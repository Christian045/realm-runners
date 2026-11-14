const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 fs.mkdirSync('test-output',{recursive:true});
 for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1280,height:960}}),errors=[],missing=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)missing.push(r.status()+' '+r.url());});
   await page.goto('http://127.0.0.1:8000/tests/hunter-locomotion-review.html');
   await page.locator('html[data-hunter-walk-review="passed"]').waitFor();
   await page.locator('#pause').click();
   for(let row=0;row<8;row++){
    await page.locator('[data-row="'+row+'"]').click();
    for(let frame=0;frame<8;frame++){
     await page.locator('#phase').evaluate((el,f)=>{el.value=String(f);el.dispatchEvent(new Event('input',{bubbles:true}));},frame);
     await page.locator('#readout[data-row="'+row+'"][data-frame="'+frame+'"]').waitFor();
    }
    await page.locator('#idle').click();await page.locator('#readout[data-moving="false"]').waitFor();
   }
   await page.locator('[data-row="2"]').click();await page.selectOption('#mode','walk');
   await page.screenshot({path:'test-output/hunter-walk-'+name+'-west.png'});
   await page.selectOption('#mode','cycle');await page.locator('#readout[data-moving="true"]').waitFor();
   await page.locator('#readout[data-moving="false"]').waitFor();
   await page.selectOption('#mode','manual');await page.locator('#stage').focus();
   await page.keyboard.down('ArrowUp');await page.keyboard.down('ArrowRight');
   await page.locator('#readout[data-row="5"][data-moving="true"]').waitFor();
   await page.waitForTimeout(120);await page.keyboard.up('ArrowUp');await page.keyboard.up('ArrowRight');
   await page.locator('#readout[data-moving="false"]').waitFor();
   await page.locator('[data-row="4"]').click();await page.selectOption('#mode','walk');
   await page.screenshot({path:'test-output/hunter-walk-'+name+'-north.png'});
   await page.locator('#frames').evaluate(el=>el.open=true);
   await page.screenshot({path:'test-output/hunter-walk-'+name+'-all-frames.png',fullPage:true});
   assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
   console.log(name+': 64 gait frames, eight idle transitions, timed start/stop, diagonal keyboard movement, no asset or page errors');
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1});
