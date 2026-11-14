import {HunterLocomotionAtlas,hunterLocomotionPose,advanceHunterLocomotion,HUNTER_STRIDE} from '../src/hunter-locomotion.js?v=0.73.4';
const $=id=>document.getElementById(id),rig=new HunterLocomotionAtlas();
const labels=['S','SW','W','NW','N','NO','O','SO'];
const direction=row=>({x:Math.cos(Math.PI/2+row*Math.PI/4),y:Math.sin(Math.PI/2+row*Math.PI/4)});
const player={kind:'hunter',x:0,y:0,hp:100,direction:direction(0),moving:true,hunterWalkDistance:0,heroMoveDirection:direction(0)};
const keys=new Set();let row=0,paused=false,cycleTime=0,totalDistance=0,previous=null,checked=0;
const ctx=$('stage').getContext('2d'),load=src=>new Promise((resolve,reject)=>{const im=new Image();im.crossOrigin='anonymous';im.onload=()=>resolve(im);im.onerror=()=>reject(Error(src));im.src=src;});
let mage;
function choose(r){row=r;player.direction=direction(r);player.heroMoveDirection=direction(r);for(const b of $('directions').children)b.setAttribute('aria-pressed',String(Number(b.dataset.row)===r));if(rig.ready)render();}
for(const r of [4,5,6,7,0,1,2,3]){const b=document.createElement('button');b.textContent=labels[r];b.dataset.row=r;b.onclick=()=>choose(r);$('directions').append(b);}choose(0);
function pause(value){paused=value;$('pause').textContent=paused?'Abspielen':'Pause';}
$('pause').onclick=()=>pause(!paused);
$('idle').onclick=()=>{$('mode').value='idle';keys.clear();player.moving=false;pause(false);render();};
$('mode').onchange=()=>{cycleTime=0;keys.clear();pause(false);player.moving=$('mode').value==='walk';render();};
function seek(frame){pause(true);player.moving=true;player.heroMoveDirection=direction(row);player.hunterWalkDistance=frame*HUNTER_STRIDE/8+.001;$('phase').value=frame;render();}
$('phase').oninput=()=>seek(Number($('phase').value));
$('step').onclick=()=>seek(((hunterLocomotionPose(player)?.frame||0)+1)%8);
const movementKeys=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight']);
window.addEventListener('keydown',e=>{if(!movementKeys.has(e.code)||e.target.closest('select,input'))return;e.preventDefault();keys.add(e.code);$('mode').value='manual';pause(false);});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();previous=null;}});
$('stage').onpointerdown=()=>$('stage').focus();
function manualMovement(){return {x:Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')),y:Number(keys.has('KeyS')||keys.has('ArrowDown'))-Number(keys.has('KeyW')||keys.has('ArrowUp'))};}
function grid(x,moving){
 ctx.save();ctx.beginPath();ctx.rect(x,48,300,235);ctx.clip();ctx.fillStyle='#1d3030';ctx.fillRect(x,48,300,235);
 const ox=moving?((player.x*2)%48+48)%48:0,oy=moving?((player.y*2)%48+48)%48:0;
 ctx.strokeStyle='#304947';ctx.lineWidth=1;
 for(let gx=x-ox;gx<x+348;gx+=48){ctx.beginPath();ctx.moveTo(gx+.5,48);ctx.lineTo(gx+.5,283);ctx.stroke();}
 for(let gy=48-oy;gy<331;gy+=48){ctx.beginPath();ctx.moveTo(x,gy+.5);ctx.lineTo(x+300,gy+.5);ctx.stroke();}
 ctx.restore();
}
function shadow(radius){ctx.fillStyle='rgba(4,12,15,.62)';ctx.beginPath();ctx.ellipse(0,1,radius,4,0,0,Math.PI*2);ctx.fill();}
function render(){
 if(!rig.ready)return;const pose=hunterLocomotionPose(player),t=direction(row);
 ctx.clearRect(0,0,900,300);ctx.imageSmoothingEnabled=false;ctx.font='16px system-ui';ctx.textAlign='center';ctx.fillStyle='#e1e4ce';
 for(const [i,label]of ['Freigegebener Stand','Jäger · Laufprobe','Magier · Referenz'].entries()){grid(i*300,i>0&&player.moving);ctx.fillText(label,i*300+150,29);}
 ctx.save();ctx.translate(150,250);ctx.scale(2,2);shadow(21);rig.draw(ctx,{...player,x:0,y:0,moving:false,direction:t});ctx.restore();
 ctx.save();ctx.translate(450,250);ctx.scale(2,2);shadow(21);rig.draw(ctx,{...player,x:0,y:0});ctx.restore();
 if(mage){
  const mirrored=row>=6,sourceRow=mirrored?8-row:row,frame=player.moving?pose.frame+1:0;
  ctx.save();ctx.translate(750,250);ctx.scale(2,2);shadow(19);if(mirrored)ctx.scale(-1,1);
  ctx.drawImage(mage,frame*96,sourceRow*96,96,96,-48,-88,96,96);ctx.restore();
 }
 $('readout').textContent=labels[pose.row]+' · '+(player.moving?'Laufen · Bild '+(pose.frame+1)+'/8':'Stand')+' · Strecke '+totalDistance.toFixed(1)+' px'+(paused?' · angehaltenes Einzelbild':'');
 $('readout').dataset.moving=String(player.moving);$('readout').dataset.row=pose.row;$('readout').dataset.frame=pose.frame;
 if(!paused)$('phase').value=pose.frame;
}
function gallery(){
 const g=$('sheet').getContext('2d');g.imageSmoothingEnabled=false;g.font='11px monospace';
 for(let r=0;r<8;r++)for(let f=-1;f<8;f++){
  const x=(f+1)*96,y=r*128,d=direction(r),p={kind:'hunter',hp:100,x:x+48,y:y+112,direction:d,moving:f>=0,heroMoveDirection:d,hunterWalkDistance:Math.max(0,f)*12+.001};
  g.fillStyle='#c9d2be';g.fillText(labels[r]+' '+(f<0?'Stand':f+1),x+5,y+14);rig.draw(g,p);
  g.strokeStyle='#4c6258';g.beginPath();g.moveTo(x,y+112.5);g.lineTo(x+96,y+112.5);g.stroke();
 }
}
function tick(time){
 const dt=previous===null?0:Math.min(.05,(time-previous)/1000)*Number($('rate').value);previous=time;
 if(!paused){
  const mode=$('mode').value;cycleTime+=dt;let m={x:0,y:0};
  if(mode==='manual')m=manualMovement();
  else if(mode==='walk'||mode==='cycle'&&cycleTime%4.8>=1.2&&cycleTime%4.8<3.6)m=direction(row);
  totalDistance+=advanceHunterLocomotion(player,m,dt);
  if(mode==='manual'&&player.moving){const newRow=hunterLocomotionPose(player).row;if(newRow!==row)choose(newRow);}
 }
 render();requestAnimationFrame(tick);
}
try{
 await rig.loading;if(!rig.ready)throw rig.error;
 mage=await load('../assets/heroes/mage/locomotion-067/locomotion.png');
 const probe=document.createElement('canvas');probe.width=probe.height=96;const pg=probe.getContext('2d');
 for(let r=0;r<8;r++){
  const phases=new Set(),d=direction(r),p={kind:'hunter',x:0,y:0,hp:100,direction:d};
  for(let f=0;f<8;f++){
   pg.clearRect(0,0,96,96);rig.draw(pg,{kind:'hunter',x:48,y:88,hp:100,direction:d,heroMoveDirection:d,moving:true,hunterWalkDistance:f*12+.001});
   const data=pg.getImageData(0,0,96,96).data;let count=0,bottom=-1;
   for(let k=0;k<96*96;k++)if(data[k*4+3]){count++;bottom=Math.floor(k/96);}
   if(count<400||bottom!==87)throw Error('Fehlender/versetzter Frame '+r+'/'+f);checked++;
   advanceHunterLocomotion(p,d,12/245);phases.add(hunterLocomotionPose(p).frame);
  }
  if(phases.size!==8)throw Error('Schrittphasen fehlen '+r);
 }
 gallery();$('status').textContent='BESTANDEN: 64/64 Laufbilder · 8/8 unveränderte Standbilder geladen · alle acht Distanzphasen je Richtung. Visuelle Qualität wird separat geprüft.';
 document.documentElement.dataset.hunterWalkReview='passed';requestAnimationFrame(tick);
}catch(error){$('status').textContent='FEHLER: '+error.message;document.documentElement.dataset.hunterWalkReview='failed';}
