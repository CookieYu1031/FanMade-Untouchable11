/* 視窗分級 —— 依視窗寬度分為三種（斷點要與 css 的 @media 一致：640 / 1007 / 1008）
 *   大（>= 1008px，電腦或橫向的大螢幕）：圖板在左、拼圖盤在右；左側工具列貼著圖板區域的左邊框
 *   中（641~1007px，如平板直向）：圖板與拼圖盤左右放置；工具列吸附在視窗左邊框；直向也能使用沉浸模式
 *   小（<= 640px，如手機直向）：圖板與拼圖盤上下放置；工具列吸附在視窗左邊框；直向時沉浸模式會要求轉為橫向 */
export const BP_SMALL_MAX = 640;
export const BP_LARGE_MIN = 1008;
const small = window.matchMedia(`(max-width:${BP_SMALL_MAX}px)`);
const large = window.matchMedia(`(min-width:${BP_LARGE_MIN}px)`);
const portrait = window.matchMedia('(orientation:portrait)');

export const isSmall = () => small.matches;
export const isLarge = () => large.matches;
export const isMedium = () => !small.matches && !large.matches;
export const isPortrait = () => portrait.matches;
// 左側工具列是否貼著圖板區域的左邊框（否則固定在視窗左側）：大視窗，或高度很矮的橫向視窗（如手機橫放）。與 css/board.css 一致
const attached = window.matchMedia(`(min-width:${BP_LARGE_MIN}px), (orientation:landscape) and (max-height:520px)`);
export const toolsAttached = () => attached.matches;
// 圖板與拼圖盤是否左右放置（中、大視窗）；小視窗上下放置
export const sideBySide = () => !small.matches;
