// 被发现了吧，不要偷懒自己解！

(function () {
  "use strict";

  
  (function handleReset() {
    try {
      var p = new URLSearchParams(location.search);
      var r = p.get("reset");
      if (r) {
        if (r === "all") {
          
          
          var keys = [];
          for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k) keys.push(k); }
          keys.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
          try { for (var sj = sessionStorage.length - 1; sj >= 0; sj--) { var sk = sessionStorage.key(sj); if (sk) sessionStorage.removeItem(sk); } } catch (e3) {}
          history.replaceState(null, "", location.pathname);
          location.replace("page1.html");
          return;
        }
        if (r === "key") {
          localStorage.removeItem("wbs_key_found_v1");
          history.replaceState(null, "", location.pathname);
          location.replace("page1.html");
          return;
        }
        
        var pm = /^phase([123])$/.exec(r);
        if (pm) {
          setPhase(parseInt(pm[1], 10));
          history.replaceState(null, "", location.pathname);
          location.reload();
          return;
        }
      }
    } catch (e) {}
  })();

  
  
  
  
  var PROGRESS_PERSISTENT = true;

  var STORE_PHASE = "wbs_phase";
  var STORE_VISIT = "wbs_visited";

  
  
  
  var _storeOK = true;
  (function checkStore() {
    try { localStorage.setItem("__wbst__", "1"); _storeOK = (localStorage.getItem("__wbst__") === "1"); localStorage.removeItem("__wbst__"); }
    catch (e) { _storeOK = false; }
  })();
  function storeSet(key, val) {
    
    try { localStorage.setItem(key, val); return; } catch (e) {}
    try { sessionStorage.setItem(key, val); } catch (e2) {}
  }
  function storeGet(key) {
    try { var v = localStorage.getItem(key); if (v !== null) return v; } catch (e) {}
    try { return sessionStorage.getItem(key); } catch (e2) { return null; }
  }

  
  //
  
  
  
  
  
  
  
  
  var PHASE_OF = {
    
    
    "page15-xinli.html": 1,
    "page16-huizhang.html": 1,
    "page17-duxing.html": 1,
    "page18-jiayifang.html": 1,
    "page19-jiayifang-interview.html": 1,
    "page20-tongshan-notice.html": 1,
    "page14-tiantai.html": 1,
    "archive-year.html": 1,
    "archive-class.html": 1,
    "archive-class7.html": 1,

    
    "page21-chatroom.html": 2,
    "page22-graduation-photo.html": 2,
    "page23-yuli-stop.html": 2,
    "decrypt-morse.html": 2,
    "morse-code.html": 2,

    
    "food-menu.html": 3,
    "jiukan.html": 3,
    "decrypt-caesar.html": 3,
    "decrypt-base.html": 3,
    "page13-riji.html": 3
  };

  
  var PHASE_PAGES = { 1: [], 2: [], 3: [] };
  Object.keys(PHASE_OF).forEach(function (f) {
    var p = PHASE_OF[f];
    if (PHASE_PAGES[p]) PHASE_PAGES[p].push(f);
  });

  
  
  
  
  var ADVANCE_KEY = {
    1: PHASE_PAGES[1].slice(),
    2: PHASE_PAGES[2].filter(function (f) {
      return f !== "morse-code.html";
    }),
    3: PHASE_PAGES[3].slice()
  };

  
  
  
  var NAV_PAGES = [
    "page1.html", "index.html",
    "page2-about.html", "page3-notice.html", "page4-events.html",
    "page5-jiaoyu.html", "page6-mingshi.html", "page7-xiaoyou.html",
    "page8-dangjian.html", "page9-xuesheng.html", "page10-zhaosheng.html",
    "page11-luntan.html", "page12-guanyu.html",
    "school-calendar.html", "weekly-calendar.html", "downloads.html",
    "contact-us.html"
  ];

  function getPhase() {
    var n = parseInt(storeGet(STORE_PHASE), 10);
    return (n >= 1 && n <= 3) ? n : 1;
  }
  function setPhase(n) {
    storeSet(STORE_PHASE, String(n));
  }
  function getVisited() {
    try {
        var a = JSON.parse(storeGet(STORE_VISIT));
        if (Array.isArray(a)) return a;
    } catch (e) {}
    return [];
  }
  function markVisited(f) {
    var a = getVisited();
    if (a.indexOf(f) < 0) {
      a.push(f);
      storeSet(STORE_VISIT, JSON.stringify(a));
    }
    
    if (f === "archive-year.html") {
      ["archive-class.html", "archive-class7.html"].forEach(function (cf) {
        if (a.indexOf(cf) < 0) { a.push(cf); storeSet(STORE_VISIT, JSON.stringify(a)); }
      });
    }
  }

  function phaseUnlocked(n) { return n <= getPhase(); }
  function currentPhase() { return getPhase(); }

  
  function pageLocked(u) {
    var pf = (window.PHASE_OF && window.PHASE_OF[u]) || 0;
    if (pf === 0) return false;
    return pf > currentPhase();
  }

  
  
  function normFile(raw) {
    var f = (raw || "").toString().toLowerCase();
    f = f.split("?")[0].split("#")[0];
    if (f === "" || f === "/" || f === "index" || f === "index.html") return "index.html";
    if (!/\.[a-z0-9]+$/.test(f)) f += ".html";
    return f;
  }

  function cn(n) { return ["零", "一", "二", "三"][n] || n; }

  function showToast(msg, variant) {
    
    
    
    
    var wrapper = document.createElement("div");
    wrapper.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:5000;text-align:center;pointer-events:none";
    var t = document.createElement("div");
    t.textContent = msg;
    var bg = (variant === "gray") ? "rgba(96,96,96,.95)" : "rgba(26,58,108,.92)";
    t.style.cssText = "display:inline-block;margin-top:16px;" +
      "background:" + bg + ";color:#fff;padding:8px 18px;border-radius:6px;font-size:13px;" +
      "box-shadow:0 2px 10px rgba(0,0,0,.3);font-family:'宋体',SimSun,serif;letter-spacing:1px;" +
      "pointer-events:auto";
    wrapper.appendChild(t);
    (document.body || document.documentElement).appendChild(wrapper);
    setTimeout(function () {
      wrapper.style.transition = "opacity .6s"; wrapper.style.opacity = "0";
      setTimeout(function () { if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper); }, 600);
    }, 2600);
  }

  function gateContent() {
    var ph = currentPhase();
    document.querySelectorAll("[data-phase]").forEach(function (el) {
      var need = parseInt(el.getAttribute("data-phase"), 10) || 1;
      el.style.display = (need > ph) ? "none" : "";
    });
  }

  
  
  function blockLockedContent() {
    try {
      var f = normFile(location.pathname.split("/").pop() || "");
      var need = (window.PHASE_OF && window.PHASE_OF[f]) || 0;
      var ph = currentPhase();

      var wrap = document.createElement("div");
      wrap.id = "phaseLockScreen";
      wrap.style.cssText = "position:fixed;inset:0;z-index:6000;background:#f5f5f0;" +
        "display:flex;align-items:center;justify-content:center;padding:24px;" +
        "font-family:'宋体',SimSun,serif;box-sizing:border-box";
      var box = document.createElement("div");
      box.style.cssText = "max-width:420px;width:100%;background:#fff;border:2px outset #c0c0c0;" +
        "text-align:center;padding:30px 22px;box-shadow:0 2px 12px rgba(0,0,0,.15);box-sizing:border-box";
      box.innerHTML =
        '<div style="font-size:42px;line-height:1;margin-bottom:12px">🔒</div>' +
        '<div style="font-family:\'黑体\',SimHei,sans-serif;font-size:18px;color:#22324a;font-weight:bold;margin-bottom:12px">尚未解锁</div>' +
        '<div style="font-size:14px;line-height:2;color:#555;margin-bottom:8px">该内容需达到 <span style="color:#c93a3a;font-weight:bold">第' + cn(need) + '阶段</span> 剧情进度后方可查看。</div>' +
        '<div style="font-size:13px;color:#999;margin-bottom:22px">当前进度：第' + cn(ph) + '阶段。请继续探索，满足条件后将自动开放。</div>' +
        '<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">' +
          '<a href="page1.html" style="background:#c93a3a;color:#fff;border:2px outset #c0c0c0;padding:9px 18px;font-family:\'黑体\',SimHei,sans-serif;font-size:13px;text-decoration:none">返回首页</a>' +
          '<button type="button" onclick="history.back()" style="background:#fff;color:#22324a;border:2px outset #c0c0c0;padding:9px 18px;font-family:\'黑体\',SimHei,sans-serif;font-size:13px;cursor:pointer">返回上页</button>' +
        '</div>';
      document.body.innerHTML = "";
      document.body.appendChild(wrap);
      wrap.appendChild(box);
    } catch (e) {}
    document.title = "尚未解锁";
  }

  
  
  function interceptLockedLinks() {
    try {
      var ph = currentPhase();
      var links = document.querySelectorAll("a[href]");
      Array.prototype.forEach.call(links, function (a) {
        var href = (a.getAttribute("href") || "").trim();
        if (!href || /^(#|javascript:)/i.test(href)) return;
        var m = normFile(href.split("/").pop());
        if (NAV_PAGES.indexOf(m) >= 0) return;
        var need = (window.PHASE_OF && window.PHASE_OF[m]) || 0;
        if (!need || need <= ph) return;
        a.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopPropagation();
          showToast("未达到解锁条件，尚无法进入", "gray");
        });
      });
    } catch (e) {}
  }

  function checkAdvance() {
    var ph = getPhase();
    if (ph >= 3) return;
    var need = (ADVANCE_KEY[ph] || PHASE_PAGES[ph] || []);
    var vis = getVisited();
    var done = need.length > 0 && need.every(function (f) { return vis.indexOf(f) >= 0; });
    if (done) {
      setPhase(ph + 1);
      showToast("第" + cn(ph + 1) + "阶段已开启");
    }
  }

  function init() {
    
    if (!_storeOK) {
      var warnEl = document.createElement("div");
      warnEl.style.cssText = "position:fixed;bottom:0;left:0;right:0;z-index:5000;background:#c93a3a;color:#fff;" +
        "padding:8px 14px;font-size:12px;font-family:'宋体',SimSun,serif;text-align:center;line-height:1.6";
      warnEl.innerHTML = "⚠️ 当前浏览器禁用了网站数据存储，游戏进度无法保存。<br>" +
        "请关闭「无痕/隐私模式」，或在 Safari 设置中允许本网站存储数据，然后刷新页面。";
      (document.body || document.documentElement).appendChild(warnEl);
    }

    var f = normFile(location.pathname.split("/").pop() || "");

    
    interceptLockedLinks();

    
    
    if (NAV_PAGES.indexOf(f) >= 0) {
      
      
      markVisited(f);
      gateContent();
      checkAdvance();
      gateContent();
      return;
    }

    
    var need = PHASE_OF[f] || 0;
    if (need > currentPhase()) {
      blockLockedContent();
      return;
    }
    if (need) markVisited(f);
    gateContent();
    checkAdvance();
    gateContent();
  }

  
  window.PHASE_OF = PHASE_OF;
  window.phaseUnlocked = phaseUnlocked;
  window.currentPhase = currentPhase;
  window.pageLocked = pageLocked;

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();


(function mobileFramework() {
  "use strict";
  try {
    
    if (!document.getElementById("mobileCssLink")) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "mobile.css?v=20260719v";
      link.id = "mobileCssLink";
      document.head.appendChild(link);
    }

    
    
    function initNav() {
      var bar = document.querySelector(".top-bar");
      if (!bar) return;
      var nav = bar.querySelector(".main-nav");
      if (!nav) return;
      
      nav.classList.remove("open");
    }

    var isMobile = function () { return window.matchMedia("(max-width: 820px)").matches; };

    
    
    
    function unifyHamburger() {
      if (!isMobile()) return;
      var h = document.querySelector(".hamburger");
      if (!h) return;
      var clone = h.cloneNode(true);
      clone.removeAttribute("onclick");
      if (h.parentNode) h.parentNode.replaceChild(clone, h);
      clone.addEventListener("click", function (e) {
        e.stopPropagation();
        this.classList.toggle("active");
      });
      document.addEventListener("click", function (e) {
        if (!e.target.closest(".hamburger")) {
          var hh = document.querySelector(".hamburger");
          if (hh) hh.classList.remove("active");
        }
      });
    }

    
    function initBranchNav() {
      if (!isMobile()) return;
      var navs = document.querySelectorAll(".left-nav");
      Array.prototype.forEach.call(navs, function (ln) {
        var title = ln.querySelector(".nav-title");
        if (!title || title.getAttribute("data-ln-bound")) return;
        title.setAttribute("data-ln-bound", "1");
        if (!title.querySelector(".ln-arrow")) {
          var ar = document.createElement("span");
          ar.className = "ln-arrow";
          ar.textContent = "▲";
          title.appendChild(ar);
        }
        title.addEventListener("click", function () {
          ln.classList.toggle("ln-collapsed");
          var a = title.querySelector(".ln-arrow");
          if (a) a.textContent = ln.classList.contains("ln-collapsed") ? "▼" : "▲";
        });
      });
    }

    function initAll() { initNav(); unifyHamburger(); initBranchNav(); }

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", initAll);
    } else {
      initAll();
    }
  } catch (e) {  }
})();
