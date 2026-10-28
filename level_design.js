'use strict';
// Hand-built level routes, not reskinned copies of one obstacle arrangement.
// Every stage has a distinct rhythm: gentle trail -> vertical canopy ->
// clustered ruin passages -> defended castle causeway. All walkable geometry
// is static. Boss arena intentionally remains unchanged.
// Ground-first courses: a few raised, fully supported optional lookout
// platforms, long running stretches, meaningful hazards and a quiet exit runway.
// World lengths are ~80% greater than v0.10; boss is intentionally unchanged.
const WORLD_ONE_LAYOUTS=[
 {name:'1-1 · Sonnenpfad',short:'Sonnenpfad',subtitle:'Lichtung und Baumstämme',
  hint:'Lange Waldpfade, leichte Gräben und wenige erhöhte Baumstämme.',
  motif:'grove',difficulty:'★☆☆',width:7380,base:5,exitX:7200,exitName:'Tor zum Wipfelwald',
  gaps:[[1100,1215],[2530,2660],[4030,4175],[5540,5690],[6520,6660]],
  ledges:[[1390,320,170],[2940,314,180],[4600,323,155],[5920,312,176]],
  enemies:[450,920,1530,2010,2360,2820,3340,3770,4310,4740,5090,5430,5850,6100,6400],
  spikes:[800,1700,2190,3180,3520,4450,4920,5280,6280],
  stars:[[1470,274],[4670,276],[5995,245]],
  coinSpots:[215,580,980,1280,1880,2390,2820,3700,3890,4350,4780,5160,5740,6090,6920]},
 {name:'1-2 · Baumkronen',short:'Baumkronen',subtitle:'Hoch über dem Waldboden',
  hint:'Bodenläufe zwischen hohen Baumstämmen und sieben gut sichtbaren Gräben.',
  motif:'canopy',difficulty:'★★☆',width:7740,base:8,exitX:7560,exitName:'Hain der alten Steine',
  gaps:[[860,995],[1770,1935],[2810,2975],[3980,4155],[5070,5250],[6100,6275],[6800,6975]],
  ledges:[[1150,320,180],[2350,315,175],[3340,316,184],[4550,310,174],[5600,320,184]],
  enemies:[340,680,1120,1560,2220,2570,3120,3540,3820,4390,4830,5380,5770,6420,6650,7020],
  spikes:[550,1440,2110,2660,3210,3670,4470,4970,5480,5860,6500],
  stars:[[1230,262],[3430,249],[5690,255]],
  coinSpots:[215,730,1080,1660,2020,2490,3130,3450,3790,4270,4730,5330,5680,5990,6700,7100]},
 {name:'1-3 · Versunkene Ruinen',short:'Moosruinen',subtitle:'Zerbrochene Brücken und Tempelbögen',
  hint:'Steinwege mit kleinen Hochrouten, gestaffelten Gefahren und klaren Passagen.',
  motif:'ruins',difficulty:'★★★',width:7920,base:12,exitX:7730,exitName:'Straße zur Festung',
  gaps:[[700,865],[1670,1840],[2560,2740],[3600,3780],[4810,4995],[5890,6070],[6750,6930]],
  ledges:[[1070,320,175],[2080,315,170],[3000,320,185],[4280,315,168],[5400,318,180],[6260,320,175]],
  enemies:[300,900,1570,1970,2420,2910,3430,3860,4170,4590,5070,5730,6160,6540,7240],
  spikes:[430,1000,1440,2100,2350,2840,3310,3960,4530,5140,5640,6410,7090],
  stars:[[1150,245],[3080,246],[5480,236]],
  coinSpots:[215,920,1350,2020,2470,2970,3500,3840,4230,4690,5290,5520,6180,6620,7400]},
 {name:'1-4 · Die Königstraße',short:'Königstraße',subtitle:'Vom Wald zur Burgmauer',
  hint:'Lange Burgstraße, niedrige Hindernisse und ein freier Anlauf zum Schlosstor.',
  motif:'castle',difficulty:'★★★',width:8100,base:15,exitX:7845,exitName:'Schlosstor betreten',
  gaps:[[1020,1165],[2190,2360],[3350,3535],[4560,4740],[5600,5770],[6500,6680]],
  ledges:[[1450,320,190],[2810,322,175],[4010,320,185],[5180,318,185]],
  enemies:[280,850,1270,1780,2060,2890,3190,3750,4460,4860,5960,6310],
  spikes:[690,1350,1970,2450,3060,3910,4380,4990,5430,6140],
  stars:[[1540,245],[4100,243],[5270,236]],
  coinSpots:[225,590,920,1240,1820,2640,2770,3170,3700,4170,4820,5270,5920,6250,7030,7440]}
];
// v0.13: continuous, authored ground relief. Each form is a rise/flat/fall
// sequence inside an existing land segment; gap approaches and exits stay level.
const COURSE_FORMS=[
 [[530,690,820,1010,-40],[1540,1740,1930,2150,20],[2790,2990,3150,3390,-56],[4400,4590,4770,4980,-48],[5850,6060,6200,6420,-52]],
 [[1080,1320,1440,1690,-84],[2020,2240,2450,2690,-76],[3090,3320,3510,3770,-88],[4290,4510,4700,4920,-76],[5400,5620,5790,6010,-80]],
 [[960,1080,1330,1490,-32],[1940,2090,2290,2440,-48],[2850,3020,3210,3430,-48],[3970,4170,4370,4640,-40],[5150,5350,5520,5720,-48],[6170,6340,6510,6630,-32]],
 [[1300,1500,1720,1910,-32],[2480,2670,2900,3120,-48],[3690,3890,4100,4340,-48],[4900,5110,5300,5460,-48],[5870,6030,6160,6330,-32]]
];
function stairRoute(x,y,width=140,step=24){
 return [[x,y,70],[x+70,y-step,70],[x+140,y-step*2,width],[x+140+width,y-step,70],[x+210+width,y,70]];
}
const COURSE_PATHS=[
 [[1390,441,104],[2998,385,104],[4600,393,104],[6064,389,104]],
 [[1160,330,180],[2260,326,170],[3330,315,180],[4520,326,165],[5620,320,180]],
 [], // Ruins: masonry belongs to the continuous ground, not piled platforms.
 []  // King road: an integrated paved route, without block towers on the path.
];
const CANOPY_RISE=8;
const COURSE_STARS=[[[1442,396],[4652,348],[6116,344]],
 [[1260,285],[3430,270],[5720,275]],
 [[1280,316],[3250,300],[5550,300]],
 [[1650,340],[4030,324],[5240,324]]];
for(let i=0;i<WORLD_ONE_LAYOUTS.length;i++){
 const c=WORLD_ONE_LAYOUTS[i];c.ledges=COURSE_PATHS[i];c.stars=COURSE_STARS[i].map(([x,y])=>{
  const branch=i===1?c.ledges.find(([a,top,w])=>x>=a&&x<=a+w):null;
  return [x,branch?y-CANOPY_RISE*(x-branch[0])/branch[2]:y];
 });c.spikes=[];
 c.profile=[[0,G],...COURSE_FORMS[i].flatMap(([a,b,c,d,dy])=>[[a,G],[b,G+dy],[c,G+dy],[d,G]]),[c.width,G]];
 c.hint=[
  'Sanfte Erdhügel, breite Senken und niedrige, verwurzelte Baumstämme.',
  'Schlanke Bäume mit dünnen Ästen und breiten Waldwegen.',
  'Moosige Steinwege und kleine verwitterte Ruinenreste.',
  'Ein ruhiger gepflasterter Weg bis zum Burgtor.'
 ][i];
}
// Same height function for physics, enemies, scenery and the terrain painter.
function courseGroundY(x,index=stage){
 const profile=stages[index].profile;
 if(!profile)return G;
 x=Math.max(0,Math.min(stages[index].width,x));
 for(let i=1;i<profile.length;i++){
  const [b,by]=profile[i],[a,ay]=profile[i-1];
  if(x<=b)return ay+(by-ay)*(x-a)/(b-a);
 }
 return G;
}
function surfaceY(p,x){
 if(p.roundLog){
  const radius=12,local=Math.max(0,Math.min(p.w,x-p.x));
  const d=local<radius?radius-local:local>p.w-radius?local-(p.w-radius):0;
  return p.y+radius-Math.sqrt(Math.max(0,radius*radius-d*d));
 }
 return p.y+(p.yEnd===undefined?0:(p.yEnd-p.y)*Math.max(0,Math.min(1,(x-p.x)/p.w)));}
function courseTopY(x,index=stage){
 let y=courseGroundY(x,index);
 for(const [a,top,w] of stages[index].ledges)if(x>=a&&x<=a+w)y=Math.min(y,surfaceY({x:a,y:top,w,roundLog:index===0,yEnd:index===1?top-CANOPY_RISE:undefined},x));
 return y;
}
function courseLedges(){return stages[stage].ledges.map(([x,y,w])=>({x,y,w,
 volume:stage!==1&&!stages[stage].boss,roundLog:stage===0,yEnd:stage===1?y-CANOPY_RISE:undefined,
 bottom:stage===0?y+24:Math.max(courseGroundY(x),courseGroundY(x+w),G)+12}));}
const courseGroundCache=new Map();
let courseArtStage=-1;
function resetCourseArt(){
 if(courseArtStage===stage)return;
 for(const image of courseGroundCache.values()){image.c.width=1;image.c.height=1;}
 courseGroundCache.clear();
 for(const image of terrainCache.values()){image.width=1;image.height=1;}
 terrainCache.clear();courseArtStage=stage;
}
function drawCourseGround(p){
 const key=[stage,p.x,p.w,p.y,p.yEnd].join(':');let image=courseGroundCache.get(key);
 if(!image){
  const top=Math.floor(Math.min(p.y,p.yEnd??p.y))-8;
  const c=document.createElement('canvas');c.width=Math.ceil(p.w)+2;c.height=H-top;
  const q=c.getContext('2d'),r=rng(p.x*53+stage*937),stone=stage===2||stage===3&&p.x>=3535;
  const pal=stage===1?['#172d35','#3d5053','#2b3f46','#596c64','#9fc49b','#6d8a69']:stage===3&&p.x>=3535?['#1e2230','#514955','#3c3647','#6f616b','#d3c097','#91818a']:stageThemes[stage].soil;
  q.beginPath();q.moveTo(0,p.y-top);q.lineTo(c.width,(p.yEnd??p.y)-top);q.lineTo(c.width,c.height);q.lineTo(0,c.height);q.closePath();q.save();q.clip();
  q.fillStyle=pal[0];q.fillRect(0,0,c.width,c.height);
  for(let yy=0;yy<c.height;yy+=16)for(let xx=-16;xx<c.width;xx+=16){
   const x=xx+(stone&&yy%32?8:0),v=r();q.fillStyle=pal[v>.65?3:v>.3?1:2];q.fillRect(x+1,yy+1,stone?14:17,stone?14:17);
   if(v>.62){q.fillStyle=pal[5];q.fillRect(x+4,yy+6,5,3);}
  }
  q.restore();
  // Contour and collision use the same linear segment, drawn in crisp 2px strips.
  for(let x=0;x<c.width;x+=2){const y=surfaceY(p,p.x+x)-top;
   q.fillStyle=pal[0];q.fillRect(x,y-2,2,9);q.fillStyle=pal[4];q.fillRect(x,y-3,2,4);
   q.fillStyle=pal[5];q.fillRect(x,y+2,2,3);
   if(!stone&&x%10===0&&r()>.3){q.fillStyle=pal[4];q.fillRect(x,y-6,2,4);}
  }
  image={c,top};if(courseGroundCache.size>=128)courseGroundCache.clear();courseGroundCache.set(key,image);
 }
 ctx.drawImage(image.c,p.x,image.top);
}
for(let i=0;i<WORLD_ONE_LAYOUTS.length;i++)Object.assign(stages[i],WORLD_ONE_LAYOUTS[i]);
Object.assign(stages[4],{short:'Schleimkönig',subtitle:'Thronsaal',hint:'Eine kompakte Bossarena mit Phase II und drei angekündigten Angriffen.',difficulty:'★★★'});
// World-space set pieces are authored against the actual ground segments.
// Every structural FOOT has a collision-ground foundation. This avoids the
// floating columns, trees, trunks and towers that appeared above chasms.
const SCENERY_ANCHORS=Object.freeze({
 grove:{trees:[145,1410,2780,3560,4390,5140,5840,6820],
        logs:[530,2050,3240,4810,6020]},
 canopy:{trees:[200,1130,2110,3160,4370,5500,6300,7180]},
 ruins:{arches:[250,1085,1980,2920,4110,5300,6190,7100]},
 castle:{towers:[300,1450,2800,4000,5100,5950]}
});
function hasSceneryFoundation(x,width,stageIndex=stage){
 const cfg=stages[stageIndex];
 return Number.isFinite(x)&&Number.isFinite(width)&&width>0&&x>=0&&x+width<=cfg.width &&
  cfg.gaps.every(([a,b])=>x+width<=a||x>=b);
}
function drawBiomeLandmarks(){
 if(stage===BOSS_LEVEL)return;
 const motif=stages[stage].motif,anchors=SCENERY_ANCHORS[motif];
 if(!anchors)return;
 const visible=(x,w=90)=>x+w>cam-100&&x<cam+W+100;
 if(motif==='grove'){
  for(const x of anchors.trees){
   if(!visible(x,125)||!hasSceneryFoundation(x+36,28))continue;
   ctx.save();ctx.translate(0,Math.max(courseGroundY(x+36),courseGroundY(x+64))-G);ctx.fillStyle='#745d41';ctx.fillRect(x+36,G-172,28,172);
   ctx.fillStyle='#6b9056';ctx.fillRect(x+18,G-200,90,40);ctx.fillRect(x,G-177,120,34);
   ctx.fillStyle='#a2ba69';ctx.fillRect(x+24,G-200,57,9);
   ctx.fillStyle='#213d32';ctx.fillRect(x+48,G-113,12,15);ctx.restore();
  }
  // Decorative rectangles removed: the four collidable fallen logs carry this motif.
 }else if(motif==='canopy'){
  // No branch decks, overhead silhouettes or decorative crossbar platforms.
  // The HD tree backdrop and the grounded ridge carry this biome instead.
  return;
 }else if(motif==='ruins'){
  // Small weathered remnants, not full-height black doorways or block piles.
  for(const x of anchors.arches){
   if(!visible(x,70)||!hasSceneryFoundation(x,60))continue;
   const base=Math.max(courseGroundY(x),courseGroundY(x+60));
   ctx.fillStyle='#303942';ctx.fillRect(x+4,base-27,13,27);ctx.fillRect(x+38,base-17,16,17);
   ctx.fillStyle='#7d827e';ctx.fillRect(x+6,base-28,9,4);ctx.fillRect(x+40,base-18,12,3);
   ctx.fillStyle='#56795f';ctx.fillRect(x+2,base-9,19,3);
   line(ctx,x+11,base-22,x+8,base-12,'#48535b',1);
  }
 }else if(motif==='castle'){
  // The complete castle gateway remains at the exit. Roadside stones stay low.
  for(const x of anchors.towers){
   if(!visible(x,65)||!hasSceneryFoundation(x,62))continue;
   const base=Math.max(courseGroundY(x),courseGroundY(x+62));
   ctx.fillStyle='#393743';ctx.fillRect(x+4,base-18,25,18);
   ctx.fillStyle='#80767e';ctx.fillRect(x+6,base-20,21,4);
   ctx.fillStyle='#a69b89';ctx.fillRect(x+10,base-16,3,10);
   ctx.fillStyle='#292c36';ctx.fillRect(x+40,base-7,18,7);
  }
 }

}
// Raised surfaces are deliberate side routes, not airborne stepping-stones.
// Draw their foundations all the way into the actual ground before platform
// tiles, so every optional elevated walkway is visibly supported.
function drawCoursePlatformSupports(){
 if(stage===BOSS_LEVEL)return;
 const biome=stages[stage].motif;
 for(const p of courseLedges()){
  const {x,y,w}=p;if(x+w<cam-50||x>cam+W+50)continue;
  if(biome==='grove')continue;
  if(p.volume){
   ctx.fillStyle=biome==='grove'?'#3e4731':biome==='ruins'?'#424650':'#454051';
   ctx.fillRect(x,y,w,p.bottom-y);
   for(let yy=y+10;yy<p.bottom;yy+=20){
    ctx.fillStyle=biome==='grove'?'#596440':'#77727c';ctx.fillRect(x+4,yy,w-8,3);
    if(biome!=='grove'){ctx.fillStyle='#262d38';for(let xx=x+18+(yy%40?20:0);xx<x+w;xx+=42)ctx.fillRect(xx,yy,3,20);}
   }
   if(biome==='grove'){
    ctx.fillStyle='#6e8050';for(let xx=x+9;xx<x+w;xx+=31)ctx.fillRect(xx,y+8,4,p.bottom-y-8);
   }
  }else{
   drawLivingTree(p);

  }
 }
}
// A living tree supports each optional branch. No planks, posts or deck railings.
function drawLivingTree(p){
 const root=p.x+17,y=p.y,ground=Math.max(courseGroundY(root-10),courseGroundY(root+18));
 ctx.fillStyle='#233931';ctx.beginPath();ctx.moveTo(root-12,ground+3);
 ctx.quadraticCurveTo(root-1,ground-17,root-4,y+25);
 ctx.bezierCurveTo(root-7,y-12,root+1,y-52,root+4,y-80);
 ctx.lineTo(root+12,y-82);ctx.bezierCurveTo(root+8,y-39,root+7,y+15,root+9,ground-10);
 ctx.lineTo(root+21,ground+3);ctx.closePath();ctx.fill();
 ctx.strokeStyle='#827854';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(root+3,ground-7);
 ctx.bezierCurveTo(root+2,y+29,root+2,y-34,root+8,y-78);ctx.stroke();
 ctx.strokeStyle='#b09c6c';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(root+5,ground-14);
 ctx.quadraticCurveTo(root+4,y+8,root+7,y-44);ctx.stroke();
 // Small, layered leaf clusters; trunk remains slender and clearly visible.
 for(const [dx,dy,rx,ry,c] of [[-13,-81,24,11,'#244e49'],[13,-93,29,15,'#376a59'],[37,-80,23,12,'#28584d'],[8,-73,28,10,'#477e65']])
  ellipse(ctx,root+dx,y+dy,rx,ry,c);
 for(let j=0;j<5;j++)ellipse(ctx,root-13+j*12,y-94+(j%2)*6,6,2,'#739d79');
 ctx.strokeStyle='#4a6048';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(root+6,y+30);
 ctx.quadraticCurveTo(root+28,y+10,root+56,y+3);ctx.stroke();
}
function drawCourseTimber(p){
 const {x,y,w}=p,tip=p.yEnd??y;
 if(stage===0){
  // Low fallen trunk with a genuinely round cross-section, not a soil block.
  const h=24,radius=12,cy=y+radius;
  ctx.fillStyle='#223028';ctx.beginPath();ctx.roundRect(x-1,y-1,w+2,h+2,13);ctx.fill();
  const bark=ctx.createLinearGradient(0,y,0,y+h);bark.addColorStop(0,'#a38251');bark.addColorStop(.3,'#80613d');bark.addColorStop(1,'#483a2c');
  ctx.fillStyle=bark;ctx.beginPath();ctx.roundRect(x,y,w,h,12);ctx.fill();
  for(let j=0;j<4;j++){
   line(ctx,x+16+j*4,y+5+j*4,x+w-19-j*3,y+4+j*4,j%2?'#4c3929':'#bd975e',j===0?2:1);
  }
  ellipse(ctx,x+w-10,cy,8,10,'#d3b47b');ellipse(ctx,x+w-10,cy,5.5,7,'#88613c');
  ellipse(ctx,x+w-10,cy,3.7,5,'#cfa66b');ellipse(ctx,x+w-10,cy,1.5,2.3,'#795334');
  ctx.fillStyle='#809657';ctx.fillRect(x+22,y+1,22,3);ctx.fillStyle='#a5b873';ctx.fillRect(x+27,y,10,2);
 }else{
  // A thin tapering limb, not a thick triangular bridge deck.
  ctx.fillStyle='#263c30';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w-5,tip);
  ctx.lineTo(x+w,tip+2);ctx.quadraticCurveTo(x+w*.65,y+2,x+10,y+9);
  ctx.quadraticCurveTo(x-2,y+10,x,y);ctx.fill();
  ctx.fillStyle='#8b7750';ctx.beginPath();ctx.moveTo(x+4,y+2);ctx.lineTo(x+w-7,tip+1);
  ctx.quadraticCurveTo(x+w*.57,y+2,x+5,y+6);ctx.closePath();ctx.fill();
  line(ctx,x+3,y,x+w-5,tip,'#a4ba83',1.5);
  for(let j=0;j<3;j++)line(ctx,x+23+j*35,y+4-j,x+43+j*35,y+3-j,'#b29a65',1);
  ellipse(ctx,x+w-13,tip+7,5,1.5,'#578568');

 }
}
function drawWorldStar(cx,cy){
 const x=Math.round(cx/2)*2,y=Math.round(cy/2)*2;
 ctx.save();ctx.translate(x,y);
 const shape=[[0,-19],[5,-9],[18,-8],[9,1],[13,15],[0,8],[-13,15],[-9,1],[-18,-8],[-5,-9]];
 // Dark outline makes stars recognizable over both grass and bright foliage.
 const pts=shape.map(([dx,dy])=>[dx,dy]);
 const polyStar=(offset,color)=>{ctx.beginPath();pts.forEach(([dx,dy],i)=>i?ctx.lineTo(dx+offset,dy+offset):ctx.moveTo(dx+offset,dy+offset));ctx.closePath();ctx.fillStyle=color;ctx.fill();};
 polyStar(3,'#1b2b34');polyStar(0,'#d99a35');
 ctx.fillStyle='#ffdf75';ctx.fillRect(-5,-12,10,20);ctx.fillRect(-13,-7,26,9);
 ctx.fillStyle='#fff2b2';ctx.fillRect(-4,-14,7,7);ctx.fillRect(-8,-6,6,4);
 ctx.fillStyle='#a86d2d';ctx.fillRect(5,2,5,6);ctx.fillRect(-2,8,5,3);
 if(!reducedMotion&&Math.sin(visualTime*3+cx*.027)>.6){
  ctx.fillStyle='#fff6cd';ctx.fillRect(18,-18,3,10);ctx.fillRect(14,-14,11,3);
 }
 ctx.restore();
}
const PIXEL_STAR='<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-hidden="true"><path fill="#152b33" d="M10 0h4v5h4v3h6v5h-6v3h2v7h-6v-3H9v3H3v-7h3v-3H0V8h7V5h3z"/><path fill="#e0a447" d="M10 3h4v5h4v2h4v2h-6v4h2v5h-5v-4h-3v4H5v-5h3v-4H2v-2h6V8h2z"/><path fill="#ffde75" d="M11 4h2v6h5v2h-6v7h-2v-7H5v-2h5z"/><path fill="#fff4b1" d="M10 5h3v5h-3zM6 10h5v2H6z"/></svg>';
let exitActive=false,exitFrames=0,exitVisual=0;
// The end is a physical, level-specific gate. Entering it starts a visible
// transition instead of crossing an invisible x threshold or a generic flag.
function tryEnterLevelExit(){
 if(scene!=='game'||stages[stage].boss||exitActive||!hero.on)return false;
 const goal=stages[stage].exitX;
 if(hero.x+hero.w/2<goal-19||hero.x+hero.w/2>goal+47)return false;
 exitActive=true;exitFrames=0;exitVisual=0;clearInput();
 hero.vx=0;hero.vy=0;hero.on=true;
 burst(goal+10,G-58,'#ffe4a3',34,2);
 return true;
}
function tickLevelExit(dt){
 if(!exitActive)return false;
 exitFrames+=dt;
 const goal=stages[stage].exitX;
 hero.x+=(goal-hero.x-hero.w/2)*Math.min(1,dt*.11);
 hero.vx=0;hero.vy=0;hero.on=true;
 exitVisual=Math.min(1,exitFrames/62);
 if(exitFrames>=74){exitActive=false;end(true);}
 return true;
}
function drawLevelExit(){
 if(stages[stage].boss)return;
 const x=stages[stage].exitX,y=G,motif=stages[stage].motif;
 if(x+85<cam||x>cam+W+70)return;
 ctx.save();
 if(motif==='castle'){
  // The full medieval gate already exists in the HD castle approach exactly
  // behind this coordinate. Show its entrance, not a second floating door.
  ctx.fillStyle='#161625';ctx.fillRect(x-26,y-115,52,110);
  ctx.fillStyle='#d5af74';ctx.fillRect(x-30,y-122,60,7);
  ctx.fillStyle='#8f7180';ctx.fillRect(x-30,y-115,7,115);
  ctx.fillRect(x+23,y-115,7,115);
 }else{
  const color=motif==='grove'?'#91bb79':motif==='canopy'?'#80d0b2':'#b3a3b9';
  ctx.fillStyle='#152a32';ctx.fillRect(x-31,y-127,93,127);
  ctx.fillStyle=color;ctx.fillRect(x-37,y-131,105,13);
  ctx.fillRect(x-31,y-118,13,118);ctx.fillRect(x+49,y-118,13,118);
  ctx.fillStyle='#213c40';ctx.fillRect(x-17,y-116,65,116);
  for(let yy=y-106;yy<y-9;yy+=24){ctx.fillStyle='#426560';ctx.fillRect(x-10,yy,50,4);}
 }
 const glow=(Math.sin(visualTime*4)+1)*.17+.34;
 ctx.globalAlpha=glow;
 ctx.fillStyle='#f6db9b';ctx.fillRect(x+3,y-99,24,91);
 ctx.fillStyle='#fff5d7';ctx.fillRect(x+10,y-89,9,75);
 ctx.globalAlpha=1;
 ctx.fillStyle='#20353a';ctx.fillRect(x-55,y-164,150,23);
 ctx.fillStyle='#f9e4a4';ctx.textAlign='center';ctx.font='bold 12px monospace';
 ctx.fillText(stages[stage].exitName,x+20,y-148);
 if(exitActive){
  ctx.fillStyle='#fff2b6';ctx.fillRect(x-17,y-15,66,8);
 }
 ctx.restore();
}
function drawExitTransition(){
 if(!exitActive||!hero)return;
 ctx.save();
 ctx.globalAlpha=Math.min(.78,exitVisual*.75);
 ctx.fillStyle='#071b25';ctx.fillRect(0,0,W,H);
 ctx.globalAlpha=Math.min(1,exitFrames/25);
 ctx.fillStyle='#fff1be';ctx.font='bold 22px monospace';ctx.textAlign='center';
 ctx.fillText(stage===3?'DAS SCHLOSSTOR ÖFFNET SICH …':'DER NÄCHSTE ABSCHNITT WARTET …',W/2,H/2);
 ctx.restore();
}
