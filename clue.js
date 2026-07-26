// 被发现了吧，不要偷懒自己解！

(function () {
  "use strict";

  
  
  
  function liveFrag() {
    return (new URLSearchParams(location.search).get("frag") || "").trim();
  }
  function liveKnown() {
    return new URLSearchParams(location.search).get("known") === "1"
           || /(^|&)known=1/.test(location.hash.replace(/^#/, ""));
  }
  function carry(u) {
    var add = [];
    var FRAG = liveFrag();
    var KNOWN = liveKnown();
    if (FRAG) add.push("frag=" + encodeURIComponent(FRAG));
    if (KNOWN) add.push("known=1");
    if (!add.length) return u;
    return u + (u.indexOf("?") > -1 ? "&" : "?") + add.join("&");
  }

  
  var SEARCH = {
    "校友": "decrypt-caesar.html",
    "旧刊": "decrypt-caesar.html",
    "密文": "decrypt-caesar.html",
    "凯撒": "decrypt-caesar.html",
    "替换密码": "decrypt-caesar.html",
    "广播": "decrypt-morse.html",
    "电台": "decrypt-morse.html",
    "录音": "decrypt-morse.html",
    "摩斯": "morse-code.html",
    "摩斯密码": "morse-code.html",
    "摩斯电码": "morse-code.html",
    "新同善楼": "page2-about.html",
    "我是纪佑泽": "food-menu.html",
    "纪佑泽": "food-menu.html",
    "天台见": "page14-tiantai.html",
    "天台": "page14-tiantai.html",
    "储藏室": "page14-tiantai.html",
    "秘密基地": "decrypt-base.html",
    "基地": "decrypt-base.html",
    "档案馆": "archive-year.html",
    "档案": "archive-year.html",
    "电子档案馆": "archive-year.html",
    "毕业档案": "archive-year.html",
    "毕业生": "archive-year.html",
    "同": "page14-tiantai.html",
    "同善印": "page14-tiantai.html",
    "同善楼之印": "page14-tiantai.html",
    "旧同善楼之印": "page14-tiantai.html"
  };

  function phaseOk(u) {
    var cur = (window.currentPhase ? window.currentPhase() : 1);
    var pf = (window.PHASE_OF && window.PHASE_OF[u]) || 0;
    return pf === 0 || pf <= cur;
  }

  function match(q) {
    q = (q || "").trim();
    if (!q) return null;
    if (SEARCH[q] && phaseOk(SEARCH[q])) return SEARCH[q];
    var lower = q.toLowerCase();
    for (var k in SEARCH) {
      var kl = k.toLowerCase();
      if ((kl.indexOf(lower) >= 0 || lower.indexOf(kl) >= 0) && phaseOk(SEARCH[k])) return SEARCH[k];
    }
    return null;
  }

  var SEARCH_ICON = '<svg width="13" height="13" viewBox="0 0 13 13" shape-rendering="crispEdges" fill="#333" xmlns="http://www.w3.org/2000/svg">' +
    '<rect x="1" y="1" width="8" height="8" fill="none" stroke="#333" stroke-width="1"/>' +
    '<rect x="3" y="3" width="4" height="4" fill="#333"/>' +
    '<rect x="8" y="8" width="4" height="2" fill="#333"/>' +
    '<rect x="9" y="9" width="2" height="4" fill="#333"/></svg>';

  function wire(input, btn) {
    
    if (btn && /[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(btn.textContent)) {
      btn.textContent = "";
      btn.innerHTML = SEARCH_ICON;
    }
    function go(e) {
      if (e && e.type === "keydown") e.preventDefault();
      
      if (window.siteSearchExact && window.siteSearchExact(input.value)) {
        window.doSiteSearch(input.value);
        return;
      }
      var target = match(input.value);
      if (target) { location.href = carry(target); return; }
      
      
      if (window.doSiteSearch) window.doSiteSearch(input.value);
    }
    if (btn) btn.addEventListener("click", go);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") go(e); });
  }

  function injectInlineSearch() {
    var box = document.createElement("div");
    box.className = "clue-search-inline";
    box.innerHTML = '<input type="text" placeholder="搜索"><button type="button" aria-label="搜索">' + SEARCH_ICON + '</button>';
    var crumb = document.querySelector(".breadcrumb");
    var top = document.querySelector(".top, .top-bar");
    if (crumb && crumb.parentNode) crumb.parentNode.insertBefore(box, crumb.nextSibling);
    else if (top && top.parentNode) top.parentNode.insertBefore(box, top.nextSibling);
    else document.body.insertBefore(box, document.body.firstChild);
    wire(box.querySelector("input"), box.querySelector("button"));
  }

  function init() {
    var sb = document.querySelector(".search-box");
    var input = sb ? sb.querySelector("input") : null;
    var btn = sb ? sb.querySelector("button") : null;
    if (input && btn) wire(input, btn);
    else injectInlineSearch();
  }

  if (document.readyState !== "loading") init();
  else document.addEventListener("DOMContentLoaded", init);
})();
