// 被发现了吧，不要偷懒自己解！

(function () {
  
  
  
  
  
  
  var PAGES = [
    
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
    'page11-luntan.html',
    'page12-guanyu.html',
    'school-calendar.html',
    'weekly-calendar.html',
    'contact-us.html',
    'downloads.html',
    
    'page14-tiantai.html',
    'page15-xinli.html',
    'page16-huizhang.html',
    'page17-duxing.html',
    'page18-jiayifang.html',
    'page19-jiayifang-interview.html',
    'page20-tongshan-notice.html',
    'archive-year.html',
    'archive-class.html',
    'archive-class7.html',
    
    'page21-chatroom.html',
    'page22-graduation-photo.html',
    'page23-yuli-stop.html',
    'decrypt-morse.html',
    'morse-code.html',
    
    'food-menu.html',
    'jiukan.html',
    'decrypt-caesar.html',
    'decrypt-base.html',
    'page13-riji.html'
  ];

  
  var SKIP = ['test-unlock.html', 'preview-comparison.html'];

  function currentFile() {
    var path = location.pathname || '';
    var m = path.split('/').pop();
    return m || 'page1.html';
  }

  
  function injectStyle() {
    if (document.getElementById('pageNumStyle')) return;
    var s = document.createElement('style');
    s.id = 'pageNumStyle';
    s.textContent =
      '.pageNumText{' +
      'display:inline;margin-left:1.5em;' +
      'font:11px/1 "Courier New",monospace;letter-spacing:.5px;' +
      'color:#8a8a8a;user-select:none;pointer-events:none;' +
      '}' +
      '@media (max-width:820px){.pageNumText{font-size:10px;margin-left:1em;}}';
    document.head.appendChild(s);
  }

  
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
    if (idx === -1) return;
    var n = idx + 1;
    var total = PAGES.length;

    injectStyle();

    var host = findHost();
    if (!host) {
      
      host = document.createElement('div');
      host.className = 'copy';
      host.style.cssText = 'position:relative;text-align:center;padding:14px 12px;color:#8a8a8a;font-size:12px;';
      host.innerHTML = 'Copyright &copy; 十个化石 版权所有';
      document.body.appendChild(host);
    }

    if (host.querySelector('.pageNumText')) return;

    
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
