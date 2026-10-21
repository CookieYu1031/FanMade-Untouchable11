/* 分享圖片：把解答、完成時間、暱稱、製作者資訊畫成 PNG（依設定的亮 / 暗背景、一律橫式），按下按鈕後依裝置直接開啟系統分享（行動裝置）或下載（電腦） */
import { t, fmtTime, getLang } from '../../i18n/i18n.js';
import { rotateCW } from '../../core/matrix.js';
import { LV_INK, lvFill } from '../../core/config.js';
import { settings, effTheme } from '../../state/settings.js';
import { state, lvLong, gameTitle, colorOf, groupOfSig, itemTag } from '../../state/state.js';
import { $ } from '../dom.js';
import { toast } from '../toast.js';

function drawShareCanvas(item, L, nick, near) {
  let g = (item.disp || item.sig).split('/').map(r => [...r]);
  if (g.length > g[0].length) g = rotateCW(g);   // 分享圖一律橫式（左右寬），與目前螢幕寬窄無關
  const rows = g.length, cols = g[0].length;
  const dark = effTheme() === 'dark';
  const K = dark
    ? { bg:'#262945', board:'#20223B', grid:'#34375A', line:'#3A3E63', ink:'#ECEEFF', muted:'#A3A8CC', faint:'#A3A8CC' }
    : { bg:'#FFFFFF', board:'#FFFFFF', grid:'#E3E6F5', line:'#DADDF0', ink:'#2B2E4A', muted:'#6B6F8F', faint:'#8A8EAD' };
  const W = 800, padX = 44, barH = 76, S = 2;
  const cell = Math.floor(Math.min((W - padX * 2) / cols, 420 / rows));
  const bw = cols * cell, bh = rows * cell, bx = (W - bw) / 2, by = barH + 30;
  const my = by + bh + 34, H = my + 38 + 30;
  const cv = document.createElement('canvas'); cv.width = W * S; cv.height = H * S;
  const c = cv.getContext('2d'); c.scale(S, S);
  const FONT = getLang() === 'ja' ? '"Noto Sans JP","Hiragino Sans","Yu Gothic","Meiryo","Noto Sans TC",system-ui,sans-serif' : '"Noto Sans TC","PingFang TC","Microsoft JhengHei",system-ui,sans-serif';
  c.fillStyle = K.bg; c.fillRect(0, 0, W, H);
  lvFill(c, L.lv, 0, 0, W, barH);          // 頂欄 = 難度顏色
  c.fillStyle = LV_INK[L.lv]; c.textBaseline = 'middle';
  const grp = groupOfSig(L, item.sig), gt = itemTag(L, item);   // 有拼圖組合的關卡：標註使用的組合，配色也用那一組的
  const rt = `${lvLong(L)}${gt ? ' ' + gt : ''}  ${L.cols} × ${L.rows}${near ? '  ' + t('near.tag') : ''}`;
  c.font = `700 22px ${FONT}`; c.textAlign = 'right'; c.fillText(rt, W - padX, barH / 2);
  const rtW = c.measureText(rt).width, ttl = gameTitle(L);   // 標題較長時（額外難度）自動縮小字級
  let fs = 30; c.font = `900 ${fs}px ${FONT}`;
  while (fs > 14 && c.measureText(ttl).width > W - padX * 2 - rtW - 24) { fs--; c.font = `900 ${fs}px ${FONT}`; }
  c.textAlign = 'left'; c.fillText(ttl, padX, barH / 2);
  c.fillStyle = K.board; c.fillRect(bx, by, bw, bh);                       // 底板
  c.strokeStyle = K.grid; c.lineWidth = 1;                                 // 格線
  for (let x = 1; x < cols; x++) { c.beginPath(); c.moveTo(bx + x * cell, by); c.lineTo(bx + x * cell, by + bh); c.stroke(); }
  for (let y = 1; y < rows; y++) { c.beginPath(); c.moveTo(bx, by + y * cell); c.lineTo(bx + bw, by + y * cell); c.stroke(); }
  c.strokeStyle = K.line; c.lineWidth = 2; c.strokeRect(bx - 1, by - 1, bw + 2, bh + 2);
  g.forEach((row, y) => row.forEach((ch, x) => {                           // 拼圖方塊
    if (ch === '.') return;
    const pal = colorOf(ch, L, grp), r = cell * .14, px = bx + x * cell + cell * .04, py = by + y * cell + cell * .04, w = cell * .92;
    c.beginPath(); c.moveTo(px + r, py);
    c.arcTo(px + w, py, px + w, py + w, r); c.arcTo(px + w, py + w, px, py + w, r);
    c.arcTo(px, py + w, px, py, r); c.arcTo(px, py, px + w, py, r); c.closePath();
    c.fillStyle = pal.fill; c.fill(); c.strokeStyle = pal.edge; c.lineWidth = cell * .06; c.stroke();
  }));
  c.font = `500 18px ${FONT}`; c.fillStyle = K.muted; c.textAlign = 'left'; c.fillText(item.time ? fmtTime(item.time) : '', bx, my);   // 左下：時間
  c.font = `700 18px ${FONT}`; c.fillStyle = K.ink; c.textAlign = 'right'; c.fillText(nick, bx + bw, my);                               // 右下：暱稱
  c.font = `500 15px ${FONT}`; c.fillStyle = K.faint; c.textAlign = 'center'; c.fillText(t('share.credit'), W / 2, my + 38);              // 製作者資訊
  return cv;
}
// ---- 單一按鈕，依裝置切換功能（沒有二級視窗） ----
//   行動裝置（觸控為主要輸入、且瀏覽器支援「分享檔案」）→ 圖示「分享」：直接開啟系統分享選單，不提供下載
//   電腦（或不支援分享檔案的瀏覽器）→ 圖示「下載」：直接下載 PNG
const btn = $('solShare'), btnIcon = btn.querySelector('svg'), btnLabel = btn.querySelector('span');
const ICON_SHARE = '<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4"/><path d="m15.4 6.5-6.8 4"/>';
const ICON_DL = '<path d="M12 3v12"/><path d="m7 11 5 5 5-5"/><path d="M5 21h14"/>';

const isMobile = () => {
  const ua = navigator.userAgentData;
  if (ua && typeof ua.mobile === 'boolean' && ua.mobile) return true;
  return window.matchMedia('(pointer:coarse)').matches && !window.matchMedia('(hover:hover) and (pointer:fine)').matches;   // 觸控為主（含 iPad），排除接了滑鼠的電腦
};
// 用一個空的 PNG 檔探測瀏覽器是否支援「分享檔案」
const canShareFile = () => { try { return !!(navigator.share && navigator.canShare && navigator.canShare({ files: [new File([''], 'a.png', { type: 'image/png' })] })); } catch (e) { return false; } };
const wantShare = () => isMobile() && canShareFile();

// 依裝置換圖示與文字（語言切換後 applyI18n 會依 data-i18n 重新填字，所以只要換 key）
function updateBtn() {
  const s = wantShare(), key = s ? 'share' : 'download';
  btnIcon.innerHTML = s ? ICON_SHARE : ICON_DL;
  btnLabel.setAttribute('data-i18n', key); btnLabel.textContent = t(key);
  btn.setAttribute('data-i18n-title', key); btn.title = t(key); btn.setAttribute('aria-label', t(key));   // 小視窗只顯示圖示，名稱改由 title / aria-label 提供
}
updateBtn();

function fileName(v) {
  const d = new Date(v.item.time || Date.now()), p2 = n => String(n).padStart(2, '0');
  return `untouchable11_L${v.L.lv}${v.near ? '_near' : ''}_${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}.png`;
}
// 產生圖片檔。分享要在「使用者手勢」的有效時間內呼叫，所以按下去（pointerdown）就先開始畫，click 時多半已經好了
async function make(v) {
  if (document.fonts && document.fonts.ready) await document.fonts.ready;
  const cv = drawShareCanvas(v.item, v.L, v.item.nick || settings.nick || t('anon'), v.near);
  const blob = await new Promise(res => cv.toBlob(res, 'image/png'));
  if (!blob) throw new Error('toBlob failed');
  const name = fileName(v);
  return { blob, name, file: new File([blob], name, { type: 'image/png' }) };
}
let pre = null, busy = false;   // pre = { item, p }：預先產生中的圖片
const prep = v => (pre && pre.item === v.item) ? pre.p : (pre = { item: v.item, p: make(v) }).p;
btn.addEventListener('pointerdown', () => { const v = state.viewItem; if (v && !busy) prep(v).catch(() => {}); });

function download(r) {
  const url = URL.createObjectURL(r.blob), a = document.createElement('a');
  a.href = url; a.download = r.name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  toast(t('share.saved'));
}
btn.addEventListener('click', async () => {
  const v = state.viewItem; if (!v || busy) return;
  busy = true;
  try {
    const r = await prep(v);
    if (wantShare()) {
      try { await navigator.share({ files: [r.file], title: gameTitle(v.L), text: t('share.credit') }); }
      catch (e) { if (e && e.name !== 'AbortError') toast(t('share.fail')); }   // AbortError = 玩家自己關掉分享選單，不算錯誤
    } else download(r);
  } catch (e) { console.error(e); toast(t('share.fail')); }
  finally { pre = null; busy = false; }
});
