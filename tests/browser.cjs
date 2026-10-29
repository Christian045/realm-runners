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
  assert.ok(await page.locator('[data-action="specialization:standard"]').count());
  assert.ok(await page.locator('[data-action="challenge:normal"]').count());
  assert.ok(await page.locator('[data-action="endless"]').count());
  assert.ok(await page.locator('[data-action="tower"]').count());
  // Layout regression: a long German event title must never create
  // horizontal scrolling, and a short choice dialog fits on desktop.
  for(const viewport of [{width:742,height:706},{width:1280,height:800},
   {width:390,height:844},{width:320,height:568}]){
   const preview=await browser.newPage({viewport});
   try{
    await preview.goto('http://127.0.0.1:8000/',{waitUntil:'load'});
    for(const scene of [
     {name:'event',title:'VERSIEGELTES GEWÖLBE',chapter:'DER GOLDENE SCHLÜSSEL',choice:true},
     {name:'event',title:'VERGESSENE BIBLIOTHEK',chapter:'DAS RÄTSEL DER DREI RUNEN',choice:true},
     {name:'shrine',title:'ALTER SCHREIN',chapter:'DREI WEGE · EINE ENTSCHEIDUNG',choice:true},
     {name:'stageclear',title:'ETAGE 8 GESCHAFFT!',chapter:'WEITERER AUFSTIEG',choice:true},
     {name:'inventory',title:'AUSRÜSTUNG',chapter:'WAFFEN · RÜSTUNG · RELIKTE',choice:false}
    ]){
     const result=await preview.evaluate(({scene})=>{
      const overlay=document.querySelector('#overlay'),panel=overlay.querySelector('.panel');
      overlay.classList.remove('castle-menu');
      overlay.classList.add('dialog-view');
      overlay.classList.toggle('dialog-choice',scene.choice);
      overlay.classList.toggle('dialog-inventory',!scene.choice);
      const title=panel.querySelector('h1');
      title.textContent=scene.title;
      title.classList.toggle('long-title',scene.title.length>17);
      panel.querySelector('.chapter').textContent=scene.chapter;
      panel.querySelector('#panelContent').innerHTML=scene.choice
       ?'<p>Hinter dem Tor liegt hochwertige Ausrüstung. Du kannst einen Runenschlüssel benutzen, das Schloss bezahlen oder die Tür gewaltsam öffnen.</p><div class="upgrade-grid">'+
        ['RUNENSCHLÜSSEL EINSETZEN','60 GOLD ZAHLEN','AUFBRECHEN · 25 LP OPFERN','GEWÖLBE VERLASSEN'].map(x=>'<button class="secondary">'+x+'</button>').join('')+'</div>'
       :'<div class="equip-grid"><div class="equip-slot">WAFFE</div><div class="equip-slot">RÜSTUNG</div><div class="equip-slot">RELIKT</div></div><div class="inventory-list">Noch keine Ausrüstung.</div>';
      const titleRange=document.createRange();titleRange.selectNodeContents(title);
      const container=panel.getBoundingClientRect();
      const rects=[...titleRange.getClientRects()];
      return {
       scrollX:panel.scrollWidth>panel.clientWidth+2||overlay.scrollWidth>overlay.clientWidth+2,
       titleOverflows:rects.some(r=>r.left<container.left-2||r.right>container.right+2),
       scrollY:panel.scrollHeight>panel.clientHeight+2,
       menuIntroHidden:getComputedStyle(panel.querySelector('.menu-intro')).display==='none',
       menuEyebrowHidden:getComputedStyle(panel.querySelector('.menu-eyebrow')).display==='none'
      };
     },{scene});
     assert.ok(!result.scrollX,JSON.stringify({viewport,scene,result}));
     assert.ok(!result.titleOverflows,'title overflow: '+JSON.stringify({viewport,scene,result}));
     assert.ok(result.menuIntroHidden&&result.menuEyebrowHidden,'menu copy should not appear in dialog');
     if(viewport.width>=742&&scene.name==='event')
      assert.ok(!result.scrollY,'desktop event should fit without a scrollbar: '+JSON.stringify({viewport,scene,result}));
    }
   }finally{await preview.close()}
  }
  const towerRuntime=await page.evaluate(async()=>{
    const [{TOWER_RELICS},{generateDungeon}]=await Promise.all([
     import('./src/tower-relics.js'),import('./src/dungeon.js')]);
    return {relicCount:TOWER_RELICS.length,roomCount:generateDungeon(11,{tower:true}).rooms.length};
  });
  assert.deepEqual(towerRuntime,{relicCount:6,roomCount:7});
  await page.locator('[data-action="tower"]').click();
  assert.ok(await page.locator('[data-action="tower"]').getAttribute('class').then(c=>c.includes('selected')));
  await page.locator('[data-action="tower"]').click();
  assert.ok(await page.locator('.achievement-list .achievement').count()>=7);
  await page.locator('[data-action="class:mage"]').click();
  await page.locator('[data-action="start"]').click();
  await page.locator('#overlay').waitFor({state:'hidden'});
  await page.waitForTimeout(800);
  assert.ok(await page.locator('#hud').isVisible());
  // A versioned main module alone does not bust an imported ./game.js URL.
  // Prevent an old cached combat engine from running after a release.
  const currentCombat=await page.evaluate(()=>performance.getEntriesByType('resource')
    .some(entry=>entry.name.includes('/src/game.js?v=0.18.0')));
  assert.ok(currentCombat,'the browser must load the versioned combat engine');
  const realBattle=await page.evaluate(async()=>{
   const [{Game},{defaultProgress}]=await Promise.all([
    import('./src/game.js?v=0.18.0'),import('./src/progression.js')]);
   const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),
    attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
   for(const seed of [5,71,150]){
    const g=new Game(defaultProgress(),input);
    g.start('warrior',seed);
    const room=g.dungeon.rooms.find(r=>r.type==='combat');
    g.player.x=room.cx;g.player.y=room.cy;g.entrance(room);
    const hp=g.player.hp;
    for(let frame=0;frame<720&&g.mode==='playing'&&g.player.hp===hp;frame++)g.update(1/60);
    if(g.player.hp===hp)return {seed,passed:false};
   }
   return {passed:true};
  });
  assert.ok(realBattle.passed,'live browser combat must damage an idle player: '+JSON.stringify(realBattle));
  // Verify deployed dungeon format and essential room types in the real browser.
  const dungeonResult=await page.evaluate(async()=>{
   const {generateDungeon,ROOM_COUNT}=await import('./src/dungeon.js');
   const d=generateDungeon(903);
   return {rooms:d.rooms.length,expected:ROOM_COUNT,grid:d.columns*d.rows,
    gateCount:d.gates.length,library:d.rooms.some(r=>r.type==='library'),
    vault:d.rooms.some(r=>r.type==='vault'),camp:d.rooms.some(r=>r.type==='camp'),
    traps:d.rooms.some(r=>r.type==='trap')};
  });
  assert.equal(dungeonResult.rooms,13);
  assert.equal(dungeonResult.expected,13);
  assert.equal(dungeonResult.grid,25);
  assert.ok(dungeonResult.gateCount>=12);
  assert.ok(dungeonResult.library&&dungeonResult.vault&&dungeonResult.camp&&dungeonResult.traps);
  // The actual browser must be able to paint cached authored pixel images.
  const pixelArt=await page.evaluate(async()=>{
   const {PixelSpriteAtlas}=await import('./src/sprites.js');
   const {PixelTileAtlas}=await import('./src/tileset.js');
   const sprites=new PixelSpriteAtlas(),tiles=new PixelTileAtlas();
   const warrior=sprites.frame('warrior','idle',0,'down');
   const mage=sprites.frame('mage','cast',1,'right');
   const floor=tiles.tile('fungal',0,4),wall=tiles.tile('crypt',1,7);
   const painted=canvas=>{
    const d=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;
    for(let i=3;i<d.length;i+=4)if(d[i]>0)return true;
    return false;
   };
   return {warrior:painted(warrior),mage:painted(mage),floor:painted(floor),
    wall:painted(wall),cached:warrior===sprites.frame('warrior','idle',0,'down')};
  });
  assert.deepEqual(pixelArt,{warrior:true,mage:true,floor:true,wall:true,cached:true});
  await page.locator('#inventoryBtn').click();
  assert.ok(await page.locator('#overlay').isVisible(),'inventory overlay must be usable');
  assert.ok(await page.locator('[data-action="closeInventory"]').isVisible());
  await page.locator('[data-action="closeInventory"]').click();
  assert.ok(await page.locator('#overlay').isHidden());
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
  assert.ok(await mobile.locator('.challenge-grid').count(),'mobile challenge selection exists');
  await mobile.locator('[data-action="tower"]').tap();
  const recordUI=await mobile.locator('[data-action="tower"]').innerText();
  assert.ok(recordUI.includes('Bestleistung'),'mobile tower records must be readable');
  await mobile.locator('[data-action="start"]').click();
  assert.ok(await mobile.locator('#mobileControls').isVisible());
  await mobile.waitForTimeout(120);
  assert.match(await mobile.locator('#roomText').textContent(),/TURM 1\/10/);
  await mobile.locator('#inventoryBtn').tap();
  assert.ok(await mobile.locator('[data-action="closeInventory"]').isVisible());
  await mobile.locator('[data-action="closeInventory"]').tap();
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
   await ios.locator('[data-action="tower"]').tap();
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
   await ios.locator('#inventoryBtn').tap();
   assert.ok(await ios.locator('#overlay').isVisible());
   await ios.locator('[data-action="closeInventory"]').tap();
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
