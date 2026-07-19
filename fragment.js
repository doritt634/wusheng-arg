/* 记忆碎片系统 · 无生中学
 * 玩家 = 失忆的纪佑泽。集齐 5 片记忆碎片 → 触发"你就是纪佑泽"翻转。
 * 状态以 URL（?frag=f1,f2,...）为主通道透传，并同步持久化到 localStorage，
 * 保证玩家直接刷新 / 重新进入日记页时，已解锁的章节继续保持已解锁状态。可部署到任意静态托管。
 * 链接拦截器会在点击站内 .html 链接时自动把当前碎片参数带上，实现跨页面持久化。
 */
(function () {
  // —— 重置兼容：?reset=all 时清除记忆碎片状态并剥离 URL 的 known/frag 参数 ——
  // 避免「重置」后，链接拦截器把残留的 ?known=1 重新透传，导致记忆碎片 UI 又出现。
  // 唯有玩家再次走到解锁「你是纪佑泽」关键词（FRAG.setKnown）时，UI 才会重新出现。
  (function handleFragReset(){
    try {
      var p = new URLSearchParams(location.search);
      if (p.get('reset') === 'all') {
        localStorage.removeItem('wbs_known_v1');
        localStorage.removeItem('wbs_frag_v1');
        localStorage.removeItem('wbs_jyz_msg_v1');
        localStorage.removeItem('wbs_jyz_read_v1');
        if (p.has('known') || p.has('frag')) {
          p.delete('known'); p.delete('frag');
          var q = p.toString();
          history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash);
        }
      }
    } catch (e) {}
  })();

  var TOTAL = 5;
  var ORDER = ['f1', 'f2', 'f3', 'f4', 'f5'];

  // 持久化：URL 仍为跨页面透传主通道；localStorage 作为「已解锁记忆」的持久备份，
  // 保证玩家直接刷新 / 重新进入日记页时，已解锁的章节继续保持已解锁状态。
  var LS_FRAG = 'wbs_frag_v1';
  var LS_KNOWN = 'wbs_known_v1';
  // 贾义正「最后一次机会」主动私信：集齐全部记忆碎片后触发
  var LS_JYZ_MSG = 'wbs_jyz_msg_v1';   // '1' = 已触发（他已发来消息）
  var LS_JYZ_READ = 'wbs_jyz_read_v1'; // '1' = 玩家已进入招生咨询（消息已读，不再提醒）
  var JYZ_CHAT_PAGE = 'page10-zhaosheng.html'; // 消息落点：与贾义正对话
  function lsGet(key){
    try { var v = localStorage.getItem(key); return v == null ? null : JSON.parse(v); } catch(e){ return null; }
  }
  function lsSet(key, val){
    try { localStorage.setItem(key, JSON.stringify(val)); } catch(e){}
  }

  // 状态模式：优先用 query（?frag=），file:// 下 replaceState 被禁时退化为 hash（#frag=）
  var useHash = /[?&]frag=/.test(location.search) ? false
              : (/frag=/.test(location.hash) ? true : false);

  // —— 自注入样式（不依赖各页已有 CSS）——
  var css = [
    '#fragHud{position:fixed;left:14px;bottom:14px;z-index:1500;',
    'font-family:"宋体",SimSun,serif;font-size:12px;color:#fff;',
    'background:linear-gradient(180deg,#c43a3a,#b02e2e);',
    'border:1px solid #c0a040;border-radius:4px;padding:5px 10px;',
    'box-shadow:0 2px 8px rgba(0,0,0,.25);cursor:default;user-select:none;}',
    '#fragHud b{color:#ffe9a8;font-size:13px;}',
    '#fragHud .fh-dot{display:inline-block;width:7px;height:7px;margin-left:2px;',
    'border:1px solid #c0a040;background:transparent;vertical-align:middle;}',
    '#fragHud .fh-dot.on{background:#ffe9a8;}',
    '.frag-trigger{display:inline-block;margin:6px 0;padding:4px 10px;cursor:pointer;',
    'font-family:"宋体",SimSun,serif;font-size:12px;color:#b02e2e;',
    'border:1px dashed #c43a3a;border-radius:3px;background:#fceeee;',
    'transition:all .2s;}',
    '.frag-trigger:hover{background:#fbdcdc;color:#861a1a;}',
    '.frag-trigger.collected{border-style:solid;border-color:#9bbf8a;color:#5a7d4a;',
    'background:#eef6ea;cursor:default;}',
    '.frag-trigger .ft-mark{display:inline-block;width:9px;height:9px;margin-right:6px;',
    'background:#c43a3a;transform:rotate(45deg);vertical-align:middle;}',
    '.frag-trigger.collected .ft-mark{background:#5a7d4a;}',
    '#revealOverlay{position:fixed;inset:0;z-index:2000;display:flex;',
    'align-items:center;justify-content:center;',
    'background:rgba(0,0,0,0.92);}',
    '.reveal-center{max-width:640px;margin:0 20px;padding:40px;text-align:center;}',
    '.reveal-big{color:#e8eef6;font-family:"宋体",SimSun,serif;font-size:20px;line-height:2;letter-spacing:1px;text-shadow:0 0 14px rgba(120,30,20,.5);min-height:2.4em;}',
    '.reveal-center button{margin-top:26px;padding:8px 22px;font-family:"宋体",SimSun,serif;font-size:14px;color:#0d2347;background:#ffe9a8;border:none;border-radius:4px;cursor:pointer;}',
    '.reveal-center button:hover{background:#ffd86b;}',
    '.reveal-box{max-width:520px;margin:0 20px;padding:30px 34px;',
    'background:#0d2347;border:1px solid #c0a040;border-radius:6px;',
    'box-shadow:0 0 40px rgba(192,160,64,.35);text-align:left;',
    'font-family:"宋体",SimSun,serif;color:#e8eef6;line-height:2;}',
    '.reveal-box h2{margin:0 0 14px;font-size:20px;color:#ffe9a8;letter-spacing:2px;}',
    '.reveal-box p{margin:10px 0;font-size:14px;}',
    '.reveal-box .em{color:#ffd36b;}',
    '.reveal-box button{margin-top:18px;padding:8px 22px;font-family:"宋体",SimSun,serif;',
    'font-size:14px;color:#0d2347;background:#ffe9a8;border:none;border-radius:4px;cursor:pointer;}',
    '.reveal-box button:hover{background:#ffd86b;}',
    // —— 贾义正主动私信弹窗（右下角）——
    '#jyzNotify{position:fixed;right:18px;bottom:18px;z-index:3000;width:300px;',
    'max-width:calc(100vw - 36px);background:linear-gradient(180deg,#22364a,#152537);',
    'color:#eef2f7;border:1px solid #c0a040;border-radius:8px;',
    'box-shadow:0 8px 28px rgba(0,0,0,.5);font-family:"宋体",SimSun,serif;',
    'overflow:hidden;cursor:pointer;transform:translateY(150%);opacity:0;',
    'transition:transform .55s cubic-bezier(.18,.9,.28,1.2),opacity .45s;}',
    '#jyzNotify.show{transform:translateY(0);opacity:1;}',
    '#jyzNotify .jn-head{display:flex;align-items:center;gap:9px;padding:9px 11px;',
    'background:rgba(192,160,64,.14);border-bottom:1px solid rgba(192,160,64,.35);}',
    '#jyzNotify .jn-av{width:36px;height:36px;border-radius:50%;overflow:hidden;flex-shrink:0;',
    'border:1px solid #c0a040;background:#0d2347;display:flex;align-items:center;justify-content:center;',
    'font-size:15px;color:#ffe9a8;}',
    '#jyzNotify .jn-av img{width:100%;height:100%;object-fit:cover;}',
    '#jyzNotify .jn-who{flex:1;min-width:0;}',
    '#jyzNotify .jn-name{font-size:13px;font-weight:bold;color:#ffe9a8;letter-spacing:1px;}',
    '#jyzNotify .jn-sub{font-size:10px;color:#9fb4c8;margin-top:1px;}',
    '#jyzNotify .jn-dot{width:7px;height:7px;border-radius:50%;background:#e23d3d;flex-shrink:0;',
    'margin-right:2px;animation:jnDot 1.1s ease-in-out infinite;}',
    '@keyframes jnDot{0%,100%{opacity:1;}50%{opacity:.25;}}',
    '#jyzNotify .jn-close{width:20px;height:20px;line-height:18px;text-align:center;border-radius:50%;',
    'color:#9fb4c8;font-size:15px;flex-shrink:0;}',
    '#jyzNotify .jn-close:hover{background:rgba(255,255,255,.14);color:#fff;}',
    '#jyzNotify .jn-body{padding:11px 13px 4px;font-size:13px;line-height:1.75;color:#e9eff6;}',
    '#jyzNotify .jn-cta{padding:0 13px 11px;font-size:11px;color:#ffd36b;letter-spacing:1px;}'
  ].join('');
  var st = document.createElement('style');
  st.textContent = css;
  document.head.appendChild(st);

  // —— URL 状态读写 ——
  function parseRaw() {
    if (!useHash) {
      var q = new URLSearchParams(location.search).get('frag');
      if (q) return q;
    }
    var h = location.hash.match(/frag=([^&]+)/);
    return h ? h[1] : '';
  }
  function getCollected() {
    // URL 与 localStorage 取并集（localStorage 持久化已解锁的记忆，避免重进日记页后丢失）
    var s = parseRaw();
    var urlList = s ? s.split(',').filter(function (x) { return x && ORDER.indexOf(x) >= 0; }) : [];
    var lsList = lsGet(LS_FRAG);
    if (!Array.isArray(lsList)) lsList = [];
    lsList = lsList.filter(function (x) { return ORDER.indexOf(x) >= 0; });
    var merged = urlList.slice();
    lsList.forEach(function (x) { if (merged.indexOf(x) < 0) merged.push(x); });
    return merged;
  }
  function writeFrags(arr) {
    var val = arr.join(',');
    lsSet(LS_FRAG, arr.slice()); // 收集即持久化，已解锁的日记保持已解锁
    if (useHash) {
      location.hash = val ? 'frag=' + val : '';
      return;
    }
    var u = new URL(location.href);
    if (val) u.searchParams.set('frag', val); else u.searchParams.delete('frag');
    try {
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) {
      // file:// 等环境禁用 replaceState → 退化为 hash
      useHash = true;
      location.hash = val ? 'frag=' + val : '';
    }
  }

  // —— 「已知身份」状态：发现「你是纪佑泽」之后，记忆碎片才解锁 ——
  function getKnown() {
    var urlKnown = false;
    if (!useHash) {
      urlKnown = new URLSearchParams(location.search).get('known') === '1';
    } else {
      urlKnown = /(^|&)known=1/.test(location.hash.replace(/^#/, ''));
    }
    if (urlKnown) { lsSet(LS_KNOWN, 1); return true; }
    return lsGet(LS_KNOWN) === 1;
  }
  function writeKnown() {
    lsSet(LS_KNOWN, 1);
    if (useHash) {
      if (!/(^|&)known=1/.test(location.hash.replace(/^#/, ''))) {
        location.hash = (location.hash ? location.hash + '&' : '#') + 'known=1';
      }
      return;
    }
    var u = new URL(location.href);
    u.searchParams.set('known', '1');
    try {
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) {
      useHash = true;
      if (!/(^|&)known=1/.test(location.hash.replace(/^#/, ''))) {
        location.hash = (location.hash ? location.hash + '&' : '#') + 'known=1';
      }
    }
  }

  // 暴露给其它页面（page13 日记 / food-menu 糖醋排骨等）使用
  window.FRAG = {
    getCollected: getCollected,
    known: getKnown,
    setKnown: writeKnown,
    param: function () { return getCollected().join(','); },
    go: function (target) { window.location.href = FRAG_link(target); },
    link: FRAG_link
  };

  function FRAG_link(target) {
    var frags = getCollected();
    var known = getKnown();
    var base = target.split('#')[0];
    var hash = target.indexOf('#') >= 0 ? target.slice(target.indexOf('#')) : '';
    if (useHash) {
      var clean = hash.replace(/^#/, '').replace(/frag=[^&]+/, '').replace(/known=[^&]+/, '').replace(/^&/, '');
      var parts = [];
      if (frags.length) parts.push('frag=' + frags.join(','));
      if (known) parts.push('known=1');
      return base + '#' + parts.join('&') + (clean ? '&' + clean : '');
    } else {
      var u = new URL(base, location.href);
      if (frags.length) u.searchParams.set('frag', frags.join(','));
      if (known) u.searchParams.set('known', '1');
      return u.pathname.split('/').pop() + u.search + hash;
    }
  }

  // 初始化：把当前 URL 中的碎片集合合并持久化到 localStorage（玩家直接刷新 / 重进日记页也能保持已解锁）
  (function initPersist(){
    try { lsSet(LS_FRAG, getCollected()); } catch(e){}
  })();

  // —— HUD（仅在发现「你是纪佑泽」且解锁第三阶段之后才出现；结局页不显示记忆碎片 UI）——
  var known = getKnown();
  var fragPhase = (function () { try { var p = parseInt(localStorage.getItem('wbs_phase'), 10); return isNaN(p) ? 1 : (p < 1 ? 1 : p); } catch (e) { return 1; } })();
  // 记忆碎片 UI（红色碎片框 / HUD）仅在「确认身份」且「已解锁第三阶段」后弹出
  var fragAllowed = known && fragPhase >= 3;
  var isEnding = /(^|\/)ending-/.test(location.pathname);
  if (fragAllowed && !isEnding) {
    var hud = document.createElement('div');
    hud.id = 'fragHud';
    hud.innerHTML = '记忆碎片 <b id="fhNum">0</b>/' + TOTAL + '<span id="fhDots"></span>';
    document.body.appendChild(hud);
  }

  function renderDots() {
    var numEl = document.getElementById('fhNum');
    var dotsEl = document.getElementById('fhDots');
    if (!numEl || !dotsEl) return; // HUD 未生成时（如本页 known 后置位）跳过，避免报错
    var c = getCollected().length;
    var dots = '';
    for (var i = 0; i < TOTAL; i++) {
      dots += '<span class="fh-dot' + (i < c ? ' on' : '') + '"></span>';
    }
    dotsEl.innerHTML = dots;
    numEl.textContent = c;
  }

  function markCollectedStatic() {
    var have = getCollected();
    document.querySelectorAll('.frag-trigger').forEach(function (el) {
      if (have.indexOf(el.getAttribute('data-frag')) >= 0) {
        el.classList.add('collected');
        el.innerHTML = '<span class="ft-mark"></span>已收入记忆碎片';
      }
    });
  }

  function showReveal() {
    if (document.getElementById('revealOverlay')) return;
    var ov = document.createElement('div');
    ov.id = 'revealOverlay';
    ov.innerHTML =
      '<div class="reveal-center">' +
      '<div class="reveal-big" id="revealBig"></div>' +
      '<button id="revealGo" style="display:none" onclick="FRAG.go(\'page13-riji.html\')">去看日记</button>' +
      '</div>';
    document.body.appendChild(ov);
    // 中央大字逐字浮现（改动后文案；HUD 不闪红光）
    var text = '记忆逐渐从深处浮现，那些忘却的不为人知的往事，正一点一滴，清晰地想起......';
    var big = document.getElementById('revealBig');
    var btn = document.getElementById('revealGo');
    var i = 0;
    var timer = setInterval(function () {
      if (i < text.length) {
        big.textContent = text.substring(0, i + 1);
        i++;
      } else {
        clearInterval(timer);
        btn.style.display = '';
      }
    }, 70);
  }

  // —— 消息来电提示音（Web Audio 合成「叮咚」，无需音频文件，可离线）——
  function playMsgTone() {
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      var ctx = new AC();
      function ding(startAt, f1, f2) {
        [[f1, 0], [f2, 0.13]].forEach(function (p) {
          var o = ctx.createOscillator(), g = ctx.createGain();
          o.type = 'sine'; o.frequency.value = p[0];
          o.connect(g); g.connect(ctx.destination);
          var t = startAt + p[1];
          g.gain.setValueAtTime(0.0001, t);
          g.gain.exponentialRampToValueAtTime(0.28, t + 0.02);
          g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5);
          o.start(t); o.stop(t + 0.55);
        });
      }
      var now = ctx.currentTime;
      ding(now, 880, 1174.7);        // 第一声「叮咚」
      ding(now + 0.72, 880, 1174.7); // 第二声，营造「来消息了」的提醒感
      setTimeout(function () { try { ctx.close(); } catch (e) {} }, 2200);
    } catch (e) {}
  }

  // —— 贾义正主动私信弹窗（右下角）——
  function isJyzChatPage() {
    return new RegExp(JYZ_CHAT_PAGE.replace('.', '\\.')).test(location.pathname);
  }
  function showJyzNotify(withSound) {
    if (isEnding || isJyzChatPage()) return;                 // 结局页 / 对话页本身不弹
    if (localStorage.getItem(LS_JYZ_READ) === '1') return;   // 已读则不再提醒
    if (document.getElementById('jyzNotify')) return;        // 避免重复
    var box = document.createElement('div');
    box.id = 'jyzNotify';
    box.setAttribute('role', 'alert');
    box.innerHTML =
      '<div class="jn-head">' +
        '<div class="jn-av"><img src="jiayizheng.webp" alt="贾义正" onerror="this.parentNode.textContent=\'贾\'"></div>' +
        '<div class="jn-who"><div class="jn-name"><span class="jn-dot" style="display:inline-block"></span>贾义正</div>' +
        '<div class="jn-sub">无生中学 · 招生咨询　现在</div></div>' +
        '<div class="jn-close" title="关闭">×</div>' +
      '</div>' +
      '<div class="jn-body">还有什么想问的吗？这是最后一次机会了。</div>' +
      '<div class="jn-cta">点击回复 →</div>';
    document.body.appendChild(box);
    // 关闭按钮：仅关闭本次（未读，下次进入页面仍会提醒）
    box.querySelector('.jn-close').addEventListener('click', function (e) {
      e.stopPropagation();
      box.classList.remove('show');
      setTimeout(function () { if (box.parentNode) box.parentNode.removeChild(box); }, 450);
    });
    // 点击弹窗主体：进入与贾义正的对话（标记已读，携带碎片/身份参数）
    box.addEventListener('click', function () {
      try { localStorage.setItem(LS_JYZ_READ, '1'); } catch (e) {}
      window.location.href = FRAG_link(JYZ_CHAT_PAGE);
    });
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { box.classList.add('show'); });
    });
    if (withSound) playMsgTone();
  }

  function onCollect(id, el) {
    if (!fragAllowed) return; // 未确认身份 / 未解锁第三阶段前，记忆碎片不可收集
    var have = getCollected();
    if (have.indexOf(id) >= 0) return;
    have.push(id);
    writeFrags(have);
    el.classList.add('collected');
    el.innerHTML = '<span class="ft-mark"></span>已收入记忆碎片';
    renderDots();
    if (getCollected().length >= TOTAL) {
      setTimeout(showReveal, 350);
      // 集齐全部记忆：贾义正主动发来「最后一次机会」的私信（弹窗 + 提示音）
      try { localStorage.setItem(LS_JYZ_MSG, '1'); } catch (e) {}
      setTimeout(function () { showJyzNotify(true); }, 1200);
    }
  }

  // —— 点击分发：碎片触发 + 站内链接参数透传 ——
  document.addEventListener('click', function (e) {
    // 1) 记忆碎片触发（未确认身份 / 未解锁第三阶段前不可收集）
    var t = e.target.closest && e.target.closest('.frag-trigger');
    if (t) {
      if (!fragAllowed) return;
      onCollect(t.getAttribute('data-frag'), t);
      return;
    }

    // 2) 站内 .html 链接：透传碎片 + 已知身份 参数
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return; // 保留浏览器新标签等行为
    var a = e.target.closest && e.target.closest('a');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href) return;
    if (href.indexOf('javascript:') === 0) return;
    if (href.indexOf('://') >= 0) return;
    if (href.charAt(0) === '#') return;
    if (/\.html($|\?|#)/.test(href) === false) return;

    var frags = getCollected();
    var known = getKnown();
    if (frags.length === 0 && !known) return; // 没有状态可带，正常导航

    var hashIndex = href.indexOf('#');
    var hash = hashIndex >= 0 ? href.slice(hashIndex) : '';
    var base = hashIndex >= 0 ? href.slice(0, hashIndex) : href;
    var newHref;
    if (useHash) {
      var clean = hash.replace(/^#/, '').replace(/frag=[^&]+/, '').replace(/known=[^&]+/, '').replace(/^&/, '');
      var parts = [];
      if (frags.length) parts.push('frag=' + frags.join(','));
      if (known) parts.push('known=1');
      newHref = base + '#' + parts.join('&') + (clean ? '&' + clean : '');
    } else {
      var u = new URL(base, location.href);
      if (frags.length) u.searchParams.set('frag', frags.join(','));
      if (known) u.searchParams.set('known', '1');
      newHref = u.pathname.split('/').pop() + u.search + hash;
    }
    e.preventDefault();
    a.setAttribute('href', newHref);
    window.location.href = newHref;
  });

  if (fragAllowed && !isEnding) {
    renderDots();
    markCollectedStatic();
  } else {
    // 未确认身份前：记忆碎片入口不显示、不可收集
    document.querySelectorAll('.frag-trigger').forEach(function (el) { el.style.display = 'none'; });
  }

  // —— 贾义正私信：跨页面持久提醒 ——
  // 进入招生咨询页 = 视为已读，停止后续提醒；
  // 其它页面若消息已触发且未读，则重新弹出提醒（页面加载无用户手势，浏览器可能拦截声音，静默显示即可）。
  (function jyzNotifyOnLoad(){
    try {
      // 来源无关：碎片可能经 fragment.js 点击收集，也可能由天台/招生页直接写入 localStorage。
      // 只要「已集齐全部 5 片」，就补齐触发标记，确保贾义正私信一定能弹出（不再依赖某个收集路径顺手设标记）。
      var allCollected = getCollected().length >= TOTAL;
      if (allCollected && localStorage.getItem(LS_JYZ_MSG) !== '1') {
        try { localStorage.setItem(LS_JYZ_MSG, '1'); } catch (e) {}
      }
      if (localStorage.getItem(LS_JYZ_MSG) !== '1') return; // 尚未集齐全部记忆
      if (isJyzChatPage()) { localStorage.setItem(LS_JYZ_READ, '1'); return; }
      if (localStorage.getItem(LS_JYZ_READ) === '1') return;
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function(){ showJyzNotify(false); });
      } else {
        showJyzNotify(false);
      }
    } catch (e) {}
  })();
})();
