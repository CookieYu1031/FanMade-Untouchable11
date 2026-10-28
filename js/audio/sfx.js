/* 簡約音效（Web Audio 即時合成，不需任何音檔） */
import { settings } from '../state/settings.js';

export const Sfx = (() => {
  let ctx = null, master = null;
  function ensure() {
    if (settings.vol <= 0) return null;
    try {
      if (!ctx) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
        ctx = new AC(); master = ctx.createGain(); master.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      master.gain.value = Math.pow(settings.vol / 10, 1.6) * 0.5;
      return ctx;
    } catch { return null; }
  }
  function tone(f0, f1, dur, type, peak, delay = 0) {
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime + delay;
    const o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t0);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master); o.start(t0); o.stop(t0 + dur + 0.03);
  }
  return {
    click()  { tone(900, 620, .05, 'sine', .35); },                                     // 按鈕
    place()  { tone(260, 120, .11, 'triangle', .8); tone(520, 300, .05, 'sine', .25); }, // 放置板塊
    rotate() { tone(480, 720, .07, 'sine', .45); },                                     // 旋轉
    flip()   { tone(720, 520, .05, 'sine', .4); tone(520, 760, .06, 'sine', .4, .05); }, // 鏡像
    back()   { tone(420, 240, .09, 'sine', .45); },                                     // 收回拼圖盤
    solve()  { [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(f, f, .24, 'triangle', .5, .12 + i * .09)); }, // 新解答
    clear()  { tone(640, 140, .24, 'triangle', .5); tone(320, 70, .28, 'sine', .45); }, // 清除圖版
  };
})();
