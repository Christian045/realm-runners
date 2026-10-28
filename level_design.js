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
  ledges:[[1390,320,170],[2940,314,180],[4600,323,155],[5920,296,176]],
  enemies:[450,920,1530,2010,2360,2820,3340,3770,4310,4740,5090,5430,5850,6100,6400],
  spikes:[800,1700,2190,3180,3520,4450,4920,5280,6280],
  stars:[[1470,274],[4670,276],[5995,245]],
  coinSpots:[215,580,980,1280,1880,2390,2820,3700,3890,4350,4780,5160,5740,6090,6920]},
 {name:'1-2 · Baumkronen',short:'Baumkronen',subtitle:'Hoch über dem Waldboden',
  hint:'Bodenläufe zwischen hohen Baumstämmen und sieben gut sichtbaren Gräben.',
  motif:'canopy',difficulty:'★★☆',width:7740,base:8,exitX:7560,exitName:'Hain der alten Steine',
  gaps:[[860,995],[1770,1935],[2810,2975],[3980,4155],[5070,5250],[6100,6275],[6800,6975]],
  ledges:[[1150,320,180],[2350,298,175],[3340,305,184],[4550,294,174],[5600,310,184]],
  enemies:[340,680,1120,1560,2220,2570,3120,3540,3820,4390,4830,5380,5770,6420,6650,7020],
  spikes:[550,1440,2110,2660,3210,3670,4470,4970,5480,5860,6500],
  stars:[[1230,262],[3430,249],[5690,255]],
  coinSpots:[215,730,1080,1660,2020,2490,3130,3450,3790,4270,4730,5330,5680,5990,6700,7100]},
 {name:'1-3 · Versunkene Ruinen',short:'Moosruinen',subtitle:'Zerbrochene Brücken und Tempelbögen',
  hint:'Steinwege mit kleinen Hochrouten, gestaffelten Gefahren und klaren Passagen.',
  motif:'ruins',difficulty:'★★★',width:7920,base:12,exitX:7730,exitName:'Straße zur Festung',
  gaps:[[700,865],[1670,1840],[2560,2740],[3600,3780],[4810,4995],[5890,6070],[6750,6930]],
  ledges:[[1070,307,175],[2080,285,170],[3000,305,185],[4280,293,168],[5400,296,180],[6260,312,175]],
  enemies:[300,900,1290,1570,1970,2420,2910,3430,3860,4170,4590,5070,5410,5730,6160,6540,7240],
  spikes:[430,1000,1440,2100,2350,2840,3310,3960,4530,5140,5640,6410,7090],
  stars:[[1150,245],[3080,246],[5480,236]],
  coinSpots:[215,920,1350,2020,2470,2970,3500,3840,4230,4690,5290,5520,6180,6620,7400]},
 {name:'1-4 · Die Königstraße',short:'Königstraße',subtitle:'Vom Wald zur Burgmauer',
  hint:'Lange Burgstraße, niedrige Hindernisse und ein freier Anlauf zum Schlosstor.',
  motif:'castle',difficulty:'★★★',width:8100,base:15,exitX:7845,exitName:'Schlosstor betreten',
  gaps:[[1020,1165],[2190,2360],[3350,3535],[4560,4740],[5600,5770],[6500,6680]],
  ledges:[[1450,300,190],[2810,306,175],[4010,294,185],[5180,292,185]],
  enemies:[370,850,1270,1690,2060,2580,2890,3190,3750,4110,4460,4860,5300,5960,6310,6970],
  spikes:[690,1350,1970,2450,3060,3910,4380,4990,5430,6140],
  stars:[[1540,245],[4100,243],[5270,236]],
  coinSpots:[225,590,920,1240,1820,2640,2770,3170,3700,4170,4820,5270,5920,6250,7030,7440]}
];
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
   ctx.fillStyle='#355e43';ctx.fillRect(x+36,G-172,28,172);
   ctx.fillStyle='#6b9056';ctx.fillRect(x+18,G-200,90,40);ctx.fillRect(x,G-177,120,34);
   ctx.fillStyle='#a2ba69';ctx.fillRect(x+24,G-200,57,9);
   ctx.fillStyle='#213d32';ctx.fillRect(x+48,G-113,12,15);
  }
  for(const x of anchors.logs){
   if(!visible(x,78)||!hasSceneryFoundation(x,78))continue;
   ctx.fillStyle='#604d3f';ctx.fillRect(x,G-25,78,26);
   ctx.fillStyle='#977857';ctx.fillRect(x+3,G-23,66,7);
  }
 }else if(motif==='canopy'){
  for(const x of anchors.trees){
   if(!visible(x,110)||!hasSceneryFoundation(x+24,44))continue;
   // All branches grow out of a trunk that visibly reaches the terrain.
   ctx.fillStyle='#264e43';ctx.fillRect(x+24,G-290,44,290);
   ctx.fillStyle='#418569';ctx.fillRect(x+36,G-290,12,280);
   for(let y=G-280;y<G-80;y+=55){
    ctx.fillStyle='#326b5b';ctx.fillRect(x+6,y,95,13);
    ctx.fillStyle='#7aab7a';ctx.fillRect(x+10,y,56,4);
   }
   // This creeper hangs directly from the trunk's branch, not from thin air.
   ctx.fillStyle='#5e9277';ctx.fillRect(x+55,G-265,7,115);
   ctx.fillStyle='#abcfaf';ctx.fillRect(x+58,G-232,3,38);
  }
 }else if(motif==='ruins'){
  for(const x of anchors.arches){
   // Require BOTH columns to be grounded before drawing the lintel or doorway.
   if(!visible(x,175)||!hasSceneryFoundation(x,24)||!hasSceneryFoundation(x+141,25))continue;
   ctx.fillStyle='#313c43';ctx.fillRect(x,G-225,24,225);ctx.fillRect(x+141,G-225,25,225);
   ctx.fillRect(x,G-240,167,28);ctx.fillRect(x+18,G-259,129,22);
   ctx.fillStyle='#7e897b';ctx.fillRect(x+4,G-238,154,6);
   ctx.fillRect(x+5,G-222,6,159);ctx.fillRect(x+145,G-222,7,159);
   ctx.fillStyle='#52775e';ctx.fillRect(x+10,G-257,80,8);
   ctx.fillStyle='#b4ae8a';ctx.fillRect(x+43,G-242,28,5);
   ctx.fillStyle='#1f353b';ctx.fillRect(x+24,G-199,117,199);
  }
 }else if(motif==='castle'){
  for(const x of anchors.towers){
   if(!visible(x,140)||!hasSceneryFoundation(x,125))continue;
   ctx.fillStyle='#3b3d50';ctx.fillRect(x,G-208,125,208);
   ctx.fillStyle='#777181';ctx.fillRect(x-10,G-215,146,13);
   for(let b=0;b<125;b+=27){ctx.fillStyle='#4b4556';ctx.fillRect(x+b,G-236,17,22);}
   ctx.fillStyle='#a18f85';ctx.fillRect(x+25,G-175,9,76);
   ctx.fillStyle='#b48c6b';ctx.fillRect(x+92,G-163,11,65);
  }
 }
}
// Raised surfaces are deliberate side routes, not airborne stepping-stones.
// Draw their foundations all the way into the actual ground before platform
// tiles, so every optional elevated walkway is visibly supported.
function drawCoursePlatformSupports(){
 if(stage===BOSS_LEVEL)return;
 const biome=stages[stage].motif;
 for(const [x,y,w] of stages[stage].ledges){
  if(x+w<cam-60||x>cam+W+60)continue;
  const feet=[x+16,x+w-30];
  for(const foot of feet){
   if(!hasSceneryFoundation(foot,14))continue;
   if(biome==='grove'||biome==='canopy'){
    ctx.fillStyle='#243e37';ctx.fillRect(foot-3,y+5,20,G-y-5);
    ctx.fillStyle='#5c8760';ctx.fillRect(foot+2,y+11,9,G-y-18);
    ctx.fillStyle='#80ab78';ctx.fillRect(foot+5,y+20,3,G-y-33);
    // Tree roots visually meet the ground beneath the supported deck.
    ctx.fillStyle='#355b43';ctx.fillRect(foot-9,G-15,31,15);
   }else{
    ctx.fillStyle=biome==='ruins'?'#333943':'#302d40';
    ctx.fillRect(foot-5,y+5,24,G-y-5);
    ctx.fillStyle=biome==='ruins'?'#899184':'#95818a';
    ctx.fillRect(foot-1,y+11,8,G-y-19);
    for(let yy=y+25;yy<G-7;yy+=30){
     ctx.fillStyle=biome==='ruins'?'#59666a':'#645468';
     ctx.fillRect(foot-4,yy,21,4);
    }
    ctx.fillStyle='#1d2930';ctx.fillRect(foot-9,G-11,32,11);
   }
  }
  // A continuous crossbeam joins both structural supports.
  ctx.fillStyle=biome==='grove'||biome==='canopy'?'#2b4c40':'#3a3748';
  ctx.fillRect(x+10,y+9,w-20,10);
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
