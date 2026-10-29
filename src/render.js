import {CLASSES,ENEMY_DATA,TILE,clamp} from './data.js?v=0.15.0';
import {ROOM_W,ROOM_H,ROOM_COLS,ROOM_ROWS} from './dungeon.js';
import {drawDungeonAtmosphere,drawBossWarnings,drawVignette} from './atmosphere.js?v=0.18.1';
import {drawTowerVictory} from './tower-visuals.js';
import {PixelSpriteAtlas,spriteIdentity} from './sprites.js?v=0.18.1';
import {PixelTileAtlas,tileTheme,tileVariant} from './tileset.js?v=0.18.1';
import {drawArchitecturalDepth,drawAnchoredDressings,drawDynamicLighting} from './visual-world.js?v=0.14.0';
import {drawImpact,drawMagicTrail} from './visual-impact.js?v=0.14.0';
import {drawWarriorSword,drawMageStaff,weaponFacing} from './weapon-visuals.js?v=0.18.1';
const hash=(x,y,seed=0)=>{let a=Math.imul(x+seed,374761393)+Math.imul(y,668265263);a=Math.imul(a^(a>>>13),1274126177);return (a^(a>>>16))>>>0};
const fill=(ctx,color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h)};
export class Renderer {
 constructor(canvas){
  this.canvas=canvas;this.ctx=canvas.getContext('2d',{alpha:false});this.ctx.imageSmoothingEnabled=false;
  this.sprites=new PixelSpriteAtlas();this.tiles=new PixelTileAtlas();
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
  const shake=game.shake||0;
  const sx=shake?Math.sin(performance.now()*.099)*shake:0;
  const sy=shake?Math.cos(performance.now()*.11)*shake:0;
  c.setTransform(this.scale,0,0,this.scale,(-game.camera.x+sx)*this.scale,(-game.camera.y+sy)*this.scale);
  this.map(game);
  drawArchitecturalDepth(c,game);
  drawDungeonAtmosphere(c,game);
  drawAnchoredDressings(c,game);
  drawDynamicLighting(c,game);
  this.fogOfWar(game);
  drawBossWarnings(c,game);
  for(const h of game.hazards||[]){
   c.save();c.globalAlpha=.14+.25*(1-Math.max(0,h.time)/h.maxTime);
   c.fillStyle=h.color||'#ff895a';c.strokeStyle=h.color||'#ffd5a1';c.lineWidth=3;
   c.beginPath();c.arc(h.x,h.y,h.radius,0,Math.PI*2);c.fill();c.stroke();
   c.restore();
  }
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
  drawTowerVictory(c,game);
  drawVignette(c,game,canvas);
  // Portrait Safari: the map otherwise overlaps the boss HP / attack HUD.
  // Restore it automatically when the boss is defeated or outside combat.
  if(!(game.camera.w<700&&game.getActiveBoss?.()))this.minimap(game);
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
   const tile=d.tileAt(x,y),room=d.roomAt((x+.5)*TILE,(y+.5)*TILE);
   const px=x*TILE,py=y*TILE;
   if(!room){fill(c,'#06141b',px,py,TILE,TILE);continue}
   const biome=tileTheme(room),variant=tileVariant(d.seed,x,y);
   if(!this.tiles.draw(c,biome,tile,variant,px,py,TILE)){
    // Canvas creation can be blocked by restrictive browsers; collision stays unchanged.
    fill(c,tile===0?'#284440':tile===2?'#526c68':'#243d43',px,py,TILE,TILE);
   }
  }
  // Carved archways and engraved thresholds; red seals only in combat.
  const sealed=game.enemies.some(e=>e.hp>0);
  for(const gate of d.gates){
   const x=gate.x,y=gate.y,v=gate.orientation==='vertical';
   if(x<cam.x-145||y<cam.y-145||x>cam.x+cam.w+145||y>cam.y+cam.h+145)continue;
   c.save();
   if(v){
    fill(c,'#17292b',x-11,y-73,22,146);fill(c,'#668376',x-9,y-73,18,10);
    fill(c,'#82998a',x-9,y+63,18,9);fill(c,'#b4bba1',x-3,y-63,6,126);
   }else{
    fill(c,'#17292b',x-73,y-11,146,22);fill(c,'#668376',x-73,y-9,10,18);
    fill(c,'#82998a',x+63,y-9,10,18);fill(c,'#b4bba1',x-63,y-3,126,6);
   }
   if(sealed){
    c.strokeStyle='#ff748a';c.globalAlpha=.65+.3*Math.sin(game.time*8);c.lineWidth=6;
    c.beginPath();
    if(v){c.moveTo(x,y-64);c.lineTo(x,y+64)}
    else{c.moveTo(x-64,y);c.lineTo(x+64,y)}
    c.stroke();
   }
   c.restore();
  }
  // Keep the playable floor free of room-name labels. Room identity
  // remains visible through architecture, lighting and the minimap.
 }
 fogOfWar(game){
  const c=this.ctx,d=game.dungeon;
  for(const room of d.rooms){
   if(room.visited||room.discovered)continue;
   const x=room.gx*ROOM_W*TILE,y=room.gy*ROOM_H*TILE;
   c.fillStyle='#061016f2';c.fillRect(x,y,ROOM_W*TILE,ROOM_H*TILE);
  }
 }
 shadow(x,y,r){
  const c=this.ctx;
  c.save();c.fillStyle='#060e13a8';c.beginPath();c.ellipse(x+2,y+10,r*1.18,r*.49,0,0,Math.PI*2);c.fill();
  c.fillStyle='#13252b70';c.beginPath();c.ellipse(x-3,y+5,r*.82,r*.27,0,0,Math.PI*2);c.fill();
  c.restore();
 }
 player(p,time){
  if(!p)return;
  const c=this.ctx,k=CLASSES[p.kind],f=p.direction||{x:0,y:1};
  const face=weaponFacing(f);
  const drawWeapon=()=>{if(p.kind==='warrior')drawWarriorSword(c,p);else if(p.kind==='mage')drawMageStaff(c,p)};
  this.shadow(p.x,p.y,p.radius+5);
  // Looking north places the weapon behind the body; other facings show it in front.
  if(face==='up')drawWeapon();
  if(!this.sprites.draw(c,p,spriteIdentity(p,true),time,true)){
  c.save();c.translate(p.x,p.y);
  c.translate(0,p.dashTimer>0?-3:Math.sin(p.walkCycle||0)*2);
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
  }
  if(face!=='up')drawWeapon();
  if(p.shield>0){c.save();c.globalAlpha=.5+.12*Math.sin(time*8);c.strokeStyle='#a8e7ff';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y,23,0,Math.PI*2);c.stroke();c.restore()}
  if(p.dashTimer>0){c.strokeStyle='#b1f1ee99';c.lineWidth=3;c.beginPath();c.arc(p.x,p.y,24,0,Math.PI*2);c.stroke()}
 }
 enemy(e,time){
  const c=this.ctx,s=ENEMY_DATA[e.type],r=e.radius;
  this.shadow(e.x,e.y,r+4);
  if(!this.sprites.draw(c,e,spriteIdentity(e),time,false)){
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
  }else if(e.type==='boss'&&e.boss?.variant==='warden'){
   c.fillStyle='#243849';c.beginPath();c.ellipse(0,5,r+5,r*.87,0,0,Math.PI*2);c.fill();
   c.fillStyle=e.flash>0?'#f5ffff':'#6a91b3';c.beginPath();c.moveTo(-r,-18);c.lineTo(-r+4,24);c.lineTo(r-4,24);c.lineTo(r,-18);c.closePath();c.fill();
   fill(c,'#263d57',-28,-19,56,15);fill(c,'#b5d9ef',-22,-16,44,6);
   fill(c,'#102631',-17,-4,34,15);fill(c,'#8ff4e9',-10,0,7,5);fill(c,'#8ff4e9',5,0,7,5);
   fill(c,'#7bafff',-4,-29,8,20);
   for(const xx of [-27,19])fill(c,'#7dd6d8',xx,11,8,12);
  }else{
   c.fillStyle='#633950';c.beginPath();c.ellipse(0,5,r+4,r*.94,0,0,Math.PI*2);c.fill();
   c.fillStyle=e.flash>0?'#ffebdf':e.boss?.phase===2?'#d55883':'#f97e99';c.beginPath();c.ellipse(0,-5,r,r*.82,0,0,Math.PI*2);c.fill();
   c.fillStyle=e.boss?.phase===2?'#ffd6e0':'#f6d38a';c.beginPath();c.moveTo(-24,-25);c.lineTo(-15,-46);c.lineTo(-4,-28);c.lineTo(8,-48);c.lineTo(22,-27);c.closePath();c.fill();
   fill(c,'#322a3b',-15,-4,9,7);fill(c,'#322a3b',7,-4,9,7);
   fill(c,'#fff0e1',-13,-3,4,4);fill(c,'#fff0e1',9,-3,4,4);
  }
  c.restore();
  }
  if(['tower','sovereign'].includes(e.boss?.variant)){
   const pulse=.7+.22*Math.sin(time*5);
   c.save();c.strokeStyle=e.boss.color;c.globalAlpha=pulse;c.lineWidth=e.boss.phase===3?7:4;
   c.beginPath();c.arc(e.x,e.y,r+(e.boss.phase===3?23:13),0,Math.PI*2);c.stroke();
   if(e.boss.phase===3){
    c.beginPath();c.arc(e.x,e.y,r+33,0,Math.PI*2);c.stroke();
   }
   c.restore();
  }
  if(e.burn>0||e.poison>0||e.slow>0){
   const col=e.burn>0?'#ffc078':e.poison>0?'#9add7f':'#9edbff';
   c.save();c.globalAlpha=.5+.25*Math.sin(time*11);c.strokeStyle=col;c.lineWidth=3;
   c.beginPath();c.arc(e.x,e.y,r+3,0,Math.PI*2);c.stroke();c.restore();
  }
  if(e.elite){c.save();c.strokeStyle='#f9cf82';c.globalAlpha=.65+.25*Math.sin(time*7);
   c.lineWidth=3;c.beginPath();c.arc(e.x,e.y,r+7,0,2*Math.PI);c.stroke();c.restore()}
  const ratio=clamp(e.hp/e.maxHp,0,1);
  if(e.hp<e.maxHp||e.type==='boss'){
   const width=e.type==='boss'?94:36;
   fill(c,'#17232a',e.x-width/2,e.y-r-24,width,7);
   fill(c,e.type==='boss'?'#e86c83':'#e1a67d',e.x-width/2,e.y-r-24,width*ratio,7);
  }
  if(e.boss?.phase===2){
   c.save();c.globalAlpha=.55+.22*Math.sin(time*8);c.strokeStyle='#ff6f9f';c.lineWidth=4;
   c.beginPath();c.arc(e.x,e.y,r+7,0,Math.PI*2);c.stroke();c.restore();
  }
  if(e.elite&&e.eliteMod){
   c.font='bold 9px monospace';c.textAlign='center';c.fillStyle='#f4d4a6';
   c.fillText(({swift:'FLINK',guardian:'PANZER',arcane:'ARKAN',volatile:'EXPLOSIV',vampiric:'VAMPIR'})[e.eliteMod]||'ELITE',e.x,e.y-r-34);
  }
  if(e.flash>0){
   c.save();c.globalAlpha=Math.min(.43,e.flash*1.75);c.strokeStyle='#fff5de';c.lineWidth=3;
   c.beginPath();c.arc(e.x,e.y-r*.19,r+4+e.flash*19,0,Math.PI*2);c.stroke();c.restore();
  }
  if(e.windup>0){
   c.strokeStyle=e.type==='boss'?'#ff7898':'#eed0ff';c.lineWidth=2;
   c.beginPath();c.arc(e.x,e.y,e.radius+9,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-e.windup/.58));c.stroke();
  }
 }
 drop(d,t){
  const c=this.ctx,pulse=Math.sin(t*5+d.x)*2;this.shadow(d.x,d.y,8);
  c.save();c.translate(d.x,d.y-5+pulse);
  c.fillStyle=d.type==='gear'?({common:'#d9e6d2',rare:'#88cfff',epic:'#cf9aff',legendary:'#ffd075'}[d.item?.rarity]||'#d6cbeb'):d.type==='coin'?'#f5d38b':'#8ee4bd';
  c.beginPath();c.moveTo(0,-11);c.lineTo(10,0);c.lineTo(0,11);c.lineTo(-10,0);c.closePath();c.fill();
  c.fillStyle='#ffffff88';c.fillRect(-3,-5,4,7);c.restore();
 }
 projectile(b){
  const c=this.ctx;
  const color=b.hostile?'#ff8198':b.magic?'#c2a1ff':b.charged?'#c6fba1':'#e3d89e';
  c.save();c.shadowColor=color;c.shadowBlur=b.magic||b.charged?15:7;c.fillStyle=color;
  if(!b.hostile&&!b.magic){
   // Razor-sharp arrowheads make direction and charged penetration visible.
   const a=Math.atan2(b.vy,b.vx);c.translate(b.x,b.y);c.rotate(a);
   c.fillRect(b.charged?-21:-12,-2,b.charged?30:20,b.charged?4:3);
   c.beginPath();c.moveTo(b.charged?21:15,0);c.lineTo(4,b.charged?-9:-5);
   c.lineTo(4,b.charged?9:5);c.closePath();c.fill();
   if(b.charged){c.strokeStyle='#eaffd7';c.lineWidth=2;c.strokeRect(-15,-5,17,10)}
  }else{
   c.beginPath();c.arc(b.x,b.y,b.radius,0,Math.PI*2);c.fill();
   if(b.magic){c.strokeStyle='#f2e1ff';c.lineWidth=2;c.stroke()}
  }
  c.restore();
 }
 effect(e){
  const c=this.ctx,alpha=clamp(e.life/e.maxLife,0,1);
  c.save();c.globalAlpha=alpha;c.strokeStyle=e.color;c.fillStyle=e.color;
  if(e.type==='death'){
   const sprite=this.sprites.frame(e.kind,'death',0,'down',e.phaseTwo);
   if(sprite){
    const scale=e.kind==='sovereign'?3.85:e.kind==='slimeking'||e.kind==='warden'||e.kind?.startsWith('tower')?3.1:e.elite?1.85:1.62;
    const w=sprite.width*scale,h=sprite.height*scale;
    c.drawImage(sprite,Math.round(e.x-w/2),Math.round(e.y-h*.76-(1-alpha)*10),Math.round(w),Math.round(h));
   }
  }else if(e.type==='ring'){
   c.lineWidth=5;c.beginPath();c.arc(e.x,e.y,e.radius*(1-alpha*.2),0,Math.PI*2);c.stroke();
  }else if(e.type==='impact'){
   c.restore();drawImpact(c,e,alpha);return;
  }else if(e.type==='ember'||e.type==='magic-trail'){
   c.restore();drawMagicTrail(c,{...e,kind:e.type},alpha);return;
  }else if(e.type==='slash'){
   // Thin directional trail supports the visible sword, not replaces it.
   c.globalAlpha=alpha*.65;c.lineWidth=6;
   c.beginPath();c.arc(e.x,e.y,e.radius,e.angle-.8,e.angle+.8);c.stroke();
   c.lineWidth=2;c.strokeStyle='#fff8dd';c.stroke();
  }else if(e.type==='text'){
   c.font=(e.text?.startsWith('KRIT')?'900 24px monospace':'900 17px monospace');
   c.textAlign='center';c.shadowColor='#040e16';c.shadowBlur=5;
   c.strokeStyle='#0a1825';c.lineWidth=5;
   c.strokeText(e.text||'',e.x,e.y-(1-alpha)*22);
   c.fillText(e.text||'',e.x,e.y-(1-alpha)*22);
  }else if(e.type==='lightning'){
   c.lineWidth=4;c.shadowColor=e.color;c.shadowBlur=10;
   c.beginPath();c.moveTo(e.x,e.y);c.lineTo(e.x+Math.cos(e.angle)*e.radius,e.y+Math.sin(e.angle)*e.radius);c.stroke();c.shadowBlur=0;
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
  const size=15*dp,gap=3*dp,pitch=size+gap;
  const w=ROOM_COLS*pitch,h=ROOM_ROWS*pitch;
  const px=this.canvas.width-w-24*dp,py=76*dp;
  c.setTransform(1,0,0,1,0,0);
  fill(c,'#081820dd',px-9*dp,py-9*dp,w+15*dp,h+15*dp);
  const current=d.roomAt(game.player.x,game.player.y);
  for(const room of d.rooms){
   if(!room.discovered&&!room.visited)continue;
   for(const id of room.links){
    if(id<room.id)continue;
    const other=d.rooms[id];
    if(!other.discovered&&!other.visited)continue;
    c.strokeStyle='#8ab5a4';c.lineWidth=3*dp;c.beginPath();
    c.moveTo(px+room.gx*pitch+size/2,py+room.gy*pitch+size/2);
    c.lineTo(px+other.gx*pitch+size/2,py+other.gy*pitch+size/2);c.stroke();
   }
  }
  for(const room of d.rooms){
   if(room.type==='secret'&&!room.visited)continue;
   if(!room.discovered&&!room.visited)continue;
   const x=px+room.gx*pitch,y=py+room.gy*pitch;
   fill(c,room.visited?'#6c9981':'#2b4b51',x,y,size,size);
   const flags={boss:'#ed788a',treasure:'#f1ce84',shrine:'#93e4c6',elite:'#eab36f',
    event:'#b6a3ea',library:'#a9b0e9',trap:'#e7977e',camp:'#9edbb7',vault:'#ffd38c',secret:'#efcda1'};
   if(room.visited&&flags[room.type])fill(c,flags[room.type],x+size*.28,y+size*.28,size*.44,size*.44);
   if(current?.id===room.id){c.strokeStyle='#fff3d5';c.lineWidth=2*dp;c.strokeRect(x-dp,y-dp,size+2*dp,size+2*dp)}
  }
  // The minimap is recognisable without an additional text caption.
 }

}