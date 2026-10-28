import { normalized } from './data.js';
export class Input {
 constructor(canvas){
  this.canvas=canvas;this.keys=new Set();this.mouse={x:0,y:0,down:false,active:false};
  this.stick={x:0,y:0};this.aim={x:1,y:0};
  this.dashQueued=false;this.abilityQueued=false;this.mobileAttack=false;
  const block=new Set(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space']);
  window.addEventListener('keydown',e=>{
   if(block.has(e.code))e.preventDefault();
   if(!e.repeat&&['Space','ShiftLeft','ShiftRight'].includes(e.code))this.dashQueued=true;
   if(!e.repeat&&['KeyQ','KeyE'].includes(e.code))this.abilityQueued=true;
   this.keys.add(e.code);
  });
  window.addEventListener('keyup',e=>this.keys.delete(e.code));
  const clear=()=>{this.keys.clear();this.mouse.down=false;this.mobileAttack=false;this.stick={x:0,y:0}};
  window.addEventListener('blur',clear);document.addEventListener('visibilitychange',()=>{if(document.hidden)clear()});
  canvas.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'){this.mouse.x=e.clientX;this.mouse.y=e.clientY;this.mouse.active=true}});
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button===0){this.mouse.x=e.clientX;this.mouse.y=e.clientY;this.mouse.down=true;this.mouse.active=true}});
  window.addEventListener('pointerup',e=>{if(e.pointerType==='mouse')this.mouse.down=false});
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
  attack.addEventListener('pointerdown',e=>{e.preventDefault();attack.setPointerCapture(e.pointerId);this.mobileAttack=true});
  for(const evt of ['pointerup','pointercancel','lostpointercapture'])attack.addEventListener(evt,()=>this.mobileAttack=false);
  document.querySelector('#dashTouch').addEventListener('pointerdown',e=>{e.preventDefault();this.dashQueued=true});
  document.querySelector('#abilityTouch').addEventListener('pointerdown',e=>{e.preventDefault();this.abilityQueued=true});
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
 attacking(){return this.mouse.down||this.mobileAttack||this.keys.has('KeyF')||this.keys.has('KeyJ')}
 consumeDash(){const result=this.dashQueued;this.dashQueued=false;return result}
 consumeAbility(){const result=this.abilityQueued;this.abilityQueued=false;return result}
}
