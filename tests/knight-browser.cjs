const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 fs.mkdirSync('test-output',{recursive:true});
 for(const [name,type,mobile] of [['chromium',chromium,false],['webkit',webkit,true]]){
  const browser=await type.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
  try{
   const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8000/');
   await page.locator('[data-action="class:warrior"]').click();
   await page.locator('[data-action="start"]').click();
   await page.locator('#overlay').waitFor({state:'hidden'});
   const result=await page.evaluate(async()=>{
    const [{KnightSpriteAtlas},{Game},{Renderer},{defaultProgress},{beginKnightAction,knightPose}]=await Promise.all([
     import('./src/knight-sprites.js?v=0.31.0'),import('./src/game.js?v=0.31.0'),import('./src/render.js?v=0.31.0'),
     import('./src/progression.js'),import('./src/knight-animation.js?v=0.31.0')]);
    const atlas=new KnightSpriteAtlas();await atlas.loading;
    if(!atlas.ready)throw new Error('Production knight atlas failed to decode');
    const c=document.createElement('canvas');c.width=192;c.height=192;const ctx=c.getContext('2d');
    let minimumUnique=8,minimumPixels=1e9,edgePixels=0;
    for(const face of ['down','right','up','left'])for(let row=0;row<9;row++){
     const hashes=new Set();
     for(let col=0;col<8;col++){
      const f=atlas.manifest.frames[face][row*8+col];ctx.clearRect(0,0,192,192);
      ctx.drawImage(atlas.images[face],f.x,f.y,f.w,f.h,16,16,f.w,f.h);
      const d=ctx.getImageData(0,0,192,192).data;let pixels=0,hash=2166136261;
      for(let i=0;i<d.length;i+=4){if(d[i+3]>30){pixels++;hash=Math.imul(hash^i,16777619);hash=Math.imul(hash^d[i],16777619);
       const x=i/4%192,y=Math.floor(i/768);if(x===0||x===191||y===0||y===191)edgePixels++;}}
      minimumPixels=Math.min(minimumPixels,pixels);hashes.add(hash);
     }
     minimumUnique=Math.min(minimumUnique,hashes.size);
    }
    const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
    const g=new Game(defaultProgress(),input);g.start('warrior',5);g.player.crit=0;g.player.direction={x:1,y:0};
    const p=g.player,e={type:'slime',x:p.x+40,y:p.y,hp:1000,maxHp:1000,radius:17,knock:{x:0,y:0},flash:0};g.enemies=[e];
    g.attack();const hpBefore=e.hp;g.updateKnightAction(p.knightAction.duration*3/8);
    const hpAfter=e.hp,contactFrame=knightPose(p).frame;
    // Capture a deterministic scene through the real renderer, without adding a debug hook to the game.
    const scene=document.createElement('canvas'),r=new Renderer(scene);await r.knight.loading;
    g.player.direction={x:0,y:1};g.player.knightAction=null;g.enemies=[];g.camera.x=p.x-g.camera.w/2;g.camera.y=p.y-g.camera.h/2;
    r.updateCamera(g);g.camera.x=p.x-g.camera.w/2;g.camera.y=p.y-g.camera.h/2;r.draw(g);
    const screenshot=scene.toDataURL('image/png');
    const frames=[];
    for(const clip of ['idle','walk','attack1','attack2','attack3','special','dash','hurt','death']){
     p.hp=100;p.hurtTimer=0;p.knightAction=null;
     if(clip==='death'){p.hp=0;p.knightDeathElapsed=.9;}
     else if(clip==='walk'){p.moving=true;p.walkCycle=3;}
     else if(clip==='hurt')p.hurtTimer=.16;
     else if(clip!=='idle'){beginKnightAction(p,clip,.8);p.knightAction.elapsed=.4;}
     r.draw(g);frames.push(scene.toDataURL('image/png'));p.moving=false;
    }
    return {ready:atlas.ready,minimumUnique,minimumPixels,edgePixels,hpBefore,hpAfter,contactFrame,screenshot,frames};
   });
   assert.ok(result.ready);assert.ok(result.minimumUnique>=6,'every strip needs distinct authored poses');
   assert.ok(result.minimumPixels>500,'no empty or tiny cutout frames');assert.equal(result.edgePixels,0,'sprites must not be clipped');
   assert.equal(result.hpBefore,1000);assert.ok(result.hpAfter<1000);assert.equal(result.contactFrame,3);
   fs.writeFileSync('test-output/knight-'+name+'.png',Buffer.from(result.screenshot.split(',')[1],'base64'));
   result.frames.forEach((data,i)=>fs.writeFileSync('test-output/knight-'+name+'-'+i+'.png',Buffer.from(data.split(',')[1],'base64')));
   if(mobile){
    await page.locator('#attackTouch').tap();await page.locator('#abilityTouch').tap();await page.locator('#dashTouch').tap();
    assert.ok(await page.locator('#mobileControls').isVisible());
    assert.equal(await page.evaluate(()=>visualViewport.scale),1);
   }else{await page.keyboard.press('KeyF');await page.keyboard.press('KeyQ');await page.keyboard.press('Space');}
   await page.screenshot({path:'test-output/knight-live-'+name+'.png'});
   assert.deepEqual(errors,[]);
   const summary={...result};delete summary.screenshot;delete summary.frames;console.log(name,JSON.stringify(summary));
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
