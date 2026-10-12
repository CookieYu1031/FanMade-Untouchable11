/* 分享圖片：把解答、完成時間、暱稱、製作者資訊畫成 PNG 下載（依設定的亮 / 暗背景、一律橫式） */
import { t, fmtTime, getLang } from '../../i18n/i18n.js';
import { rotateCW } from '../../core/matrix.js';
import { LV_COLORS, LV_INK } from '../../core/config.js';
import { settings, effTheme } from '../../state/settings.js';
import { state, lvLong, gameTitle, colorOf, groupOfSig, grpTag } from '../../state/state.js';
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
  c.fillStyle = LV_COLORS[L.lv - 1]; c.fillRect(0, 0, W, barH);          // 頂欄 = 難度顏色
  c.fillStyle = LV_INK[L.lv - 1]; c.textBaseline = 'middle';
  const grp = groupOfSig(L, item.sig), gt = grpTag(L, grp);   // 有拼圖組合的關卡：標註使用的組合，配色也用那一組的
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
$('solShare').addEventListener('click', async () => {
  const v = state.viewItem; if (!v) return;
  try {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const cv = drawShareCanvas(v.item, v.L, v.item.nick || settings.nick || t('anon'), v.near);
    cv.toBlob(blob => {
      if (!blob) { toast(t('share.fail')); return; }
      const d = new Date(v.item.time || Date.now()), p2 = n => String(n).padStart(2, '0');
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `untouchable11_L${v.L.lv}${v.near ? '_near' : ''}_${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}${p2(d.getSeconds())}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      toast(t('share.done'));
    }, 'image/png');
  } catch (e) { toast(t('share.fail')); }
});
