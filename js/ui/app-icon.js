/* 主頁圖示（加到 iOS / Android 主畫面的應用程式圖示）依「裝置」的深淺色主題換底色：淺色 = 白底、深色 = 網站的深藍底（#1B1D32）
 *   網頁清單（manifest）與 iOS 的 apple-touch-icon 都無法直接依深淺色切換，所以在頁面上依 prefers-color-scheme 換掉連結（玩家按下「加入主畫面」時瀏覽器讀的就是當下的連結）；
 *   裝置在使用中切換深淺色也會跟著更新。index.html 裡預設放深色（深藍底）版本：沒有 JS 的環境（社群分享預覽的爬蟲）看到的就是深色圖示；淺色裝置載入後換成白底版本。 */
const mq = window.matchMedia('(prefers-color-scheme: dark)');
const sel = {
  manifest: 'link[rel="manifest"]',
  apple: 'link[rel="apple-touch-icon"]',
  png192: 'link[rel="icon"][sizes="192x192"]',
};
function apply() {
  const dark = mq.matches, sfx = dark ? '-dark' : '';
  const set = (q, href) => { const l = document.querySelector(q); if (l && l.getAttribute('href') !== href) l.setAttribute('href', href); };
  set(sel.manifest, dark ? 'manifest-dark.webmanifest' : 'manifest.webmanifest');
  set(sel.apple, `assets/apple-touch-icon${sfx}.png`);
  set(sel.png192, `assets/icon-192${sfx}.png`);
}
apply();
mq.addEventListener('change', apply);
