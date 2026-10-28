/* 多語系 —— 英(美) / 英(英) / 繁中 / 簡中 / 日 / 韓 / 法 / 德 / 西 / 葡(巴西) / 義 / 俄（選單依此順序排成國旗矩陣）。靜態文字用 data-i18n* 屬性，動態文字用 t('key', ...參數)
   缺少翻譯時一律退回英文（見 langChain）；偵測不到語言時預設英文(美國)。
   新增語言：① locales/ 放一份語言檔 ② 在 LANG_INFO 登記 ③ ui/flags.js 補國旗 ④ levels.json 各關卡 / 星名補名稱
            ⑤ index.html 的 Google Fonts 與載入畫面文字 ⑥ css/base.css 補該語言的字體 */
import zh from './locales/zh.js';
import zhCN from './locales/zh-CN.js';
import ja from './locales/ja.js';
import ko from './locales/ko.js';
import en from './locales/en.js';
import enGB from './locales/en-GB.js';
import fr from './locales/fr.js';
import de from './locales/de.js';
import es from './locales/es.js';
import ptBR from './locales/pt-BR.js';
import it from './locales/it.js';
import ru from './locales/ru.js';

const I18N = { en, 'en-GB': enGB, zh, 'zh-CN': zhCN, ja, ko, fr, de, es, 'pt-BR': ptBR, it, ru };
const SANS_TC = '"Noto Sans TC","PingFang TC","Microsoft JhengHei"';
const SANS_LAT = `"Noto Sans",${SANS_TC},system-ui,sans-serif`;   // 拉丁 / 西里爾字母語言（法 德 西 葡 義 俄）
// 語言清單（設定選單依此順序）：label = 選單上的語言名稱，html = <html lang>，locale = 日期 / 數字格式，font = 分享圖（canvas）用的字體
// 字體堆疊要與 css/base.css 的 html[lang] 規則一致
export const LANG_INFO = {
  en:      { label:'English(US)', html:'en-US',   locale:'en-US', font:`${SANS_TC},system-ui,sans-serif` },
  'en-GB': { label:'English(UK)', html:'en-GB',   locale:'en-GB', font:`${SANS_TC},system-ui,sans-serif`, base:'en' },
  zh:      { label:'繁體中文',    html:'zh-Hant', locale:'zh-TW', font:`${SANS_TC},system-ui,sans-serif` },
  'zh-CN': { label:'简体中文',    html:'zh-Hans', locale:'zh-CN', font:'"Noto Sans SC","PingFang SC","Microsoft YaHei","Noto Sans TC",system-ui,sans-serif' },
  ja:      { label:'日本語',      html:'ja',      locale:'ja-JP', font:'"Noto Sans JP","Hiragino Sans","Yu Gothic","Meiryo","Noto Sans TC",system-ui,sans-serif' },
  ko:      { label:'한국어',      html:'ko',      locale:'ko-KR', font:'"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic","Noto Sans TC",system-ui,sans-serif' },
  fr:      { label:'Français',    html:'fr',      locale:'fr-FR', font:SANS_LAT },
  de:      { label:'Deutsch',     html:'de',      locale:'de-DE', font:SANS_LAT },
  es:      { label:'Español',     html:'es',      locale:'es-ES', font:SANS_LAT },
  'pt-BR': { label:'Português(BR)', html:'pt-BR', locale:'pt-BR', font:SANS_LAT },
  it:      { label:'Italiano',    html:'it',      locale:'it-IT', font:SANS_LAT },
  ru:      { label:'Русский',     html:'ru',      locale:'ru-RU', font:SANS_LAT },
};
export const LANGS = Object.keys(LANG_INFO);
export const DEFAULT_LANG = 'en';   // 偵測不到、或偵測到的語言不支援時使用英文(美國)
let LANG = DEFAULT_LANG;
export const getLang = () => LANG;

/* 自動偵測語言 —— 網頁拿不到 Google 帳戶的地區（要登入並取得額外授權才行），能用的是瀏覽器的「偏好語言清單」
   （通常等於作業系統 / 瀏覽器的語言與地區設定）。順序：偏好語言（含地區碼）→ 時區 → 英文(美國)。
   ※ index.html 的載入畫面有一份相同邏輯的精簡版（頁面 JS 載入前就要決定文字語言），修改時請兩邊一起改 */
const EN_UK = /^(gb|uk|ie|au|nz|in|za|sg|hk|my|ng|ke|pk|bd|lk|mt|cy)$/;   // 慣用英式拼寫 / 日期格式的英語地區
const ZH_TW = /^(tw|hk|mo|hant)$/;                                          // 繁體中文地區 / 字體（其餘如 cn、sg、hans 與沒有地區碼的 zh 都用簡體）
const TZ = { 'Asia/Taipei':'zh', 'Asia/Hong_Kong':'zh', 'Asia/Macau':'zh', 'Asia/Shanghai':'zh-CN', 'Asia/Tokyo':'ja', 'Asia/Seoul':'ko',
  'Europe/London':'en-GB', 'Europe/Dublin':'en-GB', 'Australia/Sydney':'en-GB', 'Pacific/Auckland':'en-GB',
  'Europe/Paris':'fr', 'Europe/Berlin':'de', 'Europe/Vienna':'de', 'Europe/Zurich':'de', 'Europe/Madrid':'es', 'America/Mexico_City':'es', 'America/Bogota':'es', 'America/Argentina/Buenos_Aires':'es',
  'America/Sao_Paulo':'pt-BR', 'Europe/Rome':'it', 'Europe/Moscow':'ru' };
export function detectLang() {
  const prefs = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]).filter(Boolean);
  for (const p of prefs) {
    const [base, ...rest] = String(p).toLowerCase().split('-');
    if (base === 'zh') return rest.some(s => ZH_TW.test(s)) ? 'zh' : 'zh-CN';
    if (base === 'ja') return 'ja';
    if (base === 'ko') return 'ko';
    if (['fr', 'de', 'es', 'it', 'ru'].includes(base)) return base;
    if (base === 'pt') return 'pt-BR';   // 葡萄牙語只提供巴西版，葡萄牙（pt-PT）也使用
    if (base === 'en') return rest.some(s => EN_UK.test(s)) ? 'en-GB' : 'en';
  }
  let tz = ''; try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) {}
  return TZ[tz] || DEFAULT_LANG;
}
// 存檔 / 雲端裡的語言代碼不合法（或從沒設定過）→ 自動偵測
export const normLang = l => LANGS.includes(l) ? l : detectLang();
export const setLang = l => { LANG = normLang(l); };

// 查表順序：目前語言 → 同語系的基本語言（en-GB → en）→ 英文 → 中文（原始稿，最後保底）
export const langChain = (l = LANG) => [...new Set([l, LANG_INFO[l] && LANG_INFO[l].base, 'en', 'zh'].filter(Boolean))];
// 從 { zh, 'zh-CN', ja, ko, en, fr… } 這類「各語言名稱」物件挑出目前語言的字串（缺少就退回英文）
export const pickLang = o => { if (!o) return ''; const k = langChain().find(x => o[x] !== undefined); return k ? o[k] : ''; };

export const t = (k, ...a) => {
  const src = langChain().map(l => I18N[l]).find(d => d && d[k] !== undefined);
  const v = src ? src[k] : undefined;
  return typeof v === 'function' ? v(...a) : (v === undefined ? k : v);
};
// 套用到頁面上所有帶 data-i18n* 屬性的靜態元素
export function applyI18n() {
  document.documentElement.lang = LANG_INFO[LANG].html;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { const v = t(el.dataset.i18nTitle); el.title = v; el.setAttribute('aria-label', v); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.dispatchEvent(new Event('i18n'));   // 通知動態產生的內容（如帳戶列）重畫成新語言
}
export const fmtTime = ts => new Date(ts).toLocaleString(LANG_INFO[LANG].locale, { hour12:false });
