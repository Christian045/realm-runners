'use strict';
// Realm Runners v0.12 – deliberately authored ground encounters.
// Colliders, hazards and pixel sprites use the SAME static world coordinates.
// No moving/falling platforms, no hazards on gap edges, no generic obstacle spam.
const COURSE_SECTIONS=[
 {obstacles:[
  {x:600,w:64,h:29,type:'log'}, {x:1325,w:68,h:32,type:'log'},
  {x:1800,w:62,h:30,type:'log'}, {x:2960,w:72,h:29,type:'log'},
  {x:4565,w:65,h:31,type:'log'}],traps:[]},
 {obstacles:[
  {x:1260,w:62,h:31,type:'roots'}, {x:2370,w:62,h:33,type:'roots'},
  {x:3340,w:60,h:30,type:'roots'}, {x:4620,w:62,h:34,type:'roots'},
  {x:5600,w:59,h:29,type:'roots'}],traps:[]},
 {obstacles:[
  {x:560,w:64,h:32,type:'rubble'}, {x:2220,w:65,h:35,type:'rubble'},
  {x:3110,w:72,h:31,type:'rubble'}, {x:4340,w:69,h:37,type:'rubble'},
  {x:6295,w:65,h:33,type:'rubble'}],
  traps:[{x:1226,dir:-1,anchor:1085},{x:5441,dir:-1,anchor:5300}]},
 {obstacles:[
  {x:485,w:62,h:35,type:'barricade'}, {x:2680,w:63,h:34,type:'barricade'},
  {x:4230,w:68,h:38,type:'barricade'}, {x:6750,w:66,h:36,type:'barricade'},
  {x:7110,w:70,h:39,type:'barricade'}],
  traps:[{x:1570,dir:-1,anchor:1450},{x:5225,dir:-1,anchor:5100}]}
];
for(let i=0;i<4;i++)Object.assign(stages[i],COURSE_SECTIONS[i]);
let courseTraps=[],courseDarts=[];
function resetCourseFeatures(){
 courseTraps=(stages[stage].traps||[]).map(t=>({
  ...t,phase:'idle',timer:0,cooldown:0
 }));
 courseDarts=[];
}
function courseSolids(){
 return (stages[stage].obstacles||[]).map(o=>({
  x:o.x,y:G-o.h,w:o.w,blockType:o.type
 }));
}
// Keep side walls truly physical. A player must JUMP over a 29-39px obstacle;
// it cannot be walked through, nor does it require a dash or special skill.
function resolveCourseObstacles(h,previousX){
 for(const o of stages[stage].obstacles||[]){
  const top=G-o.h;
  if(h.y+h.h<=top+3||h.y>=G-3)continue;
  if(h.vx>0&&previousX+h.w<=o.x+2&&h.x+h.w>o.x){
   h.x=o.x-h.w;h.vx=0;
  }else if(h.vx<0&&previousX>=o.x+o.w-2&&h.x<o.x+o.w){
   h.x=o.x+o.w;h.vx=0;
  }
 }
}
// Fixed, architecture-mounted darts: 42-frame amber warning, one shot,
// then a long cooldown. Predictable at 60Hz; can be jumped or dashed.
function tickCourseFeatures(dt){
 if(stages[stage].boss||scene!=='game')return false;
 for(const trap of courseTraps){
  trap.cooldown=Math.max(0,trap.cooldown-dt);
  const distance=trap.x-(hero.x+hero.w/2);
  if(trap.phase==='idle'&&trap.cooldown===0&&distance>32&&distance<340&&hero.y+hero.h>G-120){
   trap.phase='warn';trap.timer=42;
  }else if(trap.phase==='warn'){
   trap.timer-=dt;
   if(trap.timer<=0){
    trap.phase='idle';trap.cooldown=196;
    if(courseDarts.length<8)
     courseDarts.push({x:trap.x-12,y:G-31,vx:-7.6,ttl:52,source:trap.x});
   }
  }
 }
 for(const dart of courseDarts){
  dart.x+=dart.vx*dt;dart.ttl-=dt;
  if(dart.ttl>0&&dart.x+12>hero.x&&dart.x-12<hero.x+hero.w&&
    dart.y+4>hero.y&&dart.y-4<hero.y+hero.h){
   dart.ttl=0;
   if(invincible<=0&&hero.dash<=0){
    courseDarts=courseDarts.filter(d=>d.ttl>0);
    return die(dart.source);
   }
  }
 }
 courseDarts=courseDarts.filter(d=>d.ttl>0&&d.x>0&&d.x<WIDTH);
 return false;
}
function drawCourseObstacles(){
 if(stage===BOSS_LEVEL)return;
 for(const o of stages[stage].obstacles||[]){
  if(o.x+o.w<cam-30||o.x>cam+W+30)continue;
  const x=o.x,y=G-o.h,w=o.w,h=o.h;
  ctx.fillStyle='#132830';ctx.fillRect(x-3,y+5,w+6,h-2);
  if(o.type==='log'){
   // Organic fallen tree: rings and solid bark show that it's a real trunk.
   ctx.fillStyle='#5f4633';ctx.fillRect(x,y+5,w,h-7);
   ctx.fillStyle='#9b744b';ctx.fillRect(x+4,y+2,w-9,9);
   ctx.fillStyle='#bb965f';ctx.fillRect(x+9,y+3,w-25,4);
   ctx.fillStyle='#382d2b';ctx.fillRect(x+w-17,y+8,15,h-13);
   ctx.fillStyle='#d6b57b';ctx.fillRect(x+w-14,y+12,9,h-23);
   ctx.fillStyle='#8f6c47';ctx.fillRect(x+w-11,y+15,4,6);
   ctx.fillStyle='#304934';ctx.fillRect(x+11,y,w/3,5);
   ctx.fillStyle='#76945d';ctx.fillRect(x+13,y,w/4,3);
  }else if(o.type==='roots'){
   // Root heap grows from the ground and uses a low, readable silhouette.
   ctx.fillStyle='#214e4e';ctx.fillRect(x+3,y+11,w-6,h-10);
   ctx.fillStyle='#457368';ctx.fillRect(x+11,y+6,w-22,h-7);
   ctx.fillStyle='#8eb494';ctx.fillRect(x+16,y+3,w-31,8);
   for(let k=0;k<3;k++){
    const xx=x+5+k*19;
    ctx.fillStyle='#192f39';ctx.fillRect(xx,y+6+(k%2)*4,10,h-8);
    ctx.fillStyle='#74a89a';ctx.fillRect(xx+3,y+11+(k%2)*4,4,h-18);
   }
   ctx.fillStyle='#b4d2ab';ctx.fillRect(x+12,y+3,13,4);
  }else if(o.type==='rubble'){
   // Broken masonry, no incongruous wooden spikes in ancient ruins.
   ctx.fillStyle='#363c47';ctx.fillRect(x+2,y+14,w-4,h-12);
   ctx.fillStyle='#777e7d';ctx.fillRect(x+5,y+10,23,17);
   ctx.fillStyle='#a3a598';ctx.fillRect(x+9,y+8,18,5);
   ctx.fillStyle='#505665';ctx.fillRect(x+27,y+2,w-33,h-5);
   ctx.fillStyle='#959f99';ctx.fillRect(x+31,y+4,w-41,7);
   ctx.fillStyle='#2d4b40';ctx.fillRect(x+10,y+7,10,4);
   ctx.fillStyle='#7f9c6b';ctx.fillRect(x+12,y+5,13,3);
   ctx.fillStyle='#c2b395';ctx.fillRect(x+w-16,y+16,8,4);
  }else if(o.type==='barricade'){
   // Grounded square timber shield wall, clearly NON-spiky.
   ctx.fillStyle='#382e36';ctx.fillRect(x+2,y+2,w-4,h-3);
   ctx.fillStyle='#826447';ctx.fillRect(x+6,y+5,w-12,h-9);
   ctx.fillStyle='#b58d5c';ctx.fillRect(x+9,y+8,w-18,6);
   ctx.fillStyle='#50404a';ctx.fillRect(x+6,y+17,w-12,5);
   ctx.fillStyle='#d0b17b';ctx.fillRect(x+5,y+23,w-10,4);
   ctx.fillStyle='#34333d';ctx.fillRect(x+w/2-3,y+4,7,h-8);
   ctx.fillStyle='#e1c591';ctx.fillRect(x+11,y+11,4,4);
   ctx.fillRect(x+w-16,y+21,4,4);
  }
  // Dark contact shadow ties all variants directly to the walkable floor.
  ctx.fillStyle='#13252d';ctx.fillRect(x-5,G-3,w+10,4);
 }
}
function drawCourseTraps(){
 if(stage===BOSS_LEVEL)return;
 for(const trap of courseTraps){
  if(trap.x<cam-70||trap.x>cam+W+55)continue;
  const x=trap.x,y=G-42;
  // Arrow slit is bolted to a supported ruin pier / castle watchtower.
  ctx.fillStyle='#1a2631';ctx.fillRect(x-14,y-8,27,45);
  ctx.fillStyle=stage===2?'#646b70':'#74677b';ctx.fillRect(x-10,y-5,19,37);
  ctx.fillStyle='#262d37';ctx.fillRect(x-12,y+8,22,11);
  ctx.fillStyle='#ffd28c';ctx.fillRect(x-10,y+10,11,6);
  ctx.fillStyle='#a48975';ctx.fillRect(x-4,y+20,5,13);
  if(trap.phase==='warn'){
   const flash=Math.floor(trap.timer/5)%2===0;
   // Large outlined pixel warning, not a tiny antialiased glyph. The entire
   // 27px sign can be read even after scaling to iPhone landscape.
   ctx.fillStyle='#121c2a';ctx.fillRect(x-33,y-48,31,35);
   ctx.fillStyle=flash?'#ffbf78':'#ef8b6b';ctx.fillRect(x-30,y-45,25,29);
   ctx.fillStyle='#fff1c1';ctx.fillRect(x-20,y-39,7,15);
   ctx.fillRect(x-20,y-21,7,5);
   ctx.fillStyle='#422a39';ctx.fillRect(x-30,y-16,25,3);
   // Amber dotted shot direction always stays below the warning marker.
   ctx.fillStyle='#f8a570';
   for(let j=0;j<5;j++)ctx.fillRect(x-49-j*43,y+10,18,4);
  }
 }
 for(const dart of courseDarts){
  if(dart.x<cam-18||dart.x>cam+W+18)continue;
  ctx.fillStyle='#1b2730';ctx.fillRect(dart.x-13,dart.y-5,30,10);
  ctx.fillStyle='#ffd28f';ctx.fillRect(dart.x-10,dart.y-2,20,4);
  ctx.fillStyle='#fff0b6';ctx.fillRect(dart.x-12,dart.y-1,11,2);
  ctx.fillStyle='#a75e52';ctx.fillRect(dart.x+7,dart.y-5,3,10);
 }
}
function drawStageGroundHazards(){
 if(stage===BOSS_LEVEL)return;
 for(const hazard of spikes){
  const x=hazard.x,y=G;
  if(x+hazard.w<cam-25||x>cam+W+25)continue;
  ctx.fillStyle='#19262e';ctx.fillRect(x,y-4,hazard.w,5);
  if(stage===0){
   // Forest thorns are brambles rooted in a low green shrub, not metal spikes.
   ctx.fillStyle='#31583c';ctx.fillRect(x+4,y-15,36,14);
   ctx.fillStyle='#699a55';ctx.fillRect(x+8,y-18,27,7);
   ctx.fillStyle='#805068';ctx.fillRect(x+15,y-16,14,5);
   for(let k=0;k<3;k++){
    const xx=x+5+k*14;
    ctx.fillStyle='#263c34';ctx.fillRect(xx+4,y-21,7,17);
    ctx.fillStyle='#b2d37d';ctx.fillRect(xx+6,y-23,4,14);
   }
  }else if(stage===1){
   // Exposed root-thorns are part of the forest ecosystem.
   ctx.fillStyle='#274e53';ctx.fillRect(x+3,y-14,37,13);
   ctx.fillStyle='#78b7a1';ctx.fillRect(x+6,y-17,29,6);
   for(let k=0;k<3;k++){
    ctx.fillStyle='#182f3b';ctx.fillRect(x+5+k*14,y-24,8,21);
    ctx.fillStyle='#a4d9c5';ctx.fillRect(x+7+k*14,y-21,4,16);
   }
  }else{
   // Ancient floor traps and castle caltrops are framed by fitted stone.
   ctx.fillStyle='#3c3946';ctx.fillRect(x,y-8,44,8);
   ctx.fillStyle=stage===2?'#8b8888':'#b5a3a2';
   ctx.fillRect(x+2,y-9,40,3);
   for(let k=0;k<3;k++){
    const xx=x+2+k*14;
    ctx.fillStyle='#20232e';ctx.fillRect(xx+2,y-19,11,12);
    ctx.fillStyle=stage===2?'#dfc08d':'#edb1a4';
    ctx.fillRect(xx+5,y-19,5,13);
    ctx.fillStyle='#f7dfb2';ctx.fillRect(xx+6,y-23,3,7);
   }
  }
 }
}
function drawCourseWarningPosts(){
 if(stage===BOSS_LEVEL)return;
 const cfg=stages[stage];
 for(const [index,[from]] of cfg.gaps.entries()){
  if(index%2!==0)continue;
  const x=from-146;
  if(x<cam-20||x>cam+W+30||!hasSceneryFoundation(x,17))continue;
  if(cfg.spikes.some(p=>Math.abs(p-x)<55))continue;
  ctx.fillStyle='#182a31';ctx.fillRect(x,G-34,7,34);
  ctx.fillStyle=stage<2?'#8d7853':'#807b7d';ctx.fillRect(x+2,G-32,4,30);
  ctx.fillStyle='#253a3d';ctx.fillRect(x-13,G-53,41,25);
  ctx.fillStyle=stage<2?'#a68e60':'#aaa1a2';ctx.fillRect(x-10,G-50,35,19);
  ctx.fillStyle='#283f43';ctx.fillRect(x+2,G-45,13,6);
  ctx.fillRect(x+11,G-42,9,4);
  ctx.fillRect(x+15,G-39,5,5);
 }
}
