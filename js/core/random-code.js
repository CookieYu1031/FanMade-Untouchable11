/* =====================================================================
 * 隨機挑戰的組合代碼 —— 純運算，不碰畫面與存檔
 *
 * 從拼圖庫 n 片（2~21 號共 20 片）中取 k 片（9 片）= C(20,9) = 167,960 種組合，
 * 每一種組合依「字典序」編成一個編號（0 ~ 167959），再用 30 個字元寫成 4 位的 30 進位代碼：
 *   字元表 2345679ABCDEFGHJKLNPQRSTUVWXYZ（不含 0 1 8 M O I，避免看錯）；
 *   編號 < 167960，所以第一個字元一定落在字元表前 7 個（2~9 的數字）。
 *
 * 玩家輸入的任意 4 個字，在「背後運算」時才轉換（畫面上不會改玩家輸入的字）：
 *   0、O → Q　1、I → L　8 → B　M → N（大小寫不分、全形會先轉半形）
 *   不在字元表裡的字（例如中文）→ 用該字的 Unicode 編碼 % 30 當作字元表位置
 *   轉成 4 位 30 進位數字後 ÷ 組合總數 取餘數 → 編號 → 原代碼（canonical code）
 *
 * 排除組合（exclude）：某些組合不出現在隨機挑戰裡（例如與「危險貨物」相同的那一組）。
 *   骰子不會抽到；輸入的代碼若剛好映射到被排除的組合，順延到下一個編號。
 * ===================================================================== */

export const ALPHABET = '2345679ABCDEFGHJKLNPQRSTUVWXYZ';
export const BASE = ALPHABET.length;     // 30
export const CODE_LEN = 4;
const FOLD = { '0': 'Q', 'O': 'Q', '1': 'L', 'I': 'L', '8': 'B', 'M': 'N' };

// 畫面上的「4 個字」一律以字元（Unicode code point）計，不是 UTF-16 單位
export const charsOf = s => Array.from(String(s == null ? '' : s));
export const isTypedCode = s => typeof s === 'string' && charsOf(s).length === CODE_LEN && !/\s/.test(s);

// 單一字元 → 字元表位置（0 ~ 29）
export function charValue(ch) {
  const u = ch.normalize('NFKC').toUpperCase();
  const f = FOLD[u] || u;
  if (f.length === 1) { const i = ALPHABET.indexOf(f); if (i >= 0) return i; }
  return ch.codePointAt(0) % BASE;   // 中文或其他符號：用編碼決定位置（同一個字永遠對到同一個位置）
}

const binomTable = (n, k) => {
  const c = Array.from({ length: n + 1 }, () => Array(k + 1).fill(0));
  for (let i = 0; i <= n; i++) { c[i][0] = 1; for (let j = 1; j <= Math.min(i, k); j++) c[i][j] = c[i - 1][j - 1] + (j <= i - 1 ? c[i - 1][j] : 0); }
  return c;
};

/* n = 拼圖庫片數、k = 每次取幾片、ids = 拼圖庫每片的代號字元（依號碼由小到大）、
 * exclude = 要排除的組合（每組是 ids 的字元字串，順序不拘） */
export function makeCodec({ n, k, ids, exclude = [] }) {
  if (ids.length !== n) throw new Error('makeCodec：ids 長度必須等於 n');
  const C = binomTable(n, k), total = C[n][k];
  if (total > Math.pow(BASE, CODE_LEN)) throw new Error(`組合總數 ${total} 超過 ${CODE_LEN} 位代碼能表示的範圍`);

  // 組合（由小到大的位置陣列）<-> 編號（字典序）
  function rank(pos) {
    let idx = 0, prev = -1;
    for (let i = 0; i < k; i++) {
      for (let x = prev + 1; x < pos[i]; x++) idx += C[n - x - 1][k - i - 1];
      prev = pos[i];
    }
    return idx;
  }
  function unrank(idx) {
    const pos = []; let x = 0;
    for (let i = 0; i < k; i++) {
      for (;; x++) { const c = C[n - x - 1][k - i - 1]; if (idx < c) break; idx -= c; }
      pos.push(x++);
    }
    return pos;
  }
  const posOfIds = str => {
    const set = [...new Set(String(str))];
    if (set.length !== k) return null;
    const pos = set.map(ch => ids.indexOf(ch));
    return pos.some(p => p < 0) ? null : pos.sort((a, b) => a - b);
  };

  const excluded = new Set();
  exclude.forEach(g => { const p = posOfIds(g); if (!p) throw new Error('makeCodec：exclude 裡有無效的組合'); excluded.add(rank(p)); });
  if (excluded.size >= total) throw new Error('makeCodec：排除了所有組合');

  // 編號 <-> 4 位代碼
  const codeOfIndex = idx => {
    let s = '';
    for (let i = 0; i < CODE_LEN; i++) { s = ALPHABET[idx % BASE] + s; idx = Math.floor(idx / BASE); }
    return s;
  };
  const valueOf = chars => chars.reduce((v, ch) => v * BASE + charValue(ch), 0);
  const resolve = idx => { while (excluded.has(idx)) idx = (idx + 1) % total; return idx; };   // 被排除的組合順延到下一個

  // 任意輸入 → 編號 → 原代碼（原代碼本身再轉一次還是自己，因為編號 < 總數且沒被排除）
  const indexOf = typed => resolve(valueOf(charsOf(typed)) % total);
  const canon = typed => codeOfIndex(indexOf(typed));

  const idsOfIndex = idx => unrank(idx).map(p => ids[p]).join('');
  return {
    total, excluded,
    canon,                                                     // 任意輸入 → 原代碼
    isCanon: code => isTypedCode(code) && canon(code) === code,   // 是不是「原代碼」（可用來檢查存檔裡的鍵）
    idsOfCode: code => idsOfIndex(indexOf(code)),         // 代碼（原代碼或任意輸入）→ 這組拼圖的代號字串（依號碼由小到大）
    codeOfIdSet: str => { const p = posOfIds(str); return p ? codeOfIndex(rank(p)) : null; },   // 解答盤面上的拼圖 → 原代碼
    rollCode(rng = Math.random) {                              // 隨機抽一組（不會抽到被排除的組合）
      for (;;) { const i = Math.floor(rng() * total); if (!excluded.has(i)) return codeOfIndex(i); }
    },
    defaultCode: codeOfIndex(resolve(0)),
    // 以下供測試
    _rank: rank, _unrank: unrank, _codeOfIndex: codeOfIndex, _valueOf: typed => valueOf(charsOf(typed)),
  };
}
