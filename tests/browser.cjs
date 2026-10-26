const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{fs.mkdirSync('test-output',{recursive:true});for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true});const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8000');
 await page.evaluate(()=>localStorage.setItem('realm-runners-save-v2',JSON.stringify({class:'hunter',unlocked:3,stars:[3,2,1],xp:87,level:4})));
 await page.reload();await page.locator('#play').click();
 try {
  await page.waitForFunction(()=>scene==='game'&&hero?.on,{},{timeout:10000});
 } catch (error) {
  const diagnostic=await page.evaluate(()=>({
   scene:typeof scene==='undefined'?'missing':scene,
   hero:typeof hero==='undefined'?null:hero,
   fps:typeof t==='undefined'?null:t,
   scripts:[...document.scripts].map(s=>s.src),
   gameVisible:!document.querySelector('#layer')?.classList.contains('hide')
  }));
  console.error(name,'startup diagnostics:',JSON.stringify(diagnostic),'page errors:',errors);
  await page.screenshot({path:'test-output/'+name+'-startup-failure.png'});
  throw error;
 }
 
 // Exercise jump duration with the actual touch input route in the browser.
 const heights=await page.evaluate(()=>{
  const touch=(type,id)=>{
   const button=document.querySelector('[data-control="jump"]');
   const event=new Event(type,{bubbles:true,cancelable:true});
   Object.defineProperty(event,'changedTouches',{value:[{identifier:id,target:button}]});
   button.dispatchEvent(event);
  };
  const height=hold=>{
   start(0);touch('touchstart',301);let top=hero.y;
   for(let i=0;i<65;i++){
    if(i===1&&!hold)touch('touchend',301);
    step(1);top=Math.min(top,hero.y);
   }
   if(hold)touch('touchend',301);
   return 422-top;
  };
  return {short:height(false),high:height(true),hasCheckpoints:typeof checkpoints!=='undefined'};
 });
 assert.ok(heights.short>25&&heights.high>heights.short+65,name+' variable jump: '+JSON.stringify(heights));
 assert.equal(heights.hasCheckpoints,false);
 assert.ok(heights.high>165&&heights.high<185,name+' maximum hunter jump: '+heights.high);
 const pixelArt=await page.evaluate(()=>({
  buffer:[pixelCanvas.width,pixelCanvas.height],
  nearest:!pixelCtx.imageSmoothingEnabled,
  pixelCss:getComputedStyle(document.querySelector('#view')).imageRendering,
  buttonRadius:getComputedStyle(document.querySelector('[data-control="jump"]')).borderRadius,
  hasRecordBoard:!!save.bestTimesPixelV051
 }));
 assert.deepEqual(pixelArt.buffer,[480,270]);
 assert.equal(pixelArt.nearest,true);
 assert.ok(pixelArt.pixelCss==='pixelated'||pixelArt.pixelCss==='crisp-edges');
 assert.equal(pixelArt.buttonRadius,'4px');
 assert.ok(pixelArt.hasRecordBoard);
 await page.evaluate(()=>menu());
 assert.ok(await page.locator('#pixelEditionBadge').isVisible());
 assert.match(await page.locator('#pixelEditionBadge').innerText(),/0\.6\.0/);
 // Store each biome in the CI artifacts so pixel-style changes are reviewable.
 for(const [level,label] of [[0,'forest'],[1,'canopy'],[2,'ruins'],[3,'swamp'],[4,'slime-king']]){
  await page.evaluate(index=>{start(index);if(index===4){hero.x=2220;step(1);cam=1840;}draw();},level);
  await page.screenshot({path:`test-output/${name}-pixel-${label}.png`});
 }
 // Real in-browser encounter: red bar appears, three classes and stamp attacks run.
 await page.evaluate(()=>{
  save.class='mage';start(4);hero.x=boss.x-175;hero.y=G-43;
  boss.engaged=true;performAttack();
  for(let i=0;i<35;i++)combatTick(1);
  updateBossHud();
 });
 assert.ok(await page.locator('#bossHud').isVisible());
 assert.equal(await page.evaluate(()=>boss.maxHp),20);
 const hp=await page.evaluate(()=>boss.hp);
 assert.ok(hp>0&&hp<20,name+' mage fireball must damage Slime King: '+hp);
 assert.equal(await page.locator('#bossHealthTrack').getAttribute('aria-valuenow'),String(hp));
 assert.ok((await page.locator('#bossHealthFill').evaluate(el=>getComputedStyle(el).backgroundColor)).includes('237, 52, 62'));
 await page.evaluate(()=>{
  start(4);hero.x=2080;hero.y=130;hero.on=false;
  boss.engaged=true;boss.phase='warn';boss.timer=1;
  for(let i=0;i<47;i++)bossTick(1,hero.y);
 });
 assert.equal(await page.evaluate(()=>boss.slamCount),1);
 assert.ok(await page.evaluate(()=>bossWaves.length)>0);
 await page.evaluate(()=>start(0));
 
 await page.keyboard.down('KeyD');try{await page.waitForFunction(()=>hero.x>70,{},{timeout:20000});}catch(e){console.error(name,await page.evaluate(()=>({scene,x:hero.x,t,input,hidden:document.hidden})));throw e;}await page.keyboard.up('KeyD');
 await page.keyboard.down('Space');await page.waitForFunction(()=>hero.vy<0,{},{timeout:20000});await page.keyboard.up('Space');
 await page.evaluate(()=>{start(0);for(let i=0;i<60;i++)step(1);});
 // Dispatch concurrent pointer contacts; physical Safari touch remains a manual check.
 await page.evaluate(()=>{for(const [k,id] of [['right',1],['jump',2]]){const b=document.querySelector(`[data-control="${k}"]`);b.setPointerCapture=()=>{};b.dispatchEvent(new PointerEvent('pointerdown',{pointerId:id,bubbles:true}));}});
 assert.equal(await page.evaluate(()=>input.right&&input.jump),true);
 await page.evaluate(()=>document.querySelector('[data-control="jump"]').dispatchEvent(new PointerEvent('pointercancel',{pointerId:2})));
 assert.equal(await page.evaluate(()=>input.right&&!input.jump),true);
 // Attack is independently held by another pointer.
 await page.evaluate(()=>{const b=document.querySelector('[data-control="attack"]');b.setPointerCapture=()=>{};b.dispatchEvent(new PointerEvent('pointerdown',{pointerId:3,bubbles:true}));});
 assert.equal(await page.evaluate(()=>input.right&&input.attack),true);
 await page.evaluate(()=>document.querySelector('[data-control="attack"]').dispatchEvent(new PointerEvent('pointercancel',{pointerId:3})));
 assert.equal(await page.evaluate(()=>input.right&&!input.attack),true);


 // Exercise the iOS Touch Event route independently from mouse/pen pointers.
 await page.evaluate(()=>{clearInput();window.testTouch=(type,contacts)=>{
   const touches=contacts.map(([id,k])=>({identifier:id,target:document.querySelector('[data-control="'+k+'"]')}));
   const event=new Event(type,{bubbles:true,cancelable:true});
   Object.defineProperty(event,'changedTouches',{value:touches});
   touches[0].target.dispatchEvent(event);return event.defaultPrevented;
 };});
 assert.equal(await page.evaluate(()=>testTouch('touchstart',[[41,'right'],[42,'jump']])),true);
 assert.equal(await page.evaluate(()=>input.right&&input.jump),true);
 assert.equal(await page.evaluate(()=>testTouch('touchmove',[[41,'right']])),true);
 await page.evaluate(()=>testTouch('touchend',[[42,'jump']]));
 assert.equal(await page.evaluate(()=>input.right&&!input.jump),true);
 await page.evaluate(()=>testTouch('touchcancel',[[41,'right']]));
 assert.equal(await page.evaluate(()=>input.right),false);
 assert.equal(await page.evaluate(()=>{
   const event=new Event('contextmenu',{bubbles:true,cancelable:true});
   document.querySelector('#view').dispatchEvent(event);return event.defaultPrevented;
 }),true);
 await page.evaluate(()=>{
   const range=document.createRange();range.selectNodeContents(document.querySelector('#hudLeft'));
   document.getSelection().addRange(range);document.dispatchEvent(new Event('selectionchange'));
 });
 assert.equal(await page.evaluate(()=>document.getSelection().rangeCount),0);
 assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('#hudLeft')).webkitUserSelect||getComputedStyle(document.querySelector('#hudLeft')).userSelect),'none');
 // Leave a touch held: pause must clear it as well.
 await page.evaluate(()=>testTouch('touchstart',[[43,'right']]));
 await page.locator('#pause').click();assert.equal(await page.evaluate(()=>scene),'pause');assert.equal(await page.evaluate(()=>input.right),false);await page.locator('#resume').click();
 await page.evaluate(()=>{hero.x=2750;hero.stars=2;hero.earned=25;step(1)});assert.equal(await page.evaluate(()=>scene),'end');
 await page.reload();assert.equal(await page.evaluate(()=>save.level),4);assert.equal(await page.evaluate(()=>save.xp),182);assert.equal(await page.evaluate(()=>save.stars[0]),3);
 await page.locator('#play').click();await page.screenshot({path:`test-output/${name}-landscape.png`});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:`test-output/${name}-portrait.png`});
 for(const b of await page.locator('[data-control]').all()){const box=await b.boundingBox();assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=390&&box.y+box.height<=844);}
 assert.deepEqual(errors,[]);console.log(`PASS ${name}: startup, movement, jump, concurrent pointers, pause, save, responsive controls, no JS errors`);
 }finally{await browser.close();}
}})().catch(e=>{console.error(e);process.exitCode=1});
