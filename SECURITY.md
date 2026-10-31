# 安全政策

## 回報安全問題
若發現安全漏洞（例如 Firestore 規則可被繞過、XSS、資料外洩），請**不要**直接開公開的 Issue。
請透過 GitHub 的 [Private vulnerability reporting](https://github.com/CookieYu1031/untouchable11/security/advisories/new) 私下回報，並附上重現步驟。

## 專案的安全設計
- 純靜態網站，沒有自建後端；雲端功能只使用 Firebase Auth（Google 登入）與 Cloud Firestore。
- `js/cloud/config.js` 內的 Firebase Web 設定值本來就是公開的，真正的存取控制在 [`firestore.rules`](firestore.rules)：每位使用者只能讀寫自己的資料，排行榜只能寫自己的那一份，且欄位型別與範圍受限。**修改 `firestore.rules` 後請用 Firebase Emulator 測試再部署。**
- 建議在 Firebase Console 把 API Key 的「應用程式限制」設為 HTTP 參照位址（`cookieyu1031.github.io`），並在 Authentication 的「已授權網域」只保留正式網域。
- 第一次進站、且瀏覽器偏好語言都不支援時，會向第三方服務（`api.country.is`，失敗再用 `ipwho.is`）查詢使用者 IP 所在的國家以決定介面語言：只讀取國家代碼、不帶 Cookie 與 Referrer，結果不會上傳到本站雲端；查到後語言存在本機設定，之後不再查詢。
- 頁面中不使用 inline 事件屬性（`onclick=` 等），日後若要加上嚴格的 Content-Security-Policy 可以直接套用（GitHub Pages 無法設定 HTTP 標頭時，可改用 Cloudflare 等前端代理加上標頭）。
- 使用者輸入（暱稱等）一律以 `textContent` 或跳脫後輸出，請維持這個做法；新增 `innerHTML` 時，內容必須來自程式內建的字串，不可含使用者輸入。
