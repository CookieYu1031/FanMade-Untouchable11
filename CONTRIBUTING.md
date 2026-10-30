# 開發規範

## 環境
- Node.js ≥ 20（只用來跑檢查工具；網站本身沒有建置步驟）
- `npm install` 安裝 ESLint
- `npm start` 在 http://localhost:8080 開啟本機伺服器（ES modules 不能用 `file://` 開啟）

## 提交前
```sh
npm run check      # = npm run validate && npm run lint
```
GitHub Actions（`.github/workflows/ci.yml`）在每次 push / PR 也會跑同一組檢查。

### `npm run validate` 會檢查什麼（`scripts/validate.mjs`）
- `data/*.json` 可解析；關卡 `lv` 不重複，每個關卡都有各語言名稱
- 六格 / 七格骨牌每片格數正確、編號不重複
- 所有語言檔的 key 與 `zh.js` 完全一致；`index.html` 用到的 `data-i18n*` key 都存在
- 每個語言在 `LANG_INFO` 都有 `code`（ISO 語言代碼，不可重複）、`label`（原名稱）等欄位
- `index.html` 的 id 不重複、參照的本機檔案存在、`target="_blank"` 都有 `rel="noopener"`

## 程式風格
- 格式遵循 `.editorconfig`（UTF-8、LF、2 空格縮排、檔尾換行）
- JavaScript：ES modules、`const` / `let`（禁用 `var`）、`===`；沒用到的 catch 變數寫 `catch { /* 原因 */ }`
- 註解用繁體中文，寫「為什麼」而不是「做什麼」；每個檔案開頭用一段註解說明職責
- CSS：依區域分檔，載入順序見 `index.html`（順序會影響覆蓋關係）；顏色一律用 CSS 變數，並同時支援亮 / 暗色
- 不使用 inline 事件屬性（`onclick=` 等）

## 語言（`js/i18n/i18n.js`）
- 新增語言步驟見檔案開頭；要讓它出現在「推薦語言」，另補 `REGION_LANGS` / `SIMILAR`
- 語言以文字呈現（ISO 代碼 + 原名稱），不使用國旗：一種語言不等於一個國家

## 資料與授權
- 修改 `data/` 的結構時，同步更新 `README.md` 的「結構」說明與 `scripts/validate.mjs`
- 內容授權範圍見 [NOTICE.md](NOTICE.md)
- 提交訊息建議格式：`feat:` / `fix:` / `refactor:` / `docs:` / `chore:`（[Conventional Commits](https://www.conventionalcommits.org/zh-hant/)）
