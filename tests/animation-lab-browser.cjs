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
   const click=async selector=>{const el=page.locator(selector);if(!mobile){await el.click();return;}await el.evaluate(node=>node.scrollIntoView({block:'nearest',inline:'nearest',behavior:'instant'}));const box=await el.boundingBox();assert.ok(box);await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);};
   const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:8000/?debugAnimations=1');
   await page.evaluate(async()=>{
    const {getMageProduction}=await import('./src/mage-production.js?v=0.58.0');
    const mage=getMageProduction();await mage.loading;const draw=mage.draw.bind(mage);
    window.mageLabDraws=0;mage.draw=(...args)=>{window.mageLabDraws++;return draw(...args);};
   });
   const before=await page.evaluate(()=>JSON.stringify(localStorage));
   await click('[data-action="animationLab"]');
   const dialog=page.locator('.animation-lab');await dialog.waitFor({state:'visible'});
   await page.waitForFunction(()=>[...document.querySelectorAll('[data-info]')].every(p=>p.textContent.includes('Bild')));
   assert.equal(await page.locator('[data-kind]').count(),6);
   await click('[data-lab="pause"]');
   // Exercise the real dialog input handlers and Canvas loop in one browser
   // evaluation. 528 cross-process locator round trips overloaded mobile WebKit
   // and could close the renderer even though every frame was rendered correctly.
   const tested=await page.evaluate(async()=>{
    const dialog=document.querySelector('.animation-lab');
    const clip=dialog.querySelector('[data-lab="state"]');
    const seek=dialog.querySelector('[data-lab="seek"]');
    let frames=0;
    for(const state of ['idle','walk','attack','attack2','attack3','special','cast','recovery','hurt','dash','death']){
     clip.value=state;clip.dispatchEvent(new Event('input',{bubbles:true}));
     for(let direction=0;direction<8;direction++){
      dialog.querySelector(`[data-direction="${direction}"]`).click();
      seek.value='500';seek.dispatchEvent(new Event('input',{bubbles:true}));
      await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
      const texts=[...dialog.querySelectorAll('[data-info]')].map(el=>el.textContent);
      if(texts.length!==6||texts.some(t=>!t.includes('Bild')||t.includes('Darstellungsfehler')))
       throw new Error(state+' '+direction+': invalid preview '+texts.join(' | '));
      frames+=texts.length;
     }
    }
    return frames;
   });
   assert.equal(tested,528);
   assert.ok(await page.evaluate(()=>window.mageLabDraws>0),'Training hall uses the production mage');
   await page.selectOption('[data-lab="state"]','attack');await click('[data-direction="4"]');await page.locator('[data-lab="anchors"]').check();
   await page.locator('[data-lab="seek"]').evaluate(node=>{node.value='500';node.dispatchEvent(new Event('input',{bubbles:true}));});
   await page.waitForFunction(()=>document.querySelector('[data-info="mage"]').textContent.includes('attack · S · Bild 7'));
   await page.screenshot({path:`test-output/${name}-animation-lab-${mobile?'mobile':'desktop'}.png`});
   const bounds=await dialog.boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=(mobile?390:1280)+1);
   await click('[data-lab="close"]');assert.equal(await dialog.count(),0);
   assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),before);
   await click('[data-action="animationLab"]');
   await page.waitForFunction(()=>[...document.querySelectorAll('[data-info]')].every(p=>p.textContent.includes('Bild')));
   await click('[data-lab="close"]');
   await click('[data-action="start"]');await page.locator('#overlay').waitFor({state:'hidden'});
   assert.deepEqual(errors,[]);console.log(`${name} ${mobile?'mobile':'desktop'}: 528 class/state/direction previews; saves unchanged; game starts`);
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
