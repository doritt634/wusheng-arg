/* pagenum.js —— 全站右下角「页码标」可逆层
 *
 * 功能：在每个游戏页面右下角显示一个固定页码标「n / 总页数」，
 *       n 取自「推荐游玩顺序」（见 无生中学游玩攻略.md 第一/二层）。
 *
 * 设计要点：
 *  - position:fixed 钉在右下角，不受 foot.css 的 body flex 布局影响；
 *  - 半透明深底 + 白字，适配浅色/深色/白色背景的各类页面；
 *  - 位于左下角 fragHud、左上角热线方块之外的空白区，不冲突；
 *  - z-index 低于搜索弹窗(4000)/揭示遮罩(2000)，高于普通内容。
 *
 * 还原方式：删除本文件，并移除各页 <script src="pagenum.js"></script> 即可整体撤销。
 */
(function () {
  // 推荐游玩顺序 —— 严格按《全解锁攻略》第一阶段→第二阶段→第三阶段的「发现顺序」重排：
  //   常驻导航/表面页 → 阶段1(搜索框发现的表面线索：心理老师/会长/杜兴/贾一方/同善楼/天台/档案馆)
  //   → 阶段2(论坛/聊天室/档案馆深层/停职/广播)
  //   → 阶段3(菜单/校友旧刊/凯撒解密/秘密基地/日记/校友聚集/招生咨询/下载)
  // 序页(preamble)、索引(index)、三结局页(ending-*)与测试页不在序列内、不显示页码。
  var PAGES = [
    /* 常驻导航 / 表面浏览页（永远可访问） */
    'page1.html',
    'page2-about.html',
    'page3-notice.html',
    'page4-events.html',
    'page5-jiaoyu.html',
    'page6-mingshi.html',
    'page7-xiaoyou.html',
    'page8-dangjian.html',
    'page9-xuesheng.html',
    'page10-zhaosheng.html',
    'page12-guanyu.html',
    'school-calendar.html',
    'weekly-calendar.html',
    'contact-us.html',
    'downloads.html',
    'page11-luntan.html',
    /* 第一阶段：搜索框发现的表面线索页 */
    'page15-xinli.html',
    'page16-huizhang.html',
    'page17-duxing.html',
    'page18-jiayifang.html',
    'page19-jiayifang-interview.html',
    'page20-tongshan-notice.html',
    'archive-year.html',
    'archive-class.html',
    'archive-class7.html',
    'page14-tiantai.html',
    /* 第二阶段：论坛 + 聊天室 + 档案馆深层 + 停职 + 广播 */
    'page21-chatroom.html',
    'page22-graduation-photo.html',
    'page23-yuli-stop.html',
    'decrypt-morse.html',
    'morse-code.html',
    /* 第三阶段：身份翻转 + 日记 + 秘密基地 + 校友旧刊 + 终局 */
    'food-menu.html',
    'jiukan.html',
    'decrypt-caesar.html',
    'decrypt-base.html',
    'page13-riji.html'
  ];

  // 开发/测试页不显示页码
  var SKIP = ['test-unlock.html', 'preview-comparison.html'];

  function currentFile() {
    var path = location.pathname || '';
    var m = path.split('/').pop();
    return m || 'page1.html';
  }

  function init() {
    var file = currentFile();
    if (SKIP.indexOf(file) !== -1) return;

    var idx = PAGES.indexOf(file);
    if (idx === -1) return;               // 不在游玩顺序表里的页不显示
    var n = idx + 1;
    var total = PAGES.length;

    var badge = document.createElement('div');
    badge.id = 'pageNumBadge';
    badge.textContent = n + ' / ' + total;
    // 移动端抬到底部安全区/浏览器工具栏之上
    // （mobile.css 另有 #pageNumBadge !important 兜底规则）
    var isMobile = window.matchMedia && window.matchMedia('(max-width: 820px)').matches;
    var bottomPos = isMobile ? 'calc(env(safe-area-inset-bottom, 0px) + 14px)' : '12px';
    badge.setAttribute('style',
      'position:fixed;right:12px;bottom:' + bottomPos + ';z-index:1100;' +
      'background:rgba(20,20,20,.55);color:#fff;' +
      'font:12px/1.5 "Courier New",monospace;letter-spacing:1px;' +
      'padding:3px 9px;border-radius:11px;' +
      'box-shadow:0 1px 4px rgba(0,0,0,.35);user-select:none;pointer-events:none;'
    );
    document.body.appendChild(badge);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
