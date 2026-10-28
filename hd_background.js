'use strict';
// Native-resolution atmospheric backdrops. The gameplay sprites, tiles and collision
// world are intentionally rendered separately on a smaller nearest-neighbour layer.
const HD_PALETTES=[
 {sky:['#456a79','#729b9d','#a5c1a4'],ridges:['#668d84','#50766b'],
  trunk:['#324e55','#223f44'],leaf:['#739988','#456e61','#304f51'],
  glow:'#f8dba2',fog:'#aac9b4',far:'#779b8f'},
 {sky:['#182c53','#345e85','#6895aa'],ridges:['#406b84','#2b526b'],
  trunk:['#254d67','#193c57'],leaf:['#538b9e','#356d86','#235167'],
  glow:'#b0e1f8',fog:'#83b2c1',far:'#628ea4'},
 {sky:['#68405f','#88627b','#b89689'],ridges:['#726274','#51495e'],
  trunk:['#514a57','#353746'],leaf:['#8f7b88','#686475','#454755'],
  glow:'#f7c89c',fog:'#b59ca9',far:'#85778a'},
 {sky:['#233a53','#456979','#618882'],ridges:['#4b6d72','#345558'],
  trunk:['#3c5960','#27444d'],leaf:['#769891','#4a7770','#305751'],
  glow:'#dcb5ee',fog:'#85aaa0',far:'#638786'},
 {sky:['#272337','#423148','#58445a'],ridges:['#363345','#29293a'],
  trunk:['#514153','#342b3c'],leaf:['#6a5568','#493a50','#342d43'],
  glow:'#f2c790',fog:'#877383',far:'#645265'}
];
const HD_WIDTH=1600;
let hdCacheStage=-1,hdCachedPlanes=[];
function hdRandom(seed){
 return()=>{seed=(Math.imul(seed,1664525)+1013904223)|0;return(seed>>>0)/4294967296;};
}
function hdRgba(hex,alpha){
 const n=parseInt(hex.slice(1),16);
 return 'rgba('+((n>>>16)&255)+','+((n>>>8)&255)+','+(n&255)+','+alpha+')';
}
function hdSoftCircle(c,x,y,r,inside,outside){
 const g=c.createRadialGradient(x-r*.25,y-r*.26,r*.08,x,y,r);
 g.addColorStop(0,inside);g.addColorStop(1,outside);
 c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
}
function hdPaintTree(c,x,top,size,theme,rnd,near){
 const bottom=H+50,arch=x+(rnd()-.5)*28;
 // Branches and trunks use fine, rounded strokes and gradients, never tile blocks.
 const wood=c.createLinearGradient(x-size*.22,top,x+size*.22,bottom);
 wood.addColorStop(0,theme.trunk[0]);wood.addColorStop(1,theme.trunk[1]);
 c.strokeStyle=wood;c.lineCap='round';c.lineJoin='round';
 c.lineWidth=near?20+rnd()*13:13+rnd()*11;
 c.beginPath();c.moveTo(x,bottom);c.bezierCurveTo(x-14,top+150,arch+18,top+86,arch,top+12);c.stroke();
 const branches=near?7:5;
 for(let j=0;j<branches;j++){
  const side=j%2?-1:1,bY=top+44+j*24,bX=arch+(rnd()-.5)*19;
  const farX=bX+side*(44+rnd()*size*.55),farY=bY-25-rnd()*36;
  c.lineWidth=near?8:5;c.beginPath();c.moveTo(bX,bY);
  c.quadraticCurveTo((bX+farX)/2,bY-37,farX,farY);c.stroke();
 }
 // Layered, shaded canopies look like smooth HD foliage but remain low-contrast.
 const clusters=near?19:14;
 for(let j=0;j<clusters;j++){
  const theta=rnd()*Math.PI*2,spreadX=size*.67,spreadY=size*.37;
  const px=arch+Math.cos(theta)*rnd()*spreadX;
  const py=top+34+Math.sin(theta)*rnd()*spreadY;
  const radius=(near?27:23)+rnd()*(near?31:28);
  const outer=hdRgba(theme.leaf[2],0);
  const inner=hdRgba(theme.leaf[j%3],near?.78:.68);
  hdSoftCircle(c,px,py,radius,inner,outer);
 }
 // Small glints and foliage markings are HD backdrop detail, not collectables.
 c.fillStyle=hdRgba(theme.fog,near?.16:.10);
 for(let j=0;j<30;j++){
  const px=arch+(rnd()-.5)*size,py=top+18+(rnd()-.5)*size*.58;
  c.beginPath();c.ellipse(px,py,1.1+rnd()*2.1,2.5+rnd()*3,rnd(),0,Math.PI*2);c.fill();
 }
}
function hdMakePlane(biome,depth){
 const c=document.createElement('canvas');c.width=HD_WIDTH;c.height=H;
 const p=c.getContext('2d'),theme=HD_PALETTES[biome],rnd=hdRandom((biome+1)*91907+depth*3269);
 const near=depth===1,count=near?10:14,interval=HD_WIDTH/count;
 for(let i=-1;i<=count;i++){
  const x=i*interval+interval/2+(rnd()-.5)*65;
  const size=near?130+rnd()*55:106+rnd()*45;
  const top=near?100+rnd()*95:65+rnd()*105;
  if(biome===3&&i%3===0){
   // Luminous swamp mushrooms use smooth sculpted caps, not collectible-like pixels.
   p.strokeStyle=theme.trunk[1];p.lineWidth=near?22:17;p.lineCap='round';
   p.beginPath();p.moveTo(x,H+25);p.quadraticCurveTo(x+15,top+105,x,top+80);p.stroke();
   const grad=p.createRadialGradient(x,top+38,8,x,top+52,80);
   grad.addColorStop(0,hdRgba(theme.glow,.53));
   grad.addColorStop(.48,hdRgba(theme.leaf[0],.77));
   grad.addColorStop(1,hdRgba(theme.leaf[2],0));
   p.fillStyle=grad;p.beginPath();p.ellipse(x,top+62,90,38,0,Math.PI,Math.PI*2);p.fill();
   hdSoftCircle(p,x,top+58,51,hdRgba(theme.leaf[1],.48),hdRgba(theme.leaf[1],0));
  }else hdPaintTree(p,x,top,size,theme,rnd,near);
  if(biome===1&&near&&i%2===0){
   p.strokeStyle=hdRgba('#95c6b9',.32);p.lineWidth=2;
   for(let j=0;j<3;j++){
    const vx=x+(j-1)*33,len=60+rnd()*120;
    p.beginPath();p.moveTo(vx,top+110);p.bezierCurveTo(vx-10,top+155,vx+13,top+175,vx+5,top+110+len);p.stroke();
   }
  }
 }
 if(biome===2&&near)for(let i=0;i<7;i++){
  const x=i*260+75,y=268+(i%3)*31;
  p.fillStyle=hdRgba(theme.trunk[1],.62);p.fillRect(x,y,65,H-y);
  p.fillStyle=hdRgba(theme.far,.56);p.fillRect(x-9,y-12,85,14);
  p.fillRect(x+10,y-51,44,40);
 }
 return c;
}
function hdPlanes(biome){
 if(hdCacheStage!==biome){
  // Only the active level's backdrop is cached: bounded memory on iPhone Safari.
  // Release backing stores immediately: mobile WebKit need not wait for GC
  // after switching repeatedly between large HD biome canvases.
  for(const old of hdCachedPlanes){old.width=1;old.height=1;}
  hdCachedPlanes=biome===4?[]:[hdMakePlane(biome,0),hdMakePlane(biome,1)];
  hdCacheStage=biome;
 }
 return hdCachedPlanes;
}
function hdMountains(c,theme,depth){
 const bottom=H+40,base=250+depth*42;
 const g=c.createLinearGradient(0,base,0,bottom);
 g.addColorStop(0,hdRgba(theme.ridges[depth],depth===0?.58:.78));
 g.addColorStop(1,hdRgba(theme.ridges[depth],depth===0?.84:.96));
 c.fillStyle=g;c.beginPath();c.moveTo(0,bottom);c.lineTo(0,base+30);
 const shift=cam*(depth===0?.035:.075);
 for(let x=-150;x<W+250;x+=175){
  const crest=base+Math.sin((x+shift)/150+depth)*26;
  c.bezierCurveTo(x+44,crest-73,x+119,crest-27,x+175,crest+18);
 }
 c.lineTo(W+250,bottom);c.closePath();c.fill();
}
function hdDrawOutdoor(c){
 const theme=HD_PALETTES[stage];
 const sky=c.createLinearGradient(0,0,0,H);
 sky.addColorStop(0,theme.sky[0]);sky.addColorStop(.56,theme.sky[1]);sky.addColorStop(1,theme.sky[2]);
 c.fillStyle=sky;c.fillRect(0,0,W,H);
 const sx=stage===0?690:stage===1?760:stage===2?655:744,sy=stage===2?115:120;
 const sun= c.createRadialGradient(sx,sy,10,sx,sy,240);
 sun.addColorStop(0,hdRgba(theme.glow,.33));sun.addColorStop(.44,hdRgba(theme.glow,.095));
 sun.addColorStop(1,hdRgba(theme.glow,0));
 c.fillStyle=sun;c.fillRect(sx-240,sy-240,480,480);
 c.fillStyle=hdRgba(theme.glow,.28);
 c.beginPath();c.arc(sx,sy,29,0,Math.PI*2);c.fill();
 hdMountains(c,theme,0);hdMountains(c,theme,1);
 const layers=hdPlanes(stage);
 for(let i=0;i<layers.length;i++){
  c.save();
  c.globalAlpha=i===0?.49:.66;
  const offset=((cam*(i===0?.13:.31))%HD_WIDTH+HD_WIDTH)%HD_WIDTH;
  c.drawImage(layers[i],-offset,0);
  c.drawImage(layers[i],HD_WIDTH-offset,0);
  c.restore();
 }
 // True HD sunlight shafts are quiet and appear behind every gameplay sprite.
 if(quality==='full'){
  for(let i=0;i<3;i++){
   const sx=180+i*330-cam*.025;
   const beam=c.createLinearGradient(sx,30,sx-90,H);
   beam.addColorStop(0,hdRgba(theme.glow,.065));
   beam.addColorStop(1,hdRgba(theme.glow,0));
   c.fillStyle=beam;c.beginPath();c.moveTo(sx,0);c.lineTo(sx+66,0);
   c.lineTo(sx-130,H);c.lineTo(sx-220,H);c.closePath();c.fill();
  }
 }
 // Depth haze, concentrated near the horizon rather than over the foreground.
 const mist=c.createLinearGradient(0,250,0,H);
 mist.addColorStop(0,hdRgba(theme.fog,0));
 mist.addColorStop(.56,hdRgba(theme.fog,.15));
 mist.addColorStop(1,hdRgba(theme.sky[0],.35));
 c.fillStyle=mist;c.fillRect(0,250,W,H-250);
 if(stage===3){
  // Castle silhouettes remain anchored to their world positions.
  c.save();c.translate(-cam,0);c.globalAlpha=.62;drawCastleApproach();c.restore();
 }
}
function hdWindow(c,x,y,w,h){
 c.save();
 c.fillStyle='#191b2c';
 c.beginPath();c.moveTo(x,y+h);c.lineTo(x,y+46);
 c.quadraticCurveTo(x+w*.5,y-33,x+w,y+46);c.lineTo(x+w,y+h);c.closePath();c.fill();
 const glass=c.createLinearGradient(x,y,x+w,y+h);
 glass.addColorStop(0,'#345672');glass.addColorStop(.52,'#62536c');
 glass.addColorStop(1,'#8c6a69');
 c.fillStyle=glass;c.beginPath();c.moveTo(x+9,y+h-10);c.lineTo(x+9,y+50);
 c.quadraticCurveTo(x+w*.5,y-12,x+w-9,y+50);c.lineTo(x+w-9,y+h-10);c.closePath();c.fill();
 const shimmer=c.createRadialGradient(x+w*.6,y+100,5,x+w*.6,y+100,85);
 shimmer.addColorStop(0,'#d4a88177');shimmer.addColorStop(1,'#d4a88100');
 c.fillStyle=shimmer;c.fillRect(x,y+12,w,h-12);
 c.strokeStyle='#1d2131';c.lineWidth=8;c.beginPath();c.moveTo(x+w/2,y+17);c.lineTo(x+w/2,y+h);
 c.moveTo(x+10,y+92);c.lineTo(x+w-10,y+92);c.stroke();
 c.strokeStyle='#907b87';c.lineWidth=6;
 c.beginPath();c.moveTo(x,y+h);c.lineTo(x,y+46);
 c.quadraticCurveTo(x+w*.5,y-33,x+w,y+46);c.lineTo(x+w,y+h);c.stroke();
 c.restore();
}
function hdDrawCastle(c){
 hdPlanes(stage); // Free outdoor tree caches on entering the boss room.
 // Calm, high-definition chamber: one mural wall, three tall windows,
 // restrained lighting. Foreground floor and boss remain sharply pixelated.
 const stone=c.createLinearGradient(0,0,0,H);
 stone.addColorStop(0,'#181d2e');stone.addColorStop(.55,'#403444');
 stone.addColorStop(1,'#292433');
 c.fillStyle=stone;c.fillRect(0,0,W,H);
 c.fillStyle='#312c40';c.fillRect(0,44,W,22);
 c.fillStyle='#645467';c.fillRect(0,62,W,6);
 c.fillStyle='#292735';c.fillRect(0,402,W,63);
 // Large, subtly staggered stone blocks read as walls, not walkable platforms.
 for(let y=82;y<403;y+=42)for(let x=-90+((Math.floor(y/42)%2)*45);x<W+100;x+=90){
  c.fillStyle='#4b405148';c.fillRect(x+3,y+3,83,34);
  c.fillStyle='#7d6a7440';c.fillRect(x+7,y+5,52,3);
 }
 const windows=[104,416,746];
 for(const x of windows){
  hdWindow(c,x,120,116,242);
  hdSoftCircle(c,x+57,272,112,'#bfa0aa25','#bfa0aa00');
 }
 // Two recessive pillars and banners frame the throne, leaving the playfield quiet.
 for(const x of [24,332,645,923]){
  c.fillStyle='#272536';c.fillRect(x,77,25,357);
  c.fillStyle='#67576b';c.fillRect(x+5,88,6,332);
  c.fillStyle='#a38b85';c.fillRect(x-7,78,39,11);
  c.fillStyle='#322b3c';c.fillRect(x-10,425,45,11);
 }
 for(const x of [246,683]){
  c.fillStyle='#b08d6b';c.fillRect(x-6,88,42,6);
  c.fillStyle='#713d54';c.fillRect(x,94,29,98);
  c.fillStyle='#cf9d6c';c.fillRect(x+9,106,11,53);
  c.fillStyle='#3a3044';c.fillRect(x,190,9,13);c.fillRect(x+20,190,9,13);
 }
 c.save();c.translate(-cam,0);c.globalAlpha=.72;drawCastleThrone();c.restore();
 // Focused wall-torch glow, confined to the background layer.
 for(const x of [190,827]){
  hdSoftCircle(c,x,302,104,'#ffb36b2f','#ffb36b00');
 }
 const quiet=c.createLinearGradient(0,75,0,H);
 quiet.addColorStop(0,'#1418271a');quiet.addColorStop(1,'#17172660');
 c.fillStyle=quiet;c.fillRect(0,75,W,H-75);
}
function drawHdBackdrop(){
 const c=ctx;
 c.save();c.setTransform(1,0,0,1,0,0);
 c.imageSmoothingEnabled=true;
 if(stage===4)hdDrawCastle(c);else hdDrawOutdoor(c);
 c.restore();
}
