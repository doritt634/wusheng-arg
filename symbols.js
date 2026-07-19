/* =========================================================================
 * 符号密码本（symbols.js）
 * 符号 ↔ 字母 的对应，全部来自电子档案馆「2006 届 7 班」名册里
 * 实际出现的姓氏首字。每个符号是纯代码绘制的 SVG，并对应一个音频频率。
 * 玩家需在档案馆逐一打开学籍、把"图形 = 姓名首字"这一规律拼出来。
 * ========================================================================= */

/* 12 个符号：形状用 currentColor，由所在容器决定颜色 */
var SYM_SVG = {
  C: '<svg viewBox="0 0 24 24" class="sym" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  D: '<svg viewBox="0 0 24 24" class="sym" aria-hidden="true"><polygon points="12,4 21,20 3,20" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  G: '<svg viewBox="0 0 24 24" class="sym" aria-hidden="true"><polygon points="12,3 21,12 12,21 3,12" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  H: '<svg viewBox="0 0 24 24" class="sym" aria-hidden="true"><rect x="4" y="4" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  J: '<svg viewBox="0 0 24 24" class="sym" aria-hidden="true"><polygon points="12,2 14.5,9 22,9 16,13.5 18.5,21 12,16.5 5.5,21 8,13.5 2,9 9.5,9" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  L: '<svg viewBox="0 0 24 24" class="sym" aria-hidden="true"><path d="M10 3 H14 V10 H21 V14 H14 V21 H10 V14 H3 V10 H10 Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  M: '<svg viewBox="0 0 24 24" class="sym" aria-hidden="true"><polygon points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  S: '<svg viewBox="0 0 24 24" class="sym" aria-hidden="true"><path d="M16 4 A8 8 0 1 0 16 20 A6 6 0 1 1 16 4 Z" fill="currentColor" stroke="none"/></svg>',
  W: '<svg viewBox="0 0 24 24" class="sym" aria-hidden="true"><path d="M3 6 L7 18 L12 9 L17 18 L21 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/></svg>',
  X: '<svg viewBox="0 0 24 24" class="sym" aria-hidden="true"><path d="M4 4 L20 20 M20 4 L4 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  Y: '<svg viewBox="0 0 24 24" class="sym" aria-hidden="true"><polygon points="12,3 21,10 17,20 7,20 3,10" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  Z: '<svg viewBox="0 0 24 24" class="sym" aria-hidden="true"><polygon points="7,5 21,5 17,19 3,19" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
};

/* 每个符号对应的音频频率（Hz），用于校广播站纯音频播放 */
var SYM_FREQ = {
  C: 330, D: 349, G: 392, H: 440, J: 494, L: 523,
  M: 587, S: 659, W: 698, X: 784, Y: 880, Z: 988
};

/* 完整字母序（校广播站调色板按此排列） */
var SYM_ORDER = ['C', 'D', 'G', 'H', 'J', 'L', 'M', 'S', 'W', 'X', 'Y', 'Z'];

function symSVG(l) { return SYM_SVG[l] || ''; }
function symFreq(l) { return SYM_FREQ[l] || 440; }
