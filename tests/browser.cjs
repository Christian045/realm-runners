const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8000/',{waitUntil:'load'});
  await page.locator('[data-action="start"]').waitFor({timeout:10000});
  assert.match(await page.title(),/Realm Runners/);
  assert.ok(await page.locator('#bossHud').count(),'boss HUD structure must exist');
  assert.ok(await page.locator('#bossPhase').count(),'second-phase label must exist');
  await page.locator('[data-action="class:mage"]').click();
  await page.locator('[data-action="start"]').click();
  await page.locator('#overlay').waitFor({state:'hidden'});
  await page.waitForTimeout(800);
  assert.ok(await page.locator('#hud').isVisible());
  const pixels=await page.locator('#gameCanvas').evaluate(canvas=>{
   const c=canvas.getContext('2d');return Array.from(c.getImageData(canvas.width/2,canvas.height/2,1,1).data);
  });
  assert.ok(pixels[3]>0,'canvas must be painted');
  await page.keyboard.down('KeyD');await page.waitForTimeout(150);await page.keyboard.up('KeyD');
  await page.keyboard.press('KeyQ');await page.keyboard.press('Space');
  await page.waitForTimeout(250);
  await page.keyboard.press('Escape');
  assert.ok(await page.locator('#overlay').isVisible(),'pause should open overlay');
  await page.locator('[data-action="resume"]').click();
  assert.ok(await page.locator('#overlay').isHidden());
  await page.close();
  const mobile=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  mobile.on('pageerror',e=>errors.push(e.message));
  await mobile.goto('http://127.0.0.1:8000/',{waitUntil:'load'});
  await mobile.locator('[data-action="start"]').click();
  assert.ok(await mobile.locator('#mobileControls').isVisible());
  await mobile.locator('#attackTouch').tap();
  await mobile.locator('#dashTouch').tap();
  await mobile.locator('#abilityTouch').tap();
  await mobile.waitForTimeout(400);

  // Desktop Chromium smoke remains intact; add real WebKit engine coverage for Safari.
  // Linux WebKit is not identical to iOS Safari, so an iPhone check is still valuable.
  const safari=await webkit.launch({headless:true});
  try{
   const ios=await safari.newPage({
    viewport:{width:390,height:844},hasTouch:true,isMobile:true,
    deviceScaleFactor:2
   });
   ios.on('pageerror',e=>errors.push('WebKit: '+e.message));
   await ios.goto('http://127.0.0.1:8000/',{waitUntil:'load'});
   await ios.locator('[data-action="class:mage"]').tap();
   await ios.locator('[data-action="start"]').tap();
   await ios.locator('#overlay').waitFor({state:'hidden'});
   assert.ok(await ios.locator('#mobileControls').isVisible(),
    'touch controls must remain available in WebKit');

   const touchStyle=await ios.locator('#gameCanvas').evaluate(
    node=>getComputedStyle(node).touchAction);
   assert.equal(touchStyle,'none','game canvas must disable native browser gestures');

   const preventions=await ios.evaluate(()=>{
    const canvas=document.querySelector('#gameCanvas');
    const touch=new Event('touchstart',{bubbles:true,cancelable:true});
    canvas.dispatchEvent(touch);
    const pinch=new Event('gesturestart',{bubbles:true,cancelable:true});
    canvas.dispatchEvent(pinch);
    return {touch:touch.defaultPrevented,pinch:pinch.defaultPrevented};
   });
   assert.deepEqual(preventions,{touch:true,pinch:true},
    'Safari touch and pinch fallbacks must cancel native zoom');

   // Double-tap empty corners on a mobile viewport (the reported regression).
   // The second tap is close enough to trigger native double-tap zoom if allowed.
   for(const [x,y] of [[9,9],[381,9],[9,835],[381,835]]){
    await ios.touchscreen.tap(x,y);
    await ios.touchscreen.tap(x,y);
    const zoom=await ios.evaluate(()=>visualViewport?.scale??1);
    assert.ok(Math.abs(zoom-1)<.015,'zoomed in at '+x+','+y+': '+zoom);
   }
   // Verify the gesture guard did not swallow essential mobile actions.
   await ios.locator('#attackTouch').tap();
   await ios.locator('#dashTouch').tap();
   await ios.locator('#abilityTouch').tap();
   await ios.locator('#pauseBtn').tap();
   assert.ok(await ios.locator('#overlay').isVisible(),'pause still works on Safari');
   await ios.locator('[data-action="resume"]').tap();
   assert.ok(await ios.locator('#overlay').isHidden(),'resume still works on Safari');
   await ios.close();
  }finally{
   await safari.close();
  }
  assert.deepEqual(errors,[]);
  console.log('PASS browser smoke desktop + mobile + WebKit zoom regression');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
