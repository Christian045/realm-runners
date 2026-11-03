const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   await page.goto('http://127.0.0.1:8000/');
   const result=await page.evaluate(async()=>{
    const [{HeroSpriteAtlas},{KnightSpriteAtlas},{articulatedPose,RIG_KINDS},{heroShot}]=await Promise.all([
     import('./src/hero-sprites.js?v=0.40.0'),import('./src/knight-sprites.js?v=0.40.0'),import('./src/articulated-hero.js?v=0.40.0'),import('./src/hero-aim.js?v=0.40.0')]);
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');let checked=0,sockets=0;
    for(const kind of RIG_KINDS){
     const atlas=kind==='warrior'?new KnightSpriteAtlas():new HeroSpriteAtlas();if(kind!=='warrior')atlas.select(kind);await atlas.loading;
     const rig=atlas.rig||atlas.rigs[kind];if(!rig?.ready)throw Error('New art missing: '+kind);
     for(let row=0;row<8;row++)for(const clip of ['idle','walk','attack','special','dash','hurt','death']){
      const a=Math.PI/2+row*Math.PI/4,direction={x:Math.cos(a),y:Math.sin(a)},p={kind,x:128,y:128,hp:100,direction,moving:clip==='walk',walkDistance:23,heroMoveDirection:direction,knightMoveDirection:direction};
      if(clip==='death'){p.hp=0;p.heroDeathElapsed=.8;p.knightDeathElapsed=.8;}
      else if(!['idle','walk'].includes(clip))p[kind==='warrior'?'knightAction':'heroAction']={clip:kind==='warrior'&&clip==='attack'?'attack1':clip,elapsed:.5,duration:1,direction};
      ctx.clearRect(0,0,256,256);if(!atlas.draw(ctx,p,.4))throw Error('Empty render');
      if(articulatedPose(p).row!==row)throw Error('Wrong view');
      const pixels=ctx.getImageData(0,0,256,256).data;let count=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>30)count++;
      if(count<400)throw Error('Missing character '+kind+' '+clip);checked++;
      if(kind!=='warrior'&&clip==='attack'){
       const shot=heroShot(p),near=ctx.getImageData(Math.round(shot.x)-5,Math.round(shot.y)-5,11,11).data;
       if(!near.some((value,i)=>i%4===3&&value>30))throw Error('Detached projectile '+kind+' '+row);sockets++;
      }
     }
    }
    return {checked,sockets};
   });assert.equal(result.checked,336);assert.equal(result.sockets,40);console.log(name,'production rigs:',result);
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
