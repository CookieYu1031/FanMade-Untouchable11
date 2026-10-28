# Untouchable 11

> **粉絲作品聲明（Fan-made）**
> 本專案為開發者 Cookie Yu 個人學習用途之非營利粉絲致敬作品，為非官方作品，未經原作者授權或背書，與原作者及實體發行商無任何商業合作關係。《Untouchable 11》及其衍伸作品之拼圖設計與名稱相關權利（如有）歸原作者 Peter Grabarchuk 與 Carl Hoff 所有，不在本專案授權範圍內。若有任何侵權疑慮，請透過 [GitHub Issues](https://github.com/CookieYu1031/untouchable11/issues) 聯絡開發者，將立即處理或移除。

## 致謝與參考
- 拼圖作者：[Peter Grabarchuk](https://www.facebook.com/grabarchuk/)、[Carl Hoff](https://www.youtube.com/@Carl_Hoff)
- 網頁開發者：Cookie Yu
- 參考資料：[Untouchable11（Gathering 4 Gardner 交換禮物）](https://www.gathering4gardner.org/g4g13gift/puzzles/HoffCarl-GiftExchange-FromUntouchable11toHazmatCargo-G4G13.pdf)，其餘參考資料見網站內「規則與資訊」

## 授權
本專案依內容分開授權，**不是單一授權**，範圍詳見 [NOTICE.md](NOTICE.md)：

| 內容 | 授權 |
|---|---|
| 程式碼（`js/`、`index.html`、`firestore.rules`） | [MIT](LICENSE) |
| 視覺設計與文字（`css/`、`assets/`、`data/colors.json`、`js/i18n/locales/`） | [CC BY-NC-SA 4.0](LICENSE-CONTENT.md)（姓名標示、非商業性、相同方式分享） |
| 拼圖設計與名稱（含 `data/pieces.json`、`data/levels.json`） | **不在授權範圍內**，相關權利（如有）歸原作者 |

本專案依現狀提供，不附任何明示或默示之擔保（詳見 [LICENSE](LICENSE)）。

## 結構
- `index.html`：頁面結構（所有視窗的 HTML），以及內嵌的載入畫面（`#loader`；由 `js/ui/loader.js` 在第一次繪製完成後收起）
- `assets/`：網頁縮圖（`thumbnail.png`，供社群分享預覽的 `og:image` 使用）、網站圖示（`icon.svg`，及 `icon-32.png`、`icon-192.png`；第 12 號拼圖的轉向版、透明背景）
- `data/`：設定檔
  - `pieces.json`：35 種六格骨牌（1~21 號「常用組」、22~35 號「非常用組」），啟動時會驗證每片都是 6 格；`extraFamilies` 放其他類別的拼圖（目前有 9 種七格骨牌，代號為 a~i，驗證每片都是 7 格）
  - `levels.json`：關卡（尺寸、解答數、各槽位放哪一號拼圖）、拼圖盤順序；關卡可使用任一組的拼圖（以 `family` 指定拼圖類別，省略 = 六格骨牌）
    - `lv` 是存檔用的固定編號（解答冊、盤面、雲端文件都以它記錄），新關卡一律接在最後（lv 可以是小數，例如獵戶挑戰 = 12.1；程式一律用 `levelOf(lv)` 取關卡，不要用陣列索引）；按鈕列與統計表的顯示順序由 `order` 決定（大師、隨機、北斗挑戰、獵戶挑戰、危險貨物、危險貨物2）
    - 隨機挑戰（lv 13）寫 `random`：`{pool, pick, exclude}`，從 pool 取 pick 片；組合由 4 碼代碼決定（編碼 / 映射規則見 `js/core/random-code.js`），`exclude` = 不使用的組合（目前排除與危險貨物相同的那組）；盤面本機最多留 12 份；上雲端的只有「目前代碼」的那一份，玩家換代碼後雲端上不符的盤面會刪除（雲端文件的盤面上限為 60 份）
    - 有「拼圖組合」的關卡（北斗挑戰 lv 12 = A~G、獵戶挑戰 lv 12.1 = a~g，各 7 組）寫 `groups`：每組 `{key, pieces, names}`（`names` = 這顆星的各語言名稱），各組的拼圖組成不可相同（解答冊靠盤面上出現的拼圖判斷解答屬於哪一組），組合代號在所有關卡間不可重複；每組各自保留盤面與返回上一步紀錄；`sky` = `{stars:{代號:[x, y]}, lines:[[代號, 代號]…]}` 是星圖視窗裡每顆星的位置（0~100 × 0~62）與星座連線（兩端都點亮才連線）；收錄進度以「每顆星」顯示；摘星兩關沒有近似解（不寫 `near`）
    - 舊版皇冠挑戰（lv 12 同時放 A~G 與 a~g）的存檔由 `js/storage/migrate.js` 自動拆分：獵戶的解答 / 盤面 / 目前組合搬到 lv 12.1（本機與雲端資料套用時都會執行，可重複執行）
  - `colors.json`：色盤與「槽位數 → 顏色序」
- `css/`：依區域分檔（base、components、hero、levels、layout、board、tray、book、help、solution、modals、settings、stats、group、random、immersive）；載入順序見 index.html，順序會影響覆蓋關係
- `js/`：依功能分檔（ES modules），進入點 `main.js`
  - 音效（`js/audio/sfx.js`）與背景音樂（`js/audio/music.js`）都是 Web Audio 即時合成，沒有使用任何音檔或他人作品，因此沒有音樂版權問題
  - `core/` 設定載入、矩陣工具、隨機挑戰的代碼編碼（`random-code.js`）　`state/` 狀態與設定　`game/` 判定、簽章、過關收錄
  - `storage/` 存檔、解答冊、歷史、舊版遷移　`i18n/` 多語系（繁中、簡中、日、韓、English(US)、English(UK)；第一次開啟時依瀏覽器偏好語言 / 地區自動選擇，偵測不到就用 English(US)；缺少翻譯的字串一律退回英文；各語言字體、國旗與新增語言的步驟見 `i18n/i18n.js` 開頭、`ui/flags.js`）　`audio/` 音效　`cloud/` Google 登入與雲端同步
    - 雲端同步分兩類：主動同步（收錄新解答與排行積分同一批、暱稱、參與排行）立刻送出；延遲同步（盤面、其他設定）等下一個每 5 分鐘的定時點，或被主動同步順帶送出；詳見 `js/cloud/sync.js` 開頭註解
  - `ui/viewport.js`：視窗分級（小 ≤ 640px／中 641~1007px／大 ≥ 1008px），斷點與 `css/` 的 `@media` 一致
  - `ui/` 繪製、互動（拖曳、旋轉）、各視窗、鍵盤、沉浸模式（`immersive.js` 切換、`fan.js` 繪製右下角圓點彈出的小型拼圖盤）
