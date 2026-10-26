'use strict';
// v0.5 pixel edition: consistent chunky pixels, deterministic tile layers and crisp sprites.
// All coordinates use the original 960 × 540 gameplay space; art never changes hitboxes.
let visualTime=0,quality='full';
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
try{quality=localStorage.getItem('realm-runners-quality')==='low'?'low':'full';}catch{}
function qualityLabel(){$('#quality').textContent='Grafik: '+(quality==='full'?'Voll':'Sparsam');}
qualityLabel();$('#quality').onclick=()=>{quality=quality==='full'?'low':'full';qualityLabel();try{localStorage.setItem('realm-runners-quality',quality);}catch{}};
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let n=Math.imul(seed^seed>>>15,1|seed);n=n+Math.imul(n^n>>>7,61|n)^n;return((n^n>>>14)>>>0)/4294967296;};}
function ellipse(c,x,y,rx,ry,color){
 c.fillStyle=color;
 const cell=4;
 if(rx<3||ry<3){
  c.fillRect(Math.round((x-rx)/cell)*cell,Math.round((y-ry)/cell)*cell,
    Math.max(cell,Math.ceil(rx*2/cell)*cell),Math.max(cell,Math.ceil(ry*2/cell)*cell));
  return;
 }
 for(let yy=Math.ceil((y-ry)/cell)*cell;yy<y+ry;yy+=cell){
  const dy=Math.min(1,Math.abs((yy+cell/2-y)/ry));
  const half=rx*Math.sqrt(1-dy*dy);
  const left=Math.floor((x-half)/cell)*cell,right=Math.ceil((x+half)/cell)*cell;
  c.fillRect(left,yy,Math.max(cell,right-left),cell);
 }
}
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function line(c,x,y,xx,yy,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();}
function glow(x,y,r,color){
 ctx.save();ctx.fillStyle=color;
 for(let i=3;i>=1;i--){
  const d=Math.max(4,Math.floor(r*i/12)*4);
  ctx.globalAlpha=(4-i)*.21;
  ctx.fillRect(Math.floor((x-d)/4)*4,Math.floor((y-d)/4)*4,d*2,d*2);
 }
 ctx.restore();
}
// Deterministic rectangular tree canopies on three cached parallax planes.
// Each stage has an unmistakable color story while keeping the original pixel sprites.
const stageThemes=[
 {
  sky:['#75afbd','#93c9b9','#d0dba1','#8bb68b','#486e53','#26493d'],
  sun:'#fff0a4',sunCore:'#ffe2a3',haze:'#dbe6aa',
  trees:[
   ['#426a61','#568779','#84b39b','#a3c497'],
   ['#285b52','#3b795b','#65a86e','#9acc78'],
   ['#173e35','#285c3e','#4e8347','#79a650']
  ],
  soil:['#162d25','#37543a','#253d30','#416145','#a5d368','#527740','#7eab53'],
  flower:'#f4d977',detail:'#d6ec9d'
 },
 {
  sky:['#172c62','#284780','#406c9a','#548a98','#335d81','#193454'],
  sun:'#9bd3f5',sunCore:'#d6eaff',haze:'#8ac1d9',
  trees:[
   ['#293f71','#405f9c','#5480af','#78a9ce'],
   ['#173a65','#286290','#3d8eaf','#71b7c5'],
   ['#163a53','#1e5c71','#32848a','#63b9a4']
  ],
  soil:['#132c42','#24546b','#1b394e','#327080','#79c8cb','#397d92','#54aab7'],
  flower:'#f6b5e3',detail:'#9adff2'
 },
 {
  sky:['#382f55','#55416b','#81577a','#a17b74','#685767','#322f45'],
  sun:'#eecb95',sunCore:'#f8e4b2',haze:'#c9a9a0',
  trees:[
   ['#50475e','#655574','#8a6681','#a38299'],
   ['#3b4454','#54605e','#747d65','#a89b72'],
   ['#263a3c','#3b5650','#63785b','#a79f71']
  ],
  soil:['#252c35','#4e5157','#383f47','#62605c','#ae9e79','#726d60','#9d8e6a'],
  flower:'#ffd48c',detail:'#d8cba7'
 }
];
// Reusable tile-based planes; only the palette/geometry changes between biomes.
function makePlane(depth,biome){
 const c=document.createElement('canvas');c.width=1600;c.height=540;
 const p=c.getContext('2d'),r=rng(900+depth*120+biome*101),tile=8;
 const pal=stageThemes[biome].trees[depth],trees=[14,13,11][depth];
 const level2=biome===1,ruins=biome===2;
 for(let i=0;i<trees;i++){
  const x=Math.round((i*1600/trees+(r()-.5)*95)/tile)*tile;
  const top=Math.round((65+r()*165)/tile)*tile;
  const tw=(depth===2?4:2+depth)*tile+Math.floor(r()*3)*tile;
  p.fillStyle=pal[0];p.fillRect(x-tw/2,top,tw,540-top);
  p.fillStyle=pal[1];p.fillRect(x-tw/2+tile,top,Math.max(tile,tw/3),540-top);
  for(let k=0;k<3;k++){
   const by=top+54+k*80,dir=k%2?1:-1,reach=(6+Math.floor(r()*8))*tile;
   p.fillStyle=pal[k%2];p.fillRect(x+(dir<0?-reach:0),by,reach,tile*2);
   p.fillRect(x+(dir<0?-reach:reach-tile),by-tile*2,tile,tile*4);
  }
  const crownW=(depth===2?15:18)*tile,cy=top+20;
  for(let k=0;k<3;k++){
   const w=crownW-k*tile*3;
   p.fillStyle=pal[1+k%3];
   p.fillRect(Math.round((x-w/2)/tile)*tile,cy+k*tile*3,w,tile*6);
  }
  for(let k=0;k<74;k++){
   const lx=Math.round((x+(r()-.5)*crownW*1.25)/tile)*tile;
   const ly=Math.round((cy+r()*tile*13)/tile)*tile;
   p.fillStyle=pal[2+(k%2)];p.fillRect(lx,ly,tile*(1+(k%3===0)),tile);
  }
  if(level2){
   // The canopy level has unmistakable long hanging ropes and fluorescent leaves.
   for(let k=0;k<4;k++){
    const vx=x+Math.floor((r()-.5)*crownW/tile)*tile;
    const len=55+Math.floor(r()*8)*tile;
    p.fillStyle='#87bac1';p.fillRect(vx,cy+62,tile/2,len);
    p.fillStyle='#cf97d7';p.fillRect(vx-4,cy+len+52,tile*1.5,tile);
   }
  }else if(ruins){
   for(let k=0;k<4;k++){
    const vx=x+Math.floor((r()-.5)*crownW/tile)*tile;
    p.fillStyle=pal[3];p.fillRect(vx,cy+tile*9,tile/2,16+Math.floor(r()*6)*tile);
   }
  }
 }
 // Distant blocks make the world's silhouette different even when stationary.
 if(ruins)for(let i=0;i<6;i++){
  const x=i*283+45,y=330+Math.floor(r()*8)*8;
  p.fillStyle=pal[0];p.fillRect(x,y,80,540-y);
  p.fillRect(x-16,y,112,20);p.fillRect(x+16,y-40,48,40);
  p.fillStyle=pal[2];p.fillRect(x+8,y+25,16,24);p.fillRect(x+56,y+25,16,24);
 }else if(level2)for(let i=0;i<8;i++){
  const x=i*206+30,y=210+Math.floor(r()*10)*8;
  p.fillStyle=pal[2];p.fillRect(x,y,110,18);
  p.fillStyle=pal[0];p.fillRect(x+20,y+18,70,16);
 }
 return c;
}
const planeSets=Array.from({length:3},(_,biome)=>Array.from({length:3},(_,depth)=>makePlane(depth,biome)));
// Ground textures are cached once per level rather than regenerated every frame.
// Caches avoid repeated drawing work on slow mobile devices.
const terrainCache=new Map();
function terrain(p,index){
 const key=[stage,p.x,p.y,p.w].join(':');
 if(terrainCache.has(key))return terrainCache.get(key);
 const c=document.createElement('canvas');
 c.width=p.w+32;c.height=(p.y===G?H-p.y:42)+35;
 const q=c.getContext('2d'),r=rng(p.x+stage*200+21),soil=c.height-26,tile=8;
 const [dark,mid,low,block,grass,deep,detail]=stageThemes[stage].soil;
 q.fillStyle=dark;q.fillRect(16,20,p.w,soil);
 q.fillStyle=mid;q.fillRect(16,20,p.w,24);
 q.fillStyle=low;q.fillRect(16,44,p.w,Math.max(0,soil-28));
 for(let y=26;y<20+soil;y+=tile)for(let x=16;x<16+p.w;x+=tile){
  const choice=r();if(choice<.23){q.fillStyle=block;q.fillRect(x,y,tile,tile);}
  else if(choice>.85){q.fillStyle=dark;q.fillRect(x+tile/2,y+tile/2,tile/2,tile/2);}
 }
 q.fillStyle=deep;q.fillRect(16,14,p.w,12);
 q.fillStyle=grass;q.fillRect(16,14,p.w,5);
 for(let x=16;x<16+p.w;x+=tile){
  if(r()>.2){q.fillStyle=r()>.5?detail:grass;q.fillRect(x,8,tile/2,6);}
  if(r()>.76){q.fillStyle=deep;q.fillRect(x+2,26,tile/2,8);}
 }
 if(stage===1){ // Tree canopy: exposed wood planks and vertical hanging roots.
  for(let x=24;x<p.w;x+=24){q.fillStyle=dark;q.fillRect(x,32,3,17);}
  for(let x=28;x<p.w;x+=62){q.fillStyle=detail;q.fillRect(x,21,15,3);}
 }else if(stage===2){ // Moss ruins: unmistakable cracked stone-brick masonry.
  for(let y=30;y<20+soil;y+=18)for(let x=17+((y/18|0)%2)*15;x<16+p.w;x+=38){
   q.fillStyle=dark;q.fillRect(x,y,30,2);q.fillRect(x+29,y,2,14);
  }
 }else{ // Woodland: grassy foliage and tiny yellow blossoms.
  for(let x=28;x<p.w;x+=52){q.fillStyle=stageThemes[stage].flower;q.fillRect(x,10,4,4);}
 }
 if(p.y!==G)for(let x=28;x<p.w;x+=64){
  q.fillStyle=deep;q.fillRect(x,27,4,16);q.fillRect(x+4,39,8,4);
 }
 terrainCache.set(key,c);return c;
}
function background(){
 // Palette-locked sky and layered tile trees, without smooth gradients.
 const sky=['#142f3a','#1d3f47','#315851','#456c60','#38594f','#25463c'];
 for(let i=0;i<sky.length;i++){ctx.fillStyle=sky[i];ctx.fillRect(0,i*90,W,90);}
 const sx=Math.round((630-cam*.025)/4)*4;
 ctx.fillStyle='#96b892';ctx.fillRect(sx,100,64,64);
 ctx.fillStyle='#bed29d';ctx.fillRect(sx+12,112,40,40);
 for(let i=0;i<3;i++){
  const par=[.12,.32,.58][i],offset=((cam*par)%1600+1600)%1600;
  ctx.globalAlpha=[.65,.8,1][i];
  ctx.imageSmoothingEnabled=false;
  const shift=Math.round(offset/4)*4;
  ctx.drawImage(planes[i],-shift,0);
  ctx.drawImage(planes[i],1600-shift,0);
  ctx.globalAlpha=1;
  if(i<2){ctx.fillStyle=i===0?'#8aad8612':'#a5bd9314';ctx.fillRect(0,288+i*35,W,52);}
 }
 if(quality==='full')for(let i=0;i<5;i++){
  const x=340+i*145-Math.round(cam*.05/4)*4;
  poly(ctx,[[x,0],[x+24,0],[x-130,H],[x-192,H]],'#d0d6a012');
 }
 // Moosruinen: stacked block pillars and stair-step arches.
 if(stage===2){
  ctx.save();ctx.translate(Math.round((730-cam*.65)/4)*4,0);
  for(let n=0;n<4;n++){
   const x=n*330;
   ctx.fillStyle='#314f4b';ctx.fillRect(x,230,28,240);ctx.fillRect(x+116,230,28,240);
   ctx.fillRect(x+24,198,96,24);ctx.fillRect(x+40,181,64,17);
   ctx.fillStyle='#4e7263';ctx.fillRect(x+8,250,4,170);ctx.fillRect(x+124,250,4,170);
   ctx.fillStyle='#698e70';ctx.fillRect(x+35,196,68,5);
  }
  ctx.restore();
 }
}
function burst(x,y,color,count=12,speed=2){if(reducedMotion)count=Math.ceil(count/3);if(quality==='low')count=Math.ceil(count/2);for(let i=0;i<count&&particles.length<180;i++){let a=Math.random()*Math.PI*2,v=(.3+Math.random())*speed;particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,color,life:26+Math.random()*20,max:46,size:1+Math.random()*3});}}
function updateParticles(dt){for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.045*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);}
function motes(front=false){if(reducedMotion)return;let n=quality==='full'?32:10;for(let i=0;i<n;i++){let x=((i*137.8+Math.sin(visualTime*.38+i)*32-cam*(front?.9:.23))%1000+1000)%1000-20,y=80+(i*61%380)+Math.sin(visualTime*.6+i*3)*18;let a=.3+.3*Math.sin(visualTime*1.5+i);ctx.globalAlpha=a;if(front&&i%3===0){ctx.save();ctx.translate(x,y);ctx.rotate(visualTime*.5+i);ellipse(ctx,0,0,4,1.5,'#c5d88c');ctx.restore();}else {if(quality==='full')glow(x,y,10,'#d5f9a333');ellipse(ctx,x,y,1.4,1.4,'#ecffd0');}}ctx.globalAlpha=1;}
// Hand-authored pixel sprite: 16 × 24, rendered at 2×. Palette varies per class.
const sprite=[
'.....hhhhhh.....','....hhhhhhhh....','...hhhhhhhhhh...','...hhHHHHHHhh...',
'....HssssssH....','....sssEssss....','.....ssssss.....','......sss.......',
'....cccccccc....','...cCCcCCcCCc...','...cCCcCCcCCc...','...sCCcCCcCCs...',
'...sCCcCCcCCs...','....CCcCCcCC....','....bbbbbbbb....','....CCCCCCCC....',
'.....pppppp.....','.....pppppp.....','.....pp..pp.....','.....pp..pp.....',
'.....pp..pp.....','.....bb..bb.....','....bbb..bbb....','................'];
const characterFrames=new Map();
function spriteFrame(kind,frame,air){const key=kind+frame+air;if(characterFrames.has(key))return characterFrames.get(key);let c=document.createElement('canvas');c.width=24;c.height=28;const q=c.getContext('2d'),pal={h:'#20353a',H:'#74947c',s:'#e6bf97',E:'#14262b',c:'#213f44',C:classes[kind].color,b:'#b9ac7b',p:'#273841'};if(kind==='mage'){pal.h='#6d638e';pal.H='#a69bbd';}if(kind==='hunter'){pal.h='#3a6851';pal.H='#95b775';}
 const swing=air?2:[0,1,2,1,0,-1,-2,-1][frame];
 for(let y=0;y<sprite.length;y++)for(let x=0;x<16;x++){let v=sprite[y][x];if(v==='.'){continue;}let yy=y,xx=x+4;if(y>17){yy+=(x<8?swing:-swing);}if(y>9&&y<14&&(x<4||x>11))yy+=(x<8?-swing:swing);q.fillStyle=pal[v];q.fillRect(xx,yy+2,1,1);}
 if(kind==='warrior'){q.fillStyle='#d8e0c5';q.fillRect(20,12,2,9);q.fillStyle='#ac9060';q.fillRect(18,21,5,1);q.fillRect(20,22,1,3);}
 if(kind==='mage'){q.fillStyle='#95836a';q.fillRect(21,10,1,15);q.fillStyle='#bbebec';q.fillRect(20,8,3,3);poly(q,[[6,5],[12,0],[17,5]],'#8475a0');}
 if(kind==='hunter'){q.strokeStyle='#d3b87b';q.lineWidth=1;q.beginPath();q.moveTo(20,11);q.quadraticCurveTo(27,17,20,24);q.stroke();q.fillStyle='#d2d7b1';q.fillRect(20,11,1,14);}
 characterFrames.set(key,c);return c;
}
function drawHero(){const h=hero;if(!h)return;ellipse(ctx,h.x+15,h.y+h.h+2,18,4,'#081b2260');if(invincible&&Math.floor(invincible/6)%2)return;
 const running=h.on&&Math.abs(h.vx)>.1,frame=running?Math.floor(t/5)%8:0,bob=h.on?(running?Math.sin(t*.6)*.8:Math.sin(visualTime*3)*.7):0;
 ctx.save();ctx.translate(Math.round(h.x+15),Math.round(h.y+20+bob));ctx.scale(h.face,1);
 // Cloth trails behind the facing direction, animated separately from the legs.
 let flap=reducedMotion?0:Math.sin(t*.23)*3;poly(ctx,[[-9,-8],[-20-(running?5:0),12+flap],[-9,20],[-3,2]],save.class==='mage'?'#6a6089':save.class==='hunter'?'#477757':'#4c7186');
 ctx.imageSmoothingEnabled=false;ctx.drawImage(spriteFrame(save.class,frame,!h.on),-24,-27,48,56);ctx.restore();ctx.imageSmoothingEnabled=true;
 if(h.dash>0){ctx.strokeStyle='#d5f6e5aa';ctx.lineWidth=2;for(let i=0;i<3;i++)line(ctx,h.x+15-h.face*40,h.y+12+i*10,h.x+15,h.y+12+i*10,'#cceff0aa',2);}
}
function drawEnemy(e,i){if(!e.alive)return;const squash=Math.sin(t*.13+i)*1.6;ellipse(ctx,e.x+14,G+1,17,4,'#061e2670');ctx.save();ctx.translate(e.x+14,e.y+16);ctx.scale(e.dir,1);
 ellipse(ctx,0,0,15+squash,13-squash,'#3b7061');
ellipse(ctx,0,-5,12,8,'#73a47d');ellipse(ctx,-5,-8,6,3,'#c1dc9c');
 poly(ctx,[[-9,-10],[-10,-23],[-1,-13]],'#739b6a');poly(ctx,[[0,-12],[8,-23],[9,-9]],'#95b275');ellipse(ctx,3,-1,2,3,'#102f35');ellipse(ctx,11,-1,2,3,'#102f35');ellipse(ctx,4,-2,.7,.8,'#eef7d2');line(ctx,5,5,9,5,'#335b4e');ctx.restore();}
function finishFlag(cp){const x=cp.x,y=G;ellipse(ctx,x+8,y,25,5,'#071b2666');poly(ctx,[[x-10,y],[x-6,y-12],[x+22,y-12],[x+27,y]],'#75887b');ctx.fillStyle='#a9baa0';ctx.fillRect(x+5,y-83,4,72);let flap=Math.sin(visualTime*3+x)*4;
 poly(ctx,[[x+9,y-82],[x+52,y-77+flap],[x+45,y-54+flap],[x+9,y-58]],'#e1c686');line(ctx,x+14,y-76,x+14,y-63,'#edf0c8',2);glow(x+8,y-84,25,'#c7edaa44');ellipse(ctx,x+7,y-87,4,4,'#d6e7b5');}
// Single 480 x 270 pixel art buffer. The DOM HUD remains crisp and touch-friendly.
const pixelCanvas=document.createElement('canvas');
pixelCanvas.width=W/2;pixelCanvas.height=H/2;
const pixelCtx=pixelCanvas.getContext('2d');
function draw(){
 const screen=ctx;
 screen.save();screen.setTransform(1,0,0,1,0,0);
 screen.fillStyle='#091b20';screen.fillRect(0,0,canvas.width,canvas.height);
 screen.restore();
 ctx=pixelCtx;
 try{
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,pixelCanvas.width,pixelCanvas.height);
  ctx.setTransform(.5,0,0,.5,0,0);
  ctx.imageSmoothingEnabled=false;
  drawPixelScene();
 }finally{ctx=screen;}
 screen.save();screen.imageSmoothingEnabled=false;
 screen.drawImage(pixelCanvas,0,0,W,H);
 screen.restore();
}
function drawPixelScene(){ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();background();motes(false);
 ctx.save();ctx.translate(-cam,0);
 for(const [i,p] of solids().entries()){if(p.x+p.w<cam-20||p.x>cam+W+20)continue;ctx.drawImage(terrain(p,i),p.x-16,p.y-20);}
 // Ferns, luminous mushrooms and stones are fixed to safe ground, not gaps.
 for(const p of land()){for(let x=p.x+70;x<p.x+p.w-20;x+=133){if(x<cam-30||x>cam+W+30)continue;for(let j=0;j<5;j++){const angle=-Math.PI*.85+j*.28;line(ctx,x,G-2,x+Math.cos(angle)*19,G-2+Math.sin(angle)*20,'#6a9a65',2);for(let k=1;k<4;k++)ellipse(ctx,x+Math.cos(angle)*k*4,G-2+Math.sin(angle)*k*4,4,1.6,'#75a16b');}if(x%3<2){ctx.fillStyle='#adcbb0';ctx.fillRect(x+29,G-11,3,10);ellipse(ctx,x+30,G-12,8,4,'#82bcb0');ellipse(ctx,x+28,G-13,2,1,'#e0e9bf');}}}
 for(const s of spikes){for(let k=0;k<3;k++)poly(ctx,[[s.x+k*15,s.y+18],[s.x+8+k*15,s.y],[s.x+15+k*15,s.y+18]],'#bdc6b4');for(let k=0;k<3;k++)line(ctx,s.x+8+k*15,s.y+2,s.x+12+k*15,s.y+17,'#637c78',2);}
 for(const a of things){if(a.taken||a.x<cam-25||a.x>cam+W+25)continue;const y=a.y+(reducedMotion?0:Math.sin(visualTime*3+a.x)*3);if(a.type==='star'){glow(a.x,y,26,'#f3df8b35');let pts=[];for(let j=0;j<10;j++){const an=j*Math.PI/5-Math.PI/2,r=j%2?7:16;pts.push([a.x+Math.cos(an)*r,y+Math.sin(an)*r]);}poly(ctx,pts,'#f4dd93');line(ctx,a.x,y-10,a.x-3,y-1,'#fff4d0',2);}else{const rx=reducedMotion?6:3+Math.abs(Math.cos(visualTime*2+a.x))*4;ellipse(ctx,a.x,y,rx,9,'#99774b');ellipse(ctx,a.x,y-1,rx-1,7,'#e5be6c');line(ctx,a.x,y-5,a.x,y+3,'#fff0b0',1);}}
 bad.forEach(drawEnemy);finishFlag({x:WIDTH-77});drawHero();drawCombatEffects();
 for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);}ctx.globalAlpha=1;ctx.restore();
 if(quality==='full'){motes(true);ctx.fillStyle='#07191c46';ctx.fillRect(0,0,32,H);ctx.fillRect(W-32,0,32,H);ctx.fillRect(32,0,W-64,24);ctx.fillRect(32,H-24,W-64,24);}
 // Minimal in-world labels leave the playfield visible on a phone.
 if(scene==='game'&&t<240){ctx.globalAlpha=Math.min(1,(240-t)/60);ctx.textAlign='center';ctx.font='bold 12px monospace';ctx.fillStyle='#e0ebce';ctx.fillText('SMARAGDWALD  /  '+stages[stage].name.toUpperCase(),W/2,84);ctx.globalAlpha=1;}
 if(scene==='game'&&hero){const x=W-150,y=H-21;ctx.fillStyle='#152e32bb';ctx.fillRect(x,y,120,3);ctx.fillStyle='#b8d9ae';ctx.fillRect(x,y,120*(1-dashCooldown/70),3);ctx.font='bold 10px monospace';ctx.textAlign='right';ctx.fillStyle='#c1d9bd';ctx.fillText(dashCooldown>0?'FÄHIGKEIT LÄDT':'FÄHIGKEIT BEREIT',W-30,y-6);}
 ctx.restore();}
// Fixed 60 Hz simulation: refresh rate does not alter jumps or movement on 120 Hz phones.
let accumulator=0;
function frame(now){const elapsed=last?Math.min(100,Math.max(0,now-last)):16.667;last=now;if(scene!=='pause'&&!document.hidden){visualTime+=elapsed/1000;accumulator+=elapsed;let steps=0;while(accumulator>=1000/60&&steps<6){step(1);if(scene==='game')updateParticles(1);accumulator-=1000/60;steps++;}}else accumulator=0;draw();requestAnimationFrame(frame);}
menu();requestAnimationFrame(frame);
