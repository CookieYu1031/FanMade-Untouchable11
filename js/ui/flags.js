/* 語言選單用的國旗 —— 內嵌向量 SVG（不用 emoji：Windows 的瀏覽器不會顯示國旗 emoji，只會看到「TW」「JP」等字母）。
   每面旗的圖樣都依各國法定 / 官方規格繪製（viewBox 即旗面，座標單位各旗自訂，見各段註解），
   但「外框比例」統一為 3:2（FLAG_RATIO），讓語言選單裡的國旗整齊等寬等高：
   原本就是 3:2 的旗（中、日、中華民國、韓、法、義、俄、西）完全照規格；
   美（19:10）、英（2:1）、德（5:3）、巴西（10:7）則「重新排版而不是拉伸」——
   條紋 / 十字的粗細、星星與圓盤都維持正圓與正確的形狀，只調整各元素之間的間距，所以不會有變形。
   尺寸由 css/settings.css 以「固定高度、aspect-ratio 3 / 2」控制。
   不使用 <defs> / <clipPath> / id 參照（同一面旗會同時出現在按鈕與矩陣選單，且選單預設是 hidden），全部以幾何運算直接畫出。
   純裝飾，aria-hidden。 */

const n = v => +v.toFixed(2);
const pt = (x, y) => `${n(x)} ${n(y)}`;
const FLAG_RATIO = 3 / 2;   // 所有國旗統一的寬高比
const svg = (w, h, body) => {
  if (Math.abs(w / h - FLAG_RATIO) > 1e-6) throw new Error(`flags.js: viewBox ${w}×${h} 不是 3:2`);
  return `<svg class="flag" viewBox="0 0 ${w} ${h}" width="24" height="16" aria-hidden="true" focusable="false">${body}</svg>`;
};
const rect = (x, y, w, h, fill) => `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${fill}"/>`;
const poly = (pts, fill) => `<path d="M${pts.map(p => pt(...p)).join('L')}Z" fill="${fill}"/>`;
const rad = d => d * Math.PI / 180;

/* 正五角星（外接圓半徑 R；內圈半徑 = R × 0.381966，即正五芒星）。rot = 順時針旋轉角度，0 = 一個尖角朝正上方。回傳 path 片段（可串接多顆）。 */
const starPath = (cx, cy, R, rot = 0) => {
  const p = [];
  for (let i = 0; i < 10; i++) {
    const a = rad(rot + i * 36 - 90), d = i % 2 ? R * 0.381966 : R;
    p.push(pt(cx + d * Math.cos(a), cy + d * Math.sin(a)));
  }
  return `M${p.join('L')}Z`;
};

/* ───── 中華民國（3:2；《國旗法》第 4 條）─────
   青天 = 左上 1/2 × 1/2；白日圓心在青天中心；白日半徑 = 青天橫長 / 8；光芒頂端離圓心 = 2 × 白日半徑；
   白日與光芒之間的青圈寬 = 白日直徑 / 15；十二道光芒、頂角 30°，上下左右正對北南西東。 */
const TW = (() => {
  const cx = 22.5, cy = 15, r = 45 / 8, tip = 2 * r, base = r + 2 * r / 15, half = rad(15);
  // 光芒兩側邊與「青圈外緣」圓的交點（ T·cosα − √(T²cos²α − T² + B²) ）
  const s = tip * Math.cos(half) - Math.sqrt((tip * Math.cos(half)) ** 2 - tip * tip + base * base);
  const bx = tip - s * Math.cos(half), by = s * Math.sin(half);
  const ray = `M${pt(tip, 0)}L${pt(bx, by)}L${pt(bx, -by)}Z`;
  const rays = Array.from({ length: 12 }, (_, i) => `<path d="${ray}" transform="rotate(${i * 30 - 90})"/>`).join('');
  return svg(90, 60, rect(0, 0, 90, 60, '#FE0000') + rect(0, 0, 45, 30, '#000095')
    + `<g transform="translate(${cx} ${cy})" fill="#fff">${rays}<circle r="${n(r)}"/></g>`);
})();

/* ───── 日本（3:2；日章旗法）：紅圓直徑 = 旗高 3/5，圓心在旗面正中央 ───── */
const JP = svg(90, 60, rect(0, 0, 90, 60, '#fff') + `<circle cx="45" cy="30" r="18" fill="#BC002D"/>`);

/* ───── 美國（法定 19:10 → 這裡重排成 3:2；5 U.S.C. §1 與行政命令 10834）─────
   13 條紅白條紋（紅在最上、最下，高度照規格）；藍色星區高 7 條、寬 = 旗寬 0.4（法定比例，只是旗面變窄，所以星區也相對變窄）；
   50 顆星分 9 列（6、5 交錯）：橫向間距 = 星區寬 / 12 的兩倍、縱向 = 星區高 / 10（沿用法定算法）；
   星一律是正五角星、不隨旗面壓縮，外接圓半徑依「星區的較小間距」縮放，確保星與星不會相碰。 */
const US = (() => {
  const A = 150, B = 100, sh = B / 13, cw = 0.4 * A, ch = 7 * sh, G = cw / 12, E = ch / 10, R = Math.min(G, E) * 0.56;
  let stripes = '', stars = '';
  for (let i = 0; i < 13; i += 2) stripes += rect(0, i * sh, A, sh, '#B22234');
  for (let row = 1; row <= 9; row++) {
    const cols = row % 2 ? 6 : 5;
    for (let j = 0; j < cols; j++) stars += starPath((row % 2 ? 1 + 2 * j : 2 + 2 * j) * G, row * E, R);
  }
  return svg(A, B, rect(0, 0, A, B, '#fff') + stripes + rect(0, 0, cw, ch, '#3C3B6E') + `<path d="${stars}" fill="#fff"/>`);
})();

/* ───── 英國（法定 2:1 → 這裡重排成 3:2；米字旗）─────
   聖喬治十字（紅，寬 6）外鑲白邊（總寬 10）；聖安德魯白色斜十字（寬 6）上疊聖派翠克紅色斜十字（寬 2），
   紅斜條不置中，而是依規定「逆時針錯開」：靠旗桿的上半部，紅條在白邊下側；其餘三個象限依此旋轉對稱。
   旗面變成 60×40 後對角線斜率由 1/2 變成 2/3，所以下面四塊紅色多邊形依斜率 m 重新計算
   （t = 紅條垂直寬度在鉛直方向的投影；t / m = 它在水平方向的投影）；十字與斜條的「粗細」維持不變，只有斜率改變。 */
const UK = (() => {
  const W = 60, H = 40, cx = W / 2, cy = H / 2, m = H / W, t = 2 * Math.sqrt(1 + m * m), u = t / m;
  const red = '#C8102E';
  return svg(W, H, rect(0, 0, W, H, '#012169')
    + `<path d="M0 0L${W} ${H}M${W} 0L0 ${H}" stroke="#fff" stroke-width="6"/>`
    + poly([[0, 0], [cx, cy], [cx, cy + t], [0, t]], red) + poly([[cx, cy], [W, H], [W, H - t], [cx, cy - t]], red)
    + poly([[0, H], [cx, cy], [cx, cy + t], [u, H]], red) + poly([[cx, cy], [W, 0], [W - u, 0], [cx, cy - t]], red)
    + `<path d="M${cx} 0v${H}M0 ${cy}h${W}" stroke="#fff" stroke-width="10"/><path d="M${cx} 0v${H}M0 ${cy}h${W}" stroke="${red}" stroke-width="6"/>`);
})();

/* ───── 中國（3:2；國旗法附圖，30×20 方格，這裡放大 3 倍）─────
   大星圓心 (5,5)、外接圓半徑 3；四顆小星圓心 (10,2) (12,4) (12,7) (10,9)、半徑 1，各有一個尖角正對大星圓心。 */
const CN = (() => {
  const S = 3, big = [5, 5], small = [[10, 2], [12, 4], [12, 7], [10, 9]];
  let d = starPath(big[0] * S, big[1] * S, 3 * S);
  for (const [x, y] of small) {
    const ang = Math.atan2(big[1] - y, big[0] - x) * 180 / Math.PI;   // 指向大星的方向
    d += starPath(x * S, y * S, S, ang + 90);                         // 尖角預設朝上（-90°），轉到該方向
  }
  return svg(90, 60, rect(0, 0, 90, 60, '#DE2910') + `<path d="${d}" fill="#FFDE00"/>`);
})();

/* ───── 韓國（3:2；《大韓民國國旗法施行令》，單位 = 旗高 / 20）─────
   太極直徑 = 旗高 / 2（10）；每卦長 = 太極直徑 / 2（5）、寬 = 太極直徑 / 3（10/3，三爻＋兩個間隔共五等份）；
   卦與太極之間隔 = 太極直徑 / 4；四卦在旗面對角線上（建＝左上、坤＝右下、坎＝右上、離＝左下）；太極的陰陽分界與右上—左下對角線平行。 */
const KR = (() => {
  const U = 3, d = 10 * U, r = d / 2, len = d / 2, wid = d / 3, bar = wid / 5;
  const diag = Math.atan2(20, 30) * 180 / Math.PI;          // 旗面對角線與水平的夾角 33.69°
  const dist = r + d / 4 + wid / 2;                          // 卦中心離旗中心的距離
  const trigram = (corner, lines) => {   // corner：-1 / 1 = 左 / 右，上下由 sy 決定；lines = 由外（靠角落）到內，true = 斷（陰）
    const [sx, sy] = corner, ang = Math.atan2(sy * 20, sx * 30);
    const cx = 45 + dist * Math.cos(ang), cy = 30 + dist * Math.sin(ang), rot = ang * 180 / Math.PI + 90;
    return `<g transform="translate(${n(cx)} ${n(cy)}) rotate(${n(rot)})">${lines.map((broken, i) => {
      const y = -wid / 2 + i * 2 * bar;   // y < 0 = 靠角落的外側
      return broken
        ? `<rect x="${n(-len / 2)}" y="${n(y)}" width="${n(len * 0.4)}" height="${n(bar)}"/><rect x="${n(len * 0.1)}" y="${n(y)}" width="${n(len * 0.4)}" height="${n(bar)}"/>`
        : `<rect x="${n(-len / 2)}" y="${n(y)}" width="${n(len)}" height="${n(bar)}"/>`;
    }).join('')}</g>`;
  };
  // 太極：上紅下藍的兩個半圓，再在分界線上各疊一個半徑 r/2 的小圓（左藍、右紅），整體順時針旋轉 -33.69°，使分界線與右上—左下對角線平行
  const taeguk = `<g transform="rotate(${n(-diag)} 45 30)"><path d="M${45 - r} 30a${r} ${r} 0 0 1 ${d} 0z" fill="#CD2E3A"/><path d="M${45 - r} 30a${r} ${r} 0 0 0 ${d} 0z" fill="#0047A0"/>`
    + `<circle cx="${45 - r / 2}" cy="30" r="${r / 2}" fill="#0047A0"/><circle cx="${45 + r / 2}" cy="30" r="${r / 2}" fill="#CD2E3A"/></g>`;
  return svg(90, 60, rect(0, 0, 90, 60, '#fff') + taeguk
    + `<g fill="#000">${trigram([-1, -1], [0, 0, 0])}${trigram([1, 1], [1, 1, 1])}${trigram([1, -1], [1, 0, 1])}${trigram([-1, 1], [0, 1, 0])}</g>`);
})();

/* ───── 法國（3:2）：藍白紅三條等寬直帶 ───── */
const FR = svg(90, 60, rect(0, 0, 30, 60, '#0055A4') + rect(30, 0, 30, 60, '#fff') + rect(60, 0, 30, 60, '#EF4135'));

/* ───── 德國（法定 5:3 → 這裡改 3:2）：黑紅金三條等寬橫帶（三等分不受比例影響） ───── */
const DE = svg(90, 60, rect(0, 0, 90, 20, '#000') + rect(0, 20, 90, 20, '#DD0000') + rect(0, 40, 90, 20, '#FFCE00'));

/* ───── 義大利（3:2）：綠白紅三條等寬直帶 ───── */
const IT = svg(90, 60, rect(0, 0, 30, 60, '#009246') + rect(30, 0, 30, 60, '#fff') + rect(60, 0, 30, 60, '#CE2B37'));

/* ───── 俄羅斯（3:2）：白藍紅三條等寬橫帶 ───── */
const RU = svg(90, 60, rect(0, 0, 90, 20, '#fff') + rect(0, 20, 90, 20, '#0039A6') + rect(0, 40, 90, 20, '#D52B1E'));

/* ───── 巴西（法定 10:7 → 這裡寬度加到 21 × 14 模組 = 3:2；Lei 5.700/1971，單位 = 旗高 / 14 = 1 模組）─────
   為了不讓圓盤變橢圓，只把綠色底與黃色菱形向左右各加寬 0.5 模組（菱形四頂點離旗框仍是 1.7 模組），
   圓盤、弧帶、銘文、星空整組平移 +0.5 模組，圖樣本身完全照法定尺寸；
   黃色菱形四頂點離旗框 1.7 模組；藍色圓盤半徑 3.5、圓心在旗面正中央；
   白色弧帶：兩弧圓心在「圓盤垂直直徑與旗底相交點」左邊 2 模組處、半徑 8 與 8.5（帶寬 0.5），帶上寫綠色「ORDEM E PROGRESSO」（P 在圓盤垂直直徑上）；
   27 顆白星依「1889/11/15 8:30 里約的天空」分布（只有南十字、天蠍、大犬、南三角、長蛇、室女、小犬、船底、南極座），
   星的大小分 5 級（外接圓直徑 0.30 / 0.25 / 0.20 / 0.14 / 0.10 模組）；弧帶以上只有一顆星（小犬座南河三，代表帕拉州，赤道穿過該州）。 */
const BR = (() => {
  const O = [10, 7], RD = 3.5, C = [8, 14], R1 = 8, R2 = 8.5;
  // 弧帶（取樣成多邊形）：外弧（上）由左到右 → 沿圓盤邊緣往下接到內弧 → 內弧由右到左 → 沿圓盤邊緣回到起點
  const arcAngles = r => {   // 以 C 為圓心、半徑 r 的圓與圓盤的兩個交點，回傳相對鉛直向上的角度（左負右正）
    const dx = O[0] - C[0], dy = O[1] - C[1], D = Math.hypot(dx, dy), a = (r * r - RD * RD + D * D) / (2 * D), h = Math.sqrt(r * r - a * a);
    const mx = C[0] + a * dx / D, my = C[1] + a * dy / D;
    return [[mx + h * dy / D, my - h * dx / D], [mx - h * dy / D, my + h * dx / D]]
      .map(([x, y]) => Math.atan2(x - C[0], C[1] - y)).sort((p, q) => p - q);
  };
  const [o0, o1] = arcAngles(R2), [i0, i1] = arcAngles(R1);
  const onArc = (r, a) => [C[0] + r * Math.sin(a), C[1] - r * Math.cos(a)];
  const sample = (r, a0, a1, k = 28) => Array.from({ length: k + 1 }, (_, i) => onArc(r, a0 + (a1 - a0) * i / k));
  const discPts = (from, to, k = 8) => {   // 圓盤邊緣上由 from 點走到 to 點（取較短的弧）
    const t0 = Math.atan2(from[1] - O[1], from[0] - O[0]);
    let dt = Math.atan2(to[1] - O[1], to[0] - O[0]) - t0; dt = Math.atan2(Math.sin(dt), Math.cos(dt));
    return Array.from({ length: k - 1 }, (_, i) => [O[0] + RD * Math.cos(t0 + dt * (i + 1) / k), O[1] + RD * Math.sin(t0 + dt * (i + 1) / k)]);
  };
  const outer = sample(R2, o0, o1), inner = sample(R1, i1, i0);
  const band = [...outer, ...discPts(outer[outer.length - 1], inner[0]), ...inner, ...discPts(inner[inner.length - 1], outer[0])];

  // 銘文：沿弧帶中線（半徑 8.25）等角距排列，P 對準圓盤垂直直徑（x = 10）
  const text = 'ORDEM E PROGRESSO', Rm = 8.25, pitch = 0.36 / Rm, p0 = Math.asin((O[0] - C[0]) / Rm), pIdx = text.indexOf('PROGRESSO');
  const letters = [...text].map((ch, i) => ch === ' ' ? '' :
    `<text transform="translate(${C[0]} ${C[1]}) rotate(${n((p0 + (i - pIdx) * pitch) * 180 / Math.PI)}) translate(0 ${-(Rm - 0.165)})" text-anchor="middle">${ch}</text>`).join('');

  // 27 顆星：[x, y, 等級 1~5]（旗面模組座標）。大犬座 5、南十字 5、南三角 3、天蠍 8、船底（老人星）1、長蛇 2、室女（角宿一）1、南極座 1、小犬 1
  const S = [
    [11.15, 4.55, 1],                                                                       // 南河三（小犬）— 弧帶以上唯一一顆
    [7.2, 7.05, 1], [7.9, 6.8, 2], [7.55, 7.6, 4], [8.2, 7.65, 2], [7.9, 8.2, 2],             // 大犬：天狼星、β、γ、δ、ε
    [7.3, 8.65, 1],                                                                        // 老人星（船底）
    [9.2, 8.35, 2], [9.2, 10.0, 1], [9.8, 9.2, 2], [8.6, 9.1, 3], [8.95, 9.6, 4],             // 南十字：γ、α、β、δ、ε
    [10.6, 9.8, 2], [10.45, 9.15, 3], [11.0, 9.3, 3],                                      // 南三角：α、β、γ
    [11.95, 7.6, 3], [12.4, 8.05, 1], [12.05, 8.5, 2], [11.75, 8.9, 3], [11.6, 9.35, 2], [11.95, 9.55, 3], [12.35, 9.25, 3], [12.5, 8.75, 3],   // 天蠍：β、心宿二、ε、μ、θ、ι、κ、λ
    [10.15, 10.1, 4],                                                                      // σ 南極座（南天極附近那顆）
    [10.7, 7.1, 2], [11.4, 7.4, 3],                                                          // 長蛇：α（星宿一）、γ
    [10.45, 7.9, 1]                                                                        // 室女：角宿一
  ];
  const rr = [0, 0.15, 0.125, 0.1, 0.07, 0.05];
  const stars = S.map(([x, y, c]) => starPath(x, y, rr[c])).join('');
  const W = 21, dx = (W - 20) / 2;   // 旗面寬 21（= 高 14 × 3/2）；圖樣以 dx 平移置中
  return svg(W, 14, rect(0, 0, W, 14, '#009C3B') + poly([[1.7, 7], [W / 2, 12.3], [W - 1.7, 7], [W / 2, 1.7]], '#FFDF00')
    + `<g transform="translate(${dx} 0)"><circle cx="10" cy="7" r="3.5" fill="#002776"/><path d="${stars}" fill="#fff"/>` + poly(band, '#fff')
    + `<g fill="#009C3B" font-family="Verdana,'DejaVu Sans',Arial,sans-serif" font-weight="700" font-size="0.45">${letters}</g></g>`);
})();

/* ───── 西班牙（3:2）：紅 1 / 黃 2 / 紅 1；國徽在黃帶上、偏旗桿側（中心約在旗寬 0.36 處），高度約等於黃帶（旗高 1/2）─────
   國徽（以下座標單位：整體高 100、寬約 70，原點在盾牌中心）：盾牌四分 + 南端格拉納達 + 中央波旁—安茹橢圓小盾、
   兩側海克力斯之柱（左：帝國王冠、右：王冠）、紅色綬帶（PLUS ULTRA）、頂端王冠。 */
const ES = (() => {
  const gold = '#F1BF00', red = '#AD1519', blue = '#0039F0', purple = '#8C2C8A', silver = '#fff', green = '#058E6E', stone = '#D5D5D5', shade = '#9A9A9A';
  const yb = x => 8 + Math.sqrt(289 - x * x);   // 盾牌下半圓的下緣 y（圓心 (0,8)、半徑 17）
  // 盾牌四分：上排 y -17~4（卡斯提亞 / 萊昂），下排 y 4~圓弧（亞拉岡 / 納瓦拉）
  let a = rect(-17, -17, 17, 21, red) + rect(0, -17, 17, 21, silver)
    + `<path d="M-17 4H0V25A17 17 0 0 1-17 8Z" fill="${gold}"/><path d="M0 4H17V8A17 17 0 0 1 0 25Z" fill="${red}"/>`;
  // 亞拉岡：金底 4 條紅直紋
  for (const x of [-14.5, -10.5, -6.5, -2.5]) a += poly([[x - 0.9, 4], [x + 0.9, 4], [x + 0.9, yb(x + 0.9)], [x - 0.9, yb(x - 0.9)]], red);
  // 納瓦拉：紅底金鏈（以中心綠寶石 + 放射鏈條表示）
  const nx = 8.7, ny = 13;
  a += `<g stroke="${gold}" stroke-width="0.9" fill="none"><path d="M${nx - 5.5} ${ny}H${nx + 5.5}M${nx} ${ny - 5.5}V${ny + 5.5}M${nx - 4} ${ny - 4}L${nx + 4} ${ny + 4}M${nx + 4} ${ny - 4}L${nx - 4} ${ny + 4}"/><circle cx="${nx}" cy="${ny}" r="3.1"/></g><circle cx="${nx}" cy="${ny}" r="1.5" fill="${green}"/>`;
  // 卡斯提亞：金色三塔城堡（藍窗）
  a += `<g fill="${gold}" stroke="#000" stroke-width="0.35"><path d="M-14 -3V-8h2v-2h2v2h2v-2h2v2h2v5z"/><path d="M-11.5 -8V-14h3v6z"/><path d="M-12 -14h4l-.5 -1.5h-3z"/></g><path d="M-10.6 -3v-2.2a.8 .8 0 0 1 1.6 0V-3zM-13 -9.4h.8v1.5h-.8zM-6.5 -9.4h.8v1.5h-.8z" fill="${blue}"/>`;
  // 萊昂：紫色直立獅（簡化輪廓）
  a += `<path d="M9.5 -15.2c1.4-.7 2.8 0 3.2 1.1 1.3.2 2.2 1 2 2.2-.3 1.1-1.5 1.5-1.3 2.5.3 1 1.7 1.5 1.5 3 -.6-.4-1.2-.2-1.7.6-.7 0 -1-.8-1.7-.3-.3.8.4 1.5 1 2.3-1.2.2-2-.4-2.4-1.5-.4 1.1-.2 2.4.9 3.2-1.8.1-3-1.4-3-3.2-.7.8-1.4.7-1.9.1.4-1.3 1.7-1.4 1.7-2.7 0-1.3-1.3-1.4-1.3-2.6 0-1.4 1.5-2.1 3-2.4.3-.6 0-1.2 0-1.9z" fill="${purple}" stroke="#000" stroke-width="0.3"/>`;
  // 格拉納達（盾尖）：白底紅石榴
  a += `<path d="M-5.2 15.5H5.2V19Q5.2 22.5 0 25Q-5.2 22.5-5.2 19Z" fill="${silver}" stroke="#000" stroke-width="0.35"/><circle cx="0" cy="19.2" r="2.4" fill="${red}"/><path d="M-1.4 16.8Q0 15.4 1.4 16.8" stroke="${green}" stroke-width="0.9" fill="none"/>`;
  // 中央橢圓小盾：藍底三朵金色百合，紅色外圈
  const fl = (x, y) => `<path d="M${x} ${y - 2.2}q1.1 1.3 .5 2.6l1 -.7q.4 1.4-.9 2.1h-1.2q-1.3-.7-.9-2.1l1 .7q-.6-1.3.5-2.6z" fill="${gold}"/>`;
  a += `<ellipse cx="0" cy="2" rx="6.7" ry="8.2" fill="${red}"/><ellipse cx="0" cy="2" rx="5.5" ry="7" fill="${blue}"/>${fl(-2.4, 0.3)}${fl(2.4, 0.3)}${fl(0, 5.2)}`;
  a = `<path d="M-17.6 -17.6H17.6V8A17.6 17.6 0 0 1-17.6 8Z" fill="#000"/>${a}`;   // 先墊一層黑色細邊
  const shield = `<g>${a}</g>`;
  const ink = 'stroke="#000" stroke-width="0.35"';
  // 王冠（底邊在 y = 0、向上長）：金色冠環＋紅色冠帽＋金色冠弧＋頂端球與十字；imperial = 帝國王冠（較高、冠弧較多）
  const crown = (w, imperial) => {
    const h = imperial ? w * 1.15 : w * 0.95;
    return `<path d="M${-w / 2} 0V${-w * 0.3}h${w}V0z" fill="${gold}" ${ink}/>`
      + `<path d="M${-w / 2 + 0.6} ${-w * 0.3}Q${-w / 2 + 0.6} ${-h} 0 ${-h - 1}Q${w / 2 - 0.6} ${-h} ${w / 2 - 0.6} ${-w * 0.3}z" fill="${red}" ${ink}/>`
      + `<path d="M${-w / 2 + 0.6} ${-w * 0.3}Q${-w * 0.3} ${-h + 1} 0 ${-h - 1}Q${w * 0.3} ${-h + 1} ${w / 2 - 0.6} ${-w * 0.3}M0 ${-w * 0.3}V${-h - 1}`
      + (imperial ? `M${-w * 0.2} ${-w * 0.3}Q${-w * 0.2} ${-h + 1} 0 ${-h - 1}M${w * 0.2} ${-w * 0.3}Q${w * 0.2} ${-h + 1} 0 ${-h - 1}` : '') + `" fill="none" stroke="${gold}" stroke-width="1"/>`
      + `<circle cx="0" cy="${-h - 1.6}" r="1.3" fill="${gold}" ${ink}/><path d="M0 ${-h - 2.8}V${-h - 5.6}M-1.2 ${-h - 4.6}H1.2" stroke="${gold}" stroke-width="1"/>`
      + [-0.35, 0, 0.35].map(k => `<circle cx="${n(k * w)}" cy="${n(-w * 0.15)}" r="0.7" fill="#fff"/>`).join('');
  };
  // 海克力斯之柱（柱身、柱頂與柱腳金環、柱頂王冠）
  const pillar = (x, imperial) => `<g transform="translate(${x} 0)"><rect x="-4.2" y="-8" width="8.4" height="46" fill="${stone}" ${ink}/><rect x="1.2" y="-8" width="3" height="46" fill="${shade}"/>`
    + `<rect x="-5.4" y="-10.4" width="10.8" height="2.6" fill="${gold}" ${ink}/><rect x="-5.4" y="37.8" width="10.8" height="2.6" fill="${gold}" ${ink}/>`
    + `<g transform="translate(0 -10.4)">${crown(9, imperial)}</g></g>`;
  // 紅色綬帶（PLUS ULTRA）：橫過兩柱之間盾牌下方，兩端為燕尾
  const ribbon = `<path d="M-32 27.5H32L28.6 32.5L32 37.5H-32L-28.6 32.5Z" fill="${red}" ${ink}/>`
    + `<text x="0" y="34.5" text-anchor="middle" font-size="5" font-weight="700" fill="${gold}" font-family="Verdana,'DejaVu Sans',Arial,sans-serif" letter-spacing=".3">PLUS ULTRA</text>`;
  // 頂端王冠（盾牌上方）
  const top = `<g transform="translate(0 -16.6)">${crown(19, false)}</g>`;
  const arms = `<g transform="translate(32.4 30) scale(0.34) translate(0 2)">${pillar(-27, true)}${pillar(27, false)}${shield}${ribbon}${top}</g>`;
  return svg(90, 60, rect(0, 0, 90, 60, '#AA151B') + rect(0, 15, 90, 30, '#F1BF00') + arms);
})();

export const FLAGS = { en: US, 'en-GB': UK, zh: TW, 'zh-CN': CN, ja: JP, ko: KR, fr: FR, de: DE, es: ES, 'pt-BR': BR, it: IT, ru: RU };
