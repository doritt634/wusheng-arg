/* =========================================================================
 * 三阶段游玩门禁（phase.js）v2
 * - 隐藏/搜索页按阶段解锁：未解锁阶段的页，搜索框与关键词都搜不到。
 * - 阶段完成条件：访问过该阶段全部隐藏页（线索随页面阅读自动获得）。
 * - 阶段推进：当前阶段全部页访问后，自动解锁下一阶段搜索权限。
 * - 内容门禁：任何带 data-phase="N" 的元素，在阶段 < N 时隐藏。
 *   常驻导航页里属于后阶段的（如 page6 名师风采、page10 祈愿/39 回复）
 *   由对应页面自行加 data-phase 或 JS 判断，本模块统一执行隐藏。
 * 共享全局：window.PHASE_OF / window.phaseUnlocked(n) / window.currentPhase()
 *
 * ┌─ 进度持久化设定（v2 明确规则）──────────────────────────────────────┐
 * │ 所有解锁状态（阶段进度、已读页、聊天室口令、论坛登录、联系我们钥匙、 │
 * │ 三条解密线、旧库照片、菜品谜题、PDF、日记碎片、矛盾点高亮等）一律    │
 * │ 持久化于 localStorage，玩家重新进入任意页面都会自动恢复原状。         │
 * │ 本门禁在任何正常进入（不带参数）时【绝不】重置进度。                 │
 * │ 只有显式在 URL 后追加 ?reset=all 或 ?reset=key 才会清空进度，         │
 * │ 且这是开发者测试入口，正常游玩不会触发。                              │
 * └────────────────────────────────────────────────────────────────────┘
 * ========================================================================= */
(function () {
  "use strict";

  /* —— 开发者测试入口 ——
   * ?reset=all 清空全部进度（所有 wbs_ 进度 + 论坛登录态），并跳回首页从头开始
   * ?reset=key 只清空钥匙，其余进度保留
   * 二选一放在任意页面 URL 后面即可，例如： page1.html?reset=all
   */
  (function handleReset() {
    try {
      var p = new URLSearchParams(location.search);
      var r = p.get("reset");
      if (r) {
        if (r === "all") {
          // 清空整个 localStorage（同源开发态，清空即纯净），不再只匹配 wbs_ 前缀，
          // 否则 test_wbs_* 等非 wbs_ 前缀的状态键会残留。
          var keys = [];
          for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k) keys.push(k); }
          keys.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
          try { for (var sj = sessionStorage.length - 1; sj >= 0; sj--) { var sk = sessionStorage.key(sj); if (sk) sessionStorage.removeItem(sk); } } catch (e3) {}
          history.replaceState(null, "", location.pathname);
          location.replace("page1.html"); // 跳回首页，从头试玩
          return;
        }
        if (r === "key") {
          localStorage.removeItem("wbs_key_found_v1");
          history.replaceState(null, "", location.pathname);
          location.replace("page1.html");
          return;
        }
        // 开发者便捷入口：?reset=phaseN 直接跳到第 N 阶段（保留其余进度），便于试玩后期剧情
        var pm = /^phase([123])$/.exec(r);
        if (pm) {
          setPhase(parseInt(pm[1], 10));
          history.replaceState(null, "", location.pathname);
          location.reload(); // 当前页重载，阶段已恢复
          return;
        }
      }
    } catch (e) {}
  })();

  // —— 设定开关：进度持久化 ——
  // 默认开启：玩家重新进入任意页面都会保持此前所有解锁状态（阶段进度、聊天、
  // 论坛登录、钥匙、解密、矛盾点高亮等），绝不自动重置。
  // 关闭此开关不会自动清进度，进度清空仅由 URL 上的 ?reset= 参数显式触发。
  var PROGRESS_PERSISTENT = true;

  var STORE_PHASE = "wbs_phase";     // 当前已解锁阶段（1/2/3）
  var STORE_VISIT = "wbs_visited";   // 已访问页文件名数组

  // 隐藏/搜索页所属阶段；未列出的页（常驻导航页、工具页）视为永远可访问（阶段 0）。
  //
  // 阶段划分依据：开发提供的《一到三阶段全解锁攻略》(2026-07-18) 严格对齐：
  //   Phase 1 = 搜索框搜索即可发现的「表面线索」页（心理老师/会长/杜兴/贾一方/同善楼 + 天台 + 档案馆）
  //   Phase 2 = 聊天室 + 档案馆深层 + 矛盾点(何宏宇/俞丽) + 停职公告 + 广播站
  //   Phase 3 = 身份翻转(糖醋排骨) + 校友旧刊/凯撒解密 + 秘密基地 + 日记（终局）
  // 注：天台、档案馆的「深层内容」由各自谜题进度门禁（密码锁/授权口令），本阶段仅控制其首次可被发现/搜索。
  // 注：资源下载(downloads.html)、校园论坛(page11)、校友聚集(page7)、招生咨询(page10)
  //     均为常驻导航页，已从 PHASE_OF 移除 → 第一阶段即可打开（阶段0），绝不整页封锁；
  //     其内「深层内容」（论坛登录态、祈愿对话/结局、校友旧刊入口等）仍由页内 data-phase / JS 控制，后期阶段才显示。
  var PHASE_OF = {
    // ── 第一阶段：搜索框搜索即可发现的「表面线索」页 ──
    //   （攻略第一阶段：搜索框搜索。深层内容由各自谜题进度门禁，不靠本阶段锁）
    "page15-xinli.html": 1,           // 心理老师招聘（搜"心理老师"/"心理健康教育课"）
    "page16-huizhang.html": 1,        // 历届学生会长（搜"陈鑫垚"）
    "page17-duxing.html": 1,          // 杜兴现状（搜"杜兴"）
    "page18-jiayifang.html": 1,       // 贾一方创校（搜"贾一方"/"无生中学"）
    "page19-jiayifang-interview.html": 1, // 贾一方采访（搜"19761011"）
    "page20-tongshan-notice.html": 1, // 新同善楼通告（搜"同善楼"）
    "page14-tiantai.html": 1,         // 旧同善楼·天台储藏室（搜"天台"→表面：锁着的门；深层靠解密码锁）
    "archive-year.html": 1,           // 档案馆·年份（搜"档案馆"→表面）
    "archive-class.html": 1,          // 档案馆·班级（表面）
    "archive-class7.html": 1,         // 档案馆·7班名册（何宏宇加密，口令第二阶段聊天室获得）

    // ── 第二阶段：聊天室 + 档案馆深层 + 矛盾点 + 停职/广播 ──
    "page21-chatroom.html": 2,        // 2006届毕业班聊天室
    "page22-graduation-photo.html": 2,// 求毕业照扫描（聊天室热帖）
    "page23-yuli-stop.html": 2,       // 俞丽停职说明（搜"高峻豪"）
    "decrypt-morse.html": 2,          // 校广播站（摩斯问答，搜"广播站"/"广播"/"播音社"）
    "morse-code.html": 2,             // 摩斯电码详述（参考表，不作推进门槛）

    // ── 第三阶段：身份翻转 + 日记 + 秘密基地 + 校友旧刊 + 终局 ──
    "food-menu.html": 3,              // 食堂菜品（糖醋排骨=身份翻转，第一二阶段全解锁后开）
    "jiukan.html": 3,                 // 校友旧刊（第一二阶段全解锁后出现）
    "decrypt-caesar.html": 3,         // 校友旧刊（凯撒解密）
    "decrypt-base.html": 3,           // 秘密基地（搜"秘密基地"→「同」第一道密码锁）
    "page13-riji.html": 3             // 纪佑泽的日记（记忆复原）
  };

  // 由 PHASE_OF 反推每阶段需"找到"的页集合
  var PHASE_PAGES = { 1: [], 2: [], 3: [] };
  Object.keys(PHASE_OF).forEach(function (f) {
    var p = PHASE_OF[f];
    if (PHASE_PAGES[p]) PHASE_PAGES[p].push(f);
  });

  // 阶段推进所需的"必访隐藏页"。
  // 默认同 PHASE_PAGES，但排除纯参考/读物类辅助页（如摩斯密码对照表），
  // 避免玩家因没点开辅助页而卡在阶段之间——这些页仍可正常访问、搜索、阅读，
  // 只是不作为推进门槛。
  var ADVANCE_KEY = {
    1: PHASE_PAGES[1].slice(),                          // 扩展内容：全部需访问
    2: PHASE_PAGES[2].filter(function (f) {
      return f !== "morse-code.html";                    // 排除参考表
    }),
    3: PHASE_PAGES[3].slice()                           // 终局层：全部需访问
  };

  // 首页顶部导航栏可直接抵达的页面（常驻导航页）。
  // 这些页第一阶段即可打开，永远不做整页封锁；
  // 其中属于后阶段的“局部信息”由页面自行标注 data-phase="N" 临时隐藏，后期解锁再显示。
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
    var n = parseInt(localStorage.getItem(STORE_PHASE), 10);
    return (n >= 1 && n <= 3) ? n : 1;
  }
  function setPhase(n) {
    try { localStorage.setItem(STORE_PHASE, String(n)); } catch (e) {}
  }
  function getVisited() {
    try {
      var a = JSON.parse(localStorage.getItem(STORE_VISIT));
      if (Array.isArray(a)) return a;
    } catch (e) {}
    return [];
  }
  function markVisited(f) {
    var a = getVisited();
    if (a.indexOf(f) < 0) {
      a.push(f);
      try { localStorage.setItem(STORE_VISIT, JSON.stringify(a)); } catch (e) {}
    }
  }

  function phaseUnlocked(n) { return n <= getPhase(); }
  function currentPhase() { return getPhase(); }

  // 页面是否属于某个尚未解锁的阶段
  function pageLocked(u) {
    var pf = (window.PHASE_OF && window.PHASE_OF[u]) || 0;
    if (pf === 0) return false;
    return pf > currentPhase();
  }

  function cn(n) { return ["零", "一", "二", "三"][n] || n; }

  function showToast(msg, variant) {
    var t = document.createElement("div");
    t.textContent = msg;
    var bg = (variant === "gray") ? "rgba(96,96,96,.95)" : "rgba(26,58,108,.92)";
    t.style.cssText = "position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:5000;" +
      "background:" + bg + ";color:#fff;padding:8px 18px;border-radius:6px;font-size:13px;" +
      "box-shadow:0 2px 10px rgba(0,0,0,.3);font-family:'宋体',SimSun,serif;letter-spacing:1px;";
    (document.body || document.documentElement).appendChild(t);
    setTimeout(function () {
      t.style.transition = "opacity .6s"; t.style.opacity = "0";
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 600);
    }, 2600);
  }

  function gateContent() {
    var ph = currentPhase();
    document.querySelectorAll("[data-phase]").forEach(function (el) {
      var need = parseInt(el.getAttribute("data-phase"), 10) || 1;
      el.style.display = (need > ph) ? "none" : "";
    });
  }

  // 尚未解锁阶段的页：不再整页留白（否则移动端进入后无任何退出入口），
  // 改为显示一个友好的“未解锁”提示屏，并保留“返回首页 / 返回上页”通道。
  function blockLockedContent() {
    try {
      var f = (location.pathname.split("/").pop() || "").toLowerCase();
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

  // 拦截指向“未解锁页”的链接：点击时弹提示且不跳转（避免从论坛等页误入空白页）。
  // 仅对 PHASE_OF 中标记、且所需阶段 > 当前阶段的页生效；已解锁或常驻导航页正常跳转。
  function interceptLockedLinks() {
    try {
      var ph = currentPhase();
      var links = document.querySelectorAll("a[href]");
      Array.prototype.forEach.call(links, function (a) {
        var href = (a.getAttribute("href") || "").trim();
        if (!href || /^(#|javascript:)/i.test(href)) return;
        var m = href.split("/").pop().split("?")[0].split("#")[0].toLowerCase();
        if (NAV_PAGES.indexOf(m) >= 0) return;   // 常驻导航页永远可点，不拦截（仅页内 data-phase 深层内容受阶段门禁）
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
    var f = (location.pathname.split("/").pop() || "").toLowerCase();

    // 统一拦截指向未解锁页的链接（如论坛里点开阶段2以后的热帖），点击即提示、不跳转
    interceptLockedLinks();

    // 首页导航栏页面：永远可直接打开（第一阶段即可获取的信息）；
    // 仅按 data-phase 隐藏内部后阶段内容，绝不整页封锁。
    if (NAV_PAGES.indexOf(f) >= 0) {
      // 门户主站页面（含 page1 / 概况 / 通知等）一律计入"已访问"，
      // 便于调试面板统计实际浏览覆盖；不影响阶段推进（checkAdvance 只比对隐藏页集合）。
      markVisited(f);
      gateContent();
      checkAdvance();
      gateContent();
      return;
    }

    // 其余隐藏游戏页：所属阶段未解锁则整页隐藏内容（不显示任何锁定层/对话），且不计入已访问
    var need = PHASE_OF[f] || 0;
    if (need > currentPhase()) {
      blockLockedContent();
      return;
    }
    if (need) markVisited(f);
    gateContent();
    checkAdvance();
    gateContent(); // 推进后可能解锁部分内容
  }

  // 供 search.js / clue.js 调用
  window.PHASE_OF = PHASE_OF;
  window.phaseUnlocked = phaseUnlocked;
  window.currentPhase = currentPhase;
  window.pageLocked = pageLocked;

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();

/* =========================================================================
 * 移动端框架（由本文件统一注入，全站生效）
 *  - 注入 mobile.css（去重），集中承载窄屏通用适配规则
 *  - 顶部导航 .main-nav 在窄屏收成汉堡抽屉（CSS 在 mobile.css，逻辑在此）
 * 仅在存在 .top-bar / .main-nav 的页面生效；无则安全跳过。
 * 删除下方 mobileFramework() 与 mobile.css 即可整体还原移动端适配。
 * ========================================================================= */
(function mobileFramework() {
  "use strict";
  try {
    // 1) 注入 mobile.css（去重）
    if (!document.getElementById("mobileCssLink")) {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "mobile.css?v=20260719v";
      link.id = "mobileCssLink";
      document.head.appendChild(link);
    }

    // 2) 顶部导航：移动端不再收成汉堡抽屉（避免首页等出现“两个汉堡框”）。
    //    .main-nav 在 mobile.css 中始终可见、可横向滚动；故不再注入 .nav-toggle。
    function initNav() {
      var bar = document.querySelector(".top-bar");
      if (!bar) return;
      var nav = bar.querySelector(".main-nav");
      if (!nav) return;
      // 清理任何残留的 .open 状态，保证移动端 main-nav 始终以横向滚动条呈现
      nav.classList.remove("open");
    }

    var isMobile = function () { return window.matchMedia("(max-width: 820px)").matches; };

    // 3) 汉堡菜单：移动端统一为“点击展开/收起”，覆盖 .hamburger-dropdown 与 .hamburger-menu 两套。
    //    做法：克隆节点剥离页面自带监听 + 去掉内联 onclick，再统一挂载一个 toggle，避免重复触发。
    //    仅移动端生效，桌面端保持各页原有（点击 / hover）行为不变。
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

    // 4) 分类分支导航（.left-nav）：移动端点击大标题（.nav-title）折叠/展开条目，功能类似导航栏。
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
  } catch (e) { /* 静默失败，不影响主游戏进度逻辑 */ }
})();
