const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
 fs.mkdirSync('test-output',{recursive:true});
 for(const [name,engine,mobile] of [['chromium',chromium,false],['webkit',webkit,true]]){
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({
    viewport:mobile?{width:390,height:844}:{width:1280,height:800},
    isMobile:mobile,hasTouch:mobile
   });
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8000/?v=0.64.0');
   const result=await page.evaluate(async()=>{
    const [{getKnightFinal},{KNIGHT_PRODUCTION_COUNTS},{labSample,LAB_DIRECTIONS}]=await Promise.all([
     import('./src/knight-final.js?v=0.64.0'),
     import('./src/knight-production.js?v=0.64.0'),
     import('./src/animation-lab.js?v=0.64.0')
    ]);
    const atlas=getKnightFinal();await atlas.loading;
    if(!atlas.ready||!atlas.production||atlas.failed)throw Error('Released knight not loaded');
    const gallery=document.createElement('canvas');gallery.width=1152;gallery.height=1440;
    const g=gallery.getContext('2d');g.fillStyle='#22303b';g.fillRect(0,0,1152,1440);
    let checked=0;
    for(const [ci,[clip,count]] of Object.entries(KNIGHT_PRODUCTION_COUNTS).entries()){
     for(let row=0;row<8;row++){
      for(let f=0;f<count;f++){
       const tile=atlas.frame(row,clip,f),data=tile.getContext('2d').getImageData(0,0,144,144).data;
       let pixels=0;
       for(let i=3;i<data.length;i+=4)if(data[i]>64)pixels++;
       if(pixels<1400)throw Error('Empty production cell '+clip+'/'+row+'/'+f);
       checked++;
      }
      const frame=clip==='attack1'?3:clip==='attack2'?4:clip==='attack3'?5:clip==='death'?7:0;
      g.drawImage(atlas.frame(row,clip,frame),row*144,ci*144);
     }
    }
    for(const state of ['idle','walk']){
     const samples=new Set();
     for(const t of [0,.2,.4,.6,.8]){
      const p=labSample('warrior',state,LAB_DIRECTIONS[2],t).player;
      const c=document.createElement('canvas');c.width=256;c.height=176;
      atlas.draw(c.getContext('2d'),p,t*1.6);samples.add(c.toDataURL());
     }
     if(samples.size<4)throw Error('Frozen training-hall '+state);
    }
    return {checked,gallery:gallery.toDataURL()};
   });
   assert.equal(result.checked,608);
   fs.writeFileSync('test-output/knight-054-'+name+'-all-states.png',Buffer.from(result.gallery.split(',')[1],'base64'));
   await page.locator('[data-action="class:warrior"]').click();
   await page.screenshot({path:'test-output/knight-054-'+name+'-menu.png'});
   await page.locator('[data-action="start"]').click();
   await page.locator('#overlay').waitFor({state:'hidden'});
   if(mobile){
    await page.locator('#attackTouch').tap();
    await page.locator('#abilityTouch').tap();
    await page.locator('#dashTouch').tap();
    assert.equal(await page.evaluate(()=>visualViewport.scale),1);
    assert.ok(await page.locator('#mobileControls').isVisible());
   }else{
    await page.keyboard.down('KeyD');await page.waitForTimeout(250);
    await page.keyboard.press('KeyF');await page.waitForTimeout(200);
    await page.keyboard.up('KeyD');await page.keyboard.press('Space');
   }
   assert.deepEqual(errors,[]);
   await page.screenshot({path:'test-output/knight-054-'+name+'-game.png'});
   await page.goto('http://127.0.0.1:8000/?previewKnightFinal=1');
   assert.equal(await page.evaluate(async()=>{
    const {getKnightFinal}=await import('./src/knight-final.js?v=0.64.0');
    const atlas=getKnightFinal();await atlas.loading;return atlas.production;
   }),true);
   console.log(name,'608 production cells, menu, dungeon, controls and previous preview link passed');
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
