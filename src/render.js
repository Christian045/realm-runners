import {CLASSES,ENEMY_DATA,TILE,clamp} from './data.js';
import {ROOM_W,ROOM_H,ROOM_COLS,ROOM_ROWS} from './dungeon.js';
const hash=(x,y,seed=0)=>{let a=Math.imul(x+seed,374761393)+Math.imul(y,668265263);a=Math.imul(a^(a>>>13),1274126177);return (a^(a>>>16))>>>0};
const fill=(ctx,color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h)};
export class Renderer {
 constructor(canvas){
  this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.ctx.imageSmoothingEnabled=false;
  this.resize();window.addEventListener('resize',()=>this.resize());
 }
 resize(){
  const dpr=Math.min(2,window.devicePixelRatio||1);
  this.canvas.width=Math.round(innerWidth*dpr);this.canvas.height=Math.round(innerHeight*dpr);
  this.canvas.style.width=innerWidth+'px';this.canvas.style.height=innerHeight+'px';
  this.scale=dpr*(innerWidth<700?1.06:1.16);
 }
 updateCamera(game){
  const cam=game.camera,cw=this.canvas.width/this.scale,ch=this.canvas.height/this.scale;
  cam.scale=this.scale;cam.w=cw;cam.h=ch;
  if(!game.player)return;
  const width=game.dungeon.width*TILE,height=game.dungeon.height*TILE;
  const tx=clamp(game.player.x-cw/2,0,Math.max(0,width-cw));
  const ty=clamp(game.player.y-ch/2,0,Math.max(0,height-ch));
  cam.x+=(tx-cam.x)*.23;cam.y+=(ty-cam.y)*.23;
 }
 draw(game){
  const c=this.ctx,canvas=this.canvas;
  c.setTransform(1,0,0,1,0,0);
  fill(c,'#09161b',0,0,canvas.width,canvas.height);
  if(!game.dungeon){this.titleBackground();return}
  c.setTransform(this.scale,0,0,this.scale,-game.camera.x*this.scale,-game.camera.y*this.scale);
  this.map(game);
  const entities=[
   ...game.loot.map(e=>({kind:'loot',e,y:e.y})),
   ...game.enemies.map(e=>({kind:'enemy',e,y:e.y})),
   {kind:'player',e:game.player,y:game.player.y}
  ].sort((a,b)=>a.y-b.y);
  for(const v of entities){
   if(v.kind==='player')this.player(v.e,game.time);
   else if(v.kind==='enemy')this.enemy(v.e,game.time);
   else this.drop(v.e,game.time);
  }
  for(const b of game.projectiles)this.projectile(b);
  for(const e of game.effects)this.effect(e);
  this.minimap(game);
 }
 titleBackground(){
  const c=this.ctx,w=this.canvas.width,h=this.canvas.height;
  const grad=c.createRadialGradient(w*.5,h*.43,50,w*.5,h*.5,Math.max(w,h)*.68);
  grad.addColorStop(0,'#254b48');grad.addColorStop(.55,'#102b30');grad.addColorStop(1,'#071519');
  c.fillStyle=grad;c.fillRect(0,0,w,h);
  for(let i=0;i<115;i++){
   const x=hash(i,4)%w,y=hash(i,8)%h;
   c.globalAlpha=.1+(hash(i,3)%55)/180;
   fill(c,i%3?'#84b99f':'#f6d6a2',x,y,3+(hash(i,2)%5),3+(hash(i,5)%5));
  }
  c.globalAlpha=1;
  c.textAlign='center';c.font='900 '+Math.min(58,Math.max(25,w/23))+'px monospace';
  c.fillStyle='#c3dbb0';c.fillText('✦',w/2,h*.19);
 }
 map(game){
  const c=this.ctx,d=game.dungeon,cam=game.camera;
  const minX=Math.max(0,Math.floor(cam.x/TILE)-1),maxX=Math.min(d.width,Math.ceil((cam.x+cam.w)/TILE)+1);
  const minY=Math.max(0,Math.floor(cam.y/TILE)-1),maxY=Math.min(d.height,Math.ceil((cam.y+cam.h)/TILE)+1);
  for(let y=minY;y<maxY;y++)for(let x=minX;x<maxX;x++){
   const tile=d.tileAt(x,y),px=x*TILE,py=y*TILE,n=hash(x,y,d.seed);
   if(tile===0){
    fill(c,n%5?'#233b3a':'#284440',px,py,TILE,TILE);
    fill(c,'#294340',px+2,py+2,44,1);
    if(n%4===0)fill(c,'#3d5550',px+(n%31)+4,py+21,8,2);
    if(n%8===0){fill(c,'#385d4a',px+11,py+32,2,7);fill(c,'#5c8460',px+13,py+29,3,6)}
    if(n%23===0){fill(c,'#c5a56c',px+27,py+25,3,3);fill(c,'#b7bf8c',px+31,py+29,2,2)}
   }else if(tile===2){
    fill(c,'#202f34',px,py,TILE,TILE);
    fill(c,'#0b2228',px+7,py+14,36,33);
    fill(c,'#526c68',px+5,py+5,34,32);
    fill(c,'#64756f',px+7,py+6,26,7);
    fill(c,'#334f51',px+10,py+20,23,13);
    fill(c,'#738a75',px+7,py+3,30,4);
   }else{
    fill(c,'#0c2229',px,py,TILE,TILE);
    fill(c,'#2d4b4d',px+1,py+1,TILE-2,TILE-2);
    fill(c,'#425e5c',px+3,py+3,42,7);
    fill(c,'#1e373e',px+3,py+14,42,30);
    fill(c,'#152c33',px+2,py+37,43,8);
    if(n%3===0)fill(c,'#59736b',px+14,py+8,15,2);
    if(n%7===0)fill(c,'#436b58',px+4,py+32,13,3);
   }
  }
  // Blocking door runes appear only during live combat.
  if(game.enemies.length){
   c.strokeStyle='#fd657d';c.lineWidth=3;
   for(const key of d.doors){
    const [x,y]=key.split(',').map(Number),px=x*TILE,py=y*TILE;
    if(px<cam.x-50||py<cam.y-50||px>cam.x+cam.w+50||py>cam.y+cam.h+50)continue;
    fill(c,'#8b334c88',px,py,TILE,TILE);
    c.beginPath();c.moveTo(px+5,py+7);c.lineTo(px+43,py+41);c.moveTo(px+43,py+7);c.lineTo(px+5,py+41);c.stroke();
   }
  }
  for(const room of d.rooms)if(room.visited||room.type==='start'){
   c.textAlign='center';c.font='11px monospace';c.fillStyle='#9ab5a177';
   c.fillText(room.type==='boss'?'THRON':room.type==='treasure'?'SCHATZ':'KAMMER '+(room.id+1),room.cx,room.cy-ROOM_H*TILE*.34);
  }
 }
 shadow(x,y,r){const c=this.ctx;c.fillStyle='#08141888';c.beginPath();c.ellipse(x,y+9,r*1.1,r*.48,0,0,Math.PI*2);c.fill()}
 player(p,time){
  if(!p)return;
  const c=this.ctx,k=CLASSES[p.kind],f=p.direction;
  this.shadow(p.x,p.y,p.radius+5);
  c.save();c.translate(p.x,p.y);
  if(p.invulnerable>0&&Math.floor(time*20)%3===0)c.globalAlpha=.55;
  // Outer cloak and torso stay oriented towards the target.
  c.rotate(Math.atan2(f.y,f.x)+Math.PI/2);
  c.fillStyle='#152c36';c.beginPath();c.moveTo(-16,14);c.lineTo(0,-18);c.lineTo(16,14);c.closePath();c.fill();
  c.fillStyle=k.color;c.beginPath();c.moveTo(-11,12);c.lineTo(0,-18);c.lineTo(11,12);c.closePath();c.fill();
  c.fillStyle='#e7d6ad';c.beginPath();c.arc(0,-4,9,0,Math.PI*2);c.fill();
  fill(c,'#152d37',-9,-16,18,6);
  fill(c,'#f7e5c0',-3,-14,6,4);
  if(p.kind==='warrior'){fill(c,'#a4c6d2',13,-15,5,24);fill(c,'#f7ecd2',11,-19,9,8)}
  else if(p.kind==='hunter'){c.strokeStyle='#e7c184';c.lineWidth=4;c.beginPath();c.arc(12,0,13,-1.6,1.6);c.stroke()}
  else{fill(c,'#bb97f9',13,-11,6,6);fill(c,'#694cb0',15,-7,3,20)}
  c.restore();
  if(p.dashTimer>0){c.strokeStyle='#b1f1ee99';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y,24,0,Math.PI*2);c.stroke()}
 }
 enemy(e,time){
  const c=this.ctx,s=ENEMY_DATA[e.type],r=e.radius;
  this.shadow(e.x,e.y,r+4);
  c.save();c.translate(e.x,e.y);
  const bob=Math.sin(time*4+e.x*.15)*2;
  c.translate(0,bob);
  c.fillStyle=e.flash>0?'#fff8ef':s.color;
  if(e.type==='slime'){
   c.beginPath();c.ellipse(0,4,r,r*.83,0,Math.PI,Math.PI*2);c.lineTo(r,10);c.lineTo(-r,10);c.fill();
   fill(c,'#213b39',-9,0,5,5);fill(c,'#213b39',4,0,5,5);
  }else if(e.type==='mushroom'){
   fill(c,'#e8c6a4',-8,-1,16,20);
   c.beginPath();c.ellipse(0,-5,r,r*.64,0,Math.PI,Math.PI*2);c.fill();
   fill(c,'#ffe5b6',-9,-10,6,5);fill(c,'#ffe5b6',5,-14,6,5);
  }else if(e.type==='archer'){
   c.beginPath();c.arc(0,0,r,0,Math.PI*2);c.fill();
   fill(c,'#26374d',-9,-5,18,10);fill(c,'#f2debc',-7,1,5,4);fill(c,'#f2debc',3,1,5,4);
  }else if(e.type==='goblin'){
   c.beginPath();c.moveTo(-r,4);c.lineTo(-r-7,-8);c.lineTo(-6,-r);c.lineTo(7,-r);c.lineTo(r+7,-8);c.lineTo(r,4);c.closePath();c.fill();
   fill(c,'#3a3730',-9,-2,6,5);fill(c,'#3a3730',4,-2,6,5);
  }else{
   c.fillStyle='#633950';c.beginPath();c.ellipse(0,5,r+4,r*.94,0,0,Math.PI*2);c.fill();
   c.fillStyle=e.flash>0?'#ffebdf':'#f97e99';c.beginPath();c.ellipse(0,-5,r,r*.82,0,0,Math.PI*2);c.fill();
   c.fillStyle='#f6d38a';c.beginPath();c.moveTo(-24,-25);c.lineTo(-15,-46);c.lineTo(-4,-28);c.lineTo(8,-48);c.lineTo(22,-27);c.closePath();c.fill();
   fill(c,'#322a3b',-15,-4,9,7);fill(c,'#322a3b',7,-4,9,7);
   fill(c,'#fff0e1',-13,-3,4,4);fill(c,'#fff0e1',9,-3,4,4);
  }
  c.restore();
  const ratio=clamp(e.hp/e.maxHp,0,1);
  if(e.hp<e.maxHp||e.type==='boss'){
   const width=e.type==='boss'?94:36;
   fill(c,'#17232a',e.x-width/2,e.y-r-24,width,7);
   fill(c,e.type==='boss'?'#e86c83':'#e1a67d',e.x-width/2,e.y-r-24,width*ratio,7);
  }
  if(e.windup>0){
   c.strokeStyle=e.type==='boss'?'#ff7898':'#eed0ff';c.lineWidth=2;
   c.beginPath();c.arc(e.x,e.y,e.radius+9,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-e.windup/(e.type==='boss'?.8:.58)));c.stroke();
  }
 }
 drop(d,t){
  const c=this.ctx,pulse=Math.sin(t*5+d.x)*2;this.shadow(d.x,d.y,8);
  c.save();c.translate(d.x,d.y-5+pulse);
  c.fillStyle=d.type==='coin'?'#f5d38b':'#8ee4bd';
  c.beginPath();c.moveTo(0,-11);c.lineTo(10,0);c.lineTo(0,11);c.lineTo(-10,0);c.closePath();c.fill();
  c.fillStyle='#ffffff88';c.fillRect(-3,-5,4,7);c.restore();
 }
 projectile(b){
  const c=this.ctx;c.fillStyle=b.hostile?'#ff8198':b.magic?'#c2a1ff':'#e3d89e';
  c.shadowColor=c.fillStyle;c.shadowBlur=10;
  c.beginPath();c.arc(b.x,b.y,b.radius,0,Math.PI*2);c.fill();c.shadowBlur=0;
 }
 effect(e){
  const c=this.ctx,alpha=clamp(e.life/e.maxLife,0,1);
  c.save();c.globalAlpha=alpha;c.strokeStyle=e.color;c.fillStyle=e.color;
  if(e.type==='ring'){
   c.lineWidth=5;c.beginPath();c.arc(e.x,e.y,e.radius*(1-alpha*.2),0,Math.PI*2);c.stroke();
  }else if(e.type==='slash'){
   c.lineWidth=12;c.beginPath();c.arc(e.x,e.y,e.radius,e.angle-.8,e.angle+.8);c.stroke();
   c.lineWidth=3;c.strokeStyle='#fff8dd';c.stroke();
  }else if(e.type==='text'){
   c.font='bold 17px monospace';c.textAlign='center';c.strokeStyle='#122a32';c.lineWidth=4;
   c.strokeText(e.text||'',e.x,e.y-(1-alpha)*22);
   c.fillText(e.text||'',e.x,e.y-(1-alpha)*22);
  }else{
   for(let i=0;i<7;i++){
    const a=i*Math.PI*2/7+(e.x%3);
    fill(c,e.color,e.x+Math.cos(a)*e.radius*(1-alpha),e.y+Math.sin(a)*e.radius*(1-alpha),4,4);
   }
  }
  c.restore();
 }
 minimap(game){
  const c=this.ctx,d=game.dungeon,dp=Math.min(2,window.devicePixelRatio||1);
  const size=19*dp,gap=4*dp;
  const px=this.canvas.width-ROOM_COLS*(size+gap)-26*dp,py=81*dp;
  c.setTransform(1,0,0,1,0,0);
  fill(c,'#091a20cc',px-11*dp,py-11*dp,ROOM_COLS*(size+gap)+16*dp,ROOM_ROWS*(size+gap)+16*dp);
  const active=d.roomAt(game.player.x,game.player.y);
  for(const room of d.rooms){
   const x=px+room.gx*(size+gap),y=py+room.gy*(size+gap);
   fill(c,room.visited?'#5d8273':'#1d3940',x,y,size,size);
   if(room.type==='boss'&&room.visited)fill(c,'#e47c91',x+size*.25,y+size*.25,size*.5,size*.5);
   if(room.type==='treasure'&&room.visited)fill(c,'#f5d28d',x+size*.25,y+size*.25,size*.5,size*.5);
   if(active?.id===room.id){c.strokeStyle='#fff0cf';c.lineWidth=2*dp;c.strokeRect(x,y,size,size)}
  }
 }
}