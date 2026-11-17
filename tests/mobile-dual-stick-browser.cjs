const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');

(async()=>{
 const browser=await chromium.launch({headless:true,
  ...(process.env.CHROME_BIN?{executablePath:process.env.CHROME_BIN}:{}),
  args:['--no-sandbox']});
 const errors=[];
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,
   hasTouch:true,deviceScaleFactor:2});
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8000/',{waitUntil:'load'});
  await page.locator('[data-action="class:hunter"]').tap();
  await page.locator('[data-action="start"]').tap();
  await page.locator('#overlay').waitFor({state:'hidden'});
  assert.equal(await page.locator('.mobile-actions button').count(),3);
  assert.ok(await page.locator('#abilityHud').isHidden());
  assert.ok(await page.locator('#joystick').isVisible());
  assert.ok(await page.locator('#attackTouch').isVisible());
  assert.ok(await page.locator('#dashTouch').isVisible());
  assert.ok(await page.locator('#abilityTouch').isVisible());
  await page.evaluate(async()=>{
   const {Input}=await import('./src/input.js?v=0.75.2');
   window.__dualStickProbe=new Input(document.querySelector('#gameCanvas'));
  });
  const rect=async id=>{
   const b=await page.locator(id).boundingBox();
   assert.ok(b,'missing '+id);return {x:b.x+b.width/2,y:b.y+b.height/2};
  };
  const left=await rect('#joystick'),right=await rect('#attackTouch');
  const cdp=await page.context().newCDPSession(page);
  const touch=(id,x,y)=>({id,x,y});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[
   touch(1,left.x,left.y),touch(2,right.x,right.y)]});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[
   touch(1,left.x-38,left.y),touch(2,right.x+38,right.y)]});
  await page.waitForTimeout(100);
  const state=await page.evaluate(()=>{
   const input=window.__dualStickProbe;
   return {move:input.movement(),aim:input.aiming({x:100,y:100},{x:0,y:0,scale:1}),
    attacking:input.attacking('hunter'),attackX:parseFloat(document.querySelector('#attackTouch').style.getPropertyValue('--ax'))};
  });
  assert.ok(state.move.x<-.8,'left stick should move west: '+JSON.stringify(state));
  assert.ok(state.aim.x>.9,'right stick should aim east: '+JSON.stringify(state));
  assert.equal(state.attacking,true);
  assert.ok(state.attackX>15,'attack knob must visibly follow the aim direction');
  fs.mkdirSync('test-output',{recursive:true});
  await page.screenshot({path:'test-output/mobile-dual-stick.png'});
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[
   touch(1,left.x-38,left.y),touch(2,right.x,right.y-38)]});
  // CDP acknowledges the gesture before its DOM pointermove is always handled.
  // Wait for the real input listener rather than sampling an old direction.
  await page.waitForFunction(()=>window.__dualStickProbe.attackAim?.y<-.9,null,{timeout:4000});
  const up=await page.evaluate(()=>window.__dualStickProbe.aiming({x:100,y:100},{x:0,y:0,scale:1}));
  assert.ok(up.y<-.9,'attack direction can change while continuing to move west');
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await page.waitForTimeout(70);
  const rest=await page.evaluate(()=>({
   move:window.__dualStickProbe.movement(),
   attacking:window.__dualStickProbe.mobileAttack,
   knob:document.querySelector('#attackTouch').style.getPropertyValue('--ax')
  }));
  assert.deepEqual(rest.move,{x:0,y:0});
  assert.equal(rest.attacking,false);
  assert.equal(rest.knob,'0px');
  await page.touchscreen.tap((await rect('#dashTouch')).x,(await rect('#dashTouch')).y);
  assert.equal(await page.evaluate(()=>window.__dualStickProbe.consumeDash()),true);
  await page.touchscreen.tap((await rect('#abilityTouch')).x,(await rect('#abilityTouch')).y);
  assert.equal(await page.evaluate(()=>window.__dualStickProbe.consumeAbility()),true);
  assert.equal(await page.evaluate(()=>visualViewport.scale),1);
  assert.deepEqual(errors,[]);
  console.log('PASS: two simultaneous mobile sticks, independent movement and directional shots');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
