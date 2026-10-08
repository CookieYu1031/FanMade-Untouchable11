/* 操作說明視窗 */
import { $ } from '../dom.js';

const helpModal = $('helpModal');
$('btnHelp').addEventListener('click', () => helpModal.classList.add('open'));
$('helpClose').addEventListener('click', () => helpModal.classList.remove('open'));
helpModal.addEventListener('click', e => { if (e.target === helpModal) helpModal.classList.remove('open'); });
