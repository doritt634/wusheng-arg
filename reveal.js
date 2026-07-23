/* reveal 玩法：选中表面违和文字 → 按 R 键 → 变红 → 整组选齐后揭示真相
 * 指定按键：R
 * 状态跨页累计于 localStorage（wbs_reveal_v1）：caught[] / revealed[]
 */
(function(){
  'use strict';

  var KEY = 'r';
  var STORE = 'wbs_reveal_v1';

  // 触屏设备（手机/平板）无法“选词+按R”，改用“长按”触发抓矛盾点
  var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  // —— 视觉增强样式（改动后）：变红瞬间页面轻晃 + 文字呼吸 + 全部揭示降暗红遮罩 ——
  (function injectRevealFx(){
    var s = document.createElement('style');
    s.textContent = [
      '@keyframes revealShake{0%,100%{transform:translate(0,0);}25%{transform:translate(-2px,1px);}50%{transform:translate(2px,-1px);}75%{transform:translate(-1px,1px);}}',
      '.reveal-shake{animation:revealShake .18s;}',
      '@keyframes revealBreathe{0%,100%{opacity:.82;}50%{opacity:1;}}',
      '.anomaly.revealed-breath{animation:revealBreathe 3.2s ease-in-out infinite;}',
      '#revealRedVeil{position:fixed;inset:0;z-index:1400;pointer-events:none;background:rgba(110,0,0,0);transition:background 3s ease;}',
      '.reveal-hold{position:fixed;left:50%;bottom:84px;transform:translateX(-50%);z-index:1500;background:rgba(40,40,40,.82);color:#fff;font-size:13px;padding:7px 15px;border-radius:16px;opacity:0;pointer-events:none;transition:opacity .2s;white-space:nowrap;}',
      '.reveal-hold.show{opacity:1;}'
    ].join('');
    document.head.appendChild(s);
  })();

  // 真相文字：键为各 anomaly 的 data-id
  var TRUTH = {
    'he1': '何宏宇（2006年6月9日坠楼身亡）',
    'he2': '于2006年6月9日坠楼身亡，校方对外谎称“因个人原因退学”',
    'he3': '2006年6月9日坠楼身亡，相关信息被校方抹去',
    'he4': '何宏宇（2006年6月9日坠楼身亡）',
    'he5': '何宏宇（2006年6月9日坠楼身亡）',
    'yu1': '2006年5月24日被停职，后主动辞职离校',
    'yu2': '2006年5月24日被停职后主动辞职离校（明细未完全公示）',
    'yu3': '2006届学生，早已离校，却以“政教主任·审核发布”之名列于本站制作成员中'
  };

  // 每个 group 的全部成员（跨页累计，必须全部抓出才解锁真相）
  var GROUPS = {
    'he': ['he1','he2','he3','he4','he5'],
    'yu': ['yu1','yu2','yu3']
  };
  var GROUP_NAMES = { 'he': '何宏宇', 'yu': '俞丽' };

  // 受限 group：必须先搜索对应人名（在搜索框搜该名字）才能解锁“抓矛盾点”的能力。
  // 解锁状态持久化于 localStorage，跨页生效，无需重复搜索。
  var GATED = { 'he': true, 'yu': true };
  var UNLOCK_STORE = 'wbs_reveal_unlock_v1';

  function loadUnlocked(){
    try{
      var a = JSON.parse(localStorage.getItem(UNLOCK_STORE));
      if(Array.isArray(a)) return a;
    }catch(e){}
    return [];
  }
  function saveUnlocked(arr){
    try{ localStorage.setItem(UNLOCK_STORE, JSON.stringify(arr)); }catch(e){}
  }
  var unlocked = loadUnlocked();

  // 该 group 是否可抓：非受限组始终可抓；受限组需已解锁
  function isUnlocked(group){
    if(!GATED[group]) return true;
    return unlocked.indexOf(group) >= 0;
  }
  // 由 search.js 在搜索对应人名后调用，激活该 group 的矛盾点玩法
  function unlockGroup(group){
    if(!GATED[group]) return;
    if(unlocked.indexOf(group) >= 0) return;   // 已解锁则不再提示
    unlocked.push(group);
    saveUnlocked(unlocked);
    applyStates();
    if(group === 'he')      toast('搜索「何宏宇」——几处前后矛盾的记录，似乎浮出水面了。');
    else if(group === 'yu') toast('搜索「俞丽」——这位老师的履历，也藏着对不上的地方。');
    else                    toast('线索已激活。');
    injectHint();   // 搜索解锁后，立即弹出“找矛盾点”的玩法提示
  }
  window.revealUnlockGroup = unlockGroup;

  function loadState(){
    try{
      var s = JSON.parse(localStorage.getItem(STORE));
      if(s && Array.isArray(s.caught) && Array.isArray(s.revealed)) return s;
    }catch(e){}
    return { caught:[], revealed:[] };
  }
  function saveState(s){
    try{ localStorage.setItem(STORE, JSON.stringify(s)); }catch(e){}
  }
  var state = loadState();

  // 把一个 anomaly 标记为“已抓”，返回是否本次新抓到
  function markCaught(el){
    var id = el.getAttribute('data-id');
    if(state.caught.indexOf(id) < 0){
      state.caught.push(id);
      el.classList.add('caught');
      return true;
    }
    return false;
  }
  // 某 group 已抓/总数 文本
  function groupProgress(group){
    var gtotal = GROUPS[group] ? GROUPS[group].length : '?', gcnt = 0;
    if(GROUPS[group]){ for(var k=0;k<GROUPS[group].length;k++){ if(state.caught.indexOf(GROUPS[group][k])>=0) gcnt++; } }
    return gcnt + '/' + gtotal;
  }

  function revealEl(el, doShake){
    var id = el.getAttribute('data-id');
    var t = TRUTH[id];
    if(t != null && el.innerHTML !== t){ el.innerHTML = t; }
    el.classList.add('revealed');
    el.classList.add('revealed-breath');
    el.classList.remove('caught');
    if(doShake) shakePage();
  }
  function shakePage(){
    document.body.classList.add('reveal-shake');
    setTimeout(function(){ document.body.classList.remove('reveal-shake'); }, 220);
  }
  function showRedVeil(){
    if(document.getElementById('revealRedVeil')) return;
    var v = document.createElement('div');
    v.id = 'revealRedVeil';
    document.body.appendChild(v);
    requestAnimationFrame(function(){ v.style.background = 'rgba(110,0,0,0.07)'; });
  }

  function applyStates(){
    var els = document.querySelectorAll('.anomaly');
    for(var i=0;i<els.length;i++){
      var el = els[i];
      var id = el.getAttribute('data-id');
      var group = el.getAttribute('data-group');
      if(!isUnlocked(group)){
        // 受限且尚未解锁：确保不显示已抓/已揭示样式（看起来就是普通文字）
        el.classList.remove('caught');
        el.classList.remove('revealed');
        continue;
      }
      if(state.caught.indexOf(id) >= 0) el.classList.add('caught');
      if(state.revealed.indexOf(group) >= 0) revealEl(el, false);
    }
    if(allGroupsRevealed() && els.length) showRedVeil();
  }

  function checkGroup(group){
    var ids = GROUPS[group];
    if(!ids || !ids.length) return;
    if(!isUnlocked(group)) return;   // 受限且未解锁，不允许揭示
    var all = true;
    for(var i=0;i<ids.length;i++){
      if(state.caught.indexOf(ids[i]) < 0){ all = false; break; }
    }
    if(all && state.revealed.indexOf(group) < 0){
      var els = document.querySelectorAll('.anomaly[data-group="'+group+'"]');
      for(var j=0;j<els.length;j++){ revealEl(els[j], true); }
      state.revealed.push(group);
      saveState(state);
      toast('真相，已浮现。');
      injectHint();   // 该 group 已完整揭示 → 若已找完至少一人，则隐藏玩法提示
      if(allGroupsRevealed()) showRedVeil();
    }
  }

  var toastTimer = null;
  function toast(msg){
    var t = document.getElementById('reveal-toast');
    if(!t){
      t = document.createElement('div');
      t.id = 'reveal-toast';
      t.className = 'reveal-toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    if(toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ t.classList.remove('show'); }, 1900);
  }

  // 选区是否“命中”某异常短句：必须落在该短句的 DOM 范围内
  // （起点、终点都在该句之内），而非仅与它相交——这样框选整页不会被误判命中。
  // 同时容错：若仅多选中了句首/句末的标点或空白（如句末的“。”），仍算命中。
  function rangeWithinAnomaly(range, el){
    var elRange = document.createRange();
    try { elRange.selectNodeContents(el); } catch(e){ return false; }
    try {
      var startOk = range.compareBoundaryPoints(Range.START_TO_START, elRange) >= 0;
      var endOk   = range.compareBoundaryPoints(Range.END_TO_END, elRange) <= 0;
      if(startOk && endOk) return true;
      if(startOk && !endOk)   return onlyBoundaryPunct(range, elRange, 'end');
      if(!startOk && endOk)   return onlyBoundaryPunct(range, elRange, 'start');
      return false;
    } catch(e){ return false; }
  }
  // 超出范围的部分是否仅为标点/空白（如顺带选中了“。”、空格）
  function onlyBoundaryPunct(range, elRange, side){
    try {
      var r = document.createRange();
      if(side === 'end'){
        r.setStart(elRange.endContainer, elRange.endOffset);
        r.setEnd(range.endContainer, range.endOffset);
      } else {
        r.setStart(range.startContainer, range.startOffset);
        r.setEnd(elRange.startContainer, elRange.startOffset);
      }
      return /^[\s　。，、；：！？\.\,;:!\?）\)】»>「「]*$/.test(r.toString());
    } catch(e){ return false; }
  }

  // 读取“当前选中的文字”，命中落在异常短句范围内的 anomaly 并捕获。
  // desktop：按 R 键时调用；mobile：选区旁「标记矛盾点」按钮点击(touchstart)时调用，直接传 savedRange。
  // silentEmpty=true 时，若没有选中任何文字则不弹提示（移动端松手即取消，避免打扰）。
  function catchFromSelection(silentEmpty, rangeOverride){
    var range;
    if(rangeOverride){
      range = rangeOverride;               // 触屏按钮场景：直接用保存的选区，不受点击时选区塌缩影响
    } else {
      var sel = window.getSelection();
      if(!sel || sel.isCollapsed || sel.rangeCount === 0){
        if(!silentEmpty) toast('这里似乎并无异样。');
        return;
      }
      range = sel.getRangeAt(0);
    }
    if(!range || !range.toString().trim()){
      if(!silentEmpty) toast('这里似乎并无异样。');
      return;
    }

    // 命中所有“落在异常短句范围内”的 anomaly（整句或其中片段均可）
    var els = document.querySelectorAll('.anomaly');
    var newCaught = [];
    var alreadyCaught = [];
    var lockedTouched = [];   // 触碰到了、但因未搜索对应名字而被锁住的 group
    var touched = {};
    for(var i=0;i<els.length;i++){
      var el = els[i];
      if(!rangeWithinAnomaly(range, el)) continue;
      var id = el.getAttribute('data-id');
      var group = el.getAttribute('data-group');
      touched[group] = true;
      if(!isUnlocked(group)){
        if(lockedTouched.indexOf(group) < 0) lockedTouched.push(group);
        continue;   // 受限且未解锁：暂不捕获，引导玩家去搜索该名字
      }
      if(markCaught(el)){ newCaught.push(id); }
      else { alreadyCaught.push(id); }
    }
    if(newCaught.length){
      saveState(state);
      var g = Object.keys(touched)[0];
      toast('你抓住了那一处违和（' + groupProgress(g) + '）。');
      for(var gg in touched){ checkGroup(gg); }
      injectHint();   // 抓中后实时刷新“还剩多少个”计数
    } else if(alreadyCaught.length){
      toast('这一处，已经标记过了。');
    } else if(lockedTouched.length){
      toast('这一处线索还没浮现——试试在搜索框里查查这个名字。');
    } else if(!silentEmpty){
      toast('这里似乎并无异样。');
    }
  }

  function onKey(e){
    if(e.ctrlKey || e.metaKey || e.altKey) return;
    var ae = document.activeElement;
    if(ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA')) return;
    if(!e.key || e.key.toLowerCase() !== KEY) return;
    catchFromSelection(false);
  }

  // ========== 触屏：选中文字后浮现「标记矛盾点」按钮，点按即捕获 ==========
  // 思路：完全不劫持系统选词、不要求“长按保持 2 秒”。玩家像平时一样
  // 选中文字（安卓即长按选词、拖拽手柄调整选区），只要选区落在某处矛盾点范围内，
  // 页面即在选区旁浮现一个浮动按钮，点一下即读取选中文字并捕获。
  // 这样彻底规避了安卓“长按已选文字即拖动选区 / 手指微移取消计时”与原生选词的冲突。
  var selBtn = null, savedRange = null;

  function ensureSelBtn(){
    if(selBtn) return;
    selBtn = document.createElement('button');
    selBtn.id = 'reveal-sel-btn';
    selBtn.type = 'button';
    selBtn.textContent = '标记矛盾点';
    selBtn.style.cssText = 'position:fixed;z-index:100000;background:#c93a3a;color:#fff;' +
      'border:2px outset #e6b0b0;border-radius:18px;padding:8px 16px;font-size:13px;' +
      'font-family:\'黑体\',SimHei,sans-serif;box-shadow:0 3px 12px rgba(0,0,0,.35);' +
      'display:none;touch-action:manipulation;user-select:none;-webkit-user-select:none;';
    // 关键：安卓上点按钮时浏览器会先塌缩选区(selectionchange→本脚本隐藏按钮)，
    // 若用 click 则按钮在 click 触发前已被 display:none，点击永不生效。
    // 故用 touchstart(passive:false + preventDefault) 在选区塌缩前捕获，并直接传 savedRange，
    // 完全不依赖点击瞬间的实时选区。mousedown 作桌面兜底（按钮本仅触屏显示）。
    function onBtnActivate(e){
      if(e){ e.preventDefault(); e.stopPropagation(); }
      if(savedRange) catchFromSelection(true, savedRange);
      hideSelBtn();
      try { window.getSelection().removeAllRanges(); } catch(e3){}
    }
    selBtn.addEventListener('touchstart', onBtnActivate, { passive:false });
    selBtn.addEventListener('mousedown', onBtnActivate);
    document.body.appendChild(selBtn);
  }
  function showSelBtnAt(x, y){
    ensureSelBtn();
    var bw = 116, bh = 38;
    var px = Math.max(8, Math.min(window.innerWidth - bw - 8, x - bw / 2));
    var py = y - bh - 12;
    if(py < 8) py = y + 16;               // 选区贴顶则改放到下方
    selBtn.style.left = px + 'px';
    selBtn.style.top = py + 'px';
    selBtn.style.display = 'block';
  }
  function hideSelBtn(){
    if(selBtn) selBtn.style.display = 'none';
    savedRange = null;
  }

  // 选区是否与任一矛盾点短句相交（部分覆盖也算），用于决定是否弹按钮
  function selectionIntersectsAnomaly(range){
    var els = document.querySelectorAll('.anomaly');
    for(var i = 0; i < els.length; i++){
      try { if(range.intersectsNode(els[i])) return true; } catch(e){}
    }
    return false;
  }

  function onSelectionChange(){
    if(!isTouch) return;
    if(!hasIncompleteUnlockedGroup()){ hideSelBtn(); return; }  // 任务未激活/已完成不弹
    var sel = window.getSelection();
    if(!sel || sel.isCollapsed || sel.rangeCount === 0){ hideSelBtn(); return; }
    var range = sel.getRangeAt(0);
    if(!range.toString().trim()){ hideSelBtn(); return; }
    if(!selectionIntersectsAnomaly(range)){ hideSelBtn(); return; }
    savedRange = range.cloneRange();
    var rect = range.getBoundingClientRect();
    showSelBtnAt(rect.right, rect.top);
  }

  function attachTouchListeners(){
    document.addEventListener('selectionchange', onSelectionChange, { passive:true });
    // 滚动时按当前选区重定位按钮（选区仍在，仅视口坐标变化）
    window.addEventListener('scroll', function(){
      if(selBtn && selBtn.style.display === 'block' && savedRange){
        var rect = savedRange.getBoundingClientRect();
        showSelBtnAt(rect.right, rect.top);
      }
    }, { passive:true });
  }

  function resetReveal(){
    try { localStorage.removeItem(STORE); } catch(e){}
    toast('解谜进度已重置，正在刷新…');
    setTimeout(function(){ location.reload(); }, 700);
  }

  // 供其他页面查询：某 group 的矛盾点是否已全部揭示（真相已浮现）
  function isGroupRevealed(group){
    return state.revealed.indexOf(group) >= 0;
  }
  window.revealIsGroupRevealed = isGroupRevealed;

  // 所有 group 是否均已揭示（矛盾点全部解锁）
  function allGroupsRevealed(){
    for(var g in GROUPS){ if(state.revealed.indexOf(g) < 0) return false; }
    return true;
  }
  // 是否「已有至少一个」group 被完整揭示（找完了一个人的矛盾点）
  function anyGroupRevealed(){
    for(var g in GROUPS){ if(state.revealed.indexOf(g) >= 0) return true; }
    return false;
  }
  // 是否存在「已解锁（搜过名字/非受限）但其矛盾点尚未全部揭示」的 group。
  // 这是提示卡片的显示依据：某组还在找 → 显示；某组找完 → 该组不再显示，
  // 因此各组独立门控（何宏宇找完隐藏、再搜俞丽激活后重新显示）。
  function hasIncompleteUnlockedGroup(){
    for(var g in GROUPS){
      if(isUnlocked(g) && state.revealed.indexOf(g) < 0) return true;
    }
    return false;
  }

  function injectHint(){
    // 受限组的提示：仅在玩家已在搜索框搜过对应人名（解锁了至少一个 group）后才出现，
    // 未搜索前不提前弹出，避免剧透“有矛盾点可找”。
    // 显示规则（各组独立门控）：某 group 已解锁、但其矛盾点尚未全部揭示 → 卡片显示；
    // 该 group 全部揭示后 → 针对该组的卡片隐藏。
    // 因此「何宏宇矛盾点全部解锁后卡片消失」，但「再搜索俞丽激活其矛盾点后卡片重新显示」，
    // 直到俞丽的矛盾点也全部揭示才再次隐藏；两人都找完则彻底隐藏。
    // 卡片内逐人显示“已抓 / 共 N（剩 M）”，并在每次抓中后实时刷新。
    var show = hasIncompleteUnlockedGroup();
    var tip = isTouch
      ? '提示：先在搜索框查查某个名字，激活 ta 的矛盾点；再回到页面，<b>选中</b>那段看似不合常理的整句话（安卓即长按选词、拖手柄调整选区），选区旁会浮现「标记矛盾点」按钮，<b>点一下</b>即可窥见被掩去的真相。'
      : '提示：先在搜索框查查某个名字，激活 ta 的矛盾点；再回到页面，选中看似不合常理的<b>整句话</b>，按下 <b>R</b> 键，或可窥见被掩去的真相。';
    var body =
      '<div class="reveal-hint-tip">' + tip + '</div>' +
      '<div class="reveal-hint-grps">' + groupRemainHTML() + '</div>';
    var existing = document.getElementById('reveal-hint');
    if(existing){
      existing.innerHTML = body +
        '<a href="javascript:void(0)" class="reset" title="清空已抓出的进度，从头再玩">重置进度</a>' +
        '<span class="close" title="关闭提示">×</span>';
      existing.style.display = show ? '' : 'none';
      existing.querySelector('.close').addEventListener('click', function(){ existing.style.display = 'none'; });
      existing.querySelector('.reset').addEventListener('click', resetReveal);
      return;
    }
    if(!show) return;
    var d = document.createElement('div');
    d.id = 'reveal-hint';
    d.className = 'reveal-hint';
    d.innerHTML = body +
      '<a href="javascript:void(0)" class="reset" title="清空已抓出的进度，从头再玩">重置进度</a>' +
      '<span class="close" title="关闭提示">×</span>';
    d.querySelector('.close').addEventListener('click', function(){ d.style.display = 'none'; });
    d.querySelector('.reset').addEventListener('click', resetReveal);
    document.body.appendChild(d);
  }

  // 逐人（group）渲染“已抓 / 共 N（剩 M）”；未解锁或已全找完的行不显示
  function groupRemainHTML(){
    var parts = [];
    for(var g in GROUPS){
      if(!isUnlocked(g)) continue;                   // 没搜过名字 → 不显示
      if(state.revealed.indexOf(g) >= 0) continue;   // 已全找完 → 隐藏该行
      var total = GROUPS[g].length, got = 0;
      for(var k=0;k<total;k++){ if(state.caught.indexOf(GROUPS[g][k]) >= 0) got++; }
      var left = total - got;
      var name = GROUP_NAMES[g] || g;
      parts.push('<span class="reveal-grp">' + name + '：已抓 ' + got + ' / 共 ' + total + '（剩 ' + left + '）</span>');
    }
    return parts.join('');
  }

  // 聊天室等内容为动态生成，加载后派发此事件以同步已抓出/已揭示状态
  document.addEventListener('reveal:refresh', applyStates);

  document.addEventListener('keydown', onKey);
  if(isTouch) attachTouchListeners();
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ applyStates(); injectHint(); });
  } else {
    applyStates(); injectHint();
  }
})();
