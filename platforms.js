'use strict';
// Moving lifts and crumbling stone bridges. Deterministic 60Hz simulation,
// no checkpoints and no persistent state: restarting resets each platform.
let movingPlatforms=[];
function resetPlatforms(){
 const cfg=stages[stage];
 movingPlatforms=[
  ...(cfg.moving||[]).map(([x,y,w,axis,distance,speed],i)=>({
   kind:'moving',id:'m'+i,x,y,w,baseX:x,baseY:y,
   axis,distance,speed,dir:1,prevY:y,dx:0,dy:0
  })),
  ...(cfg.crumbling||[]).map(([x,y,w],i)=>({
   kind:'crumble',id:'c'+i,x,y,w,baseX:x,baseY:y,prevY:y,
   state:'ready',timer:0,vy:0,dx:0,dy:0
  }))
 ];
}
function activePlatforms(){
 return movingPlatforms.filter(p=>p.kind==='moving'||p.state==='ready'||p.state==='shaking');
}
function triggerCrumble(p){
 if(p.kind==='crumble'&&p.state==='ready'){p.state='shaking';p.timer=33;}
}
function platformTick(dt){
 for(const p of movingPlatforms){
  const ox=p.x,oy=p.y;p.prevY=oy;
  if(p.kind==='moving'){
   const key=p.axis==='y'?'y':'x',base=p.axis==='y'?p.baseY:p.baseX;
   let current=p[key]+p.dir*p.speed*dt;
   if(current>=base+p.distance){current=base+p.distance;p.dir=-1;}
   if(current<=base-p.distance){current=base-p.distance;p.dir=1;}
   p[key]=current;
  }else if(p.state==='shaking'){
   p.timer-=dt;
   if(p.timer<=0){
    p.state='falling';p.vy=.4;
    burst(p.x+p.w/2,p.y+6,'#e7b991',20,2.1);
   }
  }else if(p.state==='falling'){
   p.vy=Math.min(16,p.vy+.44*dt);p.y+=p.vy*dt;
   if(p.y>H+100){p.state='gone';p.timer=210;}
  }else if(p.state==='gone'){
   p.timer-=dt;
   if(p.timer<=0){
    p.x=p.baseX;p.y=p.baseY;p.vy=0;p.state='ready';p.timer=0;
    burst(p.x+p.w/2,p.y,'#a8d2b8',9,1.1);
   }
  }
  p.dx=p.x-ox;p.dy=p.y-oy;
  if(hero&&hero.on&&hero.riding===p.id&&
     (p.kind==='moving'||p.state==='shaking')){
   hero.x=Math.max(0,Math.min(WIDTH-hero.w,hero.x+p.dx));
   hero.y+=p.dy;
  }
 }
}
function drawDynamicPlatforms(){
 for(const p of movingPlatforms){
  if(p.state==='gone'||p.x+p.w<cam-30||p.x>cam+W+30||p.y>H+80)continue;
  const x=Math.round(p.x/4)*4,y=Math.round(p.y/4)*4,w=p.w;
  if(p.kind==='moving'){
   // Iron winch rail, chain and gears: readable without drawing behind the player.
   ctx.fillStyle='#1d2535';
   if(p.axis==='y'){
    ctx.fillRect(x+w/2-5,p.baseY-p.distance-22,10,p.distance*2+55);
    ctx.fillStyle='#798d93';ctx.fillRect(x+w/2-2,p.baseY-p.distance-20,4,p.distance*2+49);
    for(let cy=p.baseY-p.distance;cy<p.baseY+p.distance;cy+=18){
     ctx.fillStyle='#c1b8a0';ctx.fillRect(x+w/2-4,cy,8,4);
    }
   }else{
    ctx.fillRect(p.baseX-p.distance,p.baseY+17,p.distance*2+w,7);
    ctx.fillStyle='#879695';ctx.fillRect(p.baseX-p.distance,p.baseY+19,p.distance*2+w,3);
   }
   ctx.fillStyle='#132c38';ctx.fillRect(x-3,y-4,w+6,26);
   ctx.fillStyle='#5d7478';ctx.fillRect(x,y,w,20);
   ctx.fillStyle='#91a8a5';ctx.fillRect(x,y,w,6);
   ctx.fillStyle='#d7d0a2';ctx.fillRect(x+5,y+2,w-10,3);
   for(let i=10;i<w-5;i+=23){
    ctx.fillStyle='#364651';ctx.fillRect(x+i,y+9,4,7);
    ctx.fillStyle='#c3b28e';ctx.fillRect(x+i+1,y+10,2,3);
   }
  }else{
   const warning=p.state==='shaking';
   const jitter=warning&&Math.floor(p.timer/4)%2?3:0;
   const yy=y+jitter;
   ctx.fillStyle='#1f2234';ctx.fillRect(x-2,yy-3,w+4,26);
   ctx.fillStyle=p.state==='falling'?'#695365':'#6f666c';
   ctx.fillRect(x,yy,w,20);
   ctx.fillStyle=warning?'#ffd58b':'#b7ac97';ctx.fillRect(x,yy,w,5);
   for(let i=8;i<w;i+=26){
    ctx.fillStyle='#342f41';ctx.fillRect(x+i,yy+8,5,8);
    ctx.fillRect(x+i+4,yy+11,14,3);
    if(warning){ctx.fillStyle='#ff8c72';ctx.fillRect(x+i+6,yy+2,5,3);}
   }
   if(p.state==='falling'&&Math.floor(t)%5===0){
    ctx.fillStyle='#cfaa92';ctx.fillRect(x+w/2,yy-12,5,5);
   }
  }
 }
}
