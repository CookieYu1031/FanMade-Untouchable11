/* 雲端同步（Firebase Auth + Firestore）
 * 資料結構（每位使用者只能讀寫自己的 users/{uid}/…，見 firestore.rules）：
 *   users/{uid}/data/settings   設定（暱稱、語言、背景、音量、額外關卡）
 *   users/{uid}/data/meta       { rev }  最後更新時間；裝置比對 rev 沒變就不必重讀整本解答冊
 *   users/{uid}/book/{s|n}{lv}_{k}   解答（s）/ 近似解（n），每 CHUNK 組一個文件（避免超過單一文件 1MiB 上限）
 * 本機 localStorage 是快取：登入期間所有寫入同時存本機與雲端（去抖動、只寫有變動的文件）。*/
import { FIREBASE_CONFIG, SDK_BASE } from './config.js';
import { Store, Hooks, KEY_SYNC, KEY_REDIRECT, KEY_BOOK } from '../storage/store.js';
import { loadBook } from '../storage/book.js';
import { settings, sanitizeSettings, saveSettingsLocal } from '../state/settings.js';

const CHUNK = 400, DELAY = 1500, RETRY = 15000;

// ---- 對外狀態 ----
export const cloud = { user: null, status: 'out' };   // status: out | syncing | ok | error
const listeners = new Set();
export const onCloud = fn => listeners.add(fn);
const setStatus = s => { cloud.status = s; listeners.forEach(f => f()); };
const handlers = { askMerge: async () => true, applied() {}, notify() {} };
export const setHandlers = h => Object.assign(handlers, h);

// ---- SDK（需要時才載入，沒登入過的玩家完全不會下載）----
let sdkP = null, listening = false, ready = false;
function loadSdk() {
  return sdkP || (sdkP = (async () => {
    const [a, au, fs] = await Promise.all(['firebase-app.js', 'firebase-auth.js', 'firebase-firestore.js'].map(f => import(SDK_BASE + f)));
    const app = a.initializeApp(FIREBASE_CONFIG);
    return { au, fs, auth: au.getAuth(app), db: fs.getFirestore(app) };
  })().catch(e => { sdkP = null; throw e; }));
}

// ---- 解答冊 <-> 文件 ----
const normItem = it => {
  if (!it || typeof it.sig !== 'string' || it.sig.length > 600) return null;
  const o = { sig: it.sig, time: Number.isFinite(it.time) ? it.time : Date.now() };
  if (typeof it.disp === 'string' && it.disp.length <= 600) o.disp = it.disp;
  if (typeof it.nick === 'string' && it.nick) o.nick = it.nick.slice(0, 20);
  return o;
};
function bookToDocs(book) {   // Map: 文件 id -> JSON 字串（用字串比對有沒有變動）
  const m = new Map();
  for (const near of [false, true]) {
    const root = (near ? book.near : book.levels) || {};
    for (const lv of Object.keys(root)) {
      const list = Array.isArray(root[lv]) ? root[lv].map(normItem).filter(Boolean) : [];
      for (let k = 0; k * CHUNK < list.length; k++)
        m.set(`${near ? 'n' : 's'}${lv}_${k}`, JSON.stringify({ lv: Number(lv), near, k, items: list.slice(k * CHUNK, (k + 1) * CHUNK) }));
    }
  }
  return m;
}
function docsToBook(datas) {
  const b = { version: 2, levels: {}, near: {} };
  datas.filter(d => d && Number.isInteger(d.lv) && Number.isInteger(d.k) && Array.isArray(d.items))
    .sort((x, y) => x.k - y.k)
    .forEach(d => { const root = d.near ? b.near : b.levels; (root[d.lv] = root[d.lv] || []).push(...d.items.map(normItem).filter(Boolean)); });
  return b;
}
function mergeBooks(a, b) {   // 聯集（以 sig 去重，雲端的順序在前）
  const out = { version: 2, levels: {}, near: {} };
  for (const key of ['levels', 'near']) {
    const lvs = new Set([...Object.keys(a[key] || {}), ...Object.keys(b[key] || {})]);
    for (const lv of lvs) {
      const seen = new Set(); out[key][lv] = [];
      for (const it of [...((a[key] || {})[lv] || []), ...((b[key] || {})[lv] || [])]) {
        if (!it || seen.has(it.sig)) continue; seen.add(it.sig); out[key][lv].push(it);
      }
    }
  }
  return out;
}
const countBook = b => ({
  sol: Object.values(b.levels || {}).reduce((n, l) => n + (l ? l.length : 0), 0),
  near: Object.values(b.near || {}).reduce((n, l) => n + (l ? l.length : 0), 0),
});

// ---- 寫入（去抖動 + 只送有變動的文件）----
let mirror = new Map();     // 雲端目前的文件內容（id -> JSON）
const pending = new Set();  // 待上傳：'book' | 'settings'
let timer = null, chain = Promise.resolve();
const setSync = patch => Store.set(KEY_SYNC, { ...(Store.get(KEY_SYNC, {}) || {}), ...patch });
const settingsPayload = () => ({ nick: settings.nick, lang: settings.lang, theme: settings.theme || '', extra: !!settings.extra, vol: settings.vol, musicVol: settings.musicVol });
function schedule(what) {
  if (!cloud.user || !ready) return;
  pending.add(what); setSync({ dirty: true });
  clearTimeout(timer); timer = setTimeout(flush, DELAY);
}
Hooks.book = () => schedule('book');
Hooks.settings = () => schedule('settings');

async function doPush() {
  if (!cloud.user || !ready || !pending.size) return true;
  const what = [...pending]; pending.clear();
  setStatus('syncing');
  try {
    const { fs, db } = await loadSdk(), uid = cloud.user.uid, batch = fs.writeBatch(db), rev = Date.now();
    const next = new Map(mirror);
    if (what.includes('book')) {
      const docs = bookToDocs(loadBook());
      for (const [id, json] of docs) if (mirror.get(id) !== json) { batch.set(fs.doc(db, 'users', uid, 'book', id), JSON.parse(json)); next.set(id, json); }
      for (const id of mirror.keys()) if (!docs.has(id)) { batch.delete(fs.doc(db, 'users', uid, 'book', id)); next.delete(id); }
    }
    if (what.includes('settings')) batch.set(fs.doc(db, 'users', uid, 'data', 'settings'), settingsPayload());
    batch.set(fs.doc(db, 'users', uid, 'data', 'meta'), { rev });
    await batch.commit();
    mirror = next; setSync({ uid, rev, dirty: pending.size > 0 });
    if (!pending.size) setStatus('ok');
    return true;
  } catch (e) {
    console.error('cloud push failed', e);
    what.forEach(w => pending.add(w));
    setStatus('error');
    clearTimeout(timer); timer = setTimeout(flush, RETRY);
    return false;
  }
}
// 立刻上傳待處理的變更；回傳是否全部成功
function flush() {
  clearTimeout(timer);
  chain = chain.then(doPush);
  return chain;
}

// ---- 登入後的對帳 ----
async function reconcile(user) {
  const { fs, db } = await loadSdk(), uid = user.uid;
  const prev = Store.get(KEY_SYNC, null), same = !!(prev && prev.uid === uid);
  const metaSnap = await fs.getDoc(fs.doc(db, 'users', uid, 'data', 'meta'));
  const cloudRev = metaSnap.exists() ? (metaSnap.data().rev || 0) : 0;
  const local = loadBook();
  if (same && !prev.dirty && cloudRev && prev.rev === cloudRev) { mirror = bookToDocs(local); return; }   // 沒有變動：不必再讀其他文件

  const [bs, ss] = await Promise.all([fs.getDocs(fs.collection(db, 'users', uid, 'book')), fs.getDoc(fs.doc(db, 'users', uid, 'data', 'settings'))]);
  const cloudBook = docsToBook(bs.docs.map(d => d.data()));
  mirror = bookToDocs(cloudBook);
  const lc = countBook(local), localHas = lc.sol + lc.near > 0;
  let book = cloudBook, merge = true;
  if (!same && localHas) { merge = await handlers.askMerge(lc); if (merge) book = mergeBooks(cloudBook, local); }
  else if (same && prev.dirty) book = mergeBooks(cloudBook, local);   // 上次離線時沒傳完的紀錄

  const cs = ss.exists() ? sanitizeSettings(ss.data()) : null;
  if (cs) Object.assign(settings, cs);
  else if (!merge) Object.assign(settings, sanitizeSettings({}));   // 不合併：本機設定一併捨棄
  saveSettingsLocal(); Store.set(KEY_BOOK, book);
  setSync({ uid, rev: cloudRev, dirty: false });
  ready = true;
  if (JSON.stringify([...bookToDocs(book)]) !== JSON.stringify([...mirror])) pending.add('book');
  if (!cs && merge) pending.add('settings');
  handlers.applied();
  if (pending.size) { setSync({ dirty: true }); await flush(); }
}
async function onUser(user) {
  ready = false; pending.clear(); clearTimeout(timer);
  if (!user) { cloud.user = null; setStatus('out'); return; }
  cloud.user = user; setStatus('syncing');
  try { await reconcile(user); ready = true; if (!pending.size) setStatus('ok'); }
  catch (e) { console.error('cloud sync failed', e); setStatus('error'); handlers.notify('acct.syncFail'); }
}
export const retry = () => cloud.user && onUser(cloud.user);

async function listen() {
  if (listening) return; listening = true;
  try {
    const { au, auth } = await loadSdk();
    au.onAuthStateChanged(auth, u => { Store.remove(KEY_REDIRECT); onUser(u); });
  } catch (e) { listening = false; throw e; }
}
// 開啟網頁時：只有「登入過」或「正從登入跳轉回來」才載入 Firebase
export function initCloud() {
  const s = Store.get(KEY_SYNC, null);
  if ((s && s.uid) || Store.get(KEY_REDIRECT, null)) listen().catch(e => { console.error(e); setStatus('error'); });
}
export async function signIn() {
  await listen();
  const { au, auth } = await loadSdk(), prov = new au.GoogleAuthProvider();
  try { await au.signInWithPopup(auth, prov); }
  catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment') {
      Store.set(KEY_REDIRECT, 1); await au.signInWithRedirect(auth, prov);   // 彈窗被擋：改用跳轉
    } else if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') throw e;
  }
}
// 登出：先把待上傳的送完（失敗就不登出，避免遺失紀錄）
export async function signOut() {
  if (!(await flush()) || pending.size) return false;
  const { au, auth } = await loadSdk();
  await au.signOut(auth);
  return true;
}
// 清除雲端資料（重置資料用）。失敗會丟出例外
export async function clearCloud({ settings: s, exact, near }) {
  if (!cloud.user) return;
  pending.clear(); clearTimeout(timer); await chain;
  const { fs, db } = await loadSdk(), uid = cloud.user.uid, batch = fs.writeBatch(db), rev = Date.now();
  if (s) batch.delete(fs.doc(db, 'users', uid, 'data', 'settings'));
  if (exact || near) {
    const snap = await fs.getDocs(fs.collection(db, 'users', uid, 'book'));
    snap.docs.forEach(d => { if ((d.id[0] === 's' && exact) || (d.id[0] === 'n' && near)) { batch.delete(d.ref); mirror.delete(d.id); } });
  }
  batch.set(fs.doc(db, 'users', uid, 'data', 'meta'), { rev });
  await batch.commit();
  setSync({ uid, rev, dirty: false });
}
