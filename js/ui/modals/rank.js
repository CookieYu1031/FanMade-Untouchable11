/* 排行榜視窗（右下角獎盃按鈕開啟；不論有沒有參與排行都能開啟、查看）
 *   頂欄的「參與排行」膠囊開關：關閉 → 不計分 / 不上榜，並立刻移除榜上已上傳的積分資料（仍可查看榜單）；重新開啟 → 當下重新計算並上傳
 *   每個榜一欄，上區 = 你的積分（本機即時計算），下區 = 排名（預設：你與前面 3 位、後面 1 位；上下滑動會自動載入更多）
 *   未開啟「額外關卡」：只有挑戰榜（單欄）；開啟後：左欄挑戰榜、右欄大師榜；小視窗（<= 640px）改為分頁，用視窗下方的 ← → 換頁
 *   「i」按鈕開啟積分公式（同樣左右分欄 / 小視窗分頁，依榜顯示）；分數畫面只顯示捨去後的整數
 * 資料來源：Firestore 的 leaderboard 集合（任何人可讀）；排序鍵是單一字串欄位（見 core/score.js），
 *   所以「前面 / 後面的玩家」用範圍查詢、「名次」用 count 查詢（只收一筆彙總，不下載整份榜單） */
import { t } from '../../i18n/i18n.js';
import { loadBook } from '../../storage/book.js';
import { settings, saveSettings } from '../../state/settings.js';
import { levelOf } from '../../core/config.js';
import { lvTag, lvName } from '../../state/state.js';
import { computeScores, fmtInt, FULL, BASE_MAX, EXTRA_MAX, CHALLENGE, EXTRA } from '../../core/score.js';
import { cloud, pushRank, rankApi } from '../../cloud/sync.js';
import { $, pageDir } from '../dom.js';

const AHEAD = 3, BEHIND = 1, PAGE = 10;   // 預設顯示前面 3 位、後面 1 位；每次往上 / 往下多載入 10 位
const BOARDS = [
  { id: 'c', field: 'ck', score: 'c4', title: 'rank.challenge' },
  { id: 'm', field: 'mk', score: 'm4', title: 'rank.master' },
];
const modal = $('rankModal'), box = $('rankBox'), cols = $('rankCols'), infoModal = $('rankInfoModal');
const wrap = $('rankWrap'), infoWrap = $('rankInfoWrap'), joinSw = $('swRank');
let token = 0;   // 每次開啟 / 重畫加 1：舊的非同步載入結果直接丟棄

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const active = () => settings.extra ? BOARDS : BOARDS.slice(0, 1);
const num = n => n.toLocaleString();

// ---------- 一欄 ----------
function buildColumn(b, sc) {
  const col = el('section', 'rcol'); col.dataset.board = b.id;
  const u = sc[b.score];
  const mine = el('div', 'rmine');
  const head = el('div', 'rm-head');
  head.append(el('b', 'rm-title', t(b.title)), el('span', 'rm-rank'));   // 名次（或登入 / 尚未上榜的提示）顯示在標題列右側
  mine.append(head, el('div', 'rm-score', String(fmtInt(u))));
  const list = el('div', 'rlist'); list.setAttribute('tabindex', '0');
  col.append(mine, list);
  return col;
}
const setRank = (col, text, extra) => {
  const r = col.querySelector('.rm-rank'); r.textContent = text || '';
  if (extra) r.append(' ', extra);
};
const setMsg = (col, text, retry) => {
  const list = col.querySelector('.rlist'); list.textContent = '';
  const m = el('div', 'rmsg', text); list.append(m);
  if (retry) { const rb = el('button', 'btn', t('rank.retry')); rb.type = 'button'; rb.addEventListener('click', retry); m.append(el('br'), rb); }
};

// ---------- 載入排名 ----------
async function loadBoard(b, col, sc, tk) {
  const alive = () => tk === token && modal.classList.contains('open');
  setMsg(col, t('rank.loading'));
  try {
    const { fs, db } = await rankApi();
    const coll = fs.collection(db, 'leaderboard'), f = b.field, uid = cloud.user && cloud.user.uid;
    let me = null;
    const joined = settings.rank === true;   // 沒有參與排行：榜上沒有自己的資料，只顯示榜單前段
    if (joined && uid && sc[b.score] > 0) {
      await pushRank();   // 先確定自己的最新分數已經寫上去
      const snap = await fs.getDoc(fs.doc(db, 'leaderboard', uid));
      if (snap.exists()) me = { id: uid, d: snap.data() };
    }
    if (!alive()) return;
    const st = { rows: [], top: 1, up: false, down: false, busy: false };
    const pick = snap => snap.docs.map(d => ({ id: d.id, d: d.data() }));
    if (me) {
      const key = me.d[f];
      const [cnt, ahead, behind] = await Promise.all([
        fs.getCountFromServer(fs.query(coll, fs.where(f, '>', key))),
        fs.getDocs(fs.query(coll, fs.where(f, '>', key), fs.orderBy(f, 'asc'), fs.limit(AHEAD))),
        fs.getDocs(fs.query(coll, fs.where(f, '<', key), fs.orderBy(f, 'desc'), fs.limit(BEHIND))),
      ]);
      if (!alive()) return;
      const rank = cnt.data().count + 1, a = pick(ahead).reverse(), bh = pick(behind);
      st.rows = [...a, me, ...bh]; st.top = rank - a.length; st.up = st.top > 1; st.down = bh.length === BEHIND;
      setRank(col, t('rank.pos', rank));
    } else {
      const first = await fs.getDocs(fs.query(coll, fs.orderBy(f, 'desc'), fs.limit(PAGE)));
      if (!alive()) return;
      st.rows = pick(first); st.down = first.size === PAGE;
      if (!joined) setRank(col, t('rank.off'));
      else if (!uid) { const lb = el('button', 'rm-link', t('rank.loginBtn')); lb.type = 'button'; lb.addEventListener('click', () => { modal.classList.remove('open'); $('btnSettings').click(); }); setRank(col, t('rank.login'), lb); }
      else if (sc[b.score] === 0) setRank(col, t('rank.zero'));
      else setRank(col, t('rank.pending'));
    }
    if (!st.rows.length) { setMsg(col, t('rank.empty')); return; }
    paint(b, col, st, uid, fs, coll, alive);
  } catch (e) {
    console.error('rank load failed', e);
    if (alive()) { setRank(col, ''); setMsg(col, t('rank.fail'), () => loadBoard(b, col, sc, tk)); }
  }
}

// 畫出排名清單：上 / 下各有一個「哨兵」，捲到它時才載入更多（初始捲動位置會把上方哨兵藏在視窗外，所以預設只看到你附近的 5 位）
function paint(b, col, st, uid, fs, coll, alive) {
  const list = col.querySelector('.rlist'), f = b.field;
  if (st.io) st.io.disconnect();
  const prevH = list.scrollHeight, prevTop = list.scrollTop, first = !list.querySelector('.rrow');
  list.textContent = '';
  const upS = st.up ? el('div', 'rsent', '⋯') : null, dnS = st.down ? el('div', 'rsent', '⋯') : null;
  if (upS) list.append(upS);
  st.rows.forEach((it, i) => {
    const rank = st.top + i, r = el('div', 'rrow' + (it.id === uid ? ' me' : ''));
    const rn = el('span', 'rn' + (rank <= 3 ? ' r' + rank : ''), String(rank));
    const nick = el('span', 'rnick', it.d.nick || t('anon')); nick.title = nick.textContent;
    const sc = el('span', 'rsc', String(fmtInt(it.d[b.score] || 0)));
    r.append(rn, nick, sc); list.append(r);
  });
  if (dnS) list.append(dnS);
  if (first) list.scrollTop = upS ? upS.offsetHeight : 0;                 // 初次：藏起上方哨兵
  else list.scrollTop = prevTop + (list.scrollHeight - prevH);            // 往上載入後：維持原本看到的位置
  const load = async dir => {
    if (st.busy || !alive()) return; st.busy = true;
    try {
      let snap, n;
      if (dir < 0) {
        snap = await fs.getDocs(fs.query(coll, fs.where(f, '>', st.rows[0].d[f]), fs.orderBy(f, 'asc'), fs.limit(PAGE)));
        const rows = snap.docs.map(d => ({ id: d.id, d: d.data() })).reverse(); n = rows.length;
        st.rows = [...rows, ...st.rows]; st.top -= n; st.up = st.top > 1 && n > 0;
      } else {
        snap = await fs.getDocs(fs.query(coll, fs.where(f, '<', st.rows[st.rows.length - 1].d[f]), fs.orderBy(f, 'desc'), fs.limit(PAGE)));
        const rows = snap.docs.map(d => ({ id: d.id, d: d.data() })); n = rows.length;
        st.rows = [...st.rows, ...rows]; st.down = n === PAGE;
      }
      if (!alive()) return;
      st.busy = false; paint(b, col, st, uid, fs, coll, alive);
    } catch (e) { console.error('rank page failed', e); st.busy = false; if (dir < 0) st.up = false; else st.down = false; if (alive()) paint(b, col, st, uid, fs, coll, alive); }
  };
  if ('IntersectionObserver' in window) {
    st.io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) load(en.target === upS ? -1 : 1); }), { root: list, threshold: 1 });
    if (upS) st.io.observe(upS); if (dnS) st.io.observe(dnS);
  } else { if (upS) upS.addEventListener('click', () => load(-1)); if (dnS) dnS.addEventListener('click', () => load(1)); }
}

// ---------- 兩個視窗等高 ----------
// 排行榜與積分公式（按「i」開啟，疊在排行榜上方）的高度必須一致，來回切換時視窗才不會上下跳動：
// 兩個視窗各自量出自然高度，都套用較高者當 min-height（排行榜的名次清單會自動拉長補滿，見 css/rank.css 的 .rlist）。
// 積分公式視窗沒開時，用 visibility:hidden 暫時開啟來量（看不到）。
function syncHeights() {
  if (!modal.classList.contains('open')) return;
  const ib = infoModal.querySelector('.rinfobox'), wasOpen = infoModal.classList.contains('open');
  box.style.minHeight = ib.style.minHeight = '';
  if (!wasOpen) { renderInfo(); infoModal.style.visibility = 'hidden'; infoModal.classList.add('open'); }
  let h = Math.max(box.getBoundingClientRect().height, ib.getBoundingClientRect().height);   // 用小數高度，兩個視窗才會上下完全對齊
  // 不超過視窗可用高度（扣掉安全區域與窄視窗的翻頁列），放不下時交給視窗框自己捲動
  const cs = getComputedStyle(modal), pg = $('rankPager'), pgH = getComputedStyle(pg).display === 'none' ? 0 : pg.offsetHeight + 12;
  h = Math.min(h, window.innerHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - pgH);
  if (!wasOpen) { infoModal.classList.remove('open'); infoModal.style.visibility = ''; }
  box.style.minHeight = ib.style.minHeight = Math.max(0, h) + 'px';
}
window.addEventListener('resize', () => { if (modal.classList.contains('open')) syncHeights(); });

// ---------- 開啟 ----------
function render() {
  const tk = ++token, bs = active(), sc = computeScores(loadBook());
  wrap.classList.toggle('two', bs.length > 1); cols.style.setProperty('--cols', bs.length);
  renderJoin(); setPage(page);
  cols.textContent = '';
  const made = bs.map(b => { const col = buildColumn(b, sc); cols.append(col); return [b, col]; });
  $('rankNote').textContent = cloud.user ? '' : t('rank.public');   // 登入後不再顯示公開說明
  syncHeights();
  Promise.all(made.map(([b, col]) => loadBoard(b, col, sc, tk))).then(() => { if (tk === token) syncHeights(); });   // 名次文字等載入完成後可能改變高度：再量一次
}
$('btnRank').addEventListener('click', () => { page = 0; modal.classList.add('open'); render(); });
$('rankClose').addEventListener('click', () => { modal.classList.remove('open'); token++; });
modal.addEventListener('click', e => { if (e.target === modal || e.target === wrap) { modal.classList.remove('open'); token++; } });

// ---------- 頂欄的「參與排行」開關 ----------
// 關閉 → 不計分 / 不上榜，並立刻移除榜上已上傳的積分資料；重新開啟 → 當下重新計算並上傳（登入時屬於主動同步，與設定一起同步，見 js/cloud/sync.js）
function renderJoin() { joinSw.setAttribute('aria-checked', String(settings.rank === true)); }
joinSw.addEventListener('click', () => {
  settings.rank = !settings.rank; saveSettings();
  render();   // 重畫：自己的名次、「未參與」提示隨之更新
});

// ---------- 小視窗分頁（挑戰榜 / 大師榜）----------
// 只在「小視窗（<= 640px）且開啟額外關卡」時才會看到翻頁列與分頁效果（見 css/rank.css）；排行榜與積分公式共用同一個頁碼，來回切換時停在同一個榜
let page = 0;
const narrow = () => window.matchMedia('(max-width:640px)').matches;
function setPage(n) {
  const total = active().length;
  page = Math.max(0, Math.min(total - 1, n));
  wrap.dataset.rp = infoWrap.dataset.rp = String(page);
  ['rank', 'rankInfo'].forEach(p => {
    $(p + 'Pg').textContent = `${page + 1} / ${total}`;
    $(p + 'Prev').disabled = page <= 0;     // 沒有上（下）一頁：箭頭仍顯示但不可點按（同統計視窗）
    $(p + 'Next').disabled = page >= total - 1;
  });
}
['rank', 'rankInfo'].forEach(p => {
  $(p + 'Prev').addEventListener('click', () => setPage(page - 1));
  $(p + 'Next').addEventListener('click', () => setPage(page + 1));
});
window.addEventListener('keydown', e => {   // 排行榜 / 積分公式開著時：左右鍵換頁（只有小視窗才分頁）
  const d = pageDir(e);
  if (!d || !narrow() || !settings.extra) return;
  if (!modal.classList.contains('open') && !infoModal.classList.contains('open')) return;
  setPage(page + d); e.preventDefault();
});
document.addEventListener('i18n', () => { if (modal.classList.contains('open')) render(); if (infoModal.classList.contains('open')) renderInfo(); });

// ---------- 積分公式（左右分欄；開啟額外關卡才有大師榜）----------
function table(heads, rows) {
  const tb = el('table', 'rtab'), th = el('thead'), tr = el('tr');
  heads.forEach(h => tr.append(el('th', '', h))); th.append(tr); tb.append(th);
  const body = el('tbody');
  rows.forEach(r => { const row = el('tr'); r.forEach((c, i) => row.append(el(i === 0 ? 'th' : 'td', '', c))); body.append(row); });
  tb.append(body); return tb;
}
function infoCol(title, ...kids) {
  const col = el('section', 'ricol');
  col.append(el('h3', '', title), ...kids);
  return col;
}
const theory = () => { const d = el('div', 'rtheory'); d.append(el('span', '', t('ri.theory')), el('b', '', num(FULL))); return d; };
function renderInfo() {
  const body = $('rankInfoBody'); body.textContent = '';
  const two = !!settings.extra;
  infoWrap.classList.toggle('two', two); setPage(page);
  const cols = el('div', 'ricols'); cols.style.setProperty('--cols', two ? 2 : 1);
  const tag = lv => lvTag(levelOf(lv));

  // 挑戰榜：理論值、每關首解積分、蒐集全解時的理論上限積分
  cols.append(infoCol(t('rank.challenge'), theory(),
    table(t('ri.cols'), CHALLENGE.map(c => [tag(c.lv), num(c.F), num(c.M)]))));

  if (two) {
    // 大師榜：理論值、組成（挑戰榜 60% + 額外關卡 40%）、額外關卡的首解 / 全解積分
    const ex = k => EXTRA.find(e => e.key === k);
    const pct = v => Math.round(v / FULL * 100) + '%';
    cols.append(infoCol(t('rank.master'), theory(),
      table(t('ri.pcols'), [
        [t('rank.challenge'), pct(BASE_MAX), num(BASE_MAX)],
        [t('ri.extra'), pct(EXTRA_MAX), num(EXTRA_MAX)],
      ]),
      table(t('ri.cols'), [
        [lvName(levelOf(9)), '300', '470'],
        [lvName(levelOf(12)), '300', '1,200'],
        [lvName(levelOf(12.1)), '350', '1,400'],
        [lvName(levelOf(10)), String(ex('hazmat').M), String(ex('hazmat').M)],
        [lvName(levelOf(11)), String(ex('hazmat2').M), String(ex('hazmat2').M)],
      ])));
  }
  body.append(cols);
}
$('rankInfoBtn').addEventListener('click', () => { renderInfo(); infoModal.classList.add('open'); });
$('rankInfoClose').addEventListener('click', () => infoModal.classList.remove('open'));
infoModal.addEventListener('click', e => { if (e.target === infoModal || e.target === infoWrap) infoModal.classList.remove('open'); });
