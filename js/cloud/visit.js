/* 造訪紀錄（給管理員面板的「網站統計」用）
 *   瀏覽器第一次造訪時產生一組隨機的裝置代碼（只存在 localStorage，不含任何個人資料）；
 *   每台裝置每天（UTC+8）第一次開啟網頁時記錄一次：
 *     visitors/{裝置代碼}      { f = 第一次造訪日, l = 最近一次造訪日 }   → 訪問人數
 *     visits/{日期}_{裝置代碼}  { d = 日期, v = 裝置代碼 }                → 日均活躍人數
 *   直接呼叫 Firestore REST API（不載入 Firebase SDK，不登入也能記錄，不拖慢第一次繪製）；寫入的格式限制見 firestore.rules。
 *   失敗（離線、被廣告攔截器擋下…）就靜默略過，下次開啟網頁再試。 */
import { FIREBASE_CONFIG } from './config.js';
import { Store, KEY_VISIT } from '../storage/store.js';

const dayOf = ms => new Date(ms + 8 * 3600e3).toISOString().slice(0, 10);
const newId = () => {
  const b = crypto.getRandomValues(new Uint8Array(20));
  return Array.from(b, x => (x % 36).toString(36)).join('');   // 20 碼英數字（小寫）
};
const BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_CONFIG.projectId}/databases/(default)/documents`;
const KEY = `?key=${encodeURIComponent(FIREBASE_CONFIG.apiKey)}`;
const str = v => ({ stringValue: v });
const send = (url, method, fields) => fetch(url, {
  method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields }),
  credentials: 'omit', referrerPolicy: 'no-referrer', keepalive: true,
});

export async function logVisit() {
  try {
    const today = dayOf(Date.now());
    let st = Store.get(KEY_VISIT, null);
    if (!st || typeof st.id !== 'string' || !/^[a-z0-9]{16,32}$/.test(st.id) || !/^\d{4}-\d{2}-\d{2}$/.test(st.f)) st = { id: newId(), f: today, d: '' };
    if (st.d === today) return;   // 今天已經記錄過
    // ① visitors/{id}：以 PATCH 建立或更新（f 在第一次寫入後就不變）
    const r1 = await send(`${BASE}/visitors/${st.id}${KEY}&updateMask.fieldPaths=f&updateMask.fieldPaths=l`, 'PATCH', { f: str(st.f), l: str(today) });
    if (!r1.ok) return;
    // ② visits/{日期}_{id}：每天一份，只新增（已存在時伺服器回 409 / 403，視為完成）
    const r2 = await send(`${BASE}/visits${KEY}&documentId=${today}_${st.id}`, 'POST', { d: str(today), v: str(st.id) });
    if (r2.ok || r2.status === 409 || r2.status === 403) Store.set(KEY_VISIT, { ...st, d: today });
    else Store.set(KEY_VISIT, { ...st, d: st.d });   // 失敗：保留裝置代碼，下次再試
  } catch { /* 離線 / 被擋下：下次開啟網頁再試 */ }
}
