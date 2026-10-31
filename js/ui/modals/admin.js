/* 管理員面板 —— 只有管理員登入後才看得到入口（標題欄的「Fan-made」換成「Admin-Panel」按鈕）
 *   身分判定在 cloud/sync.js（讀 admins/{uid}）；真正的權限在 firestore.rules：非管理員就算手動開啟面板，也讀不到任何統計與回報。
 *   三個分頁：網站統計（訪問 / 註冊 / 日均活躍）、關卡統計（各關解出人數）、問題回報（玩家從站內送出的回報）。
 *   統計用 Firestore 的 count 聚合查詢，不需要把文件整批讀下來。
 *   管理員面板只有繁體中文 / 英文（簡體中文使用者看到繁體中文，其他語言看到英文）。 */
import { getLang, LANG_INFO } from '../../i18n/i18n.js';
import { cloud, onCloud, rankApi, dayOf, lvField } from '../../cloud/sync.js';
import { levelOf } from '../../core/config.js';
import { $, escapeHtml } from '../dom.js';

const STR = {
  zh: {
    panel: '管理員面板', site: '網站統計', levels: '關卡統計', reports: '問題回報',
    visitors: '訪問人數', members: '註冊人數', dau: '日均活躍人數', person: '人', perDay: '人/日',
    win: ['累計', '近半年', '近三月', '近一月', '近一週', '近三日', '當日'],
    base: '基礎關解出人數', extra: '額外關解出人數', lv: '關卡', single: '解出', full: '全解出', colon: '：',
    master: '大師', random: '隨機', dipper: '北斗', orion: '獵戶', hazmat: '危險', hazmat2: '危險2',
    noteSite: ['訪問人數 = 期間內來訪的不重複裝置', '日均活躍 = 期間內每日來訪裝置數的平均（資料不足期間長度時，以已有資料的天數計算）', '註冊人數 = 登入過本站的 Google 帳戶（以帳戶建立日計）'],
    noteLevels: ['只統計登入並同步過的帳戶。', '解出 = 至少解出 1 組；全解出 = 解出該關全部組數', '*隨機挑戰沒有固定組數，不統計全解出；摘星挑戰以「解出的星數」計。'],
    loading: '讀取中…', retry: '重試', fail: '讀取失敗（可能是 Firestore 規則尚未更新，或帳戶不是管理員）',
    empty: '目前沒有回報', anon: '（匿名）', done: '已處理（移除此回報）',
  },
  en: {
    panel: 'Admin Panel', site: 'Site stats', levels: 'Level stats', reports: 'Reports',
    visitors: 'Visitors', members: 'Registered', dau: 'Avg. daily active', person: '', perDay: '/day',
    win: ['Total', '6 months', '3 months', '1 month', '1 week', '3 days', 'Today'],
    base: 'Solved: base levels', extra: 'Solved: extra levels', lv: 'Level', single: 'Solved', full: 'All solved', colon: ': ',
    master: 'Master', random: 'Random', dipper: 'Dipper', orion: 'Orion', hazmat: 'Hazmat', hazmat2: 'Hazmat 2',
    noteSite: ['Visitors = distinct devices that visited in the period', 'Avg. daily active = mean number of visiting devices per day (if there is less data than the period, only days with data are counted)', 'Registered = Google accounts that signed in (by account creation date)'],
    noteLevels: ['Signed-in, synced accounts only.', 'Solved = at least 1 solution; All solved = every solution of the level', '*Random has no fixed total, so no “All solved” count; star challenges count solved stars.'],
    loading: 'Loading…', retry: 'Retry', fail: 'Failed to load (Firestore rules may not be updated yet, or this account is not an admin)',
    empty: 'No reports yet', anon: '(anonymous)', done: 'Handled (remove this report)',
  },
};
const S = () => STR[getLang().startsWith('zh') ? 'zh' : 'en'];
const DAYS = [0, 180, 90, 30, 7, 3, 1];   // 0 = 累計；其餘為「含今天往回算幾天」
const CACHE_MS = 60 * 1000;
const CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

const modal = $('adminModal'), bodyEl = $('admBody'), tabs = [...modal.querySelectorAll('.admtab')];
const cache = {};   // tab -> { at, html | data }
let tab = 'site', gen = 0, reports = [], sel = 0, newKnown = false;

// ---- 入口：管理員登入後，標題欄的「Fan-made」換成同樣大小的「Admin-Panel」按鈕 ----
function syncEntry() {
  const on = !!(cloud.user && cloud.admin);
  $('btnAdmin').hidden = !on; $('fanTag').hidden = on;
  if (!on && modal.classList.contains('open')) modal.classList.remove('open');
}
// 有新回報時 Admin-Panel 閃爍：登入確認是管理員後查一次回報數量（count 查詢，不讀文件），之後每 3 分鐘與回到分頁時再查
async function checkNew() {
  if (!cloud.admin || document.visibilityState === 'hidden') return;
  try {
    const { fs, d } = await db();
    const n = (await fs.getCountFromServer(fs.collection(d, 'reports'))).data().count;
    if (modal.classList.contains('open') && newKnown) return;   // 面板開著時以載入的清單為準
    $('btnAdmin').classList.toggle('blink', n > 0);
  } catch { /* 沒有權限 / 離線：不閃爍 */ }
}
setInterval(checkNew, 3 * 60 * 1000);
document.addEventListener('visibilitychange', checkNew);
let wasAdmin = false;
onCloud(() => { syncEntry(); const on = !!(cloud.user && cloud.admin); if (on && !wasAdmin) checkNew(); wasAdmin = on; });
syncEntry();

// ---- 資料查詢 ----
const addDays = (day, n) => dayOf(Date.parse(day + 'T00:00:00Z') + n * 86400e3);   // day 是 YYYY-MM-DD，以日曆加減天數（dayOf 會再加 8 小時，仍是同一天）
const spanDays = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400e3) + 1;
async function db() { const { fs, db: d } = await rankApi(); return { fs, d }; }
async function count(fs, d, col, ...cons) {
  const q = cons.length ? fs.query(fs.collection(d, col), ...cons) : fs.collection(d, col);
  return (await fs.getCountFromServer(q)).data().count;
}
async function loadSite() {
  const { fs, d } = await db(), today = dayOf(Date.now());
  const starts = DAYS.map(n => n ? addDays(today, -(n - 1)) : '');
  const first = await fs.getDocs(fs.query(fs.collection(d, 'visits'), fs.orderBy('d'), fs.limit(1)));
  const firstDay = first.empty ? today : first.docs[0].data().d, span = Math.max(1, spanDays(firstDay, today));
  const [vis, mem, act] = await Promise.all([
    Promise.all(starts.map(s => s ? count(fs, d, 'visitors', fs.where('l', '>=', s)) : count(fs, d, 'visitors'))),
    Promise.all(starts.map(s => s ? count(fs, d, 'members', fs.where('c', '>=', s)) : count(fs, d, 'members'))),
    Promise.all(starts.map(s => s ? count(fs, d, 'visits', fs.where('d', '>=', s)) : count(fs, d, 'visits'))),
  ]);
  const avg = act.map((n, i) => n / Math.max(1, Math.min(DAYS[i] || span, span)));   // 累計：從第一筆資料起算；其餘不超過已有資料的天數
  return { vis, mem, avg };
}
// 各關：單解 = 至少 1 組；全解 = 達到該關總組數；與會員文件 members/{uid}.s 的欄位對應（見 cloud/sync.js levelCounts）
const BASE_LV = [1, 2, 3, 4, 5, 6, 7, 8];
const EXTRA_LV = [
  { lv: 9, k: 'master', full: true }, { lv: 13, k: 'random', full: false }, { lv: 12, k: 'dipper', full: true },
  { lv: 12.1, k: 'orion', full: true }, { lv: 10, k: 'hazmat', once: true }, { lv: 11, k: 'hazmat2', once: true },
];
async function loadLevels() {
  const { fs, d } = await db();
  const one = (lv, min) => count(fs, d, 'members', fs.where('s.' + lvField(lv), '>=', min));
  const rows = [...BASE_LV.map(lv => ({ lv, full: true })), ...EXTRA_LV];
  const res = await Promise.all(rows.map(async r => {
    const L = levelOf(r.lv), total = L && (L.groups ? L.groups.length : L.total);
    const single = await one(r.lv, 1);
    const all = r.once || !r.full || !total ? null : (total <= 1 ? single : await one(r.lv, total));
    return { ...r, single, all };
  }));
  return { base: res.slice(0, BASE_LV.length), extra: res.slice(BASE_LV.length) };
}
async function loadReports() {
  const { fs, d } = await db();
  const snap = await fs.getDocs(fs.query(fs.collection(d, 'reports'), fs.orderBy('ts', 'desc'), fs.limit(100)));
  return snap.docs.map(x => ({ id: x.id, ...x.data() }));
}

// ---- 繪製 ----
const note = lines => `<div class="admnote">${lines.map(l => `<p>${escapeHtml(l)}</p>`).join('')}</div>`;   // 註解固定三行（每句一行）
const fmtAvg = n => (Math.round(n * 10) / 10).toLocaleString(undefined, { maximumFractionDigits: 1 });
function siteHtml(r) {
  const s = S(), col = (title, vals, fmt, unit) => `<div class="admcard"><h3>${title}</h3>${s.win.map((w, i) => `<div class="admrow"><span>${w}${s.colon.trim()}</span><b>${fmt(vals[i])}${unit ? ' ' + unit : ''}</b></div>`).join('')}</div>`;
  const int = n => Number(n).toLocaleString();
  return `<div class="admcols">${col(s.visitors, r.vis, int, s.person)}${col(s.members, r.mem, int, s.person)}${col(s.dau, r.avg, fmtAvg, s.perDay)}</div>${note(s.noteSite)}`;
}
function levelsHtml(r) {
  const s = S(), n = v => Number(v).toLocaleString();
  const table = (title, list, base) => `<div class="admcard"><h3>${title}</h3><table class="admtable"><thead><tr><th>${s.lv}</th><th>${s.single}</th><th>${s.full}</th></tr></thead><tbody>${
    list.map(x => `<tr><th scope="row">${base ? 'Lv' + x.lv : s[x.k]}</th><td>${n(x.single)}</td><td>${x.all === null ? '' : n(x.all)}</td></tr>`).join('')   // 沒有「全解出」的關卡（隨機、危險貨物）留白
  }</tbody></table></div>`;
  return `<div class="admcols" style="--n:2">${table(s.base, r.base, true)}${table(s.extra, r.extra, false)}</div>${note(s.noteLevels)}`;
}
const fmtTs = ts => { try { return ts.toDate().toLocaleString(LANG_INFO[getLang()].locale, { hour12: false }); } catch { return ''; } };
function reportsHtml() {
  const s = S();
  if (!reports.length) return `<div class="admstate">${s.empty}</div>`;
  sel = Math.min(sel, reports.length - 1);
  const r = reports[sel];
  const list = reports.map((x, i) => `<button type="button" class="admitem" data-i="${i}"${i === sel ? ' aria-current="true"' : ''}><b>${escapeHtml(x.t)}</b><small>${escapeHtml(String(x.b).replace(/\s+/g, ' ').slice(0, 60))}</small><span class="who">${escapeHtml(x.n || s.anon)}</span></button>`).join('');
  return `<div class="admrep"><div class="admlist" id="admList">${list}</div><div class="admdetail"><button type="button" class="okbtn" id="admOk" title="${s.done}" aria-label="${s.done}">${CHECK}</button><h3>${escapeHtml(r.t)}</h3><p>${escapeHtml(r.b)}</p><div class="meta">${escapeHtml(r.n || s.anon)}<small>${fmtTs(r.ts)}</small></div></div></div>`;
}
function badge() {
  const n = reports.length, s = S();
  $('btnAdmin').classList.toggle('blink', n > 0);   // 有回報在等處理：標題欄的 Admin-Panel 閃爍
  newKnown = true;
  $('admTabReports').innerHTML = escapeHtml(s.reports) + (n ? `<span class="dot">${n > 99 ? '99+' : n}</span>` : '');
}
function drawTabs() {
  const s = S();
  $('admTitle').textContent = s.panel;
  $('admTabSite').textContent = s.site; $('admTabLevels').textContent = s.levels;
  badge();
  tabs.forEach(b => { const on = b.dataset.tab === tab; b.setAttribute('aria-selected', String(on)); b.setAttribute('role', 'tab'); });
}
function draw() {
  const c = cache[tab];
  if (!c) return;
  bodyEl.innerHTML = tab === 'site' ? siteHtml(c.data) : tab === 'levels' ? levelsHtml(c.data) : reportsHtml();
  if (tab === 'reports') { const it = bodyEl.querySelector('.admitem[aria-current]'); if (it) it.scrollIntoView({ block: 'nearest' }); }
}
async function show(force) {
  const my = ++gen, c = cache[tab];
  drawTabs();
  if (c && !force && Date.now() - c.at < CACHE_MS) { draw(); return; }
  if (c) draw(); else bodyEl.innerHTML = `<div class="admstate">${S().loading}</div>`;
  try {
    const data = await ({ site: loadSite, levels: loadLevels, reports: loadReports }[tab])();
    if (tab === 'reports') reports = data;
    cache[tab] = { at: Date.now(), data };
    if (my !== gen) return;
    draw(); badge();
  } catch (e) {
    console.error('admin load failed', e);
    if (my !== gen) return;
    bodyEl.innerHTML = `<div class="admstate">${S().fail}<button type="button" class="btn" id="admRetry">${S().retry}</button></div>`;
  }
}

// ---- 事件 ----
$('btnAdmin').addEventListener('click', () => {
  if (!cloud.admin) return;
  modal.classList.add('open'); show();
  if (!cache.reports) loadReports().then(r => { reports = r; cache.reports = { at: Date.now(), data: r }; badge(); }).catch(() => { /* 沒有權限 / 離線：切到問題回報分頁時會顯示錯誤 */ });   // 先載入回報，分頁上才有未處理數量
});
$('admClose').addEventListener('click', () => modal.classList.remove('open'));
modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('open'); });
tabs.forEach(b => b.addEventListener('click', () => { tab = b.dataset.tab; show(); }));
bodyEl.addEventListener('click', async e => {
  if (e.target.closest('#admRetry')) { show(true); return; }
  const it = e.target.closest('.admitem');
  if (it) { sel = +it.dataset.i; draw(); return; }
  const ok = e.target.closest('#admOk');
  if (!ok || !reports[sel]) return;
  const r = reports[sel];
  ok.disabled = true;
  try {   // 已處理 = 直接刪除這則回報
    const { fs, d } = await db();
    await fs.deleteDoc(fs.doc(d, 'reports', r.id));
    reports.splice(sel, 1); sel = Math.min(sel, reports.length - 1);
    cache.reports = { at: Date.now(), data: reports };
    draw(); badge();
  } catch (err) { console.error('report delete failed', err); ok.disabled = false; }
});
document.addEventListener('i18n', () => { if (modal.classList.contains('open')) { drawTabs(); draw(); } });
