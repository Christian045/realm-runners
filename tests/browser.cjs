const {chromium}=require('playwright');
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
  assert.deepEqual(errors,[]);
  console.log('PASS browser smoke desktop + mobile');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
