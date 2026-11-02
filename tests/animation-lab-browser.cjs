const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 fs.mkdirSync('test-output',{recursive:true});
 const engines=process.env.LAB_CHROMIUM_ONLY?[['chromium',chromium]]:[['chromium',chromium],['webkit',webkit]];
 for(const [name,engine] of engines)for(const mobile of [false,true]){
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:mobile?{width:390,height:844}:{width:1280,height:900},isMobile:mobile,hasTouch:mobile});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8000/');
   const before=await page.evaluate(()=>JSON.stringify(localStorage));
   await page.locator('[data-action="animationLab"]').click();
   const dialog=page.locator('.animation-lab');await dialog.waitFor({state:'visible'});
   await page.waitForFunction(()=>[...document.querySelectorAll('[data-info]')].every(p=>p.textContent.includes('Bild')));
   assert.equal(await page.locator('[data-kind]').count(),6);
   await page.locator('[data-lab="pause"]').click();
   for(const state of ['idle','walk','attack','attack2','attack3','special','cast','recovery','hurt','dash','death']){
    await page.selectOption('[data-lab="state"]',state);
    for(let direction=0;direction<8;direction++){
     await page.locator(`[data-direction="${direction}"]`).click();
     await page.locator('[data-lab="seek"]').evaluate(el=>{el.value='500';el.dispatchEvent(new Event('input',{bubbles:true}));});
     await page.evaluate(()=>new Promise(requestAnimationFrame));
     const texts=await page.locator('[data-info]').allTextContents();assert.ok(texts.every(t=>t.includes('Bild')),texts.join('\n'));
    }
   }
   await page.selectOption('[data-lab="state"]','attack');await page.locator('[data-direction="4"]').click();await page.locator('[data-lab="anchors"]').check();
   await page.screenshot({path:`test-output/${name}-animation-lab-${mobile?'mobile':'desktop'}.png`});
   const bounds=await dialog.boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=(mobile?390:1280)+1);
   await page.locator('[data-lab="close"]').click();assert.equal(await dialog.count(),0);
   assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),before);
   await page.locator('[data-action="animationLab"]').click();await page.locator('[data-lab="close"]').click();
   await page.locator('[data-action="start"]').click();await page.locator('#overlay').waitFor({state:'hidden'});
   assert.deepEqual(errors,[]);console.log(`${name} ${mobile?'mobile':'desktop'}: 528 class/state/direction previews; saves unchanged; game starts`);
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
