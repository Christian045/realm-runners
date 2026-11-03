import {getKnightPainted} from './knight-painted.js?v=0.41.0';
import {heroRigReady,articulatedPose,RIG_ROWS,getHeroRig} from './articulated-hero.js?v=0.40.0';
import {HeroSpriteAtlas} from './hero-sprites.js?v=0.40.0';
import {KnightSpriteAtlas} from './knight-sprites.js?v=0.41.0';
import {heroPose,HERO_CLIPS} from './hero-animation.js?v=0.31.0';
import {knightPose,KNIGHT_CLIPS} from './knight-animation.js?v=0.31.0';
import {heroShot} from './hero-aim.js?v=0.40.0';
import {KNIGHT_VISUAL_STRIDE} from './knight-walk.js?v=0.34.0';
import {CLASSES} from './data.js?v=0.23.0';

export const LAB_KINDS=Object.freeze(['warrior','mage','summoner','hunter','glasscannon','alchemist']);
export const LAB_DIRECTIONS=Object.freeze(['N','NO','O','SO','S','SW','W','NW'].map((name,i)=>Object.freeze({name,x:Math.cos(-Math.PI/2+i*Math.PI/4),y:Math.sin(-Math.PI/2+i*Math.PI/4)})));
export const LAB_STATES=Object.freeze({idle:'Stand',walk:'Laufen',attack:'Angriff 1',attack2:'Angriff 2',attack3:'Angriff 3',special:'Spezial',cast:'Vorbereitung',recovery:'Rückbewegung',hurt:'Treffer',dash:'Ausweichen',death:'Tod'});

// Pure preview actors: no Game, progress, inventory, storage or statistics access.
// Cast/recovery inspect sections of the actual attack, not invented extra clips.
export function labSample(kind,state,direction,seconds,moving=false){
 if(!LAB_KINDS.includes(kind)||!Object.hasOwn(LAB_STATES,state))throw new RangeError('Unknown preview');
 const progress=Math.max(0,Math.min(1,seconds));
 const p={kind,x:128,y:121,hp:100,invulnerable:0,direction:{x:direction.x,y:direction.y},
  moving:state==='walk'||moving,walkDistance:progress*72,knightWalkDistance:progress*KNIGHT_VISUAL_STRIDE,
  robedWalkDistance:progress*240,walkCycle:progress*.54*14,heroMoveDirection:{...direction},knightMoveDirection:{...direction},hurtTimer:0};
 const knight=kind==='warrior',clips=knight?KNIGHT_CLIPS:HERO_CLIPS;
 let clip=state;
 if(/^attack|cast|recovery/.test(state))clip=knight?state==='attack2'?'attack2':state==='attack3'?'attack3':'attack1':'attack';
 let elapsed=progress;
 if(state==='cast')elapsed=progress*(knight?.375:.5);
 if(state==='recovery')elapsed=.65+progress*.35;
 if(state==='death'){p.hp=0;p.knightDeathElapsed=progress*1.04;p.heroDeathElapsed=progress*1.04;}
 else if(!['idle','walk'].includes(state))p[knight?'knightAction':'heroAction']={clip,duration:1,elapsed,direction:{...direction},fired:elapsed>=(clips[clip].hitFrame??clips[clip].releaseFrame??Infinity)/clips[clip].frames};
 const pose=knight?knightPose(p,progress*1.6):heroPose(p,progress*1.5);
 const event=(clips[clip]?.hitFrame??clips[clip]?.releaseFrame);
 const release=event===undefined?null:event/clips[clip].frames;
 return {player:p,pose,release,progress:elapsed,shot:knight?null:heroShot(p)};
}
let active=null;
export const animationLabOpen=()=>active!==null;
export async function openAnimationLab(){
 if(active){active.focus();return;}
 const returnFocus=document.activeElement;
 const dialog=document.createElement('dialog');dialog.className='animation-lab';active=dialog;
 dialog.setAttribute('aria-labelledby','animation-lab-title');
 dialog.innerHTML=`<header><div><p class="lab-eyebrow">REALM RUNNERS · ANIMATIONEN</p><h2 id="animation-lab-title">Die Trainingshalle</h2></div><button type="button" data-lab="close" aria-label="Testszene schließen">Schließen ✕</button></header>
 <p class="lab-description">Alle sechs Klassen mit dem Renderer des Spiels. Diese Szene verändert weder Spielstände noch Statistiken. Der Ritter nutzt neue komplette Pixel-Art-Frames in acht Richtungen; die anderen Klassen verwenden weiterhin ihre bestehenden Modelle.</p>
 <div class="lab-controls"><label>Animation<select data-lab="state">${Object.entries(LAB_STATES).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label><label>Tempo<select data-lab="speed"><option value="0.25">¼ ×</option><option value="0.5">½ ×</option><option value="1" selected>1 ×</option></select></label>
 <label><input type="checkbox" data-lab="moving"> Gleichzeitig laufen</label><label><input type="checkbox" data-lab="anchors"> Anker anzeigen</label></div>
 <div class="lab-directions" role="group" aria-label="Blick- und Zielrichtung">${LAB_DIRECTIONS.map((d,i)=>`<button type="button" data-direction="${i}" aria-pressed="${i===4}">${d.name}</button>`).join('')}</div>
 <div class="lab-timeline"><button type="button" data-lab="pause">Pause</button><button type="button" data-lab="step" aria-label="Ein vierundzwanzigstel Zyklus weiter">Schritt +</button><label>Fortschritt<input type="range" data-lab="seek" min="0" max="1000" value="0"></label><output data-lab="clock">0 %</output></div>
 <div class="lab-grid">${LAB_KINDS.map(kind=>`<section class="lab-card"><h3>${CLASSES[kind].name}</h3><canvas width="256" height="176" data-kind="${kind}" aria-label="${CLASSES[kind].name}: Animationsvorschau"></canvas><p data-info="${kind}">Grafik wird geladen …</p></section>`).join('')}</div>
 <p class="lab-description">Ein Prüfzyklus dauert bei 1× für alle Klassen 1,2 Sekunden. „Vorbereitung“ und „Rückbewegung“ zeigen Abschnitte des Angriffs. Angriff 2/3 sind beim Ritter eigene Kombos; die anderen Klassen zeigen ihren normalen Angriff. Türkis: Ursprung · Gold: Auslösezeitpunkt. Treffer und Projektile werden hier nicht gegen Gegner berechnet.</p>`;
 document.body.append(dialog);dialog.showModal();
 const atlases=new Map(),errors=new Set();let closed=false,raf=0,last=null,clock=0,paused=false,dirty=true,lastPaint=0;
 const state={clip:'idle',direction:4,speed:1,moving:false,anchors:false};
 const seek=dialog.querySelector('[data-lab="seek"]'),pause=dialog.querySelector('[data-lab="pause"]');
 const close=()=>{if(closed)return;closed=true;cancelAnimationFrame(raf);for(const atlas of atlases.values())atlas.release?.();dialog.remove();active=null;returnFocus?.focus?.({preventScroll:true});};
 const setPaused=value=>{dirty=true;paused=value;pause.textContent=paused?'Abspielen':'Pause';};
 dialog.addEventListener('cancel',e=>{e.preventDefault();close();});
 dialog.addEventListener('click',e=>{
  const button=e.target.closest('button');if(!button)return;dirty=true;
  if(button.dataset.direction!==undefined){state.direction=Number(button.dataset.direction);for(const b of dialog.querySelectorAll('[data-direction]'))b.setAttribute('aria-pressed',String(b===button));}
  if(button.dataset.lab==='close')close();
  if(button.dataset.lab==='pause')setPaused(!paused);
  if(button.dataset.lab==='step'){setPaused(true);clock=Math.min(1,clock+1/24);}
 });
 dialog.addEventListener('input',e=>{
  const control=e.target;dirty=true;
  if(control.dataset.lab==='state'){state.clip=control.value;clock=0;}
  if(control.dataset.lab==='speed')state.speed=Number(control.value);
  if(control.dataset.lab==='moving')state.moving=control.checked;
  if(control.dataset.lab==='anchors')state.anchors=control.checked;
  if(control.dataset.lab==='seek'){setPaused(true);clock=Number(control.value)/1000;}
 });
 const cards=LAB_KINDS.map(kind=>({kind,canvas:dialog.querySelector(`[data-kind="${kind}"]`),info:dialog.querySelector(`[data-info="${kind}"]`)}));
 function draw(now){
  if(closed)return;
  const dt=last===null?0:Math.min(.05,(now-last)/1000);last=now;
  if(!paused&&!document.hidden){clock=(clock+dt*state.speed/1.2)%1;if(now-lastPaint>=1000/24)dirty=true;}
  if(!dirty||document.hidden){raf=requestAnimationFrame(draw);return;}
  dirty=false;lastPaint=now;
  seek.value=String(Math.round(clock*1000));dialog.querySelector('[data-lab="clock"]').textContent=Math.round(clock*100)+' %';
  for(const {kind,canvas,info} of cards){
   const c=canvas.getContext('2d'),atlas=atlases.get(kind);
   c.clearRect(0,0,canvas.width,canvas.height);c.fillStyle='#121a22';c.fillRect(0,0,256,176);
   c.strokeStyle='#27333e';c.lineWidth=1;for(let x=0;x<256;x+=16){c.beginPath();c.moveTo(x,0);c.lineTo(x,176);c.stroke();}for(let y=9;y<176;y+=16){c.beginPath();c.moveTo(0,y);c.lineTo(256,y);c.stroke();}
   c.fillStyle='#080d14';c.beginPath();c.ellipse(128,130,27,8,0,0,Math.PI*2);c.fill();
   if(!atlas?.ready){info.textContent=errors.has(kind)?'Grafik konnte nicht geladen werden.':'Grafik wird geladen …';continue;}
   const sample=labSample(kind,state.clip,LAB_DIRECTIONS[state.direction],clock,state.moving);
   try{atlas.draw(c,sample.player,clock*(kind==='warrior'?1.6:1.5));}catch(error){info.textContent='Darstellungsfehler: '+error.message;continue;}
   const releasing=sample.release!==null&&Math.abs(sample.progress-sample.release)<.065;
   if(state.anchors){
    c.strokeStyle='#6ee3d4';c.lineWidth=1;
    for(const point of [{x:128,y:130},...(sample.shot?[sample.shot]:[])]){c.beginPath();c.moveTo(point.x-5,point.y);c.lineTo(point.x+5,point.y);c.moveTo(point.x,point.y-5);c.lineTo(point.x,point.y+5);c.stroke();}
    if(sample.shot){const s=sample.shot;c.setLineDash([3,4]);c.beginPath();c.moveTo(s.x,s.y);c.lineTo(s.x+s.aim.x*65,s.y+s.aim.y*65);c.stroke();c.setLineDash([]);}
   }
   if(releasing){c.strokeStyle='#ebc582';c.strokeRect(1,1,254,174);}
   info.textContent=`${sample.pose.clip} · ${heroRigReady(kind)?RIG_ROWS[articulatedPose(sample.player).row]:sample.pose.face} · Bild ${sample.pose.frame+1}${releasing?' · AUSLÖSEN':''}`;
  }
  raf=requestAnimationFrame(draw);
 }
 raf=requestAnimationFrame(draw);
 await Promise.all(LAB_KINDS.map(async kind=>{
  // The preview uses the very same production rig as gameplay. Do not load
  // six additional, superseded full-body fallback atlases on mobile: WebKit
  // can exhaust its graphics process with that duplicate decoding workload.
  const rig=kind==='warrior'&&new URLSearchParams(location.search).has('newKnight')?getKnightPainted():getHeroRig(kind);
  try{await rig?.loading;}catch{/* Keep the legacy decoder as a safe fallback. */}
  if(rig?.ready){
   atlases.set(kind,rig);dirty=true;return;
  }
  const atlas=kind==='warrior'?new KnightSpriteAtlas():new HeroSpriteAtlas();
  atlases.set(kind,atlas);
  if(kind!=='warrior')atlas.select(kind);
  try{await atlas.loading;if(!atlas.ready)errors.add(kind);}catch{errors.add(kind);}
  dirty=true;if(closed)atlas.release?.();
 }));
}
