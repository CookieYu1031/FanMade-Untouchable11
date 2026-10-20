/* 雲端同步（Firebase Auth + Firestore）
 * 資料結構（每位使用者只能讀寫自己的 users/{uid}/…，見 firestore.rules）：
 *   users/{uid}/data/settings   設定（暱稱、語言、背景、音量、額外關卡、參與排行、近似解顯示、解答冊隱藏）
 *   users/{uid}/data/meta       { rev, brev }  rev = 設定 / 解答冊最後更新時間、brev = 盤面最後更新時間；裝置比對沒變就不必重讀
 *   users/{uid}/data/boards     { level, group, lt, boards:{ 鍵: { t, p:[拼圖…] } } }  各關未完成的盤面（t = 最後變更時間，換裝置時以較晚的為準）
 *   users/{uid}/book/{s|n}{lv}_{k}   解答（s）/ 近似解（n），每 CHUNK 組一個文件（避免超過單一文件 1MiB 上限）
 *   leaderboard/{uid}           排行榜（任何人可讀、只有本人能寫）：暱稱、兩個榜的分數與排序鍵；只有分數 / 暱稱真的改變才會寫入
 * 本機 localStorage 是快取：登入期間所有寫入同時存本機與雲端（只寫有變動的文件）。
 * 同步分兩類：
 *   主動同步（資料一改變就立刻同步）：收錄新解答（連同排行積分，同一個批次一次寫入）、暱稱變更、參與排行開關
 *   延遲同步（等到下一個定時點才一起同步）：盤面、暱稱以外的設定；定時點 = 每 5 分鐘一個（12:00、12:05、…，見 TICK）
 *   有主動同步被觸發時，等待中的延遲項目會順帶一起同步；沒有變動就不會有任何網路動作（掛機不會一直同步）。
 *   登入對帳、登出、手動同步（設定頁的按鈕）也會把所有待同步的項目一次送出。*/
import { FIREBASE_CONFIG, SDK_BASE } from './config.js';
import { Store, Hooks, KEY_SYNC, KEY_REDIRECT, KEY_BOOK, KEY_BOARDS } from '../storage/store.js';
import { loadBook } from '../storage/book.js';
import { readBoardsStore, persistBoards } from '../storage/boards.js';
import { settings, sanitizeSettings, saveSettingsLocal } from '../state/settings.js';
import { computeScores, challengeKey, masterKey } from '../core/score.js';
import { isLocalBoardKey, syncRandomKeys } from '../state/state.js';

const CHUNK = 400, RETRY = 15000;
const MERGE_DELAY = 200;      // 主動同步：同一瞬間的多個變動合併成一次（0.2 秒）
const TICK = 5 * 60 * 1000;   // 延遲同步的定時點間隔：每 5 分鐘（整點、05、10…分）
const FOCUS_GAP = 30000;      // 回到分頁時檢查雲端是否有別台裝置的新進度：至少間隔 30 秒

// ---- 對外狀態 ----
export const cloud = { user: null, status: 'out', lastSync: 0, quiet: false };   // status: out | syncing | ok | error；lastSync = 最近一次同步完成的時間（毫秒）；quiet = 登入時的那次同步進行中（設定按鈕不顯示同步動畫）
const listeners = new Set();
export const onCloud = fn => listeners.add(fn);
const notify = () => listeners.forEach(f => f());
const setStatus = s => { cloud.status = s; notify(); };
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
  if (typeof it.code === 'string' && it.code) o.code = Array.from(it.code).slice(0, 4).join('');   // 隨機挑戰：玩家輸入的代碼（與原代碼不同時才有）
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

// ---- 盤面 <-> 文件 ----
const canon = v => Array.isArray(v) ? '[' + v.map(canon).join(',') + ']'
  : (v && typeof v === 'object') ? '{' + Object.keys(v).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}'
  : JSON.stringify(v);   // 鍵排序後再轉字串：Firestore 讀回的欄位順序與寫入時不同，比對才不會誤判
const normPiece = q => (q && typeof q.id === 'string' && q.id.length <= 2) ? {
  id: q.id, rot: Number.isInteger(q.rot) ? q.rot : 0, flip: !!q.flip, placed: !!q.placed,
  x: Number.isInteger(q.x) ? q.x : 0, y: Number.isInteger(q.y) ? q.y : 0 } : null;
const normBoard = e => (e && Number.isFinite(e.t) && Array.isArray(e.p) && e.p.length <= 20)
  ? { t: e.t, p: e.p.map(normPiece).filter(Boolean) } : null;
const isFresh = p => p.every(q => !q.placed && !q.rot && !q.flip);   // 完全沒動過的盤面
const metaOf = o => canon({ level: o.level || 1, group: o.group || {}, lt: o.lt || 0 });
const localBoards = () => {   // 本機盤面整理成 { 鍵: {t,p} }
  const lb = readBoardsStore(), out = {};
  const rk = syncRandomKeys(lb);   // 隨機挑戰：只有目前代碼的那一份會上雲端，其餘只留本機
  for (const k of Object.keys(lb.boards)) { if (isLocalBoardKey(k) && !rk.has(k)) continue; const e = normBoard({ t: lb.times[k] || 0, p: lb.boards[k] }); if (e) out[k] = e; }
  return { lb, boards: out };
};
let bmirror = new Map();    // 雲端目前的盤面（鍵 -> canon 字串）
let bmetaMirror = '';       // 雲端目前記錄的 level / group / lt
function setBoardMirror(boards, meta) { bmirror = new Map(Object.keys(boards).map(k => [k, canon(boards[k])])); bmetaMirror = metaOf(meta); }
// 本機與雲端的差異：只有真的不同的盤面才要上傳（雲端沒有、本機又沒動過的盤面不傳）
function boardDiff() {
  const { lb, boards } = localBoards(), diff = {};
  for (const k of Object.keys(boards)) {
    const c = canon(boards[k]), m = bmirror.get(k);
    if (m === c || (m === undefined && isFresh(boards[k].p))) continue;
    diff[k] = boards[k];
  }
  // 隨機挑戰：雲端只留一份。雲端上的隨機盤面與目前代碼不符（玩家換了代碼）就刪除
  const dels = [...bmirror.keys()].filter(k => isLocalBoardKey(k) && !(k in boards));
  const metaDiff = metaOf(lb) !== bmetaMirror && lb.lt > 0;
  return Object.keys(diff).length || dels.length || metaDiff ? { lb, diff, dels } : null;
}

// ---- 寫入（去抖動 + 只送有變動的文件）----
let mirror = new Map();     // 雲端目前的文件內容（id -> JSON）
const pending = new Set();  // 待上傳：'book' | 'settings' | 'rank'（盤面另外用 bWaiting 記錄）
let timer = null, chain = Promise.resolve();
const failed = { push: false, boards: false };   // 哪一類上次失敗（都成功才顯示「已同步」）
const okIfHealthy = () => { if (failed.push || failed.boards) return; cloud.lastSync = Date.now(); setSync({ lastSync: cloud.lastSync }); setStatus('ok'); };
const setSync = patch => Store.set(KEY_SYNC, { ...(Store.get(KEY_SYNC, {}) || {}), ...patch });
const settingsPayload = () => ({ nick: settings.nick, lang: settings.lang, theme: settings.theme || '', extra: !!settings.extra, rank: settings.rank !== false, near: !!settings.near, hideBook: !!settings.hideBook, vol: settings.vol, musicVol: settings.musicVol });

// 定時點：下一個「每 5 分鐘」的整點時刻（不含現在）
// 是否有變動在等待同步（延遲同步的項目，或即將送出的主動同步）
export const hasWaiting = () => pending.size > 0 || bWaiting;
export const nextTick = (now = Date.now()) => Math.floor(now / TICK) * TICK + TICK;
let tickTimer = null, tickDue = 0;
function armTick() {   // 排定下一個定時點統一同步（已排定就不重複）
  if (tickTimer || !cloud.user || !ready) return;
  tickDue = nextTick();
  tickTimer = setTimeout(() => { tickTimer = null; syncNow(); }, Math.max(0, tickDue - Date.now()) + 50);
}
const clearTick = () => { clearTimeout(tickTimer); tickTimer = null; };
// 立刻把所有待同步的項目（主動 + 等待中的延遲項目）一次送出
export function syncNow() { clearTick(); return flushAll(); }
// 主動同步：登記待傳項目後立刻同步（0.2 秒內的多個變動合併）；延遲同步：登記後等下一個定時點
function queue(items, immediate) {
  if (!cloud.user || !ready) return;
  items.forEach(i => pending.add(i)); setSync({ dirty: true });
  notify();   // 設定頁的狀態文字：有延遲項目在等待時顯示「等待自動同步」
  if (immediate) { clearTimeout(timer); timer = setTimeout(syncNow, MERGE_DELAY); }
  else armTick();
}
// 暱稱與參與排行會改變排行榜資料，屬於主動同步；其他設定（語言、背景、音量…）屬於延遲同步
const priKey = () => (settings.nick || '') + '\u0000' + (settings.rank !== false);
let priMirror = '';
Hooks.book = () => queue(['book', 'rank'], true);   // 收錄新解答：解答與排行積分同一批寫入
Hooks.settings = () => { if (priKey() !== priMirror) queue(['settings', 'rank'], true); else queue(['settings'], false); };

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
    const pri = priKey();
    if (what.includes('settings')) batch.set(fs.doc(db, 'users', uid, 'data', 'settings'), settingsPayload());
    const plan = what.includes('rank') ? rankPlan(uid) : null;   // 排行榜：與解答 / 設定放在同一個批次，一次同步
    if (plan && !plan.local) { const ref = fs.doc(db, 'leaderboard', uid); if (plan.del) batch.delete(ref); else batch.set(ref, plan.doc); }
    batch.set(fs.doc(db, 'users', uid, 'data', 'meta'), { rev }, { merge: true });   // merge：不能蓋掉盤面的 brev
    await batch.commit();
    mirror = next; setSync({ uid, rev, dirty: pending.size > 0 });
    if (what.includes('settings')) priMirror = pri;
    if (plan) setSync({ rankUid: uid, rankSig: plan.sig });
    failed.push = false; okIfHealthy();
    return true;
  } catch (e) {
    console.error('cloud push failed', e);
    what.forEach(w => pending.add(w));
    failed.push = true; setStatus('error');
    clearTimeout(timer); timer = setTimeout(flush, RETRY);
    return false;
  }
}

// ---- 盤面上傳：屬於延遲同步（等下一個定時點，或被主動同步順帶），只送有變動的盤面 ----
let bTimer = null, bWaiting = false, reconciling = false;
function scheduleBoards() {
  const st = Store.get(KEY_SYNC, null);
  if (st && st.uid) setSync({ bdirty: true });             // 曾登入過：記下「有盤面還沒上傳」，離線 / 登出狀態下的變動下次登入才不會漏
  if (!cloud.user || !ready) return;
  bWaiting = true;
  armTick();   // 排定下一個定時點統一同步
  notify();
}
Hooks.boards = scheduleBoards;

async function pushBoards() {
  if (!cloud.user || !ready) return true;
  if (reconciling) { bWaiting = true; clearTimeout(bTimer); bTimer = setTimeout(flushBoards, 1000); return true; }
  const d = boardDiff();
  if (!d) {   // 沒有任何變動：不送出任何請求
    if (!bWaiting) setSync({ bdirty: false });
    if (failed.boards) { failed.boards = false; okIfHealthy(); }
    return true;
  }
  setStatus('syncing');
  try {
    const { fs, db } = await loadSdk(), uid = cloud.user.uid, batch = fs.writeBatch(db), brev = Date.now();
    batch.set(fs.doc(db, 'users', uid, 'data', 'boards'), { level: d.lb.level, group: d.lb.group, lt: d.lb.lt, boards: { ...d.diff, ...Object.fromEntries(d.dels.map(k => [k, fs.deleteField()])) } }, { merge: true });   // merge：只更新有變動的盤面
    batch.set(fs.doc(db, 'users', uid, 'data', 'meta'), { brev }, { merge: true });
    await batch.commit();
    for (const k of Object.keys(d.diff)) bmirror.set(k, canon(d.diff[k]));
    d.dels.forEach(k => bmirror.delete(k));
    bmetaMirror = metaOf(d.lb);
    setSync({ uid, brev, bdirty: bWaiting });
    failed.boards = false; okIfHealthy();
    return true;
  } catch (e) {
    console.error('cloud boards push failed', e);
    failed.boards = true; setStatus('error'); bWaiting = true;
    clearTimeout(bTimer); bTimer = setTimeout(flushBoards, RETRY);
    return false;
  }
}
function flushBoards() {
  clearTimeout(bTimer); bWaiting = false;
  chain = chain.then(pushBoards);
  return chain;
}
// 設定 / 解答冊 / 排行榜與盤面一併立刻上傳；回傳是否全部成功
const flushAll = async () => { const a = await flush(); const b = await flushBoards(); return a && b; };

// ---- 排行榜：把「我的分數」寫到 leaderboard/{uid} ----
// 只有分數或暱稱真的改變才寫入：上次寫入的內容簽章記在本機（KEY_SYNC.rankSig），相同就完全不送請求
// 積分改變（收錄新解答）、暱稱變更、參與排行開關屬於主動同步：與解答 / 設定同一個批次一次寫入（見 doPush）
// 設定裡關閉「參與排行」時：不計分、不上傳，並刪除榜上的文件；重新開啟的當下重新計算並上傳
let rankTimer = null, rankChain = Promise.resolve();
function rankDoc(uid) {
  const s = computeScores(loadBook());
  return { s, doc: { v: 1, nick: (settings.nick || '').slice(0, 20), c4: s.c4, m4: s.m4, near: s.near, ck: challengeKey(s, uid), mk: masterKey(s, uid), ct: s.ct, mt: s.mt } };
}
// 排行榜要做什麼：null = 不用動；{ local } = 只記錄簽章；{ del } = 刪除榜上文件；{ doc } = 寫入文件（sig = 之後記在本機的簽章）
function rankPlan(uid) {
  const st = Store.get(KEY_SYNC, null) || {}, known = st.rankUid === uid;
  if (!settings.rank) return (known && st.rankSig === '') ? null : { del: true, sig: '' };   // 不參與排行：把榜上自己的積分資料移除（已經移除過就不再送請求）
  const { s, doc } = rankDoc(uid), sig = canon(doc), empty = s.c4 === 0 && s.m4 === 0;        // 還沒有任何解答：不上榜
  if (known && st.rankSig === (empty ? '' : sig)) return null;
  if (empty && !known) return { local: true, sig: '' };
  return empty ? { del: true, sig: '' } : { doc, sig };
}
// 單獨更新排行榜（登入對帳、開啟排行榜視窗、失敗重試）；解答 / 暱稱 / 參與排行變動時改由 doPush 與解答、設定放在同一個批次一次寫入
async function doRank() {
  if (!cloud.user || !ready) return true;
  const uid = cloud.user.uid, plan = rankPlan(uid);
  if (!plan) return true;
  if (plan.local) { setSync({ rankUid: uid, rankSig: plan.sig }); return true; }
  try {
    const { fs, db } = await loadSdk(), ref = fs.doc(db, 'leaderboard', uid);
    if (plan.del) await fs.deleteDoc(ref); else await fs.setDoc(ref, plan.doc);
    setSync({ rankUid: uid, rankSig: plan.sig });
    return true;
  } catch (e) {
    console.error('cloud rank push failed', e);
    clearTimeout(rankTimer); rankTimer = setTimeout(pushRank, RETRY);
    return false;
  }
}
export function pushRank() { rankChain = rankChain.then(doRank); return rankChain; }
// 排行榜視窗讀取用：回傳 { fs, db }（不需要登入；規則允許任何人讀排行榜）
export const rankApi = async () => { const { fs, db } = await loadSdk(); return { fs, db }; };

// 立刻上傳待處理的變更；回傳是否全部成功
function flush() {
  clearTimeout(timer);
  chain = chain.then(doPush);
  return chain;
}

// ---- 登入後的對帳 ----
// 設定 / 解答冊
async function reconcileBook({ fs, db, uid, prev, same, cloudRev, local }) {
  const [bs, ss] = await Promise.all([fs.getDocs(fs.collection(db, 'users', uid, 'book')), fs.getDoc(fs.doc(db, 'users', uid, 'data', 'settings'))]);
  const cloudBook = docsToBook(bs.docs.map(d => d.data()));
  mirror = bookToDocs(cloudBook);
  const lc = countBook(local), localHas = lc.sol + lc.near > 0;
  let book = cloudBook, merge = true;
  if (!same && localHas) { merge = await handlers.askMerge(lc); if (merge) book = mergeBooks(cloudBook, local); }
  else if (same && prev.dirty) book = mergeBooks(cloudBook, local);   // 上次離線時沒傳完的紀錄

  const cs = ss.exists() ? sanitizeSettings(ss.data()) : null;
  if (cs && same && prev.dirty) pending.add('settings');   // 本機有還沒上傳的變動（延遲同步等待中就離開頁面）：以本機設定為準，再補傳
  else if (cs) Object.assign(settings, cs);
  else if (!merge) Object.assign(settings, sanitizeSettings({}));   // 不合併：本機設定一併捨棄
  saveSettingsLocal(); Store.set(KEY_BOOK, book);
  setSync({ uid, rev: cloudRev, dirty: false });
  if (JSON.stringify([...bookToDocs(book)]) !== JSON.stringify([...mirror])) pending.add('book');
  if (!cs && merge) pending.add('settings');
  return merge;
}
// 盤面：每個盤面取「較晚變更」的那一份；回傳 { applied, level }（level = 是否採用雲端記錄的關卡）
async function reconcileBoards({ fs, db, uid, merge, pullLevel, cloudBrev }) {
  persistBoards();   // 先把畫面上最新的盤面寫進本機存檔，時間戳才準
  const snap = await fs.getDoc(fs.doc(db, 'users', uid, 'data', 'boards'));
  const cd = snap.exists() ? snap.data() : {}, raw = (cd.boards && typeof cd.boards === 'object') ? cd.boards : {};
  const cloudB = {};
  for (const k of Object.keys(raw)) { const e = normBoard(raw[k]); if (e) cloudB[k] = e; }
  const cloudMeta = { level: cd.level, group: (cd.group && typeof cd.group === 'object') ? cd.group : {}, lt: Number.isFinite(cd.lt) ? cd.lt : 0 };
  setBoardMirror(cloudB, cloudMeta);

  const { lb, boards: localB } = merge ? localBoards() : { lb: { level: 1, group: {}, times: {}, lt: 0 }, boards: {} };   // 不合併：本機盤面捨棄
  const outBoards = {}, outTimes = {};
  for (const k of new Set([...Object.keys(cloudB), ...Object.keys(localB)])) {
    const c = cloudB[k], l = localB[k];
    const e = (c && (!l || c.t > l.t)) ? c : l;
    outBoards[k] = e.p; outTimes[k] = e.t;
  }
  let level = lb.level, group = lb.group, lt = lb.lt, takeLevel = false;
  if (cloudMeta.lt > lb.lt && Number.isInteger(cloudMeta.level)) {
    group = { ...lb.group, ...cloudMeta.group }; lt = cloudMeta.lt;
    if (pullLevel) { level = cloudMeta.level; takeLevel = true; }
  }
  if (merge) {   // 隨機挑戰：本機其餘的盤面（不是目前代碼的）不跟雲端比對，原封不動留著
    const keep = readBoardsStore();
    Object.keys(keep.boards).filter(k => isLocalBoardKey(k) && !(k in outBoards)).forEach(k => { outBoards[k] = keep.boards[k]; outTimes[k] = keep.times[k] || 0; });
  }
  Store.set(KEY_BOARDS, { version: 2, level, group, boards: outBoards, times: outTimes, lt });
  setSync({ uid, brev: cloudBrev, bdirty: false });
  return { applied: true, level: takeLevel };
}
// opts.focus = 回到分頁時的檢查：不切換關卡、沒有變動就只讀一份 meta
async function reconcile(user, opts = {}) {
  const { fs, db } = await loadSdk(), uid = user.uid;
  const prev = Store.get(KEY_SYNC, null), same = !!(prev && prev.uid === uid);
  const metaSnap = await fs.getDoc(fs.doc(db, 'users', uid, 'data', 'meta'));
  const md = metaSnap.exists() ? metaSnap.data() : {}, cloudRev = md.rev || 0, cloudBrev = md.brev || 0;
  const local = loadBook();
  const bookSame = same && !prev.dirty && cloudRev && prev.rev === cloudRev;
  const boardsSame = same && !prev.bdirty && cloudBrev && (prev.brev || 0) === cloudBrev;   // 雲端還沒有盤面（cloudBrev = 0）時一律對帳，才能把本機既有的進度傳上去
  if (bookSame && boardsSame) {   // 沒有任何變動：不必再讀其他文件
    mirror = bookToDocs(local);
    persistBoards();
    const { lb, boards } = localBoards(); setBoardMirror(boards, lb);
    return;
  }
  let merge = true, boardsInfo = { applied: false, level: false };
  if (bookSame) mirror = bookToDocs(local); else merge = await reconcileBook({ fs, db, uid, prev, same, cloudRev, local });
  if (!boardsSame) boardsInfo = await reconcileBoards({ fs, db, uid, merge, pullLevel: !opts.focus, cloudBrev });
  else { persistBoards(); const { lb, boards } = localBoards(); setBoardMirror(boards, lb); }
  ready = true;
  handlers.applied({ boards: boardsInfo.applied, level: boardsInfo.level });
  const jobs = [];
  if (pending.size) { setSync({ dirty: true }); jobs.push(flush()); }
  if (boardDiff()) { setSync({ bdirty: true }); jobs.push(flushBoards()); }   // 本機有比雲端新的盤面（離線時玩的、或登入前玩的）
  jobs.push(pushRank());   // 雲端解答冊套用後分數可能改變
  await Promise.all(jobs);
}
async function onUser(user, quiet = true) {   // quiet：登入 / 開啟網頁時的同步不顯示設定按鈕的同步動畫
  ready = false; pending.clear(); clearTimeout(timer); clearTimeout(bTimer); clearTick(); bWaiting = false; failed.push = failed.boards = false;
  if (!user) { cloud.user = null; setStatus('out'); return; }
  cloud.user = user; cloud.quiet = quiet; setStatus('syncing');
  reconciling = true;
  try { await reconcile(user); ready = true; priMirror = priKey(); okIfHealthy(); if (bWaiting || pending.size) armTick(); pushRank(); }   // 沒有變動的登入也要確認排行榜資料是最新的（本機簽章相同就不會寫入）
  catch (e) { console.error('cloud sync failed', e); setStatus('error'); handlers.notify('acct.syncFail'); }
  finally { reconciling = false; cloud.quiet = false; }
}
export const retry = () => cloud.user && onUser(cloud.user, false);
// 手動同步（設定頁的按鈕）：先把所有待同步的項目一次送出，再檢查雲端有沒有別台裝置的新進度
export async function manualSync() {
  if (!cloud.user || !ready || reconciling) return false;
  if (cloud.status === 'ok' && !hasWaiting()) return true;   // 已同步到雲端、沒有待同步的變動：按了不會有任何變化
  clearTick(); setStatus('syncing');
  try {
    if (!(await flushAll())) return false;   // 失敗時狀態已是「同步失敗」，15 秒後也會自動重試
    reconciling = true;
    await reconcile(cloud.user, { focus: true });
    lastFocusCheck = Date.now(); okIfHealthy();
    return true;
  } catch (e) { console.error('manual sync failed', e); setStatus('error'); return false; }
  finally { reconciling = false; }
}

// 分頁切到背景：只寫本機（延遲同步的項目仍等定時點；本機有記錄尚未同步，下次開啟或登入時會補傳）
// 分頁回到前景：定時點若在背景時已經過了（瀏覽器會暫停背景分頁的計時器），立刻補做；
//   沒有待同步項目時，檢查雲端是否有別台裝置的新進度（只讀一份 meta；至少間隔 FOCUS_GAP），避免放著的舊分頁之後把新進度蓋掉
let lastFocusCheck = 0;
document.addEventListener('visibilitychange', async () => {
  if (!cloud.user || !ready) return;
  if (document.visibilityState === 'hidden') { persistBoards(); return; }
  if (tickTimer && Date.now() >= tickDue) { syncNow(); return; }
  const now = Date.now();
  if (reconciling || bWaiting || pending.size || now - lastFocusCheck < FOCUS_GAP) return;
  lastFocusCheck = now; reconciling = true;
  try { await reconcile(cloud.user, { focus: true }); } catch (e) { console.error('cloud refresh failed', e); }
  finally { reconciling = false; }
});

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
  if (!(await flushAll()) || pending.size || bWaiting) return false;
  const { au, auth } = await loadSdk();
  await au.signOut(auth);
  return true;
}
