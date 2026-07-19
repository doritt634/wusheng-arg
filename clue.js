/* =========================================================================
 * 秘境网关（clue.js） v3 —— 极简版
 * 不再有任何底部"秘语检索"框、入口印记或正文提示。
 * 输入只走站点自带的搜索框（.search-box）：玩家在里面输入关键词/口令，
 * 命中即跳到对应解密页；未命中则静默无反应（无任何提示）。
 * 所有跳转保留 ?frag= 记忆碎片参数。真正的解密在独立 decrypt-*.html 页面。
 * ========================================================================= */
(function () {
  "use strict";

  // 实时读取，避免与 fragment.js 的 URL 状态不同步（fragment.js 会在收集碎片后
  // 通过 replaceState 更新 location.search，这里必须实时取，否则新收集的碎片会在
  // 用搜索框跳转时丢失）
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

  /* 搜索关键词 -> 目标解密页（含口令本身，可直接搜） */
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
    // 用像素 SVG 替换可能的 emoji 搜索图标
    if (btn && /[\uD800-\uDBFF][\uDC00-\uDFFF]/.test(btn.textContent)) {
      btn.textContent = "";
      btn.innerHTML = SEARCH_ICON;
    }
    function go(e) {
      if (e && e.type === "keydown") e.preventDefault();
      // 优先：若输入精确命中站内搜索索引（隐藏页关键词），就地搜索，避免被模糊口令子串匹配劫持
      if (window.siteSearchExact && window.siteSearchExact(input.value)) {
        window.doSiteSearch(input.value);
        return;
      }
      var target = match(input.value);
      if (target) { location.href = carry(target); return; }
      // 非口令：若当前页提供站内搜索入口（search.js 已注入），则就地搜索；
      // 否则保持静默（游戏设计：避免给玩家“无结果”提示）
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
