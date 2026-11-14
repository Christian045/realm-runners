// Real browser decoding + all 448 production frames + menu/lab/dungeon smoke.
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 fs.mkdirSync('test-output',{recursive:true});
 const engines=process.env.HUNTER_CHROMIUM_ONLY?[['chromium',chromium]]:[['chromium',chromium],['webkit',webkit]];
 for(const [name,engine] of engines){
  const browser=await engine.launch({headless:true,...(name==='chromium'&&process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}:{})});
  try{
   const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],missing=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400&&/\/(assets|src)\/|styles\.css/.test(r.url()))missing.push(r.status()+' '+r.url());});
   await page.goto('http://127.0.0.1:8000/?debugAnimations=1');
   const result=await page.evaluate(async()=>{
    const {getHunterProduction,HUNTER_COUNTS,hunterPose}=await import('./src/hunter-production.js?v=0.73.0');
    const {getMageProduction}=await import('./src/mage-production.js?v=0.67.1');
    const {getKnightFinal}=await import('./src/knight-final.js?v=0.67.1');
    const {heroShot}=await import('./src/hero-aim.js?v=0.73.0');
    const hunter=getHunterProduction(),mage=getMageProduction(),knight=getKnightFinal();
    await Promise.all([hunter.loading,mage.loading,knight.loading]);
    if(!hunter.ready||!mage.ready||!knight.ready)throw Error('Production art not ready');
    const c=document.createElement('canvas');c.width=1600;c.height=8*136;
    const g=c.getContext('2d');g.imageSmoothingEnabled=false;g.fillStyle='#19222a';g.fillRect(0,0,c.width,c.height);
    let checked=0;
    const galleries={};
    for(const [clip,count] of Object.entries(HUNTER_COUNTS)){
     g.fillStyle='#19222a';g.fillRect(0,0,c.width,c.height);
     for(let row=0;row<8;row++)for(let frame=0;frame<count;frame++){
      const angle=Math.PI/2+row*Math.PI/4,direction={x:Math.cos(angle),y:Math.sin(angle)};
      const p={kind:'hunter',x:frame*200+100,y:row*136+120,hp:100,direction,moving:clip==='walk',heroMoveDirection:direction,walkDistance:frame*12,heroDeathDirection:direction};
      if(clip==='death')p.hp=0;
      if(clip==='death')p.heroDeathElapsed=(frame+.01)/8*1.04;
      else if(!['walk','idle'].includes(clip))p.heroAction={clip,elapsed:(frame+.01)/8,duration:1,direction};
      const time=clip==='idle'?(frame+.01)/8*2.4:0;
      if(hunterPose(p,time).frame!==frame)throw Error('Wrong frame '+clip+'/'+row+'/'+frame);
      if(!hunter.draw(g,p,time))throw Error('Draw failed');
      if((clip==='attack'||clip==='special')&&frame===3){
       const s=heroShot(p);g.fillStyle='#77efff';g.fillRect(s.x-1,s.y-1,3,3);
       g.strokeStyle='#77efff';g.beginPath();g.moveTo(s.x,s.y);g.lineTo(s.x+s.aim.x*20,s.y+s.aim.y*20);g.stroke();
      }
      g.fillStyle='#d7dfd9';g.font='12px monospace';g.fillText(clip+' '+row+'/'+frame,frame*200+10,row*136+16);checked++;
     }
     galleries[clip]=c.toDataURL('image/png');
    }
    // Same runtime draw functions, same world scale, same foot pivots.
    c.width=900;c.height=320;g.fillStyle='#19222a';g.fillRect(0,0,900,320);g.imageSmoothingEnabled=false;
    for(const [i,rig] of [knight,mage,hunter].entries()){
     g.save();g.translate(i*300,0);g.scale(3,3);
     rig.draw(g,{kind:['warrior','mage','hunter'][i],x:50,y:95,hp:100,direction:{x:0,y:1}},0);g.restore();
    }
    return {checked,galleries,comparison:c.toDataURL('image/png')};
   });
   assert.equal(result.checked,448);
   for(const [clip,data] of Object.entries(result.galleries))fs.writeFileSync('test-output/hunter-'+name+'-'+clip+'.png',Buffer.from(data.split(',')[1],'base64'));
   fs.writeFileSync('test-output/hunter-'+name+'-class-comparison.png',Buffer.from(result.comparison.split(',')[1],'base64'));
   await page.locator('[data-action="class:hunter"]').click();
   await page.screenshot({path:'test-output/hunter-'+name+'-menu.png'});
   await page.locator('[data-action="animationLab"]').click();
   await page.locator('[data-info="hunter"]').filter({hasText:/idle/}).waitFor();
   await page.locator('[data-lab="pause"]').click();
   const directions=['N','NE','E','SE','S','SW','W','NW'];
   for(const clip of ['idle','walk','attack','special','dash','hurt','death']){
    await page.locator('[data-lab="state"]').selectOption(clip);
    for(let direction=0;direction<8;direction++){
     await page.locator('[data-direction="'+direction+'"]').click();
     await page.locator('[data-info="hunter"]').filter({hasText:clip+' · '+directions[direction]+' ·'}).waitFor();
    }
   }
   await page.screenshot({path:'test-output/hunter-'+name+'-training.png'});
   await page.locator('[data-lab="close"]').click();
   await page.locator('[data-action="start"]').click();await page.locator('#overlay').waitFor({state:'hidden'});
   await page.keyboard.press('f',{delay:220});await page.waitForTimeout(400);
   await page.keyboard.press('q',{delay:200});
   await page.locator('#abilityHud').filter({hasText:/Q · [0-9]/}).waitFor();
   await page.waitForTimeout(600);await page.keyboard.press('Space',{delay:100});
   await page.keyboard.down('d');await page.waitForTimeout(200);await page.keyboard.up('d');
   await page.screenshot({path:'test-output/hunter-'+name+'-dungeon.png'});
   assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
   console.log(name+': 448 frames, 56 lab states, menu, dungeon, basic/special/dash, no page or asset errors');
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
