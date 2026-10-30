import { normalized } from './data.js';
export class Input {
 constructor(canvas){
  this.canvas=canvas;this.keys=new Set();this.mouse={x:0,y:0,down:false,active:false};
  this.stick={x:0,y:0};this.aim={x:1,y:0};
  this.dashQueued=false;this.abilityQueued=false;this.mobileAttack=false;
  this.lobReleaseQueued=false;this.touchLobAim=null;
  const block=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space']);
  window.addEventListener('keydown',e=>{
   if(block.has(e.code))e.preventDefault();
   if(!e.repeat&&['Space','ShiftLeft','ShiftRight'].includes(e.code))this.dashQueued=true;
   if(!e.repeat&&['KeyQ','KeyE'].includes(e.code))this.abilityQueued=true;
   this.keys.add(e.code);
  });
  window.addEventListener('keyup',e=>{
   if(['KeyF','KeyJ'].includes(e.code)&&this.keys.has(e.code))this.lobReleaseQueued=true;
   this.keys.delete(e.code);
  });
  // Release buttons and queued actions when focus is lost or a menu opens.
  // Otherwise a held attack or dash can fire unexpectedly when play resumes.
  window.addEventListener('blur',()=>this.resetTransient());
  document.addEventListener('visibilitychange',()=>{if(document.hidden)this.resetTransient()});
  canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){this.mouse.x=e.clientX;this.mouse.y=e.clientY;this.mouse.active=true}});
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0){this.mouse.x=e.clientX;this.mouse.y=e.clientY;this.mouse.down=true;this.mouse.active=true}});
  window.addEventListener('pointerup',e=>{if(e.pointerType==='mouse'){
   if(this.mouse.down)this.lobReleaseQueued=true;
   this.mouse.down=false;
  }});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  const stick=document.querySelector('#joystick');
  let pointer=null;
  const update=e=>{
   const r=stick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;
   const dx=(e.clientX-cx)/(r.width*.34),dy=(e.clientY-cy)/(r.height*.34);
   const n=normalized(dx,dy),length=Math.min(1,Math.hypot(dx,dy));
   this.stick={x:n.x*length,y:n.y*length};
   stick.style.setProperty('--sx',(this.stick.x*30)+'px');
   stick.style.setProperty('--sy',(this.stick.y*30)+'px');
  };
  stick.addEventListener('pointerdown',e=>{e.preventDefault();pointer=e.pointerId;stick.setPointerCapture(pointer);update(e)});
  stick.addEventListener('pointermove',e=>{if(e.pointerId===pointer)update(e)});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,e=>{
   if(e.pointerId!==pointer)return;pointer=null;this.stick={x:0,y:0};stick.style.setProperty('--sx','0px');stick.style.setProperty('--sy','0px');
  });
  const attack=document.querySelector('#attackTouch');
  attack.addEventListener('pointerdown',e=>{
   e.preventDefault();attack.setPointerCapture(e.pointerId);
   this.mobileAttack=true;
   this.touchLobAim={startX:e.clientX,startY:e.clientY,x:e.clientX,y:e.clientY};
  });
  attack.addEventListener('pointermove',e=>{
   if(!this.mobileAttack||!this.touchLobAim)return;
   e.preventDefault();this.touchLobAim.x=e.clientX;this.touchLobAim.y=e.clientY;
  });
  const stopAttack=e=>{
   if(this.mobileAttack&&e.type==='pointerup')this.lobReleaseQueued=true;
   this.mobileAttack=false;
  };
  for(const evt of ['pointerup','pointercancel','lostpointercapture'])
   attack.addEventListener(evt,stopAttack);
  document.querySelector('#dashTouch').addEventListener('pointerdown',e=>{e.preventDefault();this.dashQueued=true});
  document.querySelector('#abilityTouch').addEventListener('pointerdown',e=>{e.preventDefault();this.abilityQueued=true});
 }
 resetTransient(){
  this.keys.clear();
  this.mouse.down=false;
  this.mouse.active=false;
  this.mobileAttack=false;
  this.lobReleaseQueued=false;this.touchLobAim=null;
  this.dashQueued=false;
  this.abilityQueued=false;
  this.stick={x:0,y:0};
  const stick=document.querySelector('#joystick');
  if(stick){
   stick.style.setProperty('--sx','0px');
   stick.style.setProperty('--sy','0px');
  }
 }
 movement(){
  const x=Number(this.keys.has('KeyD')||this.keys.has('ArrowRight'))-Number(this.keys.has('KeyA')||this.keys.has('ArrowLeft'))+this.stick.x;
  const y=Number(this.keys.has('KeyS')||this.keys.has('ArrowDown'))-Number(this.keys.has('KeyW')||this.keys.has('ArrowUp'))+this.stick.y;
  const length=Math.min(1,Math.hypot(x,y));const n=normalized(x,y);return {x:n.x*length,y:n.y*length};
 }
 aiming(player,camera){
  if(this.mouse.active){
   const rect=this.canvas.getBoundingClientRect();
   const wx=(this.mouse.x-rect.left)*this.canvas.width/rect.width/camera.scale+camera.x;
   const wy=(this.mouse.y-rect.top)*this.canvas.height/rect.height/camera.scale+camera.y;
   this.aim=normalized(wx-player.x,wy-player.y);
  }else{
   const m=this.movement();if(Math.hypot(m.x,m.y)>.15)this.aim=normalized(m.x,m.y);
  }
  return this.aim;
 }
 target(player,camera,maxRange=260){
  // World-space cursor target for lobbed grenades; phones use directional aim.
  const direction=this.aiming(player,camera);
  if(this.mouse.active){
   const rect=this.canvas.getBoundingClientRect();
   if(rect.width&&rect.height&&camera.scale){
    const x=(this.mouse.x-rect.left)*this.canvas.width/rect.width/camera.scale+camera.x;
    const y=(this.mouse.y-rect.top)*this.canvas.height/rect.height/camera.scale+camera.y;
    const dx=x-player.x,dy=y-player.y,len=Math.hypot(dx,dy);
    if(len>0)return {x:player.x+dx/len*Math.min(maxRange,len),
     y:player.y+dy/len*Math.min(maxRange,len)};
   }
  }
  return {x:player.x+direction.x*maxRange,y:player.y+direction.y*maxRange};
 }
 lobTarget(player,camera,maxRange=260,enemies=[]){
  // Mouse: exact screen/world-space reticle. Finger: hold ATTACK and drag
  // in the desired direction, with soft enemy targeting when not dragging.
  const drag=this.touchLobAim;
  if(drag){
   const dx=drag.x-drag.startX,dy=drag.y-drag.startY;
   const length=Math.hypot(dx,dy);
   if(length>=16){
    const scale=Math.min(maxRange,Math.max(65,length*2.1))/length;
    return {x:player.x+dx*scale,y:player.y+dy*scale};
   }
   const nearby=enemies.filter(e=>e.hp>0&&Math.hypot(e.x-player.x,e.y-player.y)<=maxRange)
    .sort((a,b)=>Math.hypot(a.x-player.x,a.y-player.y)-Math.hypot(b.x-player.x,b.y-player.y))[0];
   if(nearby)return {x:nearby.x,y:nearby.y};
  }
  return this.target(player,camera,maxRange);
 }
 consumeLobRelease(){
  const result=this.lobReleaseQueued;this.lobReleaseQueued=false;return result;
 }
 clearLobAim(){this.touchLobAim=null;}
 attacking(){return this.mouse.down||this.mobileAttack||this.keys.has('KeyF')||this.keys.has('KeyJ')}
 consumeDash(){const result=this.dashQueued;this.dashQueued=false;return result}
 consumeAbility(){const result=this.abilityQueued;this.abilityQueued=false;return result}
}
