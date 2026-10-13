/* 皇冠挑戰的拼圖組合顯示名稱：存檔與設定檔仍用字母代號（A~G、a~g），畫面上改顯示羅馬數字（Ⅰ~Ⅶ、ⅰ~ⅶ） */
export const grpLabel = k => {
  if (/^[A-G]$/.test(k)) return String.fromCharCode(0x2160 + k.charCodeAt(0) - 65);
  if (/^[a-g]$/.test(k)) return String.fromCharCode(0x2170 + k.charCodeAt(0) - 97);
  return k;
};
