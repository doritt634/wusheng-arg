/* pagenum.js —— 全站页脚「页码文字」图层
 *
 * 功能：在每个游戏页面底部版权栏的同一行右侧，以紧凑纯文字形式显示页码「n/总页数」，
 *       n 取自「推荐游玩顺序」（见 无生中学游玩攻略.md 第一/二层）。
 *
 * 设计要点：
 *  - 不使用 position:fixed 浮标（iOS Safari 在 body overflow-x:hidden 下会退化、移动端不可见）。
 *  - 改为把页码作为文档流的一部分，插入到页面底部版权栏
 *    （.copy / .site-footer / .forum-footer / <footer> / .footer）内，
 *    用 position:absolute 钉在「同一行」的右侧，保留版权文字原有居中布局；
 *    移动端随页滚动到底部必然可见，彻底避开 fixed 定位问题。
 *  - 若页面没有可识别的版权栏，则在 body 末尾兜底创建一个，保证页码始终存在。
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

  // 注入页码文字样式（文档流、钉在版权栏同一行右侧，移动端可见，字体紧凑）
  function injectStyle() {
    if (document.getElementById('pageNumStyle')) return;
    var s = document.createElement('style');
    s.id = 'pageNumStyle';
    s.textContent =
      '.pageNumText{' +
      'position:absolute;right:10px;top:50%;transform:translateY(-50%);' +
      'font:11px/1 "Courier New",monospace;letter-spacing:.5px;' +
      'color:#8a8a8a;user-select:none;pointer-events:none;' +
      '}' +
      '@media (max-width:820px){.pageNumText{font-size:10px;right:8px;}}';
    document.head.appendChild(s);
  }

  // 找页面底部版权栏：优先 .copy，其次各类 footer 容器
  function findHost() {
    var sels = ['.copy', '.site-footer', '.forum-footer', 'footer', '.footer'];
    for (var i = 0; i < sels.length; i++) {
      var el = document.querySelector(sels[i]);
      if (el) return el;
    }
    return null;
  }

  function init() {
    var file = currentFile();
    if (SKIP.indexOf(file) !== -1) return;

    var idx = PAGES.indexOf(file);
    if (idx === -1) return;               // 不在游玩顺序表里的页不显示
    var n = idx + 1;
    var total = PAGES.length;

    injectStyle();

    var host = findHost();
    if (!host) {
      // 兜底：页面无版权栏时，在 body 末尾创建一个，保证页码始终存在
      host = document.createElement('div');
      host.className = 'copy';
      host.style.cssText = 'position:relative;text-align:center;padding:14px 12px;color:#8a8a8a;font-size:12px;';
      host.innerHTML = 'Copyright &copy; 十个化石 版权所有';
      document.body.appendChild(host);
    }

    if (host.querySelector('.pageNumText')) return;   // 防重复插入

    // 让页码相对版权栏定位（钉在同一行右侧）
    if (getComputedStyle(host).position === 'static') {
      host.style.position = 'relative';
    }

    var el = document.createElement('span');
    el.className = 'pageNumText';
    el.textContent = n + '/' + total;
    host.appendChild(el);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
