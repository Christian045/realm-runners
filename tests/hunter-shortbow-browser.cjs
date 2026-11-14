const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 fs.mkdirSync('test-output',{recursive:true});
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1440,height:1080}}),errors=[],missing=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('response',r=>{if(r.status()>=400&&/\/(assets|src)\//.test(r.url()))missing.push(r.url());});
   await page.goto('http://127.0.0.1:8000/tests/hunter-qa.html?hunterShortbow=1');
   await page.locator('html[data-hunter-qa-status="passed"]').waitFor();
   assert.match(await page.locator('#status').textContent(),/448\/448 Frames/);
   await page.locator('#clip').selectOption('walk');
   await page.screenshot({path:'test-output/shortbow-'+name+'-walk.png',fullPage:true});
   await page.goto('http://127.0.0.1:8000/?hunterShortbow=1&debugAnimations=1');
   await page.locator('.identity small').filter({hasText:'KURZBOGEN-TEST'}).waitFor();
   await page.locator('[data-action="class:hunter"]').click();
   await page.locator('[data-action="animationLab"]').click();
   await page.locator('[data-lab="pause"]').click();
   for(const direction of [6,2,0]){
    await page.locator('[data-direction="'+direction+'"]').click();
    for(const state of ['idle','walk','attack','special','dash','hurt','death']){
     await page.locator('[data-lab="state"]').selectOption(state);
     await page.locator('[data-info="hunter"]').filter({hasText:state+' · '}).waitFor();
    }
   }
   await page.locator('[data-lab="state"]').selectOption('idle');
   await page.screenshot({path:'test-output/shortbow-'+name+'-north-idle.png'});
   await page.locator('[data-lab="close"]').click();
   await page.locator('[data-action="start"]').click();
   await page.locator('#overlay').waitFor({state:'hidden'});
   await page.keyboard.down('w');await page.waitForTimeout(180);await page.keyboard.up('w');
   await page.keyboard.press('f',{delay:180});await page.waitForTimeout(250);
   await page.screenshot({path:'test-output/shortbow-'+name+'-dungeon.png'});
   assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
   console.log(name+': opt-in shortbow, 448 frames, 16 origins/releases, 21 lab states, dungeon; anatomy still requires visual review');
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
