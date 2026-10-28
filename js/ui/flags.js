/* 語言選單用的國旗 —— 內嵌 SVG（不用 emoji：Windows 的瀏覽器不會顯示國旗 emoji，只會看到「TW」「JP」等字母）。
   各旗為示意簡化版，統一 60×40 畫布；純裝飾，aria-hidden。 */
const svg = body => `<svg class="flag" viewBox="0 0 60 40" width="24" height="16" aria-hidden="true" focusable="false">${body}</svg>`;

// 中華民國：紅底、左上藍色方塊、白色十二道光芒的太陽
const sunRays = Array.from({ length: 12 }, (_, i) => `<path d="M0-8.6 2.3-4.6h-4.6z" transform="rotate(${i * 30})"/>`).join('');
const TW = svg(`<rect width="60" height="40" fill="#FE0000"/><rect width="30" height="20" fill="#000095"/>`
  + `<g transform="translate(15 10)" fill="#fff">${sunRays}<circle r="5.6" fill="#000095"/><circle r="4.5"/></g>`);

// 日本：白底紅圓（加淺色邊框，避免白底在淺色背景上糊掉）
const JP = svg(`<rect width="60" height="40" fill="#fff"/><circle cx="30" cy="20" r="12" fill="#BC002D"/><rect x=".5" y=".5" width="59" height="39" fill="none" stroke="#c9ccd9"/>`);

// 美國：紅白條紋（簡化為 7 條）、左上藍底白星點
const stripes = Array.from({ length: 7 }, (_, i) => `<rect y="${(i * 2 * 40 / 13).toFixed(2)}" width="60" height="${(40 / 13).toFixed(2)}" fill="#B22234"/>`).join('');
const stars = Array.from({ length: 12 }, (_, i) => `<circle cx="${4 + (i % 4) * 5.4}" cy="${4 + Math.floor(i / 4) * 5.6}" r="1.15"/>`).join('');
const US = svg(`<rect width="60" height="40" fill="#fff"/>${stripes}<rect width="26" height="21.5" fill="#3C3B6E"/><g fill="#fff">${stars}</g>`);

// 英國：米字旗
const UK = svg(`<rect width="60" height="40" fill="#012169"/><path d="M0 0 60 40M60 0 0 40" stroke="#fff" stroke-width="7"/><path d="M0 0 60 40M60 0 0 40" stroke="#C8102E" stroke-width="2.6"/>`
  + `<path d="M30 0v40M0 20h60" stroke="#fff" stroke-width="12"/><path d="M30 0v40M0 20h60" stroke="#C8102E" stroke-width="7"/>`);

// 中國：紅底、左上一顆大黃星與四顆小星
const star = (cx, cy, r, rot = 0) => { const pts = []; for (let i = 0; i < 10; i++) { const a = (rot + i * 36 - 90) * Math.PI / 180, d = i % 2 ? r * .382 : r; pts.push((cx + d * Math.cos(a)).toFixed(2) + ',' + (cy + d * Math.sin(a)).toFixed(2)); } return `<polygon points="${pts.join(' ')}"/>`; };
const CN = svg(`<rect width="60" height="40" fill="#DE2910"/><g fill="#FFDE00">${star(10, 10, 6)}${star(20, 4, 2, 23)}${star(24, 8.5, 2, 45)}${star(24, 14.5, 2, 16)}${star(20, 18.5, 2, 37)}</g>`);

// 韓國：白底、中央太極（上紅下藍）、四角各一組卦（簡化：實線 = 陽、斷線 = 陰）
const bar = (y, broken) => broken ? `<rect x="-5.5" y="${y}" width="4.5" height="1.7"/><rect x="1" y="${y}" width="4.5" height="1.7"/>` : `<rect x="-5.5" y="${y}" width="11" height="1.7"/>`;
const tri = (rot, b) => `<g transform="translate(30 20) rotate(${rot}) translate(0 -14.5)">${bar(-3.1, b[0])}${bar(-.85, b[1])}${bar(1.4, b[2])}</g>`;
const KR = svg(`<rect width="60" height="40" fill="#fff"/><g transform="rotate(-33.7 30 20)"><path d="M21 20a9 9 0 0 1 18 0z" fill="#CD2E3A"/><path d="M21 20a9 9 0 0 0 18 0z" fill="#0047A0"/><circle cx="25.5" cy="20" r="4.5" fill="#0047A0"/><circle cx="34.5" cy="20" r="4.5" fill="#CD2E3A"/></g>`
  + `<g fill="#000">${tri(-56.3, [0, 0, 0])}${tri(56.3, [1, 0, 1])}${tri(123.7, [1, 1, 1])}${tri(-123.7, [0, 1, 0])}</g>`);

// 法國：藍白紅三條直帶
const FR = svg(`<rect width="20" height="40" fill="#0055A4"/><rect x="20" width="20" height="40" fill="#fff"/><rect x="40" width="20" height="40" fill="#EF4135"/>`);

// 德國：黑紅金三條橫帶
const DE = svg(`<rect width="60" height="13.4" fill="#000"/><rect y="13.3" width="60" height="13.4" fill="#DD0000"/><rect y="26.6" width="60" height="13.4" fill="#FFCE00"/>`);

// 西班牙：紅黃紅（1:2:1）；中央國徽簡化成一小塊紅黃色
const ES = svg(`<rect width="60" height="40" fill="#AA151B"/><rect y="10" width="60" height="20" fill="#F1BF00"/><rect x="15" y="15" width="7" height="10" rx="1.5" fill="#AA151B" opacity=".85"/>`);

// 巴西：綠底、黃色菱形、藍色圓盤與白色弧帶
const BR = svg(`<rect width="60" height="40" fill="#009C3B"/><path d="M30 4 56 20 30 36 4 20z" fill="#FFDF00"/><circle cx="30" cy="20" r="8.2" fill="#002776"/><path d="M22.2 18.2c5.6-1.4 11.6-.6 15.8 3.2" fill="none" stroke="#fff" stroke-width="1.6"/>`);

// 義大利：綠白紅三條直帶
const IT = svg(`<rect width="20" height="40" fill="#009246"/><rect x="20" width="20" height="40" fill="#fff"/><rect x="40" width="20" height="40" fill="#CE2B37"/>`);

// 俄羅斯：白藍紅三條橫帶
const RU = svg(`<rect width="60" height="13.4" fill="#fff"/><rect y="13.3" width="60" height="13.4" fill="#0039A6"/><rect y="26.6" width="60" height="13.4" fill="#D52B1E"/>`);

export const FLAGS = { en: US, 'en-GB': UK, zh: TW, 'zh-CN': CN, ja: JP, ko: KR, fr: FR, de: DE, es: ES, 'pt-BR': BR, it: IT, ru: RU };
