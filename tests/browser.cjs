const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{fs.mkdirSync('test-output',{recursive:true});for(const [name,engine] of Object.entries({chromium,webkit})){
 const browser=await engine.launch();
 try{const context=await browser.newContext({viewport:{width:844,height:390},deviceScaleFactor:2,isMobile:true,hasTouch:true});const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8000');
 await page.evaluate(()=>localStorage.setItem('realm-runners-save-v2',JSON.stringify({class:'hunter',unlocked:3,stars:[3,2,1],xp:87,level:4})));
 await page.reload();
 assert.match(await page.locator('#pixelEditionBadge').innerText(),/0\.16\.0/);
 // Main menu: compact controls; both desktop and touchscreen double activation.
 assert.ok((await page.locator('#help').innerText()).length<350);
 assert.equal(await page.locator('.control-help').getAttribute('open'),null);
 await page.locator('[data-world="0"]').dblclick();
 await page.waitForFunction(()=>scene==='game',{},{timeout:5000});
 assert.equal(await page.evaluate(()=>stage),0);
 await page.evaluate(()=>{menuView='worlds';menu()});
 await page.locator('[data-world="0"]').tap();await page.locator('[data-world="0"]').tap();
 await page.waitForFunction(()=>scene==='game',{},{timeout:5000});
 await page.evaluate(()=>{menuView='worlds';menu()});
 await page.locator('[data-world="0"]').click();
 await page.locator('#levels').waitFor({state:'visible'});
 await page.locator('[data-level="1"]').click();
 assert.equal(await page.evaluate(()=>scene),'menu');
 assert.equal(await page.locator('[data-level="1"]').getAttribute('aria-pressed'),'true');
 assert.equal(await page.evaluate(()=>document.activeElement.dataset.level),'1');
 await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>stage),1);
 await page.evaluate(()=>{menuView='levels';menu()});
 await page.locator('[data-level="0"]').tap();await page.locator('[data-level="1"]').tap();
 assert.equal(await page.evaluate(()=>scene),'menu','different cards must never form a double tap');
 await page.locator('[data-level="1"]').tap();
 await page.waitForFunction(()=>scene==='game',{},{timeout:5000});
 await page.evaluate(()=>{menuView='levels';menu()});
 await page.locator('[data-level="0"]').dblclick();
 assert.equal(await page.evaluate(()=>scene),'game');assert.equal(await page.evaluate(()=>stage),0);
 await page.evaluate(()=>{menuView='levels';menu()});await page.keyboard.press('Escape');
 assert.equal(await page.evaluate(()=>menuView),'worlds');
 // A cancelled world click must not navigate after choosing a class instead.
 await page.locator('[data-world="0"]').click();await page.locator('[data-class="mage"]').click();
 await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>menuView),'worlds');
 await page.locator('[data-class="hunter"]').click();
 await page.locator('[data-world="0"]').click();await page.locator('#changelogBtn').click();
 await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>menuView),'worlds');
 assert.ok(await page.locator('#changelogOverlay').isVisible());await page.locator('#changelogClose').click();
 await page.evaluate(()=>{selected=0;menuView='worlds';menu()});

 assert.ok(await page.locator('[data-world="0"]').isVisible(),'World 1 is visible');
 assert.equal(await page.locator('.world-card').count(),3);
 assert.ok(await page.locator('#changelogBtn').isVisible(),'Updates visible on main world overview');
 await page.locator('#changelogBtn').click();
 assert.ok(await page.locator('#changelogOverlay').isVisible());
 assert.match(await page.locator('#changelogEntries').innerText(),/0.10.1/);
 await page.screenshot({path:`test-output/${name}-menu-only-changelog.png`});
 await page.locator('#changelogClose').click();
 assert.ok(!await page.locator('#changelogOverlay').isVisible());
 await page.screenshot({path:`test-output/${name}-worlds-overview.png`});
 await page.locator('[data-world="0"]').click();
 await page.locator('#levels').waitFor({state:'visible'});
 assert.ok(!await page.locator('#changelogBtn').isVisible(),'Updates hidden on level selection');
 assert.equal(await page.locator('.level-card').count(),5,'five stage cards');
 assert.equal(await page.locator('.level-card:disabled').count(),2,'locked stages remain locked');
 await page.screenshot({path:`test-output/${name}-world-one-stage-map.png`});
 await page.locator('#play').click();
 assert.ok(!await page.locator('#changelogBtn').isVisible(),'Updates hidden during gameplay');
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
  hasRecordBoard:!!save.bestTimesPixelV051,
  nativeBackdrop:[hdCanvas.width,hdCanvas.height],
  separateContexts:hdCtx!==pixelCtx,
  hdSmooth:hdCtx.imageSmoothingEnabled,
  clearSkyAlpha:pixelCtx.getImageData(70,12,1,1).data[3],
  backdropSkyAlpha:hdCtx.getImageData(70,12,1,1).data[3]
 }));
 assert.deepEqual(pixelArt.buffer,[720,405]);
 assert.equal(pixelArt.nearest,true);
 assert.ok(pixelArt.pixelCss==='pixelated'||pixelArt.pixelCss==='crisp-edges');
 assert.equal(pixelArt.buttonRadius,'4px');
 assert.ok(pixelArt.hasRecordBoard);
 assert.ok(await page.evaluate(()=>!!save.bestTimesV08));
 assert.deepEqual(pixelArt.nativeBackdrop,[960,540]);
 assert.ok(pixelArt.separateContexts);
 assert.ok(pixelArt.hdSmooth);
 assert.equal(pixelArt.clearSkyAlpha,0,'sky should not be pixelated with gameplay');
 assert.equal(pixelArt.backdropSkyAlpha,255,'HD sky should be visible under gameplay');
 await page.evaluate(()=>menu());
 assert.ok(await page.locator('#pixelEditionBadge').isVisible());
 assert.match(await page.locator('#pixelEditionBadge').innerText(),/0\.16\.0/);
 // Visual-support and scarcity checks for all four new adventure routes.
 await page.evaluate(()=>{
  const expected=[15,16,15,16];
  for(let i=0;i<4;i++){
   start(i);
   const coins=things.filter(t=>t.type==='coin');
   if(coins.length!==expected[i])throw Error('Coin density not sparse in '+i+': '+coins.length);
   if(coins.some(coin=>!hasSceneryFoundation(coin.x-22,44,i)))throw Error('Coin above a pit');
   if(coins.some(coin=>spikes.some(p=>coin.x>=p.x-58&&coin.x<=p.x+p.w+58)))throw Error('Coin above spikes');
  }
  for(const x of SCENERY_ANCHORS.ruins.arches){
   if(!hasSceneryFoundation(x,24,2)||!hasSceneryFoundation(x+141,25,2))
    throw Error('Ruin arch has a floating support column at '+x);
  }
  for(const x of SCENERY_ANCHORS.castle.towers)
   if(!hasSceneryFoundation(x,125,3))throw Error('Tower floating at '+x);
 });
 // Store each biome in the CI artifacts so pixel-style changes are reviewable.
 for(const [level,label] of [[0,'forest'],[1,'canopy'],[2,'ruins'],[3,'swamp'],[4,'slime-king']]){
  await page.evaluate(index=>{start(index);if(index===4){hero.x=245;step(1);cam=0;}draw();},level);
  await page.screenshot({path:`test-output/${name}-pixel-${label}.png`});
  if(level===0||level===4){
   const layers=await page.evaluate(()=>({
    backdrop:Array.from(hdCtx.getImageData(110,100,1,1).data),
    foreground:Array.from(pixelCtx.getImageData(82,75,1,1).data)
   }));
   assert.equal(layers.backdrop[3],255);
   assert.equal(layers.foreground[3],0);
   await page.screenshot({path:`test-output/${name}-HD-${label}.png`});
  }
 }
 // Terrain footprint: grounded ledges, no low/suspended platform chains,
 // and a completely clear final runway in all four longer levels.
 await page.evaluate(()=>{
  const target=[7380,7740,7920,8100],ledges=[4,5,0,0];
  for(let i=0;i<4;i++){
   start(i);
   const cfg=stages[i];
   if(cfg.width!==target[i]||cfg.ledges.length!==ledges[i])
    throw Error('Unexpected ground-first level shape: '+i);
   if(cfg.ledges.some(([x,y,w])=>y>445||x+w>cfg.exitX-650))
    throw Error('A low or final-runway platform remains: '+i);
   if(cfg.ledges.some(([x,y,w])=>!hasSceneryFoundation(x+16,12,i)||!hasSceneryFoundation(x+w-30,14,i)))
    throw Error('Floating platform support: '+i);
   if(cfg.gaps.some(([a,b])=>b-a>185||b>cfg.exitX-500))
    throw Error('Unfair gap or a gap right before the exit: '+i);
  }
 });
 // Real-browser slope contact and solid-stair collision, with original inputs.
 await page.evaluate(()=>{
  save.class='hunter';start(0);bad=[];things=[];hero.x=530;hero.y=courseGroundY(545)-hero.h;
  input.right=true;
  for(let i=0;i<90;i++){
   step(1);
   if(!hero.on||Math.abs(hero.y+hero.h-courseGroundY(hero.x+15))>3)
    throw Error('Slope contact lost at '+hero.x);
  }
  clearInput();start(0);bad=[];things=[];hero.x=1340;hero.y=G-hero.h;input.right=true;
  for(let i=0;i<30;i++)step(1);
  if(hero.x!==1360)throw Error('Tree bank has no solid side');
  input.jump=true;for(let i=0;i<35;i++)step(1);
  if(hero.x<1460||hero.hearts!==3)throw Error('Tree bank not jumpable');
  clearInput();
 });
 for(const [index,x,label] of [[0,650,'hill'],[0,1390,'root'],[1,1220,'timber'],[2,1210,'stairs'],[3,1560,'causeway']]){
  await page.evaluate(([index,x])=>{start(index);hero.x=x;hero.y=courseTopY(x+15)-hero.h;cam=Math.max(0,x-300);draw();},[index,x]);
  await page.screenshot({path:`test-output/${name}-v013-${label}.png`});
 }
 // Corrected scope: remove the objects in ruins / road and restore slim canopy trees.
 await page.evaluate(()=>{
  for(const index of [2,3]){
   start(index);bad=[];
   if(stages[index].ledges.length||!solids().every(p=>p.ground))throw Error('Block piles remain in '+index);
   hero.x=index===2?960:1300;hero.y=courseGroundY(hero.x+15)-hero.h;input.right=true;
   for(let f=0;f<90;f++){
    step(1);if(!hero.on||Math.abs(hero.y+hero.h-courseGroundY(hero.x+15))>.01)throw Error('Ground contact lost');
   }
   clearInput();
  }
  start(1);if(stages[1].ledges.length!==5)throw Error('Canopy trees missing');
  hero.x=1260;hero.y=courseTopY(1275)-hero.h;cam=1000;draw();
 });
 await page.screenshot({path:`test-output/${name}-v016-slim-canopy-trees.png`});
 for(const [index,x,label] of [[2,1200,'ruins'],[3,1600,'road']]){
  await page.evaluate(([index,x])=>{start(index);hero.x=x;hero.y=courseGroundY(x+15)-hero.h;cam=x-300;draw();},[index,x]);
  await page.screenshot({path:`test-output/${name}-v016-clean-${label}.png`});
 }
 // Boss now fills exactly one viewport, with visibly grounded walls at x=0/960.
 await page.evaluate(()=>{
  start(4);
  if(WIDTH!==W||cam!==0||!boss.engaged||BOSS_ARENA_RIGHT>=WIDTH)
   throw Error('Boss arena not entirely on screen');
  if(Math.abs((hero.x+hero.w/2+boss.x+boss.w/2)/2-W/2)>80)
   throw Error('Hero and boss are not centrally composed');
  hero.x=BOSS_ARENA_RIGHT-hero.w-20;input.right=true;
  for(let i=0;i<15;i++)step(1);
  input.right=false;
  if(hero.x!==BOSS_ARENA_RIGHT-hero.w-4||cam!==0)
   throw Error('Arena right edge is not the visible screen wall');
  hero.x=BOSS_ARENA_LEFT+20;input.left=true;
  for(let i=0;i<15;i++)step(1);
  input.left=false;
  if(hero.x!==BOSS_ARENA_LEFT+3||cam!==0)
   throw Error('Arena left wall mismatches viewport');
  draw();
 });
 await page.screenshot({path:`test-output/${name}-centered-boss-full-arena.png`});
 // Only slimes and mushrooms can now spawn; reroll their encounter slots
 // and check that either projectile/weapon class still works on both engines.
 await page.evaluate(()=>{
  start(0);
  const types=bad.map(e=>e.type);
  if(!types.includes('slime')||!types.includes('mushroom')||types.some(t=>!['slime','mushroom'].includes(t)))
   throw Error('Wrong v0.10 enemy pool');
  const old=types.join(',');
  start(0);
  if(bad.map(e=>e.type).join(',')===old)throw Error('Encounter reroll did not change');
  const mushroom=bad.find(e=>e.type==='mushroom');
  hero.x=mushroom.x-85;hero.y=G-43;mushroom.attackCooldown=0;enemyTick(1);
  if(mushroom.phase!=='windup')throw Error('Mushroom warning not active');
  for(let i=0;i<34;i++)enemyTick(1);
  if(enemyShots.length!==1)throw Error('Mushroom spore not launched');
  cam=mushroom.x-320;draw();
 });
 await page.screenshot({path:`test-output/${name}-mushroom-spore.png`});
 await page.evaluate(()=>{
  save.class='warrior';start(0);const e=bad[0];
  hero.x=e.x-48;hero.y=G-43;hero.face=1;performAttack();
  if(!(e.hp<e.maxHp))throw Error('Warrior sword missed randomized target');
  if(!combatTexts.length)throw Error('Damage numbers missing');
  cam=120;draw();
 });
 await page.screenshot({path:`test-output/${name}-combat-hit-feedback.png`});
 const ranged=await page.evaluate(()=>{
  const outcomes=[];
  for(const kind of ['hunter','mage']){
   save.class=kind;start(0);const e=bad[0];
   hero.x=e.x-95;hero.y=G-43;hero.face=1;
   performAttack();for(let i=0;i<20;i++)combatTick(1);
   outcomes.push(e.hp<e.maxHp);
  }
  return outcomes;
 });
 assert.ok(ranged.every(Boolean),name+' ranged attacks work on randomized enemies');
 await page.evaluate(()=>{
  save.class='hunter';start(0);bad=[];input.attack=true;
  for(let i=0;i<50;i++)combatTick(1);
  if(projectiles.length<3)throw Error('Held touch attack must auto-repeat');
  input.attack=false;
 });
 // Longer worlds: verify old end is not the exit and late scenery is visible.
 await page.evaluate(()=>{
  start(0);hero.x=2760;hero.y=G-43;step(1);
  if(scene!=='game'||WIDTH!==7380)throw Error('Sonnenpfad must be 80 percent longer');
  cam=WIDTH-W;hero.x=7020;bad=[];draw();
 });
 await page.screenshot({path:`test-output/${name}-long-level-ending.png`});
 await page.evaluate(()=>{
  start(3);hero.x=7750;hero.y=G-43;cam=WIDTH-W;draw();
 });
 await page.screenshot({path:`test-output/${name}-new-castle-gate.png`});
 // Show the physical exit and visible non-instant transition.
 await page.evaluate(()=>{
  start(0);hero.x=WIDTH-55;hero.y=G-43;step(1);
  if(scene!=='game'||exitActive)throw Error('No invisible right-edge completion permitted');
  hero.x=stages[0].exitX-30;hero.y=G-43;hero.on=true;hero.vy=0;step(1);
  if(!exitActive||scene!=='game')throw Error('Gate did not begin an exit transition');
  for(let i=0;i<39;i++)step(1);
  cam=WIDTH-W;draw();
 });
 await page.screenshot({path:`test-output/${name}-animated-forest-exit.png`});
 await page.evaluate(()=>{for(let i=0;i<35;i++)step(1)});
 assert.equal(await page.evaluate(()=>scene),'end','gate animation finishes then wins');
 await page.evaluate(()=>{
  start(4);
  if(WIDTH!==W||stages[4].ledges.length!==0||bad.length!==0)
   throw Error('Boss chamber must stay compact, uncluttered and solo');
  boss.engaged=true;hero.x=285;hero.y=145;hero.on=false;
  boss.attackIndex=1;boss.phase='patrol';boss.timer=1;bossTick(1,hero.y);
  if(boss.phase!=='volleyWarn')throw Error('Boss should telegraph spore volley');
  cam=0;draw();
 });
 await page.screenshot({path:`test-output/${name}-boss-volley-warning.png`});
 await page.evaluate(()=>{
  start(4);hero.x=285;hero.y=140;hero.on=false;boss.engaged=true;boss.phase='patrol';boss.timer=1;boss.attackIndex=2;bossTick(1,hero.y);
  if(boss.phase!=='chargeWarn')throw Error('Boss charge warning missing');
  cam=0;draw();
 });
 await page.screenshot({path:`test-output/${name}-boss-charge-warning.png`});
 await page.evaluate(()=>{
  start(4);boss.engaged=true;hero.x=275;hero.y=130;boss.hp=29;boss.hurt=0;
  damageBoss(2);
  if(!boss.enraged||boss.phase!=='phaseShift')throw Error('Phase II not started');
  cam=0;draw();
 });
 assert.match(await page.locator('#bossState').innerText(),/PHASE II/);
 await page.screenshot({path:`test-output/${name}-boss-phase-two.png`});
  // Original castle transition and throne room screenshots at the action areas.
 await page.evaluate(()=>{start(3);hero.x=7720;hero.y=G-43;cam=WIDTH-W;draw()});
 await page.screenshot({path:`test-output/${name}-castle-gate.png`});
 await page.evaluate(()=>{start(3);hero.x=2910;hero.y=G-43;cam=2600;draw()});
 await page.screenshot({path:`test-output/${name}-static-castle-path.png`});
 await page.evaluate(()=>{start(4);hero.x=245;cam=0;draw()});
 await page.screenshot({path:`test-output/${name}-castle-throne.png`});
 assert.deepEqual(await page.evaluate(()=>({enemies:bad.length,spikes:spikes.length,gaps:stages[4].gaps.length})),{enemies:0,spikes:0,gaps:0});
 await page.evaluate(()=>{
  for(let i=0;i<5;i++){
   start(i);
   if(stages[i].moving||stages[i].crumbling||typeof movingPlatforms!=='undefined')
    throw Error('Moving and collapsing platforms must be disabled');
   if(solids().some(p=>p.kind))throw Error('Only static platforms should render');
  }
 });
 // Actual gold collection, non-resetting damage and visible pixel hearts.
 await page.evaluate(()=>{
  start(0);hero.x=85;hero.y=G-43;
  things=[{x:hero.x+15,y:hero.y+20,type:'coin',taken:false}];
  step(1);
  if(hero.coins!==1||!save.gold)throw Error('Coin pickup failed');
  if(!document.querySelector('#hudLeft').innerHTML.includes('coin-counter'))
   throw Error('Gold HUD icon missing');
  hero.x=1600;hero.y=G-43;die(1640);
  if(hero.hearts!==2||hero.x<1500||scene!=='game')throw Error('Hit incorrectly reset progress');
  if(!document.querySelector('#hudLeft').getAttribute('aria-label').includes('2 von 3 Herzen'))
   throw Error('Pixel hearts did not update');
  const hearts=hero.hearts;
  die(1640);
  if(hero.hearts!==hearts)throw Error('Repeat hit bypassed grace frames');
  cam=1340;draw();
 });
 await page.screenshot({path:`test-output/${name}-pixel-hearts-and-coins.png`});
 // Changelog may never be opened while running, even programmatically.
 assert.equal(await page.locator('#changelogBtn').isVisible(),false);
 await page.evaluate(()=>document.querySelector('#changelogBtn').click());
 assert.equal(await page.evaluate(()=>scene),'game');
 assert.equal(await page.locator('#changelogOverlay').isVisible(),false);
 await page.evaluate(()=>pause());
 assert.equal(await page.locator('#changelogBtn').isVisible(),false,'not shown on pause');
 await page.evaluate(()=>resume());
  // Real in-browser encounter: red bar appears, three classes and stamp attacks run.
 await page.evaluate(()=>{
  save.class='mage';start(4);hero.x=boss.x-175;hero.y=G-43;
  boss.engaged=true;performAttack();
  for(let i=0;i<35;i++)combatTick(1);
  updateBossHud();
 });
 assert.ok(await page.locator('#bossHud').isVisible());
 assert.equal(await page.evaluate(()=>boss.maxHp),56);
 const hp=await page.evaluate(()=>boss.hp);
 assert.ok(hp>0&&hp<56,name+' mage fireball must damage Slime King: '+hp);
 assert.equal(await page.locator('#bossHealthTrack').getAttribute('aria-valuenow'),String(hp));
 assert.ok((await page.locator('#bossHealthFill').evaluate(el=>getComputedStyle(el).backgroundColor)).includes('237, 52, 62'));
 await page.evaluate(()=>{
  start(4);hero.x=275;hero.y=130;hero.on=false;
  boss.engaged=true;boss.phase='warn';boss.timer=1;
  for(let i=0;i<47;i++)bossTick(1,hero.y);
 });
 assert.equal(await page.evaluate(()=>boss.slamCount),1);
 assert.ok(await page.evaluate(()=>bossWaves.length)>0);
 // The victory is driven by defeating the boss, not by crossing the finish line.
 await page.evaluate(()=>{
  start(4);hero.x=350;
  for(let i=0;i<30;i++)step(1); // A real boss run takes time; zero-frame wins have no record duration.
  boss.engaged=true;boss.hp=1;boss.hurt=0;
  damageBoss(1);
  if(boss.defeatTimer!==42||scene!=='game')throw Error('Victory cue missing');
 });
 assert.equal(await page.locator('#bossHealthTrack').getAttribute('aria-valuenow'),'0');
 assert.equal(await page.locator('#bossState').innerText(),'SCHLEIMKÖNIG BESIEGT!');
 await page.screenshot({path:`test-output/${name}-boss-defeated.png`});
 await page.evaluate(()=>{for(let i=0;i<42;i++)step(1)});
 assert.equal(await page.evaluate(()=>scene),'end','Slime King must end level automatically');
 assert.match(await page.locator('#heading').innerText(),/LEVEL GESCHAFFT/);
 assert.ok(await page.evaluate(()=>save.bestTimesBossV11['1-5'].mage>0));
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
 const beforeLevel1=await page.evaluate(()=>({xp:save.xp,level:save.level}));
 await page.evaluate(()=>{
  clearInput();hero.x=stages[stage].exitX-30;hero.y=G-43;
  hero.on=true;hero.vy=0;hero.vx=0;hero.stars=2;hero.earned=25;
  step(1);
  if(!exitActive)throw Error('Grounded level exit did not activate: '+JSON.stringify({scene,hero,input,jumpWas,stage,goal:stages[stage].exitX}));
  for(let i=0;i<74;i++)step(1);
 });
 assert.equal(await page.evaluate(()=>scene),'end','entering a gate must complete the level even after touch/pause/resume');
 await page.reload();
 const expectedProgress={...beforeLevel1};
 expectedProgress.xp+=95;
 while(expectedProgress.xp>=expectedProgress.level*100){
  expectedProgress.xp-=expectedProgress.level*100;expectedProgress.level++;
 }
 assert.deepEqual(await page.evaluate(()=>({xp:save.xp,level:save.level})),expectedProgress,
  'boss and regular level XP must survive reload, including level ups');
 assert.equal(await page.evaluate(()=>save.stars[0]),3);
 assert.ok(await page.evaluate(()=>save.gold>=1),'collected gold survives reload');
 await page.locator('[data-world="0"]').click();await page.locator('#play').click();await page.screenshot({path:`test-output/${name}-landscape.png`});
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:`test-output/${name}-portrait.png`});
 for(const b of await page.locator('[data-control]').all()){const box=await b.boundingBox();assert.ok(box&&box.x>=0&&box.y>=0&&box.x+box.width<=390&&box.y+box.height<=844);}
 assert.deepEqual(errors,[]);console.log(`PASS ${name}: startup, movement, jump, concurrent pointers, pause, save, responsive controls, no JS errors`);
 }finally{await browser.close();}
}})().catch(e=>{console.error(e);process.exitCode=1});
