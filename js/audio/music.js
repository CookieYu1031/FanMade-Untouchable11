/* 背景音樂：Web Audio 即時合成的輕柔循環曲（和弦墊底 + 音樂盒式琶音 + 低音，加一點殘響）。
 *   全部由程式合成、沒有使用任何現成錄音或他人作品，所以沒有版權問題，也不需要音檔。
 *   和弦進行：Cmaj7 → Am7 → Fmaj7 → G6 → Cmaj7 → Em7 → Dm7 → G6（8 小節為一輪，無限循環）。
 *   循環對齊：每個聲部都以「小節」為單位、在小節線上換和弦，尾音收在下一小節開頭附近；留白與力度用固定種子產生，每一輪（8 小節）完全相同。
 *   低音：低音根音與墊底和弦音都是單純的正弦波、不經過殘響，音高比原本高一個八度；每小節分成 2 個音、每個 2 拍（原本是 4 拍長音）。
 *   瀏覽器規定要使用者操作過才能出聲，所以第一次點擊 / 按鍵後才開始；分頁在背景時暫停。音量見 settings.musicVol（0 = 關閉）。 */
import { settings } from '../state/settings.js';

const BPM = 66, BEAT = 60 / BPM, BAR = BEAT * 4, EIGHTH = BEAT / 2, AHEAD = 3;   // AHEAD：往前排程幾秒（分頁被節流時也不會斷）
const PROG = [
  { b: 36, c: [60, 64, 67, 71] },   // Cmaj7
  { b: 33, c: [57, 60, 64, 67] },   // Am7
  { b: 41, c: [53, 57, 60, 64] },   // Fmaj7
  { b: 43, c: [55, 59, 62, 64] },   // G6
  { b: 36, c: [60, 64, 67, 71] },   // Cmaj7
  { b: 40, c: [52, 55, 59, 62] },   // Em7
  { b: 38, c: [50, 53, 57, 60] },   // Dm7
  { b: 43, c: [55, 59, 62, 64] },   // G6
];
const ARP = [0, 2, 4, 2, 5, 3, 6, 4];   // 每小節 8 個八分音符，取和弦音池（兩個八度）的第幾個音
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
// 尾音規則（單位：秒）：撥奏的尾音最多越過小節線 0.6 秒；低音每小節 2 個音（各 2 拍），音與音之間只留極短的淡出淡入
const LOW_ATT = 0.03, LOW_REL = 0.06, LOW_SHIFT = 12, PLUCK_OVER = 0.6, REV_HP = 260;   // 低音每個音的淡入 / 淡出秒數；LOW_SHIFT：低音比原本高幾個半音（12 = 一個八度）
// 固定的「留白 / 力度」表：每一輪都一樣（原本每輪隨機，聽起來不像循環）。種子 11：每輪 11 個留白、不會連續兩個、第 1 拍與第 5 個八分音符一定有聲
const FEEL = (() => {
  let a = 11;
  const r = () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  return PROG.map(() => ARP.map((_, n) => { const rest = n > 0 && r() < 0.22; return { rest, vel: (n % 4 === 0 ? 1 : 0.7) * (0.85 + r() * 0.3) }; }));
})();

export const Music = (() => {
  let ctx = null, out = null, bus = null, timer = 0, nextBar = 0, barIdx = 0, unlocked = false;

  function build() {
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    out = ctx.createGain(); out.gain.value = 0; out.connect(ctx.destination);
    bus = ctx.createGain(); bus.connect(out);                       // 乾聲
    const rev = ctx.createConvolver(), wet = ctx.createGain(); wet.gain.value = 0.38;
    const len = Math.floor(ctx.sampleRate * 2.6), ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6); }
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = REV_HP; hp.Q.value = 0.7;   // 低頻不進殘響
    rev.buffer = ir; bus.connect(hp); hp.connect(rev); rev.connect(wet); wet.connect(out);   // 殘響
    return true;
  }
  function env(g, t0, peak, att, hold, rel) {
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(peak, t0 + att);
    g.gain.setValueAtTime(peak, t0 + att + hold);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + att + hold + rel);
  }
  function voice(type, freq, t0, peak, att, hold, rel, detune = 0) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq; o.detune.value = detune;
    env(g, t0, peak, att, hold, rel);
    o.connect(g); g.connect(bus); o.start(t0); o.stop(t0 + att + hold + rel + 0.05);
  }
  function lowTone(freq, t0, peak) {                                // 低音：純正弦、只走乾聲（不進殘響），一小節 2 個音、每個 2 拍
    for (let k = 0; k < 2; k++) {
      const o = ctx.createOscillator(), g = ctx.createGain(), tb = t0 + k * 2 * BEAT, te = tb + 2 * BEAT;
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0, tb); g.gain.linearRampToValueAtTime(peak, tb + LOW_ATT);
      g.gain.setValueAtTime(peak, te - LOW_REL); g.gain.linearRampToValueAtTime(0, te);
      o.connect(g); g.connect(out); o.start(tb); o.stop(te + 0.05);
    }
  }
  function pluck(m, t0, v, barEnd) {                                // 音樂盒式撥奏：基音 + 泛音，快起音、慢衰減；尾音不拖過下一小節太久
    const f = mtof(m), rel = Math.min(1.5, Math.max(0.35, barEnd + PLUCK_OVER - t0));
    voice('sine', f, t0, 0.13 * v, 0.006, 0, rel);
    voice('sine', f * 2, t0, 0.035 * v, 0.004, 0, Math.min(0.7, rel));
    voice('triangle', f, t0, 0.04 * v, 0.006, 0, Math.min(0.9, rel), 4);
  }
  function playBar(i, t0) {
    const ch = PROG[i % PROG.length];
    ch.c.forEach(m => lowTone(mtof(m - 12 + LOW_SHIFT), t0, 0.05));                                              // 和弦墊底（原本的低八度再升一個八度，純音、每 2 拍一音）
    lowTone(mtof(ch.b + LOW_SHIFT), t0, 0.16);                                                                  // 低音根音（升一個八度，純音、每 2 拍一音）
    const pool = [...ch.c, ...ch.c.map(m => m + 12)], feel = FEEL[i % PROG.length];
    ARP.forEach((k, n) => {
      if (feel[n].rest) return;                                                                                 // 固定留白，聽起來比較自然
      pluck(pool[k % pool.length], t0 + n * EIGHTH, feel[n].vel, t0 + BAR);
    });
  }
  function tick() { while (nextBar < ctx.currentTime + AHEAD) { playBar(barIdx++, nextBar); nextBar += BAR; } }
  function gainNow() { return Math.pow(settings.musicVol / 10, 1.6) * 0.55; }

  // 依目前狀態（是否已解鎖、音量是否 > 0、分頁是否在前景）決定要播放還是暫停
  function sync() {
    if (!unlocked) return;
    const want = settings.musicVol > 0 && !document.hidden;
    if (want) {
      if (!ctx && !build()) return;
      if (ctx.state === 'suspended') ctx.resume();
      out.gain.setTargetAtTime(gainNow(), ctx.currentTime, 0.08);
      if (!timer) { nextBar = Math.max(nextBar, ctx.currentTime + 0.15); tick(); timer = setInterval(tick, 400); }
    } else if (ctx) {
      if (timer) { clearInterval(timer); timer = 0; }
      out.gain.setTargetAtTime(0, ctx.currentTime, 0.08);
      setTimeout(() => { if (!timer && ctx.state === 'running') ctx.suspend(); }, 400);
    }
  }
  // 第一次使用者操作後解鎖（瀏覽器的自動播放限制）
  const unlock = () => {
    ['pointerdown', 'keydown', 'touchend'].forEach(e => window.removeEventListener(e, unlock, true));
    unlocked = true;
    if (settings.musicVol > 0 && !ctx) build();                     // 必須在手勢裡建立 / 恢復 AudioContext（iOS）
    if (ctx && ctx.state === 'suspended') ctx.resume();
    sync();
  };
  ['pointerdown', 'keydown', 'touchend'].forEach(e => window.addEventListener(e, unlock, true));
  document.addEventListener('visibilitychange', sync);
  return { sync };
})();
