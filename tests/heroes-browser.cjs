const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 fs.mkdirSync('test-output',{recursive:true});
 for(const [engine,browserType,mobile] of [['chromium',chromium,false],['webkit',webkit,true]]){
  const browser=await browserType.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
  try{
   const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8000/');
   for(const kind of (process.env.HERO_TEST_KINDS?.split(',')||['hunter','mage','glasscannon','summoner','alchemist'])){
    await page.locator('[data-action="class:'+kind+'"]').click();await page.locator('[data-action="start"]').click();
    await page.locator('#overlay').waitFor({state:'hidden'});
    const result=await page.evaluate(async kind=>{
     const [{HeroSpriteAtlas},{Game},{Renderer},{defaultProgress},{heroPose,beginHeroAction}]=await Promise.all([
      import('./src/hero-sprites.js?v=0.28.0'),import('./src/game.js?v=0.28.0'),import('./src/render.js?v=0.28.0'),import('./src/progression.js'),import('./src/hero-animation.js?v=0.28.0')]);
     const atlas=new HeroSpriteAtlas();atlas.select(kind);await atlas.loading;await atlas.previewLoading;
     if(!atlas.ready)throw new Error('Failed atlas '+kind);
     const c=document.createElement('canvas');c.width=192;c.height=192;const ctx=c.getContext('2d');
     let minUnique=6,minPixels=1e9,edges=0;
     for(const face of ['down','right','up','left'])for(let row=0;row<7;row++){
      const hashes=new Set();
      for(let col=0;col<6;col++){
       const f=atlas.manifest.frames[face][row*6+col];
       if(f.x<0||f.y<0||f.x+f.w>atlas.images[face].width||f.y+f.h>atlas.images[face].height)throw new Error('Invalid source UV '+kind);
       ctx.clearRect(0,0,192,192);ctx.drawImage(atlas.images[face],f.x,f.y,f.w,f.h,16,16,f.w,f.h);
       const d=ctx.getImageData(0,0,192,192).data;let pixels=0,hash=2166136261;
       for(let i=0;i<d.length;i+=4)if(d[i+3]>30){pixels++;hash=Math.imul(hash^i,16777619);hash=Math.imul(hash^d[i],16777619);
        const x=i/4%192,y=Math.floor(i/768);if(x===0||x===191||y===0||y===191)edges++;}
       minPixels=Math.min(minPixels,pixels);hashes.add(hash);
      }
      minUnique=Math.min(minUnique,hashes.size);
     }
     const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
     const g=new Game(defaultProgress(),input);g.start(kind,5);const p=g.player;p.direction={x:1,y:0};
     g.attack();const before=g.projectiles.length;g.updateHeroAction(p.heroAction.duration/2);const after=g.projectiles.length,frame=heroPose(p).frame;
     const scene=document.createElement('canvas'),r=new Renderer(scene,kind);await r.heroes.loading;
     g.enemies=[];g.projectiles=[];g.effects=[];p.heroAction=null;p.direction={x:0,y:1};
     r.updateCamera(g);g.camera.x=p.x-g.camera.w/2;g.camera.y=p.y-g.camera.h/2;r.draw(g);
     const screenshot=scene.toDataURL('image/png'),states=[];
     for(const clip of ['idle','walk','attack','special','dash','hurt','death']){
      p.hp=100;p.moving=false;p.hurtTimer=0;p.heroAction=null;
      if(clip==='death'){p.hp=0;p.heroDeathElapsed=.95;}
      else if(clip==='hurt')p.hurtTimer=.15;
      else if(clip==='walk'){p.moving=true;p.walkCycle=3;}
      else if(clip!=='idle'){beginHeroAction(p,clip,.6);p.heroAction.elapsed=.3;}
      r.draw(g);states.push(scene.toDataURL('image/png'));
     }
     const activeKind=r.heroes.kind;r.heroes.release();atlas.release();
     return {ready:true,minUnique,minPixels,edges,before,after,frame,preview:!!atlas.previews[kind],activeKind,screenshot,states};
    },kind);
    assert.ok(result.minUnique>=4,kind+' needs real distinct poses in every clip');assert.ok(result.minPixels>500,kind+' empty/tiny frame');assert.equal(result.edges,0);
    assert.equal(result.before,0);assert.equal(result.after,1);assert.equal(result.frame,3);assert.equal(result.activeKind,kind);assert.ok(result.preview);
    fs.writeFileSync('test-output/'+kind+'-'+engine+'.png',Buffer.from(result.screenshot.split(',')[1],'base64'));
    result.states.forEach((data,i)=>fs.writeFileSync('test-output/'+kind+'-'+engine+'-'+i+'.png',Buffer.from(data.split(',')[1],'base64')));
    await page.evaluate(()=>new Promise(requestAnimationFrame));
    if(mobile){await page.locator('#attackTouch').tap();await page.locator('#abilityTouch').tap();await page.locator('#dashTouch').tap();assert.equal(await page.evaluate(()=>visualViewport.scale),1);}
    else{await page.keyboard.press('KeyF');await page.keyboard.press('KeyQ');await page.keyboard.press('Space');}
    await page.screenshot({path:'test-output/'+kind+'-live-'+engine+'.png'});
    await page.locator('#pauseBtn').click();await page.locator('[data-action="menu"]').click();
    const summary={...result};delete summary.screenshot;delete summary.states;console.log(engine,kind,JSON.stringify(summary));
   }
   assert.deepEqual(errors,[]);
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
