/* 規則與資訊視窗 */
import { $ } from '../dom.js';

// 資訊視窗
const infoModal = $('infoModal');
$('btnInfo').addEventListener('click', () => infoModal.classList.add('open'));
$('infoClose').addEventListener('click', () => infoModal.classList.remove('open'));
infoModal.addEventListener('click', e => { if (e.target === infoModal) infoModal.classList.remove('open'); });
