// 被发现了吧，不要偷懒自己解！

(function(){
  'use strict';

  var KEY = 'r';
  var STORE = 'wbs_reveal_v1';

  
  var isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  
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

  
  var TRUTH = {
    'he1': '何宏宇（2006年6月9日坠楼身亡）',
    'he2': '于2006年6月9日坠楼身亡，校方对外谎称“因个人原因退学”',
    'he3': '2006年6月9日坠楼身亡，相关信息被校方抹去',
    'he4': '何宏宇（2006年6月9日坠楼身亡）',
    'he5': '何宏宇（2006年6月9日坠楼身亡）',
    'yu1': '2006年5月24日被停职，后主动辞职离校',
    'yu2': '2006年5月24日被停职后主动辞职离校（明细未完全公示）',
    'yu3': '曾带过2006届学生，早已离校，却以“政教主任·审核发布”之名列于本站制作成员中'
  };

  
  var GROUPS = {
    'he': ['he1','he2','he3','he4','he5'],
    'yu': ['yu1','yu2','yu3']
  };
  var GROUP_NAMES = { 'he': '何宏宇', 'yu': '俞丽' };

  
  
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

  
  function isUnlocked(group){
    if(!GATED[group]) return true;
    return unlocked.indexOf(group) >= 0;
  }
  
  function unlockGroup(group){
    if(!GATED[group]) return;
    if(unlocked.indexOf(group) >= 0) return;
    unlocked.push(group);
    saveUnlocked(unlocked);
    applyStates();
    if(group === 'he')      toast('搜索「何宏宇」——几处前后矛盾的记录，似乎浮出水面了。');
    else if(group === 'yu') toast('搜索「俞丽」——这位老师的履历，也藏着对不上的地方。');
    else                    toast('线索已激活。');
    injectHint();
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

  
  function markCaught(el){
    var id = el.getAttribute('data-id');
    if(state.caught.indexOf(id) < 0){
      state.caught.push(id);
      el.classList.add('caught');
      return true;
    }
    return false;
  }
  
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
    if(!isUnlocked(group)) return;
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
      injectHint();
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

  
  
  
  function rangeWithinAnomaly(range, el){
    var elRange = document.createRange();
    try { elRange.selectNodeContents(el); } catch(e){ return false; }
    try {
      var startOk = range.compareBoundaryPoints(Range.START_TO_START, elRange) >= 0;
      var endOk   = range.compareBoundaryPoints(Range.END_TO_END, elRange) <= 0;
      if(startOk && endOk) return true;
      if(startOk && !endOk)   return onlyBoundaryPunct(range, elRange, 'end');
      if(!startOk && endOk)   return onlyBoundaryPunct(range, elRange, 'start');
      
      
      var _rl = range.toString().length, _el = elRange.toString().length;
      if(_rl > 0 && _el > 0 && _rl <= _el * 3){
        var _contains = range.compareBoundaryPoints(Range.START_TO_START, elRange) <= 0
                     && range.compareBoundaryPoints(Range.END_TO_END, elRange) >= 0;
        if(_contains) return true;
      }
      return false;
    } catch(e){ return false; }
  }
  
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

  
  
  
  function catchFromSelection(silentEmpty, rangeOverride){
    var range;
    if(rangeOverride){
      range = rangeOverride;
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

    
    var els = document.querySelectorAll('.anomaly');
    var newCaught = [];
    var alreadyCaught = [];
    var lockedTouched = [];
    var touched = {};
    for(var i=0;i<els.length;i++){
      var el = els[i];
      if(!rangeWithinAnomaly(range, el)) continue;
      var id = el.getAttribute('data-id');
      var group = el.getAttribute('data-group');
      touched[group] = true;
      if(!isUnlocked(group)){
        if(lockedTouched.indexOf(group) < 0) lockedTouched.push(group);
        continue;
      }
      if(markCaught(el)){ newCaught.push(id); }
      else { alreadyCaught.push(id); }
    }
    if(newCaught.length){
      saveState(state);
      var g = Object.keys(touched)[0];
      toast('你抓住了那一处违和（' + groupProgress(g) + '）。');
      for(var gg in touched){ checkGroup(gg); }
      injectHint();
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
    if(e.isComposing) return;
    if(!e.key || e.key.toLowerCase() !== KEY) return;
    
    
    
    var ae = document.activeElement;
    var inField = ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable);
    if(inField){
      var sel = window.getSelection();
      if(!sel || sel.isCollapsed || sel.rangeCount === 0 ||
         !selectionIntersectsAnomaly(sel.getRangeAt(0))){
        return;
      }
    }
    catchFromSelection(false);
  }

  
  
  
  
  
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
    if(py < 8) py = y + 16;
    selBtn.style.left = px + 'px';
    selBtn.style.top = py + 'px';
    selBtn.style.display = 'block';
  }
  function hideSelBtn(){
    if(selBtn) selBtn.style.display = 'none';
    savedRange = null;
  }

  
  function selectionIntersectsAnomaly(range){
    var els = document.querySelectorAll('.anomaly');
    for(var i = 0; i < els.length; i++){
      try { if(range.intersectsNode(els[i])) return true; } catch(e){}
    }
    return false;
  }

  function onSelectionChange(){
    if(!isTouch) return;
    if(!hasIncompleteUnlockedGroup()){ hideSelBtn(); return; }
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

  
  function isGroupRevealed(group){
    return state.revealed.indexOf(group) >= 0;
  }
  window.revealIsGroupRevealed = isGroupRevealed;

  
  function allGroupsRevealed(){
    for(var g in GROUPS){ if(state.revealed.indexOf(g) < 0) return false; }
    return true;
  }
  
  function anyGroupRevealed(){
    for(var g in GROUPS){ if(state.revealed.indexOf(g) >= 0) return true; }
    return false;
  }
  
  
  
  function hasIncompleteUnlockedGroup(){
    for(var g in GROUPS){
      if(isUnlocked(g) && state.revealed.indexOf(g) < 0) return true;
    }
    return false;
  }

  function injectHint(){
    
    
    
    
    
    
    
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

  
  function groupRemainHTML(){
    var parts = [];
    for(var g in GROUPS){
      if(!isUnlocked(g)) continue;
      if(state.revealed.indexOf(g) >= 0) continue;
      var total = GROUPS[g].length, got = 0;
      for(var k=0;k<total;k++){ if(state.caught.indexOf(GROUPS[g][k]) >= 0) got++; }
      var left = total - got;
      var name = GROUP_NAMES[g] || g;
      parts.push('<span class="reveal-grp">' + name + '：已抓 ' + got + ' / 共 ' + total + '（剩 ' + left + '）</span>');
    }
    return parts.join('');
  }

  
  document.addEventListener('reveal:refresh', applyStates);

  document.addEventListener('keydown', onKey);
  if(isTouch) attachTouchListeners();
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', function(){ applyStates(); injectHint(); });
  } else {
    applyStates(); injectHint();
  }
})();
