const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 fs.mkdirSync('test-output',{recursive:true});
 for(const [engine,type,mobile] of [['chromium',chromium,false],['webkit',webkit,true]]){
  const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
  try{
   const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:800},isMobile:mobile,hasTouch:mobile,deviceScaleFactor:mobile?2:1}),errors=[],requests=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));await page.goto('http://127.0.0.1:8000/');
   assert.ok(!requests.some(url=>/assets\/companions\/.*atlas.png/.test(url)),'other classes must not download full companion art');
   await page.locator('[data-action="class:summoner"]').click();
   await page.waitForFunction(()=>[...document.querySelectorAll('canvas[data-companion]')].length===3&&[...document.querySelectorAll('canvas[data-companion]')].every(c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data.some((v,i)=>i%4===3&&v>60)));
   assert.ok(!requests.some(url=>/companions\/(imp|spirit)\/atlas.png/.test(url)),'unselected full companions remain lazy');
   await page.screenshot({path:'test-output/companions-menu-'+engine+'.png'});
   const result=await page.evaluate(async()=>{
    const [{CompanionSpriteAtlas},{beginCompanionAttack,companionPose,companionShot}]=await Promise.all([import('./src/companion-sprites.js?v=0.30.2'),import('./src/companion-animation.js?v=0.30.2')]);
    const atlas=new CompanionSpriteAtlas(),c=document.createElement('canvas');c.width=224;c.height=224;const ctx=c.getContext('2d'),reports=[];
    const dirs={down:{x:0,y:1},right:{x:1,y:0},up:{x:0,y:-1},left:{x:-1,y:0}};
    for(const kind of ['bat','imp','spirit','giant']){
     await atlas.select(kind,kind==='giant');if(kind==='giant')await atlas.giantLoading;await atlas.previewLoading;
     const entry=atlas.entries[kind];if(!entry)throw Error('Missing '+kind);
     let minimumUnique=6,minimumPixels=1e9,edgePixels=0,frames=0;
     const sheet=document.createElement('canvas');sheet.width=960;sheet.height=480;const paint=sheet.getContext('2d');paint.fillStyle='#20232b';paint.fillRect(0,0,960,480);
     let row=0;
     for(const clip of ['motion','attack','summon','vanish'])for(const [face,d] of Object.entries(dirs)){
      if((clip==='summon'||clip==='vanish')&&face!=='down')continue;
      const hashes=new Set();
      for(let n=0;n<6;n++){
       const s={kind,x:112,y:156,hp:100,direction:d,appearanceElapsed:1,moving:true};
       if(clip==='motion')s.visualTime=(n+.01)/6*(kind==='bat'?.42:kind==='imp'?.50:kind==='giant'?.9:1.05);
       if(clip==='attack'){beginCompanionAttack(s,{x:s.x+d.x*180,y:s.y+d.y*180});s.companionAction.elapsed=(n+.01)/6*s.companionAction.duration;}
       if(clip==='summon')s.appearanceElapsed=(n+.01)/6*.42;if(clip==='vanish')s.vanishElapsed=(n+.01)/6*.48;
       const pose=companionPose(s);if(pose.frame!==n)throw Error('Wrong pose '+kind+' '+clip+' '+n);
       const f=clip==='summon'||clip==='vanish'?entry.manifest.frames[clip][n]:entry.manifest.frames[clip][face][n];
       if(f.x<0||f.y<0||f.x+f.w>entry.image.width||f.y+f.h>entry.image.height)throw Error('Bad UV');
       ctx.clearRect(0,0,224,224);atlas.draw(ctx,s);const data=ctx.getImageData(0,0,224,224).data;let hash=2166136261,pixels=0;
       for(let i=0;i<data.length;i+=4)if(data[i+3]>60){pixels++;hash=Math.imul(hash^i,16777619);hash=Math.imul(hash^data[i],16777619);const x=i/4%224,y=Math.floor(i/896);if(!x||!y||x===223||y===223)edgePixels++;}
       hashes.add(hash);minimumPixels=Math.min(minimumPixels,pixels);frames++;
       if(clip==='attack'&&n===2&&(kind==='imp'||kind==='spirit')){
        const shot=companionShot(s),sample=ctx.getImageData(Math.round(shot.x)-4,Math.round(shot.y)-4,9,9).data;let lit=0;
        for(let i=0;i<sample.length;i+=4)if(sample[i+3]>80&&(kind==='imp'?sample[i]>200&&sample[i+1]>100:sample[i+2]>170&&sample[i+1]>130))lit++;
        if(lit<2)throw Error('Projectile detached from casting-hand pixels '+kind+' '+face);
       }
       if(clip==='motion'){paint.drawImage(c,32,16,160,176,n*160,row*120-12,160,176);paint.fillStyle='#fff';paint.font='10px sans-serif';paint.fillText(kind+' '+face,n*160+2,row*120+10);}
      }
      minimumUnique=Math.min(minimumUnique,hashes.size);if(clip==='motion')row++;
     }
     reports.push({kind,frames,minimumUnique,minimumPixels,edgePixels,contact:sheet.toDataURL()});
    }return reports;
   });
   for(const r of result){assert.equal(r.frames,60);assert.ok(r.minimumUnique>=5,r.kind+' needs distinct painted poses');assert.ok(r.minimumPixels>15);assert.equal(r.edgePixels,0);fs.writeFileSync('test-output/companion-'+r.kind+'-'+engine+'.png',Buffer.from(r.contact.split(',')[1],'base64'));delete r.contact;console.log(engine,JSON.stringify(r));}
   for(const kind of ['bat','imp','spirit']){
    await page.locator('[data-action="servant:'+kind+'"]').click();await page.locator('[data-action="start"]').click();await page.locator('#overlay').waitFor({state:'hidden'});
    if(mobile){const box=await page.locator('#abilityTouch').boundingBox();await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);}else await page.keyboard.press('KeyQ');
    await page.waitForTimeout(800);await page.screenshot({path:'test-output/companion-'+kind+'-live-'+engine+'.png'});
    assert.equal(await page.evaluate(()=>visualViewport.scale),1);await page.locator('#pauseBtn').click();await page.locator('[data-action="menu"]').click();
   }
   assert.deepEqual(errors,[]);
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exit(1)});
