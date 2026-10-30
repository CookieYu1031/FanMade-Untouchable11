/* 多語系 —— 英(美) / 英(英) / 繁中 / 簡中 / 日 / 韓 / 法 / 德 / 西 / 葡(巴西) / 義 / 俄 / 荷 / 波 / 瑞典 / 捷克（語言選擇視窗見 ui/modals/lang-picker.js）。靜態文字用 data-i18n* 屬性，動態文字用 t('key', ...參數)
   缺少翻譯時一律退回英文（見 langChain）；偵測不到語言時預設英文(美國)。
   新增語言：① locales/ 放一份語言檔 ② 在 LANG_INFO 登記（code = 按鈕上顯示的 ISO 代碼、label = 語言原名稱）③ levels.json 各關卡 / 星名補名稱
            ④ index.html 的 Google Fonts 與載入畫面文字 ⑤ css/base.css 補該語言的字體 ⑥ 若要讓它出現在「推薦語言」：補下方 REGION_LANGS / SIMILAR */
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

const I18N = { en, 'en-GB': enGB, zh, 'zh-CN': zhCN, ja, ko, fr, de, es, 'pt-BR': ptBR, it, ru, nl, pl, sv, cs };
const SANS_TC = '"Noto Sans TC","PingFang TC","Microsoft JhengHei"';
const SANS_LAT = `"Noto Sans",${SANS_TC},system-ui,sans-serif`;   // 拉丁 / 西里爾字母語言（法 德 西 葡 義 俄 荷 波 瑞典 捷克）
// 語言清單：code = 設定按鈕上顯示的 ISO 語言代碼（如 zh-TW），label = 語言原名稱（選擇視窗用），html = <html lang>，locale = 日期 / 數字格式，font = 分享圖（canvas）用的字體
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
  'America/Sao_Paulo':'pt-BR', 'Europe/Rome':'it', 'Europe/Moscow':'ru',
  'Europe/Amsterdam':'nl', 'Europe/Warsaw':'pl', 'Europe/Stockholm':'sv', 'Europe/Prague':'cs' };
// 把一個 BCP-47 語言標籤（如 zh-TW、pt-PT、en-AU）對應到本站支援的語言；不支援就回傳 ''
export function langFromTag(tag) {
  const [base, ...rest] = String(tag || '').toLowerCase().split('-');
  if (base === 'zh') return rest.some(s => ZH_TW.test(s)) ? 'zh' : 'zh-CN';
  if (base === 'ja' || base === 'ko') return base;
  if (['fr', 'de', 'es', 'it', 'ru', 'nl', 'pl', 'sv', 'cs'].includes(base)) return base;
  if (base === 'pt') return 'pt-BR';   // 葡萄牙語只提供巴西版，葡萄牙（pt-PT）也使用
  if (base === 'en') return rest.some(s => EN_UK.test(s)) ? 'en-GB' : 'en';
  return '';
}
export const browserLangs = () => (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language]).filter(Boolean);
export const getTimeZone = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { return ''; /* 無法取得時區 */ } };
export function detectLang() {
  for (const p of browserLangs()) { const l = langFromTag(p); if (l) return l; }
  return TZ[getTimeZone()] || DEFAULT_LANG;
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
  document.querySelectorAll('[data-i18n-label]').forEach(el => el.setAttribute('aria-label', t(el.dataset.i18nLabel)));
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  document.dispatchEvent(new Event('i18n'));   // 通知動態產生的內容（如帳戶列）重畫成新語言
}
export const fmtTime = ts => new Date(ts).toLocaleString(LANG_INFO[LANG].locale, { hour12:false });

/* ───────── 推薦語言（語言選擇視窗的第一列）─────────
   固定順序：① 目前語言（永遠在最左）→ ② 瀏覽器偏好語言 → ③ 依「所在地區 + 目前語言」推測的在地語言 / 第二語言 →
   ④ 與目前語言相近的語言 → ⑤ English(US)。已出現過的語言會跳過，湊滿 count 個為止。
   所在地區：網頁端不呼叫第三方 IP 定位服務（會把使用者 IP 送給外部、也需要額外授權），改用瀏覽器時區推測所在國家；
   時區查不到就略過這一步。 */
const TZ_REGION = {   // 時區 → 國家 / 地區（只列出會影響推薦結果的）
  'Asia/Taipei':'TW', 'Asia/Hong_Kong':'HK', 'Asia/Macau':'MO', 'Asia/Shanghai':'CN', 'Asia/Urumqi':'CN', 'Asia/Singapore':'SG', 'Asia/Tokyo':'JP', 'Asia/Seoul':'KR',
  'Europe/London':'GB', 'Europe/Dublin':'IE', 'Australia/Sydney':'AU', 'Australia/Melbourne':'AU', 'Australia/Perth':'AU', 'Pacific/Auckland':'NZ',
  'America/New_York':'US', 'America/Chicago':'US', 'America/Denver':'US', 'America/Los_Angeles':'US', 'America/Phoenix':'US', 'America/Anchorage':'US', 'Pacific/Honolulu':'US',
  'America/Toronto':'CA', 'America/Vancouver':'CA', 'America/Montreal':'CA', 'America/Halifax':'CA',
  'Europe/Paris':'FR', 'Europe/Brussels':'BE', 'Europe/Luxembourg':'LU', 'Europe/Berlin':'DE', 'Europe/Vienna':'AT', 'Europe/Zurich':'CH',
  'Europe/Madrid':'ES', 'Europe/Rome':'IT', 'Europe/Moscow':'RU', 'Europe/Kaliningrad':'RU', 'Asia/Yekaterinburg':'RU', 'Asia/Novosibirsk':'RU', 'Asia/Vladivostok':'RU',
  'Europe/Minsk':'BY', 'Europe/Kiev':'UA', 'Europe/Kyiv':'UA', 'Asia/Almaty':'KZ',
  'America/Mexico_City':'MX', 'America/Bogota':'CO', 'America/Lima':'PE', 'America/Santiago':'CL', 'America/Argentina/Buenos_Aires':'AR', 'America/Sao_Paulo':'BR',
  'Europe/Amsterdam':'NL', 'Europe/Warsaw':'PL', 'Europe/Stockholm':'SE', 'Europe/Prague':'CZ',
  'Europe/Lisbon':'PT', 'Atlantic/Madeira':'PT', 'Asia/Kolkata':'IN', 'Asia/Calcutta':'IN', 'Africa/Johannesburg':'ZA', 'Asia/Kuala_Lumpur':'MY',
};
const REGION_LANGS = {   // 國家 / 地區 → 當地常用語言（本站支援的範圍內，由常用到次常用）
  TW:['zh','ja','en'], HK:['zh','en','zh-CN'], MO:['zh','en','zh-CN'], CN:['zh-CN','en'], SG:['zh-CN','en-GB','zh'], MY:['en-GB','zh-CN'], JP:['ja','en'], KR:['ko','en'],
  GB:['en-GB','fr'], IE:['en-GB','fr'], AU:['en-GB','zh-CN'], NZ:['en-GB'], IN:['en-GB'], ZA:['en-GB'],
  US:['en','es'], CA:['en','fr'],
  FR:['fr','en-GB'], BE:['fr','nl','de'], LU:['fr','de'], DE:['de','en-GB'], AT:['de','it'], CH:['de','fr','it'], ES:['es','en-GB'], IT:['it','fr'], PT:['pt-BR','es'],
  RU:['ru','en'], BY:['ru'], UA:['ru'], KZ:['ru'],
  NL:['nl','en-GB'], PL:['pl','en-GB'], SE:['sv','en-GB'], CZ:['cs','en-GB'],
  MX:['es','en'], CO:['es','en'], PE:['es','en'], CL:['es','en'], AR:['es','en'], BR:['pt-BR','es','en'],
};
const SIMILAR = {   // 與該語言相近（同語系 / 同文字 / 互通度高）的語言
  en:['en-GB'], 'en-GB':['en'], zh:['zh-CN','ja'], 'zh-CN':['zh','ja'], ja:['zh','ko'], ko:['ja','zh'],
  fr:['it','es'], de:['en-GB','fr'], es:['pt-BR','it'], 'pt-BR':['es','it'], it:['es','fr','pt-BR'], ru:[],
  nl:['de','en-GB'], pl:['cs','ru'], sv:['en-GB','de'], cs:['pl','de'],
};
export function recommendLangs(selected, count) {
  const out = [selected], add = l => { if (l && LANG_INFO[l] && !out.includes(l) && out.length < count) out.push(l); };
  browserLangs().forEach(p => add(langFromTag(p)));
  (REGION_LANGS[TZ_REGION[getTimeZone()]] || []).forEach(add);
  (SIMILAR[selected] || []).forEach(add);
  add(DEFAULT_LANG);
  return out;
}

// 一般語言的排序：依語言原名稱的首字母，文字系統的先後同 Unicode / CLDR 的國際通用順序（拉丁 → 西里爾 → 韓文 → 日文 → 漢字），
// 同一種文字內再用該語言自己的排序規則比較。desc = true 時整串反過來（Z~A）
const SCRIPT_RANK = [[/^[\p{Script=Latin}]/u, 0], [/^\p{Script=Cyrillic}/u, 1], [/^\p{Script=Hangul}/u, 2], [/^[\p{Script=Hiragana}\p{Script=Katakana}]/u, 3], [/^\p{Script=Han}/u, 4]];
const scriptOf = name => { const m = SCRIPT_RANK.find(([re]) => re.test(name)); return m ? m[1] : 9; };
export function sortLangs(list, desc = false) {
  const col = new Intl.Collator(undefined, { sensitivity: 'base' }), han = new Intl.Collator('zh-u-co-pinyin');
  const cmp = (a, b) => {
    const x = LANG_INFO[a].label, y = LANG_INFO[b].label, d = scriptOf(x) - scriptOf(y);
    return d || (scriptOf(x) === 4 ? han : col).compare(x, y);
  };
  const r = [...list].sort(cmp);
  return desc ? r.reverse() : r;
}
