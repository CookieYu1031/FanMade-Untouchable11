# Untouchable 11

## 執行方式
本專案使用 ES 模組與 JSON 設定檔，必須透過網頁伺服器開啟（直接雙擊 index.html 不行）：

    python3 -m http.server 8000     # 在此資料夾執行
    # 瀏覽器開啟 http://localhost:8000/

也可直接部署到 GitHub Pages 等靜態空間。

## 結構
- `index.html`：頁面結構（所有視窗的 HTML）
- `data/`：設定檔
  - `pieces.json`：35 種六格骨牌（1~21 號「常用組」、22~35 號「非常用組」），啟動時會驗證每片都是 6 格
  - `levels.json`：關卡（尺寸、解答數、各槽位放哪一號拼圖）、拼圖盤順序；關卡可使用任一組的拼圖
  - `colors.json`：色盤與「槽位數 → 顏色序」
- `css/`：依區域分檔（base、components、hero、levels、layout、board、tray、book、help、solution、modals、settings、stats）；載入順序見 index.html，順序會影響覆蓋關係
- `js/`：依功能分檔（ES modules），進入點 `main.js`
  - `core/` 設定載入、矩陣工具　`state/` 狀態與設定　`game/` 判定、簽章、過關收錄
  - `storage/` 存檔、解答冊、歷史、舊版遷移　`i18n/` 多語系　`audio/` 音效　`io/` 匯出匯入
  - `ui/` 繪製、互動（拖曳、旋轉）、各視窗、鍵盤
