'use strict';
// Level select is deliberately two steps: world overview -> proper stage map.
// Locked stages can be inspected but not launched; score shown per selected class.
let menuView='worlds';
const WORLD_INFO={name:'Smaragdwald',subtitle:'Vom Sonnenpfad bis zum Thronsaal',
 description:'Vier eigenständige Abenteuer und der Schleimkönig.',
 badge:'WELT 1',theme:'forest'};
const WORLD_UPCOMING=[
 {name:'Frostgipfel',tag:'WELT 2',desc:'Eislandschaften · in Entwicklung'},
 {name:'Glutberge',tag:'WELT 3',desc:'Vulkanpfade · in Entwicklung'}
];
function worldBestTime(index,kind=save.class){
 const level='1-'+(index+1);
 const board=index===BOSS_LEVEL?save.bestTimesBossV11:save.bestTimesV14;
 return board?.[level]?.[kind]||0;
}
function worldTotalStars(){return save.stars.reduce((total,n)=>total+n,0);}
function renderWorldMenu(){
 if(selected>=save.unlocked)selected=save.unlocked-1;
 const isLevelMap=menuView==='levels';
 $('#heading').textContent=isLevelMap?'WELT 1 · SMARAGDWALD':'REALM RUNNERS';
 $('#intro').textContent=isLevelMap?
  'Einmal auswählen · doppelt tippen zum Spielen.':'Wähle deine Welt.';
 $('#classes').classList.toggle('hide',isLevelMap);
 $('#rpgPanels').classList.toggle('hide',isLevelMap);
 $('#worlds').classList.toggle('hide',isLevelMap);
 $('#levels').classList.toggle('hide',!isLevelMap);
 $('#worldMapInfo').classList.toggle('hide',!isLevelMap);
 $('#progress').textContent='Rang '+save.level+' · '+save.xp+'/'+(save.level*100)+' XP · '+worldTotalStars()+'/'+(stages.length*3)+' Sterne · '+save.gold+' Gold';
 $('#classes').innerHTML=Object.entries(classes).map(([id,c])=>
  '<button data-class="'+id+'" class="'+(save.class===id?'active':'')+'">'+({warrior:'[K]',hunter:'[J]',mage:'[M]'}[id])+' '+c.label+'</button>').join('');
 $('#classes').querySelectorAll('button').forEach(b=>b.onclick=()=>{save.class=b.dataset.class;persist();menu();});
 const worldCard='<button data-world="0" class="world-card world-open">'+
  '<span class="world-number">WELT 1 · VERFÜGBAR</span><strong>🌲 '+WORLD_INFO.name+'</strong>'+
  '<span>'+WORLD_INFO.subtitle+'</span><span class="world-star-meter">'+PIXEL_STAR+' '+worldTotalStars()+'/'+(stages.length*3)+
  ' · '+save.unlocked+'/'+stages.length+' Level freigeschaltet</span>'+
  '<span class="world-enter">Öffnen → · doppelt tippen: spielen</span></button>';
 const upcoming=WORLD_UPCOMING.map(w=>'<div class="world-card world-locked" aria-disabled="true">'+
  '<span class="world-number">'+w.tag+' · GESPERRT</span><strong>🔒 '+w.name+'</strong><span>'+w.desc+'</span></div>').join('');
 $('#worlds').innerHTML=worldCard+upcoming;
 $('#worlds').querySelectorAll('[data-world="0"]').forEach(button=>bindMenuActivation(button,()=>{menuView='levels';menu();},()=>startMenuLevel(selected),true));
 const cards=stages.map((stageInfo,i)=>{
  const locked=i>=save.unlocked,active=i===selected;
  const best=worldBestTime(i);
  const id='1-'+(i+1);
  const desc=stageInfo.hint||'Bossarena des Schleimkönigs · drei Angriffsmuster und Phase II.';
  const stars=save.stars[i]||0;
  const medals=best?medal(best,i):'—';
  return '<button data-level="'+i+'" class="level-card'+(active?' active':'')+(locked?' locked':'')+'"'+(locked?' disabled':'')+
   ' aria-label="Level '+id+', '+stageInfo.name+', '+(locked?'gesperrt':'freigeschaltet')+'">'+
   '<span class="level-card-head"><span>'+id+'</span><span>'+(locked?'🔒':stageInfo.difficulty||'★★★')+'</span></span>'+
   '<strong>'+(stageInfo.short||'Schleimkönig')+'</strong>'+
   '<span class="level-card-sub">'+desc+'</span>'+
   '<span class="level-card-meta"><span class="level-star-meter">'+PIXEL_STAR+' '+stars+'/3</span><span>⏱ '+(best?formatRunTime(best):'--:--')+'</span></span>'+
   '<span class="level-card-medal">'+(locked?'NOCH GESPERRT':best?'BESTZEIT · '+medals:'NOCH KEINE ZEIT')+'</span>'+
  '</button>';
 }).join('');
 $('#levels').innerHTML=cards;
 $('#levels').querySelectorAll('button:not(:disabled)').forEach(b=>bindMenuActivation(b,()=>selectMenuLevel(Number(b.dataset.level)),()=>startMenuLevel(Number(b.dataset.level))));
 updateLevelSelection();
 $('#play').classList.toggle('hide',!isLevelMap);
 $('#return').classList.toggle('hide',!isLevelMap);
 $('#return').textContent='← Alle Welten';
 $('#return').onclick=()=>{menuView='worlds';menu();};
 if(!isLevelMap)renderRpgMenu();
}

// Shared desktop double-click / iPhone double-tap behavior. World single-click
// waits briefly because it changes views; level single-click selects immediately
// and keeps the same card node, keyboard focus and scroll position alive.
let menuTapTimer=null,menuTapNode=null,menuTapAt=0;
function cancelMenuTap(){if(menuTapTimer!==null)clearTimeout(menuTapTimer);menuTapTimer=null;menuTapNode=null;menuTapAt=0;}
function bindMenuActivation(node,onSelect,onStart,deferSingle=false){
 node.onclick=event=>{
  if(scene!=='menu'||node.disabled)return;
  // Keyboard/screen-reader activation remains a normal single action.
  if(event.detail===0){cancelMenuTap();onSelect();return;}
  const now=performance.now();
  if(menuTapNode===node&&now-menuTapAt<=340){cancelMenuTap();onStart();return;}
  cancelMenuTap();menuTapNode=node;menuTapAt=now;
  if(deferSingle)menuTapTimer=setTimeout(()=>{cancelMenuTap();if(scene==='menu')onSelect();},340);
  else onSelect();
 };
 node.ondblclick=event=>{event.preventDefault();if(scene==='menu'&&!node.disabled){cancelMenuTap();onStart();}};
}
function startMenuLevel(index=selected){
 if(scene!=='menu'||!Number.isInteger(index)||index<0||index>=save.unlocked)return false;
 cancelMenuTap();selected=index;start(index);return true;
}
function selectMenuLevel(index){
 if(scene!=='menu'||!Number.isInteger(index)||index<0||index>=save.unlocked)return false;
 selected=index;updateLevelSelection();document.querySelector('[data-level="'+index+'"]')?.focus({preventScroll:true});return true;
}
function updateLevelSelection(){
 $('#levels').querySelectorAll('[data-level]').forEach(card=>{
  const active=Number(card.dataset.level)===selected;card.classList.toggle('active',active);
  card.setAttribute('aria-pressed',String(active));
 });
 const level=stages[selected],best=worldBestTime(selected);
 $('#worldMapInfo').innerHTML='<div class="world-selected"><span>AKTUELL AUSGEWÄHLT</span><strong>'+level.name+
  '</strong>'+
  '<span>'+classes[save.class].label+' · Bestzeit: '+(best?formatRunTime(best)+' · '+medal(best,selected):'noch keine')+'</span></div>';
 $('#play').textContent='▶ '+stages[selected].short+' spielen';
 $('#play').onclick=()=>start(selected);

}
addEventListener('keydown',event=>{
 if(scene!=='menu'||menuView!=='levels')return;
 if(event.code==='Escape'){event.preventDefault();cancelMenuTap();menuView='worlds';menu();return;}
 const button=event.target?.closest?.('button,input,select,textarea,summary');
 if(event.code==='Enter'&&(!button||button.matches('[data-level]'))){event.preventDefault();startMenuLevel(selected);}
});
