'use strict';
// Hand-built level routes, not reskinned copies of one obstacle arrangement.
// Every stage has a distinct rhythm: gentle trail -> vertical canopy ->
// clustered ruin passages -> defended castle causeway. All walkable geometry
// is static. Boss arena intentionally remains unchanged.
const WORLD_ONE_LAYOUTS=[
 {
  name:'1-1 · Sonnenpfad',short:'Sonnenpfad',subtitle:'Lichtung und Baumstämme',
  hint:'Weite Waldlichtungen, erste Sprünge und ein ruhiger Weg zum Hain.',
  motif:'grove',difficulty:'★☆☆',width:4100,base:5,exitX:3960,exitName:'Tor zum Wipfelwald',
  gaps:[[625,735],[1660,1780],[2850,2990],[3570,3690]],
  ledges:[[255,397,158],[470,360,130],[830,383,150],[1125,333,145],
   [1445,383,172],[1880,379,153],[2180,341,178],[2450,402,139],
   [2720,362,148],[3070,371,154],[3330,331,156],[3760,375,160]],
  enemies:[420,900,1290,1920,2330,2550,3080,3410,3790],
  spikes:[1030,1560,2460,2650,3300,3740],
  stars:[[515,305],[2260,282],[3440,272]]
 },
 {
  name:'1-2 · Baumkronen',short:'Baumkronen',subtitle:'Hoch über dem Waldboden',
  hint:'Versetzte Äste, höhere Routen und sechs Sprunggräben.',
  motif:'canopy',difficulty:'★★☆',width:4300,base:8,exitX:4155,exitName:'Hain der alten Steine',
  gaps:[[385,525],[965,1135],[1555,1730],[2290,2470],[3040,3220],[3755,3925]],
  ledges:[[185,402,155],[420,344,158],[650,303,151],[880,380,147],
   [1050,348,152],[1280,297,148],[1500,373,120],[1750,339,160],
   [1940,295,165],[2150,371,145],[2410,331,161],[2680,298,160],
   [2945,368,145],[3160,333,157],[3380,295,155],[3610,362,153],
   [3870,331,145],[4045,360,144]],
  enemies:[640,850,1300,1865,2110,2700,2960,3340,4090],
  spikes:[740,1410,2020,2560,2840,3470,4010],
  stars:[[735,251],[2760,245],[3455,239]]
 },
 {
  name:'1-3 · Versunkene Ruinen',short:'Moosruinen',subtitle:'Zerbrochene Brücken und Tempelbögen',
  hint:'Engere Steinpassagen, zerfallene Torbögen und riskante Nebenwege.',
  motif:'ruins',difficulty:'★★★',width:4400,base:12,exitX:4240,exitName:'Straße zur Festung',
  gaps:[[540,702],[1260,1440],[1990,2175],[2840,3020],[3600,3775]],
  ledges:[[218,389,128],[420,327,148],[725,368,155],[940,304,140],
   [1205,375,137],[1465,328,164],[1685,284,145],[1840,376,126],
   [2180,361,166],[2390,309,152],[2590,390,118],[2980,339,164],
   [3250,289,145],[3480,376,127],[3755,338,159],[3980,299,149]],
  enemies:[385,925,1040,1550,1870,2405,2530,3265,3360,3950],
  spikes:[785,1140,1635,2240,2650,3070,3440,3820,4100],
  stars:[[475,272],[1730,231],[3300,235]]
 },
 {
  name:'1-4 · Die Königstraße',short:'Königstraße',subtitle:'Vom Wald zur Burgmauer',
  hint:'Steinerne Rampen, schmale Bollwerke und die Tore des Schleimkönigs.',
  motif:'castle',difficulty:'★★★',width:4500,base:15,exitX:4230,exitName:'Schlosstor betreten',
  gaps:[[475,617],[1120,1285],[1790,1965],[2690,2870],[3455,3635]],
  ledges:[[240,394,146],[630,365,164],[890,312,158],[1080,372,120],
   [1300,339,164],[1575,296,151],[1910,365,163],[2210,327,154],
   [2500,385,134],[2855,349,163],[3115,306,155],[3390,365,130],
   [3640,331,165],[3900,378,149]],
  enemies:[340,795,1350,1630,2140,2500,3060,3190,3830,4050],
  spikes:[910,1470,2030,2380,2950,3290,3730,3960],
  stars:[[320,336],[1640,241],[3695,275]]
 }
];
for(let i=0;i<WORLD_ONE_LAYOUTS.length;i++)Object.assign(stages[i],WORLD_ONE_LAYOUTS[i]);
Object.assign(stages[4],{short:'Schleimkönig',subtitle:'Thronsaal',hint:'Eine kompakte Bossarena mit Phase II und drei angekündigten Angriffen.',difficulty:'★★★'});
// World-space set pieces are authored against the actual ground segments.
// Every structural FOOT has a collision-ground foundation. This avoids the
// floating columns, trees, trunks and towers that appeared above chasms.
const SCENERY_ANCHORS=Object.freeze({
 grove:{trees:[145,1050,1990,3100,3810],logs:[530,1530,2720,3450]},
 canopy:{trees:[240,840,1440,2185,2920,3550,3990]},
 ruins:{arches:[350,1085,1770,2635,3390,4070]},
 castle:{towers:[350,960,1985,2510,3280]}
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
  // Match existing rendered castle doorway, now the actual interactive exit.
  ctx.fillStyle='#171a27';ctx.fillRect(x-24,y-121,84,121);
  ctx.fillStyle='#7f5261';ctx.fillRect(x-19,y-117,17,117);
  ctx.fillStyle='#b18f73';ctx.fillRect(x+45,y-117,11,117);
  ctx.fillStyle='#d4b57c';ctx.fillRect(x-12,y-124,63,10);
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
