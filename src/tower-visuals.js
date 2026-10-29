// Environment detail has no collision. Decorations anchor to stone edges and
// floor inscriptions rather than floating in mid-air or blocking combat routes.
const motif=['leaves','tide','chains','spores','coral','banners','runes','souls','clock','eclipse'];
const rect=(ctx,color,x,y,w,h)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h)};
function ring(ctx,x,y,r,col,width=3){
 ctx.strokeStyle=col;ctx.lineWidth=width;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
}
export function drawTowerEnvironment(ctx,game){
 if(!game.tower)return;
 const stage=game.currentTowerStage(),index=stage.floor-1;
 const d=game.dungeon,cam=game.camera,kind=motif[index],t=game.time;
 for(const room of d.rooms){
  const cx=room.cx,cy=room.cy;
  if(Math.abs(cx-(cam.x+cam.w*.5))>cam.w*.5+470||
   Math.abs(cy-(cam.y+cam.h*.5))>cam.h*.5+340)continue;
  ctx.save();
  // A stable, color-coded inset floor strip reflects the stage's architecture.
  ctx.globalAlpha=.19;
  rect(ctx,stage.color,cx-225,cy-153,450,3);
  rect(ctx,stage.color,cx-225,cy+150,450,3);
  ctx.globalAlpha=1;
  for(const side of [-1,1]){
   const x=cx+side*256,y=cy+side*108;
   // Wall-hung lanterns, banners and vines are only placed against blocked stone.
   if(!d.isBlocked(x,y))continue;
   rect(ctx,'#15232b',x-15,y-18,30,38);
   rect(ctx,stage.color+'aa',x-10,y-15,20,27);
   rect(ctx,'#f3e2c1',x-3,y-10,6,13);
   if(['banners','chains','souls','runes'].includes(kind)){
    rect(ctx,stage.color+'99',x-11,y+15,22,38);
    rect(ctx,'#1e2835',x-8,y+19,16,3);
   }
  }
  // Distinct inlaid icon per floor, always decorative at the room edges.
  for(let i=0;i<4;i++){
   const dx=i%2?-182:182,dy=i<2?-91:91,x=cx+dx,y=cy+dy;
   ctx.save();ctx.translate(x,y);ctx.rotate((i%2?1:-1)*.20);
   ctx.globalAlpha=.43;
   if(kind==='tide'||kind==='coral'){
    ring(ctx,0,0,19,stage.color+'aa',3);ring(ctx,0,0,8,stage.color,2);
   }else if(kind==='leaves'||kind==='spores'){
    ring(ctx,0,0,16,stage.color,2);
    for(let q=0;q<5;q++){const a=q*2*Math.PI/5;rect(ctx,stage.color,Math.cos(a)*14-3,Math.sin(a)*14-3,6,6)}
   }else if(kind==='clock'||kind==='eclipse'){
    ring(ctx,0,0,24,stage.color,3);ring(ctx,0,0,16,stage.color,2);
    rect(ctx,stage.color,-2,-23,4,13);rect(ctx,stage.color,-2,8,4,14);
   }else if(kind==='chains'){
    for(let q=-1;q<=1;q++)ring(ctx,q*11,q*8,9,stage.color,3);
   }else if(kind==='souls'){
    for(let q=0;q<3;q++)ring(ctx,q*10-12,5*Math.sin(t+q),6,stage.color,2);
   }else{
    for(let q=0;q<4;q++){ctx.rotate(Math.PI/2);rect(ctx,stage.color,-2,-24,4,15)}
   }
   ctx.restore();
  }
  if(room.type==='boss'){
   const final=stage.floor===10,phase=game.getActiveBoss()?.boss.phase||1;
   ctx.save();ctx.translate(cx,cy);
   ring(ctx,0,0,final?190:162,stage.color+'b3',final?6:4);
   ring(ctx,0,0,final?151:130,stage.color+'88',3);
   for(let i=0;i<(final?12:8);i++){
    const angle=i*2*Math.PI/(final?12:8)+t*(final?.11:.05);
    const dist=final?185:158;
    ctx.save();ctx.translate(Math.cos(angle)*dist,Math.sin(angle)*dist);
    ctx.rotate(angle);rect(ctx,stage.color,-7,-8,14,16);
    rect(ctx,'#fff0d7',-2,-4,4,8);ctx.restore();
   }
   if(final){
    const pulse=.55+.25*Math.sin(t*(phase===3?7:3));
    ctx.globalAlpha=pulse;
    ring(ctx,0,0,92,'#b89ce9',phase===3?9:5);
    ring(ctx,0,0,44,'#edc5ff',3);
    for(let q=0;q<6;q++){
     const a=q*Math.PI/3-t*.16,r=114+Math.sin(t+q)*4;
     rect(ctx,phase===3?'#f5a2b6':'#a9b4eb',Math.cos(a)*r-4,Math.sin(a)*r-4,8,8);
    }
   }
   ctx.restore();
  }
  ctx.restore();
 }
}
export function drawTowerVictory(ctx,game){
 if(!game.tower||game.mode!=='victory'||!game.player)return;
 const p=game.player,t=game.time;
 ctx.save();
 ctx.globalCompositeOperation='screen';
 for(let i=0;i<34;i++){
  const a=i*Math.PI*2/34+t*(i%2?-.14:.12);
  const r=75+(i*17)%170;
  ctx.globalAlpha=.35+.3*Math.sin(t*2+i)**2;
  rect(ctx,i%3===0?'#ffe6a3':i%3===1?'#c4aaff':'#9aebd9',
   p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,4+i%3,4+i%3);
 }
 ctx.restore();
}
