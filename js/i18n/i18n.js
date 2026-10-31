/* 多語系 —— 英(美) / 英(英) / 繁中 / 簡中 / 日 / 韓 / 法 / 德 / 西 / 葡(巴西) / 義 / 俄 / 荷 / 波 / 瑞典 / 捷克 / 烏克蘭 / 土耳其 / 希伯來 / 阿拉伯 / 越南 / 印尼 / 泰 / 印地（語言選擇視窗見 ui/modals/lang-picker.js）。靜態文字用 data-i18n* 屬性，動態文字用 t('key', ...參數)
   缺少翻譯時一律退回英文（見 langChain）；偵測不到語言時預設英文(美國)。
   新增語言：① locales/ 放一份語言檔 ② 在 LANG_INFO 登記（code = 按鈕上顯示的 ISO 代碼、label = 語言原名稱）③ levels.json 各關卡 / 星名補名稱
            ④ index.html 的 Google Fonts 與載入畫面文字 ⑤ css/base.css 補該語言的字體 ⑥ 若要讓「依 IP 所在國家」自動選到它：在下方 COUNTRY_LANG 補國家代碼
   由右至左書寫的語言（希伯來文、阿拉伯文）在 LANG_INFO 加 dir:'rtl'，並確認 css/rtl.css 涵蓋新增的版面 */
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
import nl from './locales/nl.js';
import pl from './locales/pl.js';
import sv from './locales/sv.js';
import cs from './locales/cs.js';
import uk from './locales/uk.js';
import tr from './locales/tr.js';
import he from './locales/he.js';
import ar from './locales/ar.js';
import vi from './locales/vi.js';
import id from './locales/id.js';
import th from './locales/th.js';
import hi from './locales/hi.js';

const I18N = { en, 'en-GB': enGB, zh, 'zh-CN': zhCN, ja, ko, fr, de, es, 'pt-BR': ptBR, it, ru, nl, pl, sv, cs, uk, tr, he, ar, vi, id, th, hi };
const SANS_TC = '"Noto Sans TC","PingFang TC","Microsoft JhengHei"';
const SANS_LAT = `"Noto Sans",${SANS_TC},system-ui,sans-serif`;   // 拉丁 / 西里爾字母語言（法 德 西 葡 義 俄 荷 波 瑞典 捷克 烏克蘭 土耳其 越南 印尼）
// 語言清單：code = 設定按鈕上顯示的 ISO 語言代碼（如 zh-TW），label = 語言原名稱（選擇視窗用），html = <html lang>，locale = 日期 / 數字格式，font = 分享圖（canvas）用的字體，
// dir = 'rtl' 表示由右至左書寫（套用到 <html dir>；省略 = ltr）
// 字體堆疊要與 css/base.css 的 html[lang] 規則一致
export const LANG_INFO = {
  en:      { code:'en-US', label:'English(US)', html:'en-US',   locale:'en-US', font:`${SANS_TC},system-ui,sans-serif` },
  'en-GB': { code:'en-GB', label:'English(UK)', html:'en-GB',   locale:'en-GB', font:`${SANS_TC},system-ui,sans-serif`, base:'en' },
  zh:      { code:'zh-TW', label:'繁體中文',    html:'zh-Hant', locale:'zh-TW', font:`${SANS_TC},system-ui,sans-serif` },
  'zh-CN': { code:'zh-CN', label:'简体中文',    html:'zh-Hans', locale:'zh-CN', font:'"Noto Sans SC","PingFang SC","Microsoft YaHei","Noto Sans TC",system-ui,sans-serif' },
  ja:      { code:'ja', label:'日本語',      html:'ja',      locale:'ja-JP', font:'"Noto Sans JP","Hiragino Sans","Yu Gothic","Meiryo","Noto Sans TC",system-ui,sans-serif' },
  ko:      { code:'ko', label:'한국어',      html:'ko',      locale:'ko-KR', font:'"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic","Noto Sans TC",system-ui,sans-serif' },
  fr:      { code:'fr', label:'Français',    html:'fr',      locale:'fr-FR', font:SANS_LAT },
  de:      { code:'de', label:'Deutsch',     html:'de',      locale:'de-DE', font:SANS_LAT },
  es:      { code:'es', label:'Español',     html:'es',      locale:'es-ES', font:SANS_LAT },
  'pt-BR': { code:'pt-BR', label:'Português(BR)', html:'pt-BR', locale:'pt-BR', font:SANS_LAT },
  it:      { code:'it', label:'Italiano',    html:'it',      locale:'it-IT', font:SANS_LAT },
  ru:      { code:'ru', label:'Русский',     html:'ru',      locale:'ru-RU', font:SANS_LAT },
  nl:      { code:'nl', label:'Nederlands',  html:'nl',      locale:'nl-NL', font:SANS_LAT },
  pl:      { code:'pl', label:'Polski',      html:'pl',      locale:'pl-PL', font:SANS_LAT },
  sv:      { code:'sv', label:'Svenska',     html:'sv',      locale:'sv-SE', font:SANS_LAT },
  cs:      { code:'cs', label:'Čeština',     html:'cs',      locale:'cs-CZ', font:SANS_LAT },
  uk:      { code:'uk', label:'Українська',  html:'uk',      locale:'uk-UA', font:SANS_LAT },
  tr:      { code:'tr', label:'Türkçe',      html:'tr',      locale:'tr-TR', font:SANS_LAT },
  he:      { code:'he', label:'עברית',       html:'he',      locale:'he-IL', dir:'rtl', font:'"Noto Sans Hebrew","Noto Sans",system-ui,sans-serif' },
  ar:      { code:'ar', label:'العربية',     html:'ar',      locale:'ar-AE', dir:'rtl', font:'"Noto Sans Arabic","Noto Sans",system-ui,sans-serif' },
  vi:      { code:'vi', label:'Tiếng Việt',  html:'vi',      locale:'vi-VN', font:SANS_LAT },
  id:      { code:'id', label:'Indonesia',  html:'id',      locale:'id-ID', font:SANS_LAT },
  th:      { code:'th', label:'ภาษาไทย',     html:'th',      locale:'th-TH', font:'"Noto Sans Thai","Noto Sans",system-ui,sans-serif' },
  hi:      { code:'hi', label:'हिन्दी',        html:'hi',      locale:'hi-IN', font:'"Noto Sans Devanagari","Noto Sans",system-ui,sans-serif' },
};
export const LANGS = Object.keys(LANG_INFO);
export const DEFAULT_LANG = 'en';   // 偵測不到、或偵測到的語言不支援時使用英文(美國)
let LANG = DEFAULT_LANG;
export const getLang = () => LANG;

/* 自動偵測語言 —— 網頁拿不到 Google 帳戶的地區（要登入並取得額外授權才行），能用的是瀏覽器的「偏好語言清單」
   （通常等於作業系統 / 瀏覽器的語言與地區設定）。順序：偏好語言（含地區碼）→ IP 所在國家（langFromIP，非同步）→ 英文(美國)。
   ※ index.html 的載入畫面有一份相同邏輯的精簡版（頁面 JS 載入前就要決定文字語言），修改時請兩邊一起改 */
const EN_UK = /^(gb|uk|ie|au|nz|in|za|sg|hk|my|ng|ke|pk|bd|lk|mt|cy)$/;   // 慣用英式拼寫 / 日期格式的英語地區
const ZH_TW = /^(tw|hk|mo|hant)$/;                                          // 繁體中文地區 / 字體（其餘如 cn、sg、hans 與沒有地區碼的 zh 都用簡體）
// 把一個 BCP-47 語言標籤（如 zh-TW、pt-PT、en-AU）對應到本站支援的語言；不支援就回傳 ''
export function langFromTag(tag) {
  const [base, ...rest] = String(tag || '').toLowerCase().split('-');
  if (base === 'zh') return rest.some(s => ZH_TW.test(s)) ? 'zh' : 'zh-CN';
  if (base === 'ja' || base === 'ko') return base;
  if (['fr', 'de', 'es', 'it', 'ru', 'nl', 'pl', 'sv', 'cs', 'uk', 'tr', 'he', 'ar', 'vi', 'id', 'th', 'hi'].includes(base)) return base;
  if (base === 'iw') return 'he';   // 希伯來語的舊式代碼
  if (base === 'in') return 'id';   // 印尼語的舊式代碼
  if (base === 'pt') return 'pt-BR';   // 葡萄牙語只提供巴西版，葡萄牙（pt-PT）也使用
  if (base === 'en') return rest.some(s => EN_UK.test(s)) ? 'en-GB' : 'en';
  return '';
}
export const browserLangs = () => (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]).filter(Boolean);
// 只看瀏覽器偏好語言：有支援的語言就回傳，沒有就回傳 ''
export const browserLang = () => { for (const p of browserLangs()) { const l = langFromTag(p); if (l) return l; } return ''; };
export const detectLang = () => browserLang() || DEFAULT_LANG;

/* 依 IP 判定語言（只在「第一次進站、且瀏覽器偏好語言沒有任何支援的語言」時使用，見 main.js）
   向第三方服務查詢使用者 IP 所在的國家（只取國家代碼）：主要 api.country.is，失敗再用 ipwho.is；4 秒內沒回應或查不到就回傳 ''（呼叫端沿用英文） */
const COUNTRY_LANG = {   // 國家 / 地區代碼 → 當地最常用的語言（本站支援的範圍內）
  TW:'zh', HK:'zh', MO:'zh', CN:'zh-CN', SG:'zh-CN', MY:'en-GB', JP:'ja', KR:'ko',
  GB:'en-GB', IE:'en-GB', AU:'en-GB', NZ:'en-GB', ZA:'en-GB', US:'en', CA:'en',
  IN:'hi', VN:'vi', ID:'id', TH:'th',
  FR:'fr', BE:'fr', LU:'fr', DE:'de', AT:'de', CH:'de', ES:'es', IT:'it', PT:'pt-BR', BR:'pt-BR',
  RU:'ru', BY:'ru', KZ:'ru', UA:'uk', NL:'nl', PL:'pl', SE:'sv', CZ:'cs', TR:'tr', IL:'he',
  SA:'ar', EG:'ar', AE:'ar', IQ:'ar', JO:'ar', LB:'ar', KW:'ar', QA:'ar', MA:'ar', DZ:'ar', TN:'ar', LY:'ar', SY:'ar', YE:'ar', OM:'ar', BH:'ar', SD:'ar', PS:'ar',
  MX:'es', CO:'es', PE:'es', CL:'es', AR:'es', EC:'es', VE:'es', UY:'es', PY:'es', BO:'es', CR:'es', PA:'es', GT:'es', HN:'es', SV:'es', NI:'es', DO:'es', CU:'es', PR:'es',
};
const IP_SOURCES = [['https://api.country.is/', j => j.country], ['https://ipwho.is/', j => j.country_code]];
export async function langFromIP() {
  for (const [url, pick] of IP_SOURCES) {
    const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 4000);
    try {
      const r = await fetch(url, { signal: ctl.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!r.ok) continue;
      const l = COUNTRY_LANG[String(pick(await r.json()) || '').toUpperCase()];
      if (l) return l;
    } catch { /* 網路錯誤 / 逾時：換下一個來源 */ } finally { clearTimeout(timer); }
  }
  return '';
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
  document.documentElement.dir = LANG_INFO[LANG].dir || 'ltr';   // 希伯來文 / 阿拉伯文由右至左（版面細節見 css/rtl.css）
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t(el.dataset.i18nHtml); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { const v = t(el.dataset.i18nTitle); el.title = v; el.setAttribute('aria-label', v); });
  document.querySelectorAll('[data-i18n-label]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nLabel)));
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.dispatchEvent(new Event('i18n'));   // 通知動態產生的內容（如帳戶列）重畫成新語言
}
export const fmtTime = ts => new Date(ts).toLocaleString(LANG_INFO[LANG].locale, { hour12:false });

// 一般語言的排序：依語言原名稱的首字母，文字系統的先後同 Unicode / CLDR 的國際通用順序（拉丁 → 西里爾 → 希伯來 → 阿拉伯 → 韓文 → 日文 → 漢字），
// 同一種文字內再用該語言自己的排序規則比較
const SCRIPT_RANK = [[/^[\p{Script=Latin}]/u, 0], [/^\p{Script=Cyrillic}/u, 1], [/^\p{Script=Hebrew}/u, 1.2], [/^\p{Script=Arabic}/u, 1.4], [/^\p{Script=Devanagari}/u, 1.6], [/^\p{Script=Thai}/u, 1.8], [/^\p{Script=Hangul}/u, 2], [/^[\p{Script=Hiragana}\p{Script=Katakana}]/u, 3], [/^\p{Script=Han}/u, 4]];
const scriptOf = name => { const m = SCRIPT_RANK.find(([re]) => re.test(name)); return m ? m[1] : 9; };
export function sortLangs(list) {
  const col = new Intl.Collator(undefined, { sensitivity: 'base' }), han = new Intl.Collator('zh-u-co-pinyin');
  const cmp = (a, b) => {
    const x = LANG_INFO[a].label, y = LANG_INFO[b].label, d = scriptOf(x) - scriptOf(y);
    return d || (scriptOf(x) === 4 ? han : col).compare(x, y);
  };
  return [...list].sort(cmp);
}
