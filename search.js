/* =========================================================================
 * 站内搜索（共享）v1
 * 不依赖页面跳转与 ?search= 查询参数，任何页面引入后均可就地弹出搜索结果。
 * 与 clue.js 协作：clue.js 命中口令时跳转解密页；未命中且本页提供搜索入口时
 * 调用 window.doSiteSearch 进行站内搜索（不再静默吞掉）。
 * ========================================================================= */
(function () {
  "use strict";

  // 仅收录“用户设置的隐藏页面”，公开页面一律不进入索引，无法被搜索到。
  // kw 为精确关键词列表：只有与其中任一词【完全一致】才命中（含首尾空格/大小写已归一）。
  var SEARCH_INDEX = [
    { t: '心理老师招聘详情', u: 'page15-xinli.html', kw: ['心理老师', '心理健康教育课'], d: '无生中学心理老师招聘详情：要求有本校任职经验，全国多所分校' },
    { t: '历届学生会长资料', u: 'page16-huizhang.html', kw: ['陈鑫垚', '学生会长', '历届学生会长'], d: '无生中学历届学生会长资料：2003级陈鑫垚为高三临时上任，2005.10.8任职' },
    { t: '毕业九年的校友现状如何？', u: 'page17-duxing.html', kw: ['杜兴'], d: '无生中学校友杜兴现状：大嘴巴导致事业不佳，曾在学校因走漏消息闯下大祸（2005.11.29）' },
    { t: '创校人贾一方：无生中学的由来', u: 'page18-jiayifang.html', kw: ['贾一方', '无生中学'], d: '无生中学创校人贾一方的办学往事：销声匿迹后由匿名出资人支持创办，与贾义正为父子，创校时间1976.10.11' },
    { t: '创校人贾一方访谈：从坎坷到感恩', u: 'page19-jiayifang-interview.html', kw: ['19761011', '1976年10月11日'], d: '创校人贾一方访谈：讲述早年不幸、创业受挫、遇志同道合的朋友相助，感恩无生中学并谨记校训' },
    { t: '新同善楼修建通告', u: 'page20-tongshan-notice.html', kw: ['同善楼'], d: '新同善楼修建通告：旧档案馆已同步更新至电子档案馆' },
    { t: '求2006届毕业照高清扫描版', u: 'page22-graduation-photo.html', kw: ['毕业照', '毕业照高清扫描版', '2006届毕业照'], d: '校园论坛校友闲谈：求2006届毕业照高清扫描版，多名校友回帖，并指向电子档案馆历届毕业照' },
    { t: '关于高峻豪同学休学及俞丽老师停职的说明', u: 'page23-yuli-stop.html', kw: ['高峻豪'], d: '无生中学公告：高峻豪父亲欠下大笔外债来校扰乱秩序，高峻豪休学、俞丽停职（2006.5.24）' },
    { t: '校友旧刊', u: 'jiukan.html', kw: ['校友旧刊', '无生校友通讯'], d: '2006 届《无生校友通讯》残存期刊存档，由校友会整理留存，部分页边留有当年字迹' }
  ];

  // 搜索特定人名 → 激活对应 group 的矛盾点玩法（reveal.js 提供 window.revealUnlockGroup）
  // 仅「何宏宇」「俞丽」需要先搜索才解锁，其余矛盾点不受影响。
  var REVEAL_UNLOCK = { '何宏宇': 'he', '俞丽': 'yu' };

  // 搜索特定人名 → 解锁某隐藏页面（页面本身带门禁，须先搜过该名字才可查阅）
  var PAGE_GATE = { '高峻豪': 'gaojunhao' };
  var GATE_STORE = 'wbs_page_gate';
  function loadGates(){
    try{ var a = JSON.parse(localStorage.getItem(GATE_STORE)); if(Array.isArray(a)) return a; }catch(e){}
    return [];
  }
  function saveGate(name){
    var a = loadGates();
    if(a.indexOf(name) < 0){ a.push(name); try{ localStorage.setItem(GATE_STORE, JSON.stringify(a)); }catch(e){} }
  }
  // 供被门禁的页面查询：某门禁是否已因搜索对应名字而解锁
  window.pageGateUnlocked = function(name){ return loadGates().indexOf(name) >= 0; };

  function ensureModal() {
    if (document.getElementById('searchModal')) return;
    var d = document.createElement('div');
    d.className = 'search-modal';
    d.id = 'searchModal';
    d.innerHTML = '<div class="search-modal-box">' +
      '<div class="search-modal-head">搜索结果 <span class="search-modal-close" onclick="closeSearch()">&times;</span></div>' +
      '<div class="search-modal-body" id="searchResults"></div>' +
      '</div>';
    (document.body || document.documentElement).appendChild(d);
    if (!document.getElementById('searchStyle')) {
      var s = document.createElement('style');
      s.id = 'searchStyle';
      s.textContent =
        '.search-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:4000;align-items:center;justify-content:center}' +
        '.search-modal.show{display:flex}' +
        '.search-modal-box{width:540px;max-width:92%;background:#fff;border:3px solid #c0a040;box-shadow:4px 4px 12px rgba(0,0,0,.4)}' +
        '.search-modal-head{background:linear-gradient(to bottom,#2a4a7f,#1a3a6c);color:#fff;padding:10px 16px;font-size:15px;font-family:"黑体","SimHei",sans-serif;display:flex;justify-content:space-between;align-items:center}' +
        '.search-modal-close{cursor:pointer;font-size:20px;line-height:1;color:#fff}' +
        '.search-modal-body{padding:14px 16px;max-height:62vh;overflow-y:auto}' +
        '.search-result-item{padding:10px 8px;border-bottom:1px solid #eee}' +
        '.search-result-item a{color:#1a3a6c;font-size:15px;font-family:"黑体","SimHei",sans-serif;text-decoration:none}' +
        '.search-result-item a:hover{color:#c00;text-decoration:underline}' +
        '.search-result-item .desc{font-size:12px;color:#666;margin-top:3px}' +
        '.search-empty{color:#888;font-size:13px;padding:10px 0}';
      (document.head || document.body).appendChild(s);
    }
  }

  function runSearch(q) {
    q = (q || '').trim();
    if (!q) return;
    var ql = q.toLowerCase();
    var _cur = (window.currentPhase ? window.currentPhase() : 1);
    var matches = SEARCH_INDEX.filter(function (it) {
      // 精确匹配：输入必须与 kw 中任一词完全一致，不接受包含/模糊
      return (it.kw || []).some(function (kw) { return kw.toLowerCase() === ql; });
    });
    // 阶段门禁：屏蔽尚未解锁阶段的隐藏页（即使输入对应关键字也搜不到）
    matches = matches.filter(function (it) {
      var pf = (window.PHASE_OF && window.PHASE_OF[it.u]) || 0;
      return pf === 0 || pf <= _cur;
    });
    ensureModal();
    var box = document.getElementById('searchResults');
    if (!box) return;
    if (matches.length === 0) {
      box.innerHTML = '<div class="search-empty">未找到与“' + q + '”相关的内容。</div>';
    } else {
      box.innerHTML = matches.map(function (it) {
        return '<div class="search-result-item"><a href="' + it.u + '">' + it.t + '</a></div>';
      }).join('');
    }
    var m = document.getElementById('searchModal');
    if (m) {
      // 仅移动端（≤820px）：搜索结果框缩小并紧贴搜索框正下方（dropdown 风格）；
      // 桌面端保持原居中大弹窗。
      var boxEl = m.querySelector('.search-modal-box');
      var isMobile = window.matchMedia && window.matchMedia('(max-width: 820px)').matches;
      if (isMobile && boxEl) {
        // 宽度/定位由 mobile.css（.search-modal.show .search-modal-box !important）保证；
        // 这里仅按搜索框实际位置动态设定 top，并清掉桌面残留内联样式。
        var sb = document.querySelector('.search-box');
        if (sb) {
          var r = sb.getBoundingClientRect();
          boxEl.style.top = (r.bottom + 6) + 'px';
        } else {
          boxEl.style.top = '56px';
        }
        // 清除桌面分支可能残留的内联样式，避免与 CSS !important 冲突
        boxEl.style.position = '';
        boxEl.style.width = '';
        boxEl.style.maxWidth = '';
        boxEl.style.left = '';
        boxEl.style.right = '';
        m.style.background = 'transparent';
      } else if (boxEl) {
        // 桌面端：清除移动端可能残留的内联样式，恢复居中大弹窗
        boxEl.style.position = '';
        boxEl.style.top = '';
        boxEl.style.left = '';
        boxEl.style.right = '';
        boxEl.style.width = '';
        boxEl.style.maxWidth = '';
        m.style.background = '';
      }
      m.classList.add('show');
    }

    // 搜索特定人名即激活对应的矛盾点玩法（reveal.js 提供 unlock 接口，跨页持久化）
    try {
      var _uq = q.replace(/^[　\s。，、；：！？\.\,;:!\?（）\(\)【】「」»>]+|[　\s。，、；：！？\.\,;:!\?（）\(\)【】「」»>]+$/g, '').toLowerCase();
      var _ug = REVEAL_UNLOCK[_uq];
      if (_ug && typeof window.revealUnlockGroup === 'function') {
        // 何宏宇 / 俞丽 矛盾点属第二阶段
        var _grpPhase = (_ug === 'he' || _ug === 'yu') ? 2 : 1;
        if (_grpPhase <= _cur) window.revealUnlockGroup(_ug);
      }
      // 搜索特定名字 → 解锁对应隐藏页面的查阅权限（高峻豪属第二阶段）
      var _pg = PAGE_GATE[_uq];
      if (_pg) { var _pgPhase = (_pg === 'gaojunhao') ? 2 : 1; if (_pgPhase <= _cur) saveGate(_pg); }
    } catch (e) {}
  }

  function closeSearch() {
    var m = document.getElementById('searchModal');
    if (m) m.classList.remove('show');
  }

  function doSiteSearch(q) {
    q = (q || '').trim();
    if (!q) return;
    try {
      var u = new URL(location.href);
      u.searchParams.set('search', q);
      history.replaceState(null, '', u.pathname + u.search + u.hash);
    } catch (e) { /* 预览/沙箱可能禁止 replaceState，忽略即可 */ }
    runSearch(q);
  }

  // 供 clue.js 调用：判断输入是否【精确】命中站内搜索索引里的隐藏页关键词。
  // 命中则优先走站内搜索，避免被 clue.js 的模糊口令子串匹配劫持。
  window.siteSearchExact = function (q) {
    q = (q || '').trim().toLowerCase();
    if (!q) return false;
    return SEARCH_INDEX.some(function (it) {
      return (it.kw || []).some(function (kw) { return kw.toLowerCase() === q; });
    });
  };

  window.doSiteSearch = doSiteSearch;
  window.runSearch = runSearch;
  window.closeSearch = closeSearch;

  // 处理直接进入带 ?search= 的链接（深链/分享）
  function onLoad() {
    var p = new URLSearchParams(location.search).get('search');
    if (p) {
      var inp = document.querySelector('.search-box input');
      if (inp) inp.value = p;
      runSearch(p);
    }
    document.addEventListener('click', function (e) {
      if (e.target.closest('.search-modal') && !e.target.closest('.search-modal-box')) closeSearch();
    });
  }
  if (document.readyState !== 'loading') onLoad();
  else document.addEventListener('DOMContentLoaded', onLoad);
})();
