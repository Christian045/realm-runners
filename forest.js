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
  sky:['#714769','#815479','#ad6b83','#ba8e85','#685267','#3e314b'],
  sun:'#eecb95',sunCore:'#f8e4b2',haze:'#c9a9a0',
  trees:[
   ['#50475e','#655574','#8a6681','#a38299'],
   ['#3b4454','#54605e','#747d65','#a89b72'],
   ['#263a3c','#3b5650','#63785b','#a79f71']
  ],
  soil:['#252c35','#4e5157','#383f47','#62605c','#ae9e79','#726d60','#9d8e6a'],
  flower:'#ffd48c',detail:'#d8cba7'
 },
 {
  // Luminescent mushrooms and teal marshes; quiet background lets platforms pop.
  sky:['#233750','#32475d','#4a6371','#506f68','#2d514d','#1b3b3d'],
  sun:'#c2b4ff',sunCore:'#efc7ff',haze:'#8eacac',
  trees:[
   ['#334257','#42576a','#506a79','#719195'],
   ['#283d54','#3a5868','#4c7776','#66998f'],
   ['#1c393f','#305950','#45806c','#7dac79']
  ],
  soil:['#152c38','#2b555a','#1b3b47','#36716a','#b8df8d','#538579','#8dc9a0'],
  flower:'#e9b8ff',detail:'#bcf8d9'
 },
 {
  // Boss throne uses ink-dark red/purple hues with bright gold floor accents.
  sky:['#2a263d','#362e48','#543d56','#584252','#352d42','#211e33'],
  sun:'#b07b8d',sunCore:'#f9ce9b',haze:'#a77b81',
  trees:[
   ['#343042','#473b50','#624e60','#886a77'],
   ['#2c2b41','#45374b','#604857','#7d6465'],
   ['#272a39','#3d3341','#554052','#76605e']
  ],
  soil:['#211d2d','#494051','#2e2938','#61505b','#f0c77e','#876c61','#ffdf98'],
  flower:'#f5b76c',detail:'#ffe2ad'
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
const planeSets=Array.from({length:stages.length},(_,biome)=>Array.from({length:3},(_,depth)=>makePlane(depth,biome)));
// Ground textures are cached once per level rather than regenerated every frame.
// Caches avoid repeated drawing work on slow mobile devices.
const terrainCache=new Map();
function terrain(p,index){
 const key=[stage,p.x,p.y,p.w].join(':');
 if(terrainCache.has(key))return terrainCache.get(key);
 const c=document.createElement('canvas');
 c.width=p.w+32;c.height=(p.y===G?H-p.y:42)+35;
 const q=c.getContext('2d'),r=rng((p.x+997)*(stage+11)),height=c.height;
 const fortress=stage===4||(stage===3&&p.x>=2020);
 const stone=fortress||stage===2;
 const material=fortress?
  {outline:'#141722',base:'#494556',side:'#655a6d',light:'#94869a',shadow:'#292635',chip:'#d6c49e',cap:'#d9c39a',top:'#ffe6a5'}:
  stage===0?{outline:'#14251d',base:'#42583a',side:'#576b45',light:'#748956',shadow:'#283b2c',chip:'#a1b97b',cap:'#79a64f',top:'#c5e883'}:
  stage===1?{outline:'#11283c',base:'#315d70',side:'#488397',light:'#74a5a6',shadow:'#1d465a',chip:'#a0d3d0',cap:'#61aeb1',top:'#b1ebda'}:
  stage===2?{outline:'#20232b',base:'#54545c',side:'#77767e',light:'#9b9b90',shadow:'#383b43',chip:'#b0bc94',cap:'#82a17a',top:'#c1d7a4'}:
  {outline:'#142c2e',base:'#33595b',side:'#4b7472',light:'#6e9f88',shadow:'#254347',chip:'#a5dabe',cap:'#77b396',top:'#c0efbc'};
 // Every block has a dark outer rim, crisp 16-pixel individual bricks and
 // small highlight chips. No semi-transparent layer sits over the foreground.
 q.fillStyle=material.outline;q.fillRect(14,16,p.w+4,height-16);
 q.fillStyle=material.base;q.fillRect(16,21,p.w,Math.max(0,height-23));
 for(let y=24;y<height;y+=16){
  const shift=((y/16|0)%2)*8;
  for(let x=16-shift;x<16+p.w;x+=16){
   const xx=Math.max(16,x),w=Math.min(16+p.w,x+16)-xx;
   if(w<=0)continue;
   const seed=r();
   q.fillStyle=seed<.19?material.shadow:seed<.56?material.base:material.side;
   q.fillRect(xx+1,y+1,Math.max(0,w-2),14);
   q.fillStyle=material.outline;q.fillRect(xx,y,Math.max(1,w),2);
   q.fillRect(xx,y,2,16);
   q.fillStyle=material.light;q.fillRect(xx+3,y+3,Math.max(0,w-6),2);
   if(seed>.53){q.fillStyle=material.chip;q.fillRect(xx+5,y+7,3,3);}
   if(seed<.25){q.fillStyle=material.shadow;q.fillRect(xx+9,y+10,5,2);}
  }
 }
 // Upper platform edge has a strong 3-tone silhouette against distant art.
 q.fillStyle=material.outline;q.fillRect(14,14,p.w+4,10);
 q.fillStyle=material.cap;q.fillRect(16,13,p.w,8);
 q.fillStyle=material.top;q.fillRect(16,13,p.w,4);
 q.fillStyle=material.shadow;q.fillRect(16,21,p.w,3);
 if(!fortress){
  for(let x=17;x<16+p.w-3;x+=8){
   const n=r();
   if(n>.31){
    q.fillStyle=n>.75?material.top:material.cap;
    q.fillRect(x,8,3,n>.75?6:4);
    if(n>.91)q.fillRect(x-3,10,3,3);
   }
   if(n>.81&&height>44){
    q.fillStyle=material.chip;q.fillRect(x+3,31+(n*20|0),3,4);
   }
  }
 }else{
  // Castle masonry has flat, gold-edged walkable caps and riveted blocks.
  for(let x=24;x<p.w+14;x+=32){
   q.fillStyle=material.shadow;q.fillRect(x,15,2,7);
   q.fillStyle=material.chip;q.fillRect(x+8,26,4,3);
  }
 }
 if(p.y!==G){
  q.fillStyle=material.outline;q.fillRect(14,height-17,p.w+4,8);
  q.fillStyle=material.shadow;q.fillRect(16,height-20,p.w,3);
 }
 terrainCache.set(key,c);return c;
}
function background(){
 if(stage===4){drawCastleInterior();return;}
 const theme=stageThemes[stage];
 const sky=theme.sky;
 // Big flat color bands deliberately distinguish the three fantasy regions.
 for(let i=0;i<sky.length;i++){
  ctx.fillStyle=sky[i];ctx.fillRect(0,i*90,W,90);
 }
 const moonX=Math.round((666-cam*.025)/8)*8;
 ctx.fillStyle=theme.sun;ctx.fillRect(moonX,96,72,72);
 ctx.fillStyle=theme.sunCore;ctx.fillRect(moonX+12,108,48,48);
 if(stage===0){ // Warm woodland: clouds, sunlit hills and clumps of wildflowers.
  for(let i=0;i<8;i++){
   const x=(i*176-Math.round(cam*.08/8)*8+W*4)%(W+176)-80;
   ctx.fillStyle='#e3eac48f';ctx.fillRect(x,124+(i%3)*24,80,16);
   ctx.fillRect(x+16,116+(i%3)*24,48,8);
  }
  for(let i=0;i<11;i++){
   const x=i*110-Math.round(cam*.15/8)*8;
   ctx.fillStyle=i%2?'#679776':'#538468';
   ctx.fillRect(x,350-(i%3)*15,120,160);
   ctx.fillRect(x+24,328-(i%3)*15,72,32);
  }
 }else if(stage===1){ // Blue high canopy: distant floating islands and waterfalls.
  for(let i=0;i<10;i++){
   const x=i*142-Math.round(cam*.17/8)*8;
   const y=245+(i%3)*34;
   ctx.fillStyle='#314e80';ctx.fillRect(x,y,112,22);
   ctx.fillStyle='#507ea3';ctx.fillRect(x+12,y-10,92,12);
   ctx.fillStyle='#25456c';ctx.fillRect(x+26,y+22,60,20);
   if(i%2===0){
    ctx.fillStyle='#7ac6e0b0';ctx.fillRect(x+84,y+22,12,195);
    ctx.fillStyle='#d4e7f8aa';ctx.fillRect(x+88,y+22,4,170);
   }
  }
 }else if(stage===2){ // Purple twilight ruins, massive silhouette towers and warm windows.
  for(let i=0;i<9;i++){
   const x=i*145-Math.round(cam*.14/8)*8,y=286+(i%4)*22;
   ctx.fillStyle='#50445e';ctx.fillRect(x,y,104,540-y);
   ctx.fillStyle='#6c5a70';ctx.fillRect(x-8,y,120,18);
   ctx.fillRect(x+16,y-35,72,35);
   ctx.fillStyle='#f2c77f';ctx.fillRect(x+21,y+40,12,22);
   ctx.fillRect(x+65,y+40,12,22);
   ctx.fillStyle='#a9816e';ctx.fillRect(x+26,y+45,4,9);
  }
 }else if(stage===3){ // Fireflies and giant, clearly distant mushroom caps.
  for(let i=0;i<9;i++){
   const x=i*173-Math.round(cam*.14/8)*8,y=290+(i%3)*35;
   ctx.fillStyle='#2e4959';ctx.fillRect(x+22,y,32,540-y);
   ctx.fillStyle='#465f71';ctx.fillRect(x-20,y-10,116,26);
   ctx.fillStyle='#718391';ctx.fillRect(x-5,y-30,86,20);
   ctx.fillStyle='#a18eab';ctx.fillRect(x+10,y-40,55,11);
   ctx.fillStyle='#bb9ad1';ctx.fillRect(x+45,y-30,10,10);
  }
 }else{ // Royal red-violet throne hall with strong structural silhouettes.
  for(let i=0;i<9;i++){
   const x=i*160-Math.round(cam*.13/8)*8,y=260+(i%2)*30;
   ctx.fillStyle='#252136';ctx.fillRect(x,y,85,H-y);
   ctx.fillStyle='#49384b';ctx.fillRect(x-12,y,109,18);
   ctx.fillStyle='#785264';ctx.fillRect(x+6,y+50,12,32);ctx.fillRect(x+61,y+50,12,32);
   ctx.fillStyle='#ce9468';ctx.fillRect(x+9,y+54,5,23);ctx.fillRect(x+64,y+54,5,23);
  }
 }
 // Cached three-depth tree silhouettes with palette varying by biome.
 for(let i=0;i<3;i++){
  const par=[.12,.32,.58][i],offset=((cam*par)%1600+1600)%1600;
  ctx.globalAlpha=[.42,.58,.74][i];
  ctx.imageSmoothingEnabled=false;
  const shift=Math.round(offset/4)*4;
  ctx.drawImage(planeSets[stage][i],-shift,0);
  ctx.drawImage(planeSets[stage][i],1600-shift,0);
  ctx.globalAlpha=1;
  if(i<2){
   ctx.fillStyle=stage===0?'#ffe7bd18':stage===1?'#69accb1c':stage===3?'#92c6ae0f':stage===4?'#a985a50d':'#caa8a31d';
   ctx.fillRect(0,282+i*36,W,42);
  }
 }
 if(quality==='full')for(let i=0;i<4;i++){
  const x=150+i*250-Math.round(cam*.05/4)*4;
  poly(ctx,[[x,0],[x+16,0],[x-104,H],[x-148,H]],
    stage===0?'#f9eeac13':stage===1?'#a4d9ff10':stage===3?'#e2afff0d':stage===4?'#f0ae9a0d':'#f9be9112');
 }
 // Distinctive pixel-masonry archways in Moosruinen.
 if(stage===2){
  ctx.save();ctx.translate(Math.round((730-cam*.65)/4)*4,0);
  for(let n=0;n<5;n++){
   const x=n*290;
   ctx.fillStyle='#554f62';ctx.fillRect(x,230,32,240);ctx.fillRect(x+112,230,32,240);
   ctx.fillRect(x+24,190,96,26);ctx.fillRect(x+40,173,64,18);
   ctx.fillStyle='#a28c77';ctx.fillRect(x+8,246,4,170);ctx.fillRect(x+124,246,4,170);
   ctx.fillStyle='#83a277';ctx.fillRect(x+35,188,68,5);
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
// Cached dark sprite silhouette: foreground stays legible against every pixel biome.
const heroOutlines=new Map();
function heroOutline(kind,frame,air){
 const key=kind+':'+frame+':'+air;
 if(heroOutlines.has(key))return heroOutlines.get(key);
 const img=spriteFrame(kind,frame,air);
 const buffer=document.createElement('canvas');buffer.width=img.width;buffer.height=img.height;
 const p=buffer.getContext('2d');p.drawImage(img,0,0);
 p.globalCompositeOperation='source-in';p.fillStyle='#111b28';p.fillRect(0,0,buffer.width,buffer.height);
 heroOutlines.set(key,buffer);return buffer;
}
function drawHero(){const h=hero;if(!h)return;ellipse(ctx,h.x+15,h.y+h.h+2,18,4,'#081b2260');if(invincible&&Math.floor(invincible/6)%2)return;
 const running=h.on&&Math.abs(h.vx)>.1,frame=running?Math.floor(t/5)%8:0,bob=h.on?(running?Math.sin(t*.6)*.8:Math.sin(visualTime*3)*.7):0;
 ctx.save();ctx.translate(Math.round(h.x+15),Math.round(h.y+20+bob));ctx.scale(h.face,1);
 // Cloth trails behind the facing direction, animated separately from the legs.
 let flap=reducedMotion?0:Math.sin(t*.23)*3;poly(ctx,[[-9,-8],[-20-(running?5:0),12+flap],[-9,20],[-3,2]],save.class==='mage'?'#6a6089':save.class==='hunter'?'#477757':'#4c7186');
 ctx.imageSmoothingEnabled=false;
 const silhouette=heroOutline(save.class,frame,!h.on);
 for(const [dx,dy] of [[-3,0],[3,0],[0,-3],[0,3]])ctx.drawImage(silhouette,-24+dx,-27+dy,48,56);
 ctx.drawImage(spriteFrame(save.class,frame,!h.on),-24,-27,48,56);
 ctx.restore();ctx.imageSmoothingEnabled=false;
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
function drawPixelScene(){ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();background();if(stage!==4)motes(false);
 ctx.save();ctx.translate(-cam,0);
 if(stage===3)drawCastleApproach();
 if(stage===4)drawCastleThrone();
 for(const [i,p] of solids().filter(p=>!p.kind).entries()){
  if(p.x+p.w<cam-20||p.x>cam+W+20)continue;
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(terrain(p,i),p.x-16,p.y-20);
  // Strong bright traversable edge + a dark layer immediately below it.
  ctx.fillStyle=stageThemes[stage].soil[4];ctx.fillRect(p.x,p.y-3,p.w,4);
  ctx.fillStyle=stageThemes[stage].soil[0];ctx.fillRect(p.x,p.y+2,p.w,3);
 }
 drawDynamicPlatforms();
 // Each biome has its own clearly recognizable foreground decorations.
 for(const p of land())for(let x=p.x+66;x<p.x+p.w-20;x+=136){
  if(x<cam-60||x>cam+W+60)continue;
  const tx=Math.floor(x/4)*4;
  if(stage===0){
   // Giant woodland mushrooms, golden flower heads, bright leafy shrubs.
   ctx.fillStyle='#2c6241';ctx.fillRect(tx-20,G-20,40,20);
   ctx.fillStyle='#70a84e';ctx.fillRect(tx-15,G-33,32,16);
   ctx.fillStyle='#b7d875';ctx.fillRect(tx-9,G-37,16,5);
   ctx.fillStyle='#f4db8b';ctx.fillRect(tx+29,G-25,5,25);
   ctx.fillRect(tx+20,G-32,24,8);ctx.fillStyle='#f8ecbd';ctx.fillRect(tx+26,G-35,12,5);
   ctx.fillStyle='#5a9b54';ctx.fillRect(tx+40,G-14,14,14);
  }else if(stage===1){
   // Pale luminous cyan crystals and wind-blown violet foliage.
   ctx.fillStyle='#1b697d';ctx.fillRect(tx-18,G-26,32,26);
   ctx.fillStyle='#83d9e0';ctx.fillRect(tx-10,G-34,16,34);
   ctx.fillStyle='#bdebf5';ctx.fillRect(tx-6,G-42,8,22);
   ctx.fillStyle='#ce9bdf';ctx.fillRect(tx+24,G-24,28,7);
   ctx.fillRect(tx+32,G-34,12,10);
   ctx.fillStyle='#6599b5';ctx.fillRect(tx+32,G-18,8,18);
  }else if(stage===3&&tx>2080){
   // Approaching the gate: broken battlements and warm torchlights.
   ctx.fillStyle='#3a3449';ctx.fillRect(tx-16,G-34,40,34);
   ctx.fillStyle='#8b7581';ctx.fillRect(tx-21,G-39,51,8);
   ctx.fillStyle='#a98f7b';ctx.fillRect(tx-11,G-30,11,5);
   ctx.fillStyle='#b97d55';ctx.fillRect(tx+31,G-33,13,29);
   ctx.fillStyle='#ffcd79';ctx.fillRect(tx+34,G-48,7,20);
   ctx.fillStyle='#fff0b6';ctx.fillRect(tx+36,G-43,3,10);
  }else if(stage===3){
   // Neon fungi and contrasting cyan glow below active platforms.
   ctx.fillStyle='#273d4f';ctx.fillRect(tx-16,G-30,36,30);
   ctx.fillStyle='#81d6c4';ctx.fillRect(tx-12,G-38,30,10);
   ctx.fillStyle='#d8b0ed';ctx.fillRect(tx-4,G-45,15,9);
   ctx.fillStyle='#b3efd0';ctx.fillRect(tx+30,G-17,8,17);
   ctx.fillStyle='#edc5fd';ctx.fillRect(tx+20,G-27,28,10);
  }else if(stage===4){
   // Royal banners and torch pixels; kept away from collision silhouettes.
   ctx.fillStyle='#3b2e45';ctx.fillRect(tx-17,G-42,36,42);
   ctx.fillStyle='#7b4c58';ctx.fillRect(tx-20,G-46,42,10);
   ctx.fillStyle='#ebbf7e';ctx.fillRect(tx-4,G-36,10,14);
   ctx.fillStyle='#fbe09d';ctx.fillRect(tx-2,G-38,6,9);
   ctx.fillStyle='#8d444f';ctx.fillRect(tx+28,G-45,10,26);
   ctx.fillStyle='#e9a05b';ctx.fillRect(tx+30,G-43,6,12);
  }else{
   // Broken masonry, moss drapes and glowing amber relics.
   ctx.fillStyle='#655c66';ctx.fillRect(tx-16,G-36,36,36);
   ctx.fillStyle='#a28d83';ctx.fillRect(tx-20,G-40,44,9);
   ctx.fillStyle='#3c424b';ctx.fillRect(tx-5,G-24,10,12);
   ctx.fillStyle='#89a371';ctx.fillRect(tx-20,G-40,24,4);
   ctx.fillStyle='#e4b471';ctx.fillRect(tx+31,G-37,13,20);
   ctx.fillStyle='#ffdf97';ctx.fillRect(tx+34,G-34,7,13);
   ctx.fillStyle='#7a5861';ctx.fillRect(tx+28,G-17,18,17);
  }
 }
 for(const ledge of stages[stage].ledges)if(ledge[0]+ledge[2]>cam-60&&ledge[0]<cam+W+60){
  const [x,y,w]=ledge;
  if(stage===1){ // Hanging blue ropes visually anchor canopy platforms.
   for(let k=16;k<w;k+=64){
    ctx.fillStyle='#65b5b3';ctx.fillRect(x+k,y+6,5,52);
    ctx.fillStyle='#b1ddd1';ctx.fillRect(x+k-3,y+45,12,7);
   }
  }else if(stage===2){
   for(let k=24;k<w;k+=75){
    ctx.fillStyle='#7f9972';ctx.fillRect(x+k,y+6,8,20);
    ctx.fillRect(x+k+4,y+24,6,11);
   }
  }
 }
 for(const s of spikes){
  ctx.fillStyle='#351e2b';ctx.fillRect(s.x,s.y+14,s.w,6);
  for(let k=0;k<3;k++){
   poly(ctx,[[s.x+k*15,s.y+18],[s.x+8+k*15,s.y],[s.x+15+k*15,s.y+18]],'#ff837a');
   ctx.fillStyle='#ffe5a4';ctx.fillRect(s.x+6+k*15,s.y+7,4,7);
  }
 }
 for(const a of things){if(a.taken||a.x<cam-25||a.x>cam+W+25)continue;const y=a.y+(reducedMotion?0:Math.sin(visualTime*3+a.x)*3);if(a.type==='star'){glow(a.x,y,26,'#f3df8b35');let pts=[];for(let j=0;j<10;j++){const an=j*Math.PI/5-Math.PI/2,r=j%2?7:16;pts.push([a.x+Math.cos(an)*r,y+Math.sin(an)*r]);}poly(ctx,pts,'#f4dd93');line(ctx,a.x,y-10,a.x-3,y-1,'#fff4d0',2);}else{const rx=reducedMotion?6:3+Math.abs(Math.cos(visualTime*2+a.x))*4;ellipse(ctx,a.x,y,rx,9,'#99774b');ellipse(ctx,a.x,y-1,rx-1,7,'#e5be6c');line(ctx,a.x,y-5,a.x,y+3,'#fff0b0',1);}}
 bad.forEach(drawEnemy);drawBoss();if(stage!==3&&(!stages[stage].boss||bossDefeated()))finishFlag({x:WIDTH-77});drawHero();drawCombatEffects();
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
