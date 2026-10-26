
'use strict';
const $=s=>document.querySelector(s),canvas=$('#view'),ctx=canvas.getContext('2d'),layer=$('#layer'),hud=$('#hud'),controls=$('#controls');const W=960,H=540,G=465,WIDTH=2800;let scene='menu',stage=0,selected=0,t=0,last=0,cam=0,hero=null,things=[],bad=[],spikes=[],checkpoints=[],particles=[],dashCooldown=0,jumpWas=false,invincible=0;
const stages=[{name:'1-1 · Waldanfang',base:5,gaps:[[510,640],[1120,1280],[1850,2010]],ledges:[[230,356,155],[760,342,155],[1430,355,155],[2180,345,165]],enemies:[460,920,1630,2310],spikes:[1010,1770],checkpoint:1370},{name:'1-2 · Baumkronen',base:8,gaps:[[420,570],[1080,1260],[1760,1960]],ledges:[[230,335,160],[630,315,170],[1330,305,160],[2130,340,150]],enemies:[350,820,1490,2250],spikes:[920,1640,2370],checkpoint:1380},{name:'1-3 · Moosruinen',base:12,gaps:[[530,700],[1190,1360],[1920,2110]],ledges:[[285,340,160],[815,315,175],[1450,335,175],[2220,300,180]],enemies:[430,960,1630,2340],spikes:[1070,1780,2510],checkpoint:1480}];
const classes={warrior:{label:'Krieger',color:'#66aaf0',speed:4.75,jump:13.6},hunter:{label:'Jäger',color:'#90df8b',speed:5.7,jump:13.9},mage:{label:'Magier',color:'#bf9cf1',speed:4.9,jump:14.4}};
let save;try{save=JSON.parse(localStorage.getItem('realm-runners-save-v2')||'null')}catch{}save=save&&typeof save==='object'?save:{class:'warrior',unlocked:1,stars:[0,0,0],xp:0,level:1};save.unlocked=Math.max(1,Math.min(3,Number(save.unlocked)||1));save.stars=Array.isArray(save.stars)?save.stars.slice(0,3):[0,0,0];while(save.stars.length<3)save.stars.push(0);if(!classes[save.class])save.class='warrior';save.xp=Number.isFinite(Number(save.xp))?Math.max(0,Math.floor(Number(save.xp))):0;save.level=Number.isFinite(Number(save.level))?Math.max(1,Math.floor(Number(save.level))):1;save.stars=save.stars.map(n=>Math.max(0,Math.min(3,Math.floor(Number(n)||0))));function persist(){try{localStorage.setItem('realm-runners-save-v2',JSON.stringify(save))}catch{}}
// Keyboard and pointer sources are independent: releasing one finger cannot cancel another.
const input={left:false,right:false,jump:false,dash:false},heldKeys=new Set(),heldPointers=new Map(),heldTouches=new Map();
const keymap={ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right',ArrowUp:'jump',KeyW:'jump',Space:'jump',ShiftLeft:'dash',ShiftRight:'dash',KeyJ:'dash'};
function syncInput(){for(const k of Object.keys(input))input[k]=[...heldKeys].some(code=>keymap[code]===k)||[...heldPointers.values(),...heldTouches.values()].includes(k);document.querySelectorAll('[data-control]').forEach(b=>b.classList.toggle('pressed',input[b.dataset.control]));}
function clearInput(){heldKeys.clear();heldPointers.clear();heldTouches.clear();clearSelection();syncInput();jumpWas=false;}
addEventListener('keydown',e=>{if(e.code==='Escape'){e.preventDefault();if(scene==='game')pause();else if(scene==='pause')resume();}if(keymap[e.code]){e.preventDefault();if(scene==='game'){heldKeys.add(e.code);syncInput();}}});
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

function pause(){if(scene!=='game')return;scene='pause';clearInput();layer.classList.remove('hide');controls.classList.add('hide');$('#menu').classList.add('hide');$('#play').classList.add('hide');$('#resume').classList.remove('hide');$('#return').classList.remove('hide');$('#return').onclick=menu;$('#heading').textContent='PAUSE';$('#intro').textContent='Der Wald wartet auf dich.';}
function resume(){if(scene!=='pause')return;clearInput();scene='game';layer.classList.add('hide');controls.classList.remove('hide');last=performance.now();}
$('#pause').onclick=pause;$('#resume').onclick=resume;
function size(){let d=Math.min(devicePixelRatio||1,2),s=Math.min(innerWidth/W,innerHeight/H);canvas.width=innerWidth*d;canvas.height=innerHeight*d;ctx.setTransform(d*s,0,0,d*s,(innerWidth-W*s)*d/2,(innerHeight-H*s)*d/2)}addEventListener('resize',size);size();
function menu(){clearInput();$('#play').classList.remove('hide');$('#resume').classList.add('hide');scene='menu';layer.classList.remove('hide');hud.classList.add('hide');controls.classList.add('hide');$('#menu').classList.remove('hide');$('#return').classList.add('hide');$('#heading').textContent='REALM RUNNERS';$('#intro').textContent='Welt 1: Smaragdwald · Schalte Level frei und sammle pro Abschnitt drei Sterne.';$('#play').textContent='Level starten';$('#classes').innerHTML=Object.entries(classes).map(([id,c])=>'<button data-class="'+id+'" class="'+(save.class===id?'active':'')+'">'+({warrior:'⚔',hunter:'🏹',mage:'✧'}[id])+' '+c.label+'</button>').join('');$('#classes').querySelectorAll('button').forEach(b=>b.onclick=()=>{save.class=b.dataset.class;persist();menu()});$('#levels').innerHTML=stages.map((s,i)=>'<button data-level="'+i+'" '+(i>=save.unlocked?'disabled':'')+' class="'+(i===selected?'active':'')+'">'+(i>=save.unlocked?'🔒 ':'')+s.name+'<br>'+'⭐'.repeat(save.stars[i]||0)+'</button>').join('');$('#levels').querySelectorAll('button:not(:disabled)').forEach(b=>b.onclick=()=>{selected=Number(b.dataset.level);menu()});if(selected>=save.unlocked)selected=save.unlocked-1;$('#progress').textContent='Level '+save.level+' · '+save.xp+'/'+save.level*100+' XP · ⭐ '+save.stars.reduce((a,b)=>a+b,0)+'/9';$('#play').onclick=()=>start(selected)}
function land(){let gaps=stages[stage].gaps,ends=[0,...gaps.map(g=>g[1])],begins=[...gaps.map(g=>g[0]),WIDTH];return ends.map((x,i)=>({x,w:begins[i]-x,y:G}))}
function solids(){return [...land(),...stages[stage].ledges.map(a=>({x:a[0],y:a[1],w:a[2]}))]}
function floorY(x){let p=solids().filter(s=>x>=s.x+10&&x<=s.x+s.w-10).sort((a,b)=>b.y-a.y);return p.length?p[0].y:G}
function start(i){clearInput();particles=[];$('#play').classList.remove('hide');$('#resume').classList.add('hide');stage=i;scene='game';cam=0;dashCooldown=0;jumpWas=false;invincible=0;t=0;hero={x:50,y:300,w:30,h:43,vx:0,vy:0,on:false,face:1,respawn:50,hearts:3,stars:0,earned:0,dash:0,usedDash:false};things=[];bad=[];spikes=stages[i].spikes.map(x=>({x,y:G-18,w:44,h:18}));checkpoints=[{x:stages[i].checkpoint,y:G-70,on:false}];for(let n=0;n<30;n++){let x=125+n*82,y=floorY(x)-42-(n%3)*9;if(solids().some(p=>x>p.x+8&&x<p.x+p.w-8))things.push({x,y,type:'coin',taken:false})}let sx=[340,1475,2400];for(let x of sx)things.push({x,y:floorY(x)-100,type:'star',taken:false});for(let x of stages[i].enemies)bad.push({x,y:G-27,home:x,dir:1,alive:true});layer.classList.add('hide');controls.classList.remove('hide');hud.classList.remove('hide')}
function xp(n){save.xp+=n;while(save.xp>=save.level*100){save.xp-=save.level*100;save.level++}persist()}
function die(){if(invincible>0||hero.dash>0)return;burst(hero.x+15,hero.y+20,'#f5b3a2',20,3);hero.hearts--;invincible=90;if(hero.hearts<=0){end(false);return}hero.x=hero.respawn;hero.y=230;hero.vy=0;cam=Math.max(0,hero.x-300)}
function end(win){if(scene!=='game')return;scene='end';clearInput();if(win){xp(70+hero.earned);save.stars[stage]=Math.max(save.stars[stage],hero.stars);save.unlocked=Math.max(save.unlocked,Math.min(3,stage+2));persist()}layer.classList.remove('hide');hud.classList.add('hide');controls.classList.add('hide');$('#menu').classList.add('hide');$('#return').classList.remove('hide');$('#return').onclick=menu;$('#heading').textContent=win?'Level geschafft! 🎉':'Versuch es erneut';$('#intro').textContent=win?'Du hast '+hero.stars+'/3 Sterne gesammelt und '+(hero.earned+70)+' XP erhalten.':'Die Sprünge sind knifflig! Nutze den Checkpoint und versuche eine andere Sprungfolge.';$('#play').textContent=win&&stage<2?'Nächstes Level':'Erneut spielen';$('#play').onclick=()=>start(win&&stage<2?stage+1:stage)}
function step(dt){if(scene!=='game')return;t+=dt;let h=hero,cl=classes[save.class],movement=(input.right?1:0)-(input.left?1:0);if(movement)h.face=movement;h.vx=movement*cl.speed;if(input.jump&&!jumpWas&&h.on){h.vy=-cl.jump;h.on=false;burst(h.x+15,h.y+h.h,'#c5d4a0',9,2)}jumpWas=input.jump;if(input.dash&&!h.usedDash&&dashCooldown<=0){h.dash=12;dashCooldown=70;h.usedDash=true}if(h.dash>0){h.vx=h.face*11.7;h.vy=0;h.dash-=dt}else h.vy=Math.min(18,h.vy+.63*dt);if(h.dash>0&&Math.floor(t)%2===0)burst(h.x+15,h.y+24,cl.color,2,1);let wasOn=h.on,prevY=h.y;h.x=Math.max(0,Math.min(WIDTH-30,h.x+h.vx*dt));h.y+=h.vy*dt;h.on=false;for(let p of solids())if(h.x+h.w>p.x&&h.x<p.x+p.w&&prevY+h.h<=p.y+9&&h.y+h.h>=p.y&&h.vy>=0){h.y=p.y-h.h;h.vy=0;h.on=true;h.usedDash=false}if(h.on&&!wasOn)burst(h.x+15,h.y+h.h,'#a1c59a',8,1.7);for(let a of things)if(!a.taken&&Math.hypot(a.x-h.x-15,a.y-h.y-20)<30){a.taken=true;burst(a.x,a.y,a.type==='star'?'#fff0a0':'#efc56d',a.type==='star'?22:9,2.7);if(a.type==='star'){h.stars++;h.earned+=25}else h.earned+=5}for(let e of bad)if(e.alive){e.x+=e.dir*.8*dt;if(Math.abs(e.x-e.home)>42)e.dir*=-1;if(h.x<e.x+27&&h.x+h.w>e.x&&h.y<e.y+27&&h.y+h.h>e.y){if(h.vy>1&&prevY+h.h<e.y+14){e.alive=false;burst(e.x+13,e.y+14,'#a8e2bd',18,2.8);h.vy=-9;h.earned+=15}else if(h.dash>0){e.alive=false;burst(e.x+13,e.y+14,'#a8e2bd',18,2.8);h.earned+=10}else die()}}for(let s of spikes)if(h.x+h.w>s.x+3&&h.x<s.x+s.w-3&&h.y+h.h>s.y+8&&h.y<s.y+s.h)die();for(let cp of checkpoints)if(h.x>cp.x&&!cp.on){cp.on=true;burst(cp.x+10,cp.y+20,'#d6f5a6',32,3);h.respawn=cp.x;h.hearts=Math.min(3,h.hearts+1)}if(h.y>H+110){h.x=h.respawn;h.y=260;h.vy=0;die()}if(h.x>WIDTH-85)end(true);invincible=Math.max(0,invincible-dt);dashCooldown=Math.max(0,dashCooldown-dt);cam=Math.max(0,Math.min(WIDTH-W,h.x-350));$('#hudLeft').textContent='❤️ '+h.hearts+'  ⭐ '+h.stars+'/3  🪙 '+Math.round(h.earned/5);$('#hudRight').textContent=stages[stage].name+' · '+cl.label}
