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
  assert.equal(await page.locator('#biomeText').count(),0,
   'old biome/location banner must not exist');
  assert.equal(await page.locator('#classTag').count(),0,
   'redundant hero label must not exist');
  assert.equal(await page.locator('#abilityHud span').count(),2,
   'only dash and ability status belong in the cooldown HUD');

  assert.ok(await page.locator('#bossPhase').count(),'second-phase label must exist');
  assert.ok(await page.locator('[data-action="specialization:standard"]').count());
  assert.ok(await page.locator('[data-action="challenge:normal"]').count());
  assert.ok(await page.locator('[data-action="endless"]').count());
  assert.ok(await page.locator('[data-action="tower"]').count());
  // The new statistics tab must be reachable without changing game mode.
  await page.locator('[data-action="menuTab:stats"]').click();
  assert.ok(await page.locator('.stats-dashboard').isVisible());
  assert.ok(await page.locator('.stats-metrics .stats-metric').count()===8);
  assert.ok(await page.locator('.stats-row').count()>=13,'all enemy types appear including bosses');
  assert.ok((await page.locator('.stats-dashboard').innerText()).includes('Gesamtspielzeit'));
  assert.ok((await page.locator('.stats-dashboard').innerText()).includes('BOSSE NACH NAME'));
  await page.locator('[data-action="menuTab:play"]').click();
  assert.ok(await page.locator('[data-action="start"]').isVisible());
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
     {name:'inventory',title:'AUSRÜSTUNG',chapter:'WAFFEN · RÜSTUNG · RELIKTE',choice:false},
     {name:'upgrade',title:'RELIKT',chapter:'WÄHLE DEINE MACHT',choice:true},
     {name:'paused',title:'PAUSE',chapter:'ZURÜCK ZUM SPIEL',choice:true},
     {name:'victory',title:'TURM BEZWUNGEN!',chapter:'DER EWIGE HERRSCHER IST BESIEGT',choice:true}
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
  // Preserve open panels and viewport position across menu rerenders.
  const specializationPanel=page.locator('.castle-advanced').first();
  await specializationPanel.locator('summary').click();
  assert.ok(await specializationPanel.evaluate(n=>n.open),'specializations must expand');
  await page.locator('[data-action="specialization:standard"]').click();
  assert.ok(await specializationPanel.evaluate(n=>n.open),
   'class selection / specialization must not close the details panel');
  await page.locator('[data-action="class:warrior"]').click();
  assert.ok(await specializationPanel.evaluate(n=>n.open),
   'switching a hero must preserve the open settings panel');
  const openedPanel=await page.locator('.castle-advanced').first().evaluate(n=>n.open);
  assert.ok(openedPanel);
  // Programmatic class changes must retain the position of the scrollable menu.
  const scrollBeforeMenuChange=await page.locator('#overlay .panel').evaluate(panel=>{
   panel.scrollTop=Math.min(140,Math.max(0,panel.scrollHeight-panel.clientHeight));
   const saved=panel.scrollTop;
   document.querySelector('[data-action="class:mage"]').click();
   return saved;
  });
  const scrollAfterMenuChange=await page.locator('#overlay .panel').evaluate(panel=>panel.scrollTop);
  assert.ok(Math.abs(scrollBeforeMenuChange-scrollAfterMenuChange)<=2,
   'menu scroll position should survive rerender: '+scrollBeforeMenuChange+' -> '+scrollAfterMenuChange);
  assert.ok(await page.locator('.castle-advanced').first().evaluate(n=>n.open),
   'expanded menu groups should survive class changes');
  const menuOverflow=await page.evaluate(()=>{
   const panel=document.querySelector('#overlay .panel');
   const overlay=document.querySelector('#overlay');
   return {panel:panel.scrollWidth>panel.clientWidth+2,overlay:overlay.scrollWidth>overlay.clientWidth+2};
  });
  assert.deepEqual(menuOverflow,{panel:false,overlay:false},
   'desktop menu must not overflow horizontally');
  // Keyboard Enter on a focused menu button or summary may not start a run.
  await page.locator('.castle-advanced').first().locator('summary').focus();
  await page.keyboard.press('Enter');
  assert.ok(await page.locator('[data-action="start"]').isVisible(),
   'Enter on a focused summary must not launch gameplay');
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
    .some(entry=>entry.name.includes('/src/game.js?v=0.28.1')));
  assert.ok(currentCombat,'the browser must load the versioned combat engine');
  const realBattle=await page.evaluate(async()=>{
   const [{Game},{defaultProgress}]=await Promise.all([
    import('./src/game.js?v=0.28.1'),import('./src/progression.js')]);
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
  assert.equal(dungeonResult.rooms,16);
  assert.equal(dungeonResult.expected,16);
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
  // 18 items must scroll inside the loot list, not in a second outer scrollbar.
  const inventoryLayout=await page.evaluate(()=>{
   const list=document.querySelector('.inventory-list');
   for(let i=0;i<18;i++){
    const item=document.createElement('button');item.className='inventory-item';
    item.textContent='Gefundene Ausrüstung '+i+' · Rüstung / Relikt / Bonus';
    list.appendChild(item);
   }
   const panel=document.querySelector('#overlay .panel'),overlay=document.querySelector('#overlay');
   return {outerScroll:panel.scrollHeight>panel.clientHeight+2,
    innerScroll:list.scrollHeight>list.clientHeight+2,
    horizontal:panel.scrollWidth>panel.clientWidth+2||overlay.scrollWidth>overlay.clientWidth+2,
    headingOverflow:panel.querySelector('h1').scrollWidth>panel.querySelector('h1').clientWidth+2};
  });
  assert.deepEqual(inventoryLayout,{outerScroll:false,innerScroll:true,horizontal:false,headingOverflow:false},
   'inventory must have one internal scroll area: '+JSON.stringify(inventoryLayout));
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
  // Inputs pressed during a dialog must not create deferred attacks/dashes.
  const dashBeforePause=await page.locator('#dashLabel').textContent();
  await page.keyboard.press('Space');
  await page.keyboard.press('KeyQ');
  await page.locator('[data-action="resume"]').click();
  assert.ok(await page.locator('#overlay').isHidden());
  await page.waitForTimeout(180);
  const dashAfterResume=await page.locator('#dashLabel').textContent();
  const seconds=text=>Number((text||'').match(/\d+(?:\.\d+)?/)?.[0]||0);
  assert.ok(seconds(dashAfterResume)<=seconds(dashBeforePause)+.11,
   'queued dash from pause must not reset its cooldown: '+dashBeforePause+' -> '+dashAfterResume);
  await page.keyboard.press('KeyI');
  assert.ok(await page.locator('.dialog-inventory').isVisible(),'I opens inventory');
  await page.keyboard.press('Escape');
  assert.ok(await page.locator('#overlay').isHidden(),'Escape closes inventory');
  await page.close();
  const mobile=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  mobile.on('pageerror',e=>errors.push(e.message));
  await mobile.goto('http://127.0.0.1:8000/',{waitUntil:'load'});
  const mobileMenu=await mobile.evaluate(()=>{
   const overlay=document.querySelector('#overlay'),panel=overlay.querySelector('.panel');
   return {horizontal:overlay.scrollWidth>overlay.clientWidth+2||panel.scrollWidth>panel.clientWidth+2,
    modes:document.querySelectorAll('.castle-mode-list .mode-toggle').length,
    hero:!!document.querySelector('.castle-hero canvas')};
  });
  assert.deepEqual(mobileMenu,{horizontal:false,modes:3,hero:true},
   'portrait menu should show hero and all three game modes without lateral overflow');
  await mobile.locator('[data-action="menuTab:stats"]').tap();
  assert.ok(await mobile.locator('.stats-dashboard').isVisible());
  const mobileStats=await mobile.evaluate(()=>{
   const overlay=document.querySelector('#overlay'),panel=overlay.querySelector('.panel');
   const dashboard=document.querySelector('.stats-dashboard');
   return {horizontal:overlay.scrollWidth>overlay.clientWidth+2||
    panel.scrollWidth>panel.clientWidth+2||dashboard.scrollWidth>dashboard.clientWidth+2,
    cards:document.querySelectorAll('.stats-metric').length};
  });
  assert.deepEqual(mobileStats,{horizontal:false,cards:8},'statistics must fit portrait screens');
  await mobile.locator('[data-action="menuTab:play"]').tap();
  assert.ok(await mobile.locator('.challenge-grid').count(),'mobile challenge selection exists');
  await mobile.locator('[data-action="tower"]').tap();
  const recordUI=await mobile.locator('[data-action="tower"]').innerText();
  assert.ok(recordUI.includes('Bestleistung'),'mobile tower records must be readable');
  await mobile.locator('[data-action="start"]').click();
  assert.ok(await mobile.locator('#mobileControls').isVisible());
  assert.equal(await mobile.locator('#abilityHud span').count(),2);
  const cooldownBox=await mobile.evaluate(()=>{
   const box=document.querySelector('#abilityHud').getBoundingClientRect();
   return {left:box.left,right:box.right,width:innerWidth};
  });
  assert.ok(cooldownBox.right<=cooldownBox.width-124,
   'cooldown badges must leave room for the portrait minimap: '+JSON.stringify(cooldownBox));
  await mobile.waitForTimeout(120);
  assert.match(await mobile.locator('#roomText').textContent(),/TURM 1\/10/);
  await mobile.locator('#inventoryBtn').tap();
  assert.ok(await mobile.locator('[data-action="closeInventory"]').isVisible());
  const mobileInventoryLayout=await mobile.evaluate(()=>{
   const list=document.querySelector('.inventory-list');
   for(let i=0;i<18;i++){
    const item=document.createElement('button');item.className='inventory-item';
    item.textContent='Ausrüstung '+i+' · Lebenspunkte, Schaden und Bonus';
    list.appendChild(item);
   }
   const panel=document.querySelector('#overlay .panel');
   return {outerScroll:panel.scrollHeight>panel.clientHeight+2,
    innerScroll:list.scrollHeight>list.clientHeight+2,
    horizontal:panel.scrollWidth>panel.clientWidth+2};
  });
  assert.deepEqual(mobileInventoryLayout,{outerScroll:false,innerScroll:true,horizontal:false},
   'mobile bag should scroll items only: '+JSON.stringify(mobileInventoryLayout));
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
