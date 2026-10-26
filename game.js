
'use strict';
const $=s=>document.querySelector(s),canvas=$('#view'),layer=$('#layer'),hud=$('#hud'),controls=$('#controls');let ctx=canvas.getContext('2d');const W=960,H=540,G=465,WIDTH=2800;let scene='menu',stage=0,selected=0,t=0,last=0,cam=0,hero=null,things=[],bad=[],spikes=[],particles=[],dashCooldown=0,jumpWas=false,invincible=0;
// Five distinct pixel-art levels; the last culminates in a gated boss arena.
const stages=[
 {name:'1-1 · Waldanfang',base:5,gaps:[[500,610],[1140,1270],[1960,2110]],ledges:[[250,398,160],[745,365,165],[1410,375,180],[1770,410,125],[2280,352,175]],enemies:[420,910,1590,2390],spikes:[980,1680,2520],stars:[[332,330],[1480,315],[2360,290]]},
 {name:'1-2 · Baumkronen',base:8,gaps:[[540,700],[1260,1430],[2030,2210]],ledges:[[230,395,150],[440,335,140],[710,365,160],[975,300,145],[1480,395,165],[1730,330,145],[2250,350,160],[2470,295,135]],enemies:[355,895,1580,2370],spikes:[1160,1660,2440],stars:[[495,275],[1040,245],[2525,240]]},
 {name:'1-3 · Moosruinen',base:12,gaps:[[600,760],[1320,1505],[2080,2265]],ledges:[[265,385,160],[475,330,165],[795,355,170],[1075,305,160],[1520,370,165],[1790,315,165],[2300,345,150],[2510,295,135]],enemies:[405,965,1670,2430],spikes:[1010,1730,2440],stars:[[530,272],[1150,245],[2565,240]]},
 {name:'1-4 · Leuchtpilz-Sumpf',base:15,gaps:[[465,600],[1050,1210],[1680,1845]],ledges:[[240,402,165],[635,365,180],[895,318,160],[1300,378,165],[1550,325,150],[1910,382,150],[2250,330,185]],enemies:[365,810,1440,2015,2410],spikes:[940,1510,2140,2570],stars:[[308,348],[962,255],[2325,265]]},
 {name:'1-5 · Thron des Schleimkönigs',base:18,gaps:[[510,625],[1110,1240],[1840,1980]],ledges:[[270,397,170],[740,355,190],[1340,380,155],[2030,398,165],[2350,342,160]],enemies:[405,870,1480,2040],spikes:[990,1700,2160],stars:[[345,335],[1410,310],[2420,280]],boss:true}
];
// v0.5 pixel phase: roughly 12.5% less maximum height without changing tap jump.
const JUMP={coyote:7,buffer:7,holdFrames:14,holdGravity:.50,gravity:.70,cut:.58};
const classes={warrior:{label:'Krieger',color:'#66aaf0',speed:4.75,jump:13.6},hunter:{label:'Jäger',color:'#90df8b',speed:5.7,jump:13.9},mage:{label:'Magier',color:'#bf9cf1',speed:4.9,jump:14.4}};
let save;try{save=JSON.parse(localStorage.getItem('realm-runners-save-v2')||'null')}catch{}save=save&&typeof save==='object'?save:{class:'warrior',unlocked:1,stars:[0,0,0],xp:0,level:1};save.unlocked=Math.max(1,Math.min(stages.length,Number(save.unlocked)||1));save.stars=Array.isArray(save.stars)?save.stars.slice(0,stages.length):[];while(save.stars.length<stages.length)save.stars.push(0);if(!classes[save.class])save.class='warrior';save.xp=Number.isFinite(Number(save.xp))?Math.max(0,Math.floor(Number(save.xp))):0;save.level=Number.isFinite(Number(save.level))?Math.max(1,Math.floor(Number(save.level))):1;save.stars=save.stars.map(n=>Math.max(0,Math.min(3,Math.floor(Number(n)||0))));function persist(){try{localStorage.setItem('realm-runners-save-v2',JSON.stringify(save))}catch{}}
// Keyboard and pointer sources are independent: releasing one finger cannot cancel another.
const input={left:false,right:false,jump:false,dash:false,attack:false},heldKeys=new Set(),heldPointers=new Map(),heldTouches=new Map();
const keymap={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump',ShiftLeft:'dash',ShiftRight:'dash',KeyJ:'dash',KeyK:'attack',KeyF:'attack'};
function syncInput(){for(const k of Object.keys(input))input[k]=[...heldKeys].some(code=>keymap[code]===k)||[...heldPointers.values(),...heldTouches.values()].includes(k);document.querySelectorAll('[data-control]').forEach(b=>b.classList.toggle('pressed',input[b.dataset.control]));}
function clearInput(){heldKeys.clear();heldPointers.clear();heldTouches.clear();clearSelection();syncInput();jumpWas=false;}
addEventListener('keydown',e=>{if(e.code==='Escape'){e.preventDefault();if(scene==='game')pause();else if(scene==='pause')resume();}if(e.code==='KeyR'&&(scene==='game'||scene==='end')){e.preventDefault();start(stage);return;}if(keymap[e.code]){e.preventDefault();if(scene==='game'){heldKeys.add(e.code);syncInput();}}});
addEventListener('keyup',e=>{heldKeys.delete(e.code);syncInput();});
addEventListener('blur',()=>{clearInput();if(scene==='game')pause();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(scene==='game')pause();}});
document.querySelectorAll('[data-control]').forEach(b=>{b.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;e.preventDefault();if(scene!=='game')return;b.setPointerCapture(e.pointerId);heldPointers.set(e.pointerId,b.dataset.control);syncInput();});for(const evt of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(evt,e=>{heldPointers.delete(e.pointerId);syncInput();});});

// iOS can begin native selection despite pointer preventDefault / touch-action.
// Own Touch Events explicitly; keep each finger independent and never also register
// touch Pointer Events (Safari may cancel them when touchstart is prevented).
function clearSelection(){const selection=document.getSelection?.();if(selection&&selection.rangeCount)selection.removeAllRanges();}
function gameTouchTarget(target){return scene==='game'&&!target.closest?.('#pause');}
document.addEventListener('touchstart',e=>{
  if(!gameTouchTarget(e.target))return;
  if(e.cancelable)e.preventDefault();
  clearSelection();
  for(const touch of e.changedTouches){
    const button=touch.target.closest?.('[data-control]');
    if(button)heldTouches.set(touch.identifier,button.dataset.control);
  }
  syncInput();
},{passive:false,capture:true});
document.addEventListener('touchmove',e=>{
  if(gameTouchTarget(e.target)||heldTouches.size){
    if(e.cancelable)e.preventDefault();
    clearSelection();
  }
},{passive:false,capture:true});
for(const eventName of ['touchend','touchcancel']){
  document.addEventListener(eventName,e=>{
    let handled=false;
    for(const touch of e.changedTouches)handled=heldTouches.delete(touch.identifier)||handled;
    if(handled&&e.cancelable)e.preventDefault();
    syncInput();
  },{passive:false,capture:true});
}
document.addEventListener('selectionchange',()=>{if(scene==='game')clearSelection();});

function pause(){if(scene!=='game')return;scene='pause';clearInput();updateBossHud();layer.classList.remove('hide');controls.classList.add('hide');$('#menu').classList.add('hide');$('#play').classList.add('hide');$('#resume').classList.remove('hide');$('#return').classList.remove('hide');$('#return').onclick=menu;$('#heading').textContent='PAUSE';$('#intro').textContent='Der Wald wartet auf dich.';}
function resume(){if(scene!=='pause')return;clearInput();scene='game';updateBossHud();layer.classList.add('hide');controls.classList.remove('hide');last=performance.now();}
$('#pause').onclick=pause;$('#resume').onclick=resume;
function size(){let d=Math.min(devicePixelRatio||1,2),s=Math.min(innerWidth/W,innerHeight/H);canvas.width=innerWidth*d;canvas.height=innerHeight*d;ctx.setTransform(d*s,0,0,d*s,(innerWidth-W*s)*d/2,(innerHeight-H*s)*d/2)}addEventListener('resize',size);size();
function menu(){clearInput();$('#play').classList.remove('hide');$('#resume').classList.add('hide');scene='menu';updateBossHud();layer.classList.remove('hide');hud.classList.add('hide');controls.classList.add('hide');$('#menu').classList.remove('hide');$('#return').classList.add('hide');$('#heading').textContent='REALM RUNNERS';$('#intro').textContent='Welt 1: Smaragdwald · 5 Level, inklusive Schleimkönig! Kurz tippen = kleiner Sprung, lang halten = hoher Sprung.';$('#play').textContent='Level starten';$('#classes').innerHTML=Object.entries(classes).map(([id,c])=>'<button data-class="'+id+'" class="'+(save.class===id?'active':'')+'">'+({warrior:'[K]',hunter:'[J]',mage:'[M]'}[id])+' '+c.label+'</button>').join('');$('#classes').querySelectorAll('button').forEach(b=>b.onclick=()=>{save.class=b.dataset.class;persist();menu()});$('#levels').innerHTML=stages.map((s,i)=>'<button data-level="'+i+'" '+(i>=save.unlocked?'disabled':'')+' class="'+(i===selected?'active':'')+'">'+(i>=save.unlocked?'🔒 ':'')+s.name+'<br>'+'★'.repeat(save.stars[i]||0)+'</button>').join('');$('#levels').querySelectorAll('button:not(:disabled)').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.level);menu()});if(selected>=save.unlocked)selected=save.unlocked-1;$('#progress').textContent='Level '+save.level+' · '+save.xp+'/'+save.level*100+' XP · ★ '+save.stars.reduce((a,b)=>a+b,0)+'/'+(stages.length*3);$('#play').onclick=()=>start(selected);renderRpgMenu()}
function land(){let gaps=stages[stage].gaps,ends=[0,...gaps.map(g=>g[1])],begins=[...gaps.map(g=>g[0]),WIDTH];return ends.map((x,i)=>({x,w:begins[i]-x,y:G}))}
function solids(){return [...land(),...stages[stage].ledges.map(a=>({x:a[0],y:a[1],w:a[2]}))]}
function floorY(x){let p=solids().filter(s=>x>=s.x+10&&x<=s.x+s.w-10).sort((a,b)=>b.y-a.y);return p.length?p[0].y:G}
function start(i,hearts=3){if(!Number.isInteger(i)||i<0||i>=stages.length)return;clearInput();resetRpgRun();particles=[];$('#play').classList.remove('hide');$('#resume').classList.add('hide');stage=i;scene='game';cam=0;dashCooldown=0;jumpWas=false;invincible=0;t=0;hero={x:50,y:G-43,w:30,h:43,vx:0,vy:0,on:true,face:1,hearts,stars:0,earned:0,dash:0,usedDash:false,coyote:JUMP.coyote,jumpBuffer:0,jumpHeld:0,jumpActive:false};things=[];bad=[];spikes=stages[i].spikes.map(x=>({x,y:G-18,w:44,h:18}));for(let n=0;n<30;n++){let x=125+n*82,y=floorY(x)-42-(n%3)*9;if(solids().some(p=>x>p.x+8&&x<p.x+p.w-8))things.push({x,y,type:'coin',taken:false})}for(const [x,y] of stages[i].stars)things.push({x,y,type:'star',taken:false});for(let x of stages[i].enemies)bad.push({x,y:G-27,home:x,dir:1,alive:true});resetBossRun();layer.classList.add('hide');controls.classList.remove('hide');hud.classList.remove('hide')}
function xp(n){save.xp+=n;while(save.xp>=save.level*100){save.xp-=save.level*100;save.level++;ensureRpgSave()}persist()}
// Each mistake restarts the whole level, timer and collectibles; three hearts remain.
function die(){
 if(scene!=='game'||invincible>0||hero.dash>0)return;
 const remaining=hero.hearts-1;
 if(remaining<=0){end(false);return;}
 start(stage,remaining);
}
function end(win){if(scene!=='game')return;scene='end';clearInput();updateBossHud();$('#play').classList.remove('hide');let finishedMs=0;if(win){finishedMs=recordTime();xp(70+hero.earned);save.stars[stage]=Math.max(save.stars[stage],hero.stars);save.unlocked=Math.max(save.unlocked,Math.min(stages.length,stage+2));if(stages[stage].boss)save.slimeKingWins=(Number(save.slimeKingWins)||0)+1;persist()}layer.classList.remove('hide');hud.classList.add('hide');controls.classList.add('hide');$('#menu').classList.add('hide');$('#return').classList.remove('hide');$('#return').onclick=menu;$('#heading').textContent=win?'LEVEL GESCHAFFT!':'Versuch es erneut';$('#intro').textContent=win?'Zeit: '+formatRunTime(finishedMs)+' '+medal(finishedMs)+' · Du hast '+hero.stars+'/3 Sterne gesammelt und '+(hero.earned+70)+' XP erhalten.':'Alle Herzen aufgebraucht! Versuche das Level erneut – ohne Checkpoints. Taste R startet direkt neu.';$('#play').textContent=win&&stage<stages.length-1?'Nächstes Level':'Erneut spielen';$('#play').onclick=()=>start(win&&stage<stages.length-1?stage+1:stage)}
function step(dt){
 if(scene!=='game')return;
 t+=dt;
 const h=hero,cl=classes[save.class],movement=(input.right?1:0)-(input.left?1:0);
 if(movement)h.face=movement;
 h.vx=movement*(cl.speed+equipBonus('speed'));
 // Buffer air presses, allow jumps briefly after edges, and shorten released jumps.
 if(input.jump&&!jumpWas)h.jumpBuffer=JUMP.buffer;
 else h.jumpBuffer=Math.max(0,h.jumpBuffer-dt);
 jumpWas=input.jump;
 if(h.on)h.coyote=JUMP.coyote;
 else h.coyote=Math.max(0,h.coyote-dt);
 if(h.jumpBuffer>0&&h.coyote>0&&h.dash<=0){
  h.vy=-cl.jump;h.on=false;h.coyote=0;h.jumpBuffer=0;
  h.jumpHeld=0;h.jumpActive=true;
  burst(h.x+15,h.y+h.h,'#c5d4a0',9,2);
 }
 if(h.jumpActive&&!input.jump&&h.vy<0){h.vy*=JUMP.cut;h.jumpActive=false;}
 if(input.dash&&!h.usedDash&&dashCooldown<=0){h.dash=12;dashCooldown=70;h.usedDash=true;}
 if(h.dash>0){
  h.vx=h.face*11.7;h.vy=0;h.dash-=dt;h.jumpActive=false;h.jumpBuffer=0;
 }else{
  const hold=h.jumpActive&&input.jump&&h.jumpHeld<JUMP.holdFrames&&h.vy<0;
  h.vy=Math.min(18,h.vy+(hold?JUMP.holdGravity:JUMP.gravity)*dt);
  if(h.jumpActive&&input.jump)h.jumpHeld+=dt;
  if(h.vy>=0)h.jumpActive=false;
 }
 if(h.dash>0&&Math.floor(t)%2===0)burst(h.x+15,h.y+24,cl.color,2,1);
 const wasOn=h.on,prevY=h.y;
 h.x=Math.max(0,Math.min(WIDTH-30,h.x+h.vx*dt));
 h.y+=h.vy*dt;h.on=false;
 for(const p of solids())if(h.x+h.w>p.x&&h.x<p.x+p.w&&prevY+h.h<=p.y+9&&h.y+h.h>=p.y&&h.vy>=0){
  h.y=p.y-h.h;h.vy=0;h.on=true;h.usedDash=false;h.jumpActive=false;h.coyote=JUMP.coyote;
 }
 if(h.on&&!wasOn)burst(h.x+15,h.y+h.h,'#a1c59a',8,1.7);
 for(const a of things)if(!a.taken&&Math.hypot(a.x-h.x-15,a.y-h.y-20)<30){
  a.taken=true;burst(a.x,a.y,a.type==='star'?'#fff0a0':'#efc56d',a.type==='star'?22:9,2.7);
  if(a.type==='star'){h.stars++;h.earned+=25;}else h.earned+=5;
 }
 for(const e of bad)if(e.alive){
  e.x+=e.dir*.8*dt;if(Math.abs(e.x-e.home)>42)e.dir*=-1;
  if(h.x<e.x+27&&h.x+h.w>e.x&&h.y<e.y+27&&h.y+h.h>e.y){
   if(h.vy>1&&prevY+h.h<e.y+14){
    e.alive=false;dropLoot(e);burst(e.x+13,e.y+14,'#a8e2bd',18,2.8);
    h.vy=-9;h.jumpActive=false;h.earned+=15;
   }else if(h.dash>0){
    e.alive=false;dropLoot(e);burst(e.x+13,e.y+14,'#a8e2bd',18,2.8);h.earned+=10;
   }else{die();return;}
  }
 }
 combatTick(dt);
 if(scene!=='game')return;
 if(bossTick(dt,prevY))return;
 if(scene!=='game')return;
 for(const spike of spikes)if(h.x+h.w>spike.x+3&&h.x<spike.x+spike.w-3&&h.y+h.h>spike.y+8&&h.y<spike.y+spike.h){die();return;}
 if(h.y>H+110){die();return;}
 if(h.x>WIDTH-85&&(!stages[stage].boss||bossDefeated()))end(true);
 invincible=Math.max(0,invincible-dt);
 dashCooldown=Math.max(0,dashCooldown-dt);
 cam=Math.max(0,Math.min(WIDTH-W,h.x-350));
 $('#hudLeft').textContent='HP '+h.hearts+'  ★ '+h.stars+'/3  $ '+Math.round(h.earned/5);
 $('#hudRight').textContent=stages[stage].name+' · '+cl.label+' · ⏱ '+formatRunTime(currentTime());
}
