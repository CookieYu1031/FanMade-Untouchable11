# Untouchable 11

## 結構
- `index.html`：頁面結構（所有視窗的 HTML）
- `assets/`：網頁縮圖（`thumbnail.png`，供社群分享預覽的 `og:image` 使用）
- `data/`：設定檔
  - `pieces.json`：35 種六格骨牌（1~21 號「常用組」、22~35 號「非常用組」），啟動時會驗證每片都是 6 格；`extraFamilies` 放其他類別的拼圖（目前有 9 種七格骨牌，代號為 a~i，驗證每片都是 7 格）
  - `levels.json`：關卡（尺寸、解答數、各槽位放哪一號拼圖）、拼圖盤順序；關卡可使用任一組的拼圖（以 `family` 指定拼圖類別，省略 = 六格骨牌）
  - `colors.json`：色盤與「槽位數 → 顏色序」
- `css/`：依區域分檔（base、components、hero、levels、layout、board、tray、book、help、solution、modals、settings、stats）；載入順序見 index.html，順序會影響覆蓋關係
- `js/`：依功能分檔（ES modules），進入點 `main.js`
  - `core/` 設定載入、矩陣工具　`state/` 狀態與設定　`game/` 判定、簽章、過關收錄
  - `storage/` 存檔、解答冊、歷史、舊版遷移　`i18n/` 多語系（中、英、日）　`audio/` 音效　`io/` 匯出匯入
  - `ui/` 繪製、互動（拖曳、旋轉）、各視窗、鍵盤
