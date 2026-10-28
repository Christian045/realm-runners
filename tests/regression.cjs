// Run: NODE_PATH=<directory containing @napi-rs/canvas> node tests/regression.cjs
// Headless JS + real Canvas rasterization. Not a substitute for Safari device tests.
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..');
function harness(initial){const elements=new Map(),listeners={},storage=new Map(initial?[['realm-runners-save-v2',JSON.stringify(initial)]]:[]);let raf;
 class El {constructor(){this.dataset={};this.listeners={};this.style={};this.attrs={};this.classList={add(){},remove(){},toggle(){}};}setAttribute(k,v){this.attrs[k]=String(v);}addEventListener(k,f){(this.listeners[k]??=[]).push(f)}setPointerCapture(){}querySelectorAll(){return [];}dispatch(type,data){for(const f of this.listeners[type]||[])f({preventDefault(){},...data});}}
 const canvas=createCanvas(960,540);elements.set('#view',canvas);const buttons=['left','right','jump','dash','attack'].map(k=>{let el=new El();el.dataset.control=k;return el});
 const sandbox={console,Math,JSON,Number,Map,Set,Object,Array,devicePixelRatio:1,innerWidth:960,innerHeight:540,performance:{now:()=>1000},matchMedia:()=>({matches:false}),localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},addEventListener:(k,f)=>(listeners[k]??=[]).push(f),requestAnimationFrame:f=>raf=f,document:{hidden:false,querySelector:s=>{if(!elements.has(s))elements.set(s,new El());return elements.get(s)},querySelectorAll:()=>buttons,addEventListener:(k,f)=>(listeners[k]??=[]).push(f),createElement:tag=>tag==='canvas'?createCanvas(1,1):new El()}};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(root,'game.js'),'utf8'),sandbox);vm.runInContext(fs.readFileSync(path.join(root,'rpg.js'),'utf8'),sandbox);vm.runInContext(fs.readFileSync(path.join(root,'boss.js'),'utf8'),sandbox);vm.runInContext(fs.readFileSync(path.join(root,'platforms.js'),'utf8'),sandbox);vm.runInContext(fs.readFileSync(path.join(root,'enemies.js'),'utf8'),sandbox);vm.runInContext(fs.readFileSync(path.join(root,'castle_art.js'),'utf8'),sandbox);vm.runInContext(fs.readFileSync(path.join(root,'hd_background.js'),'utf8'),sandbox);vm.runInContext(fs.readFileSync(path.join(root,'forest.js'),'utf8'),sandbox);
 return {run:s=>vm.runInContext(s,sandbox),canvas,buttons,storage,emit:(k,e)=>{for(const f of listeners[k]||[])f({preventDefault(){},...e})}};
}
let checks=0;function test(name,fn){fn();checks++;console.log('PASS',name);}
const h=harness({class:'mage',unlocked:3,stars:[3,2,1],xp:87,level:4,custom:'preserved'});
test('v0.2 progress and unknown fields survive loading and saving',()=>{h.run('persist()');const data=JSON.parse(h.storage.get('realm-runners-save-v2'));for(const [k,v] of Object.entries({class:'mage',unlocked:3,xp:87,level:4,custom:'preserved'}))assert.deepEqual(data[k],v);assert.deepEqual(data.stars,[3,2,1,0,0]);assert.equal(data.saveVersion,5);});
test('all levels and classes render; terrain cache bounded',()=>{for(let s=0;s<5;s++)for(const c of ['warrior','hunter','mage']){h.run(`save.class='${c}';start(${s});for(let i=0;i<40;i++)step(1);draw()`);}assert.ok(h.run('terrainCache.size')<=64);});
test('ground collision and jump',()=>{h.run('start(0);for(let i=0;i<60;i++)step(1)');assert.equal(h.run('hero.on'),true);const y=h.run('hero.y');h.run('input.jump=true;step(1)');assert.ok(h.run('hero.y')<y);});
test('coin and star rewards emit particles',()=>{h.run("start(0);things=[{x:hero.x+15,y:hero.y+20,type:'star',taken:false}];step(1)");assert.equal(h.run('hero.stars'),1);assert.equal(h.run('hero.earned'),25);assert.ok(h.run('particles.length')>0);});
test('stomping enemy',()=>{h.run('start(0);hero.x=420;hero.y=394;hero.vy=5;step(1)');assert.equal(h.run('bad[0].alive'),false);assert.ok(h.run('hero.vy')<0);});
test('dash defeats enemy and starts cooldown',()=>{h.run('start(0);hero.x=406;hero.y=422;input.dash=true;step(1)');assert.equal(h.run('bad[0].alive'),false);assert.ok(h.run('dashCooldown')>0);});
test('damage restarts entire run with one fewer heart',()=>{h.run("start(0);things[0].taken=true;for(let i=0;i<30;i++)step(1);hero.x=1700;die()");assert.equal(h.run('hero.x'),50);assert.equal(h.run('hero.hearts'),2);assert.equal(h.run('currentTime()'),0);assert.equal(h.run('things[0].taken'),false);});
test('fall restarts the level without a checkpoint',()=>{h.run('start(0);hero.y=700;step(1)');assert.equal(h.run('hero.hearts'),2);assert.equal(h.run('hero.x'),50);});
test('completion unlocks level, saves XP and best stars',()=>{h.run('save.unlocked=1;save.level=1;save.xp=90;save.stars=[2,0,0,0,0];start(0);hero.stars=1;hero.earned=25;hero.x=WIDTH-40;step(1)');assert.equal(h.run('scene'),'end');const s=JSON.parse(h.storage.get('realm-runners-save-v2'));assert.equal(s.level,2);assert.equal(s.xp,85);assert.equal(s.unlocked,2);assert.equal(s.stars[0],2);});
test('progress persists across a new runtime',()=>{const fresh=harness(JSON.parse(h.storage.get('realm-runners-save-v2')));assert.equal(fresh.run('save.level'),2);assert.equal(fresh.run('save.unlocked'),2);});
test('multitouch plus keyboard independent release and cancel',()=>{h.run('start(0)');const right=h.buttons[1],jump=h.buttons[2];right.dispatch('pointerdown',{pointerId:1});jump.dispatch('pointerdown',{pointerId:2});assert.equal(h.run('input.right&&input.jump'),true);h.emit('keydown',{code:'KeyD'});right.dispatch('pointerup',{pointerId:1});assert.equal(h.run('input.right'),true);jump.dispatch('pointercancel',{pointerId:2});assert.equal(h.run('input.jump'),false);h.emit('keyup',{code:'KeyD'});assert.equal(h.run('input.right'),false);});
test('blur pauses game and clears held inputs',()=>{h.run('start(0);input.right=true');h.emit('blur',{});assert.equal(h.run('scene'),'pause');assert.equal(h.run('input.right'),false);const x=h.run('hero.x');h.run('step(1)');assert.equal(h.run('hero.x'),x);h.run('resume()');assert.equal(h.run('scene'),'game');});
test('particle budget enforced',()=>{h.run("particles=[];for(let i=0;i<20;i++)burst(100,100,'#fff',40,3)");assert.ok(h.run('particles.length')<=180);h.run('updateParticles(100)');assert.equal(h.run('particles.length'),0);});
test('60 and 120 Hz produce identical motion',()=>{function travel(hz){const f=harness();f.run('start(0);last=1000;input.right=true');for(let i=1;i<=hz/2;i++)f.run(`frame(${1000+i*1000/hz})`);return f.run('hero.x')}assert.ok(Math.abs(travel(60)-travel(120))<5);});
test('full and low graphics at portrait and landscape sizes',()=>{for(const [w,ht] of [[390,844],[844,390],[1920,1080]])for(const q of ['full','low'])h.run(`innerWidth=${w};innerHeight=${ht};quality='${q}';size();draw()`);});
test('long simulation renders without exceptions',()=>{h.run("innerWidth=960;innerHeight=540;size();start(0);for(let i=0;i<900;i++){step(1);updateParticles(1);if(i%30===0)draw();}");});
h.run("save.class='hunter';start(0);for(let i=0;i<60;i++)step(1);hero.x=300;cam=120;visualTime=4;t=90;hero.vx=5;draw()");fs.mkdirSync(path.join(root,'test-output'),{recursive:true});fs.writeFileSync(path.join(root,'test-output','forest-v03.png'),h.canvas.toBuffer('image/png'));
console.log(`${checks} checks passed. Canvas preview: test-output/forest-v03.png`);

test('v0.4 timer only advances during active simulation',()=>{h.run("start(0);for(let i=0;i<60;i++)step(1)");assert.equal(h.run('currentTime()'),1000);h.run("pause();step(1)");assert.equal(h.run('currentTime()'),1000);h.run('resume()');});
test('v0.8 local leaderboard records best time per class',()=>{h.run("save.class='mage';start(0);for(let i=0;i<80;i++)step(1);recordTime()");const first=h.run("save.bestTimesV09['1-1'].mage");h.run('start(0);for(let i=0;i<100;i++)step(1);recordTime()');assert.equal(h.run("save.bestTimesV09['1-1'].mage"),first);});
test('v0.4 skills unlock in order and survive persistence',()=>{h.run("save.class='mage';save.level=5;ensureRpgSave()");assert.equal(h.run("unlockSkill('double_fireball')"),false);assert.equal(h.run("unlockSkill('fireball_damage')"),true);assert.ok(JSON.parse(h.storage.get('realm-runners-save-v2')).skills.mage.includes('fireball_damage'));});
test('v0.4 mage projectile damages an enemy',()=>{h.run("save.class='mage';start(0);hero.x=370;hero.y=420;hero.face=1;performAttack();for(let i=0;i<12;i++)combatTick(1)");assert.ok(h.run('bad[0].hp<2||!bad[0].alive'));});
test('v0.4 inventory equips class-specific items',()=>{h.run("save.class='mage';save.inventory.push('ember_staff');equipItem('ember_staff')");assert.equal(h.run("save.equipment.mage.weapon"),'ember_staff');assert.equal(h.run("equipItem('swift_bow')"),false);});

// Guard against missing or stale runtime scripts in the published HTML.
test('v0.4 HTML loads RPG systems before forest startup',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const game=html.indexOf('src="game.js?v=0.9.0"');
 const rpg=html.indexOf('src="rpg.js?v=0.9.0"');
 const boss=html.indexOf('src="boss.js?v=0.9.0"');
 const platforms=html.indexOf('src="platforms.js?v=0.9.0"');
 const enemies=html.indexOf('src="enemies.js?v=0.9.0"');
 const castleArt=html.indexOf('src="castle_art.js?v=0.9.0"');
 const hd=html.indexOf('src="hd_background.js?v=0.9.0"');
 const forest=html.indexOf('src="forest.js?v=0.9.0"');
 assert.ok(game>=0 && rpg>game && boss>rpg && platforms>boss && enemies>platforms && castleArt>enemies && hd>castleArt && forest>hd,'runtime scripts must load in order');
 assert.ok(html.includes('id="rpgPanels"'));
 assert.ok(html.includes('data-control="attack"'));
 assert.ok(html.includes('LANGE LEVEL · BOSS-PHASE II · 0.9.0'));
 assert.ok(html.includes('aria-valuemax="56"'));
 assert.ok(html.includes('id="bossHealthFill"'));
 assert.ok(html.includes('boss-health-fill'));
});

// New movement regression suite (fixed 60 Hz simulation).
test('v0.5 short tap is lower than hold for all classes',()=>{
 for(const kind of ['warrior','hunter','mage']){
  const apex=(hold)=>{
   h.run(`save.class='${kind}';start(0);input.jump=true;step(1)`);
   let min=h.run('hero.y');
   for(let i=0;i<55;i++){
    if(i===0&&!hold)h.run('input.jump=false');
    h.run('step(1)');
    min=Math.min(min,h.run('hero.y'));
   }
   return 422-min;
  };
  const short=apex(false),high=apex(true);
  assert.ok(short>=25&&short<115,`${kind}: short height ${short}`);
  assert.ok(high>short+65&&high>150,`${kind}: hold height ${high} / tap ${short}`);
 }
});
test('v0.5 coyote time allows a jump just after stepping off a ledge',()=>{
 h.run("save.class='warrior';start(0);hero.x=497;hero.on=true;input.right=true;step(1)");
 assert.equal(h.run('hero.on'),false);
 h.run('input.jump=true;step(1)');
 assert.ok(h.run('hero.vy')<0);
});
test('v0.5 buffered jump fires upon landing even after releasing input',()=>{
 h.run("start(0);hero.y=395;hero.on=false;hero.vy=8;hero.coyote=0;input.jump=true;step(1);input.jump=false;for(let i=0;i<8;i++)step(1)");
 assert.ok(h.run('hero.vy')<0,'buffered jump should trigger on the frame after landing');
});
test('v0.5 stages have safe gaps, distinct paths, stars and no checkpoint state',()=>{
 const geometry=h.run('stages.map(s=>({gaps:s.gaps,ledges:s.ledges,stars:s.stars,enemies:s.enemies,spikes:s.spikes,boss:s.boss}))');
 const signatures=new Set(geometry.map(s=>JSON.stringify(s.gaps)));
 assert.equal(signatures.size,5);
 assert.ok(geometry.filter(s=>!s.boss).every(s=>s.ledges.length>=5&&s.stars.length===3));
 assert.ok(geometry.find(s=>s.boss).enemies.length===0);
 for(const s of geometry){
  for(const [a,b] of s.gaps)assert.ok(a>150&&b-a<=210&&b<4050);
  for(const x of s.spikes)assert.ok(s.gaps.every(([a,b])=>x+44<a||x>b));
 }
 assert.equal(h.run("typeof checkpoints"),'undefined');
});
test('v0.5 failed runs do not overwrite earned XP or best times',()=>{
 h.run("save.class='mage';save.bestTimes={'1-1':{mage:72851}};save.xp=47;start(0);hero.x=1600;die()");
 assert.equal(h.run('save.xp'),47);
 assert.equal(h.run("save.bestTimes['1-1'].mage"),72851);
 assert.equal(h.run('hero.x'),50);
 assert.equal(h.run('hero.hearts'),2);
});
test('v0.5 third death shows retry and R key restarts with full hearts',()=>{
 h.run("start(0);die();die();die()");
 assert.equal(h.run('scene'),'end');
 h.emit('keydown',{code:'KeyR'});
 assert.equal(h.run('scene'),'game');
 assert.equal(h.run('hero.hearts'),3);
 assert.equal(h.run('hero.x'),50);
});

test('Pixel Edition: held jump apex is around 12 percent lower, short tap is unchanged',()=>{
 const previous={warrior:189.8,hunter:197.6,mage:210.8};
 for(const kind of Object.keys(previous)){
  const height=held=>{
   h.run(`save.class='${kind}';start(0);input.jump=true;step(1)`);
   let min=h.run('hero.y');
   for(let frame=0;frame<65;frame++){
    if(frame===0&&!held)h.run('input.jump=false');
    h.run('step(1)');
    min=Math.min(min,h.run('hero.y'));
   }
   return 422-min;
  };
  const tap=height(false),hold=height(true),ratio=hold/previous[kind];
  assert.ok(ratio>.84&&ratio<.90,`${kind}: ${ratio.toFixed(3)} of old apex`);
  const legacyTap={warrior:50.988,hunter:53.1348,mage:56.8248}[kind];
  assert.ok(Math.abs(tap-legacyTap)<1.5,`${kind}: short tap ${tap.toFixed(2)} vs old ${legacyTap}`);
  assert.ok(hold>tap+100,`${kind}: held jump remains distinguishable`);
 }
});
test('v0.7 dual-resolution background, crisp pixel buffer, and context restoration',()=>{
 h.run('innerWidth=960;innerHeight=540;size();start(0);draw()');
 assert.equal(h.run('pixelCanvas.width'),720);
 assert.equal(h.run('pixelCanvas.height'),405);
 assert.equal(h.run("ctx===canvas.getContext('2d')"),true);
 const data=h.canvas.getContext('2d').getImageData(200,140,2,2).data;
 assert.ok(data[3]>0);
 assert.equal(h.run('pixelCtx.imageSmoothingEnabled'),false);
 assert.equal(h.run('hdCanvas.width'),960);
 assert.equal(h.run('hdCanvas.height'),540);
 assert.equal(h.run('hdCtx.imageSmoothingEnabled'),true);
 assert.equal(h.run('pixelCtx.getImageData(95,13,1,1).data[3]'),0,'background must not be baked into pixel layer');
 assert.equal(h.run('hdCtx.getImageData(95,13,1,1).data[3]'),255,'HD background must render opaque');
});
test('Pixel Edition: previous time trials remain untouched after recording new runs',()=>{
 h.run("save.class='mage';save.bestTimes={'1-1':{mage:69000}};save.bestTimesV05={'1-1':{mage:72000}};start(0);for(let i=0;i<90;i++)step(1);recordTime()");
 assert.equal(h.run("save.bestTimes['1-1'].mage"),69000);
 assert.equal(h.run("save.bestTimesV05['1-1'].mage"),72000);
 assert.ok(h.run("save.bestTimesV09['1-1'].mage")>0);
});
test('Pixel Edition: maximum terrain gap remains passable without forced long dash',()=>{
 const gapLengths=h.run('stages.flatMap(s=>s.gaps.map(([a,b])=>b-a))');
 assert.ok(Math.max(...gapLengths)<=185);
});

test('v0.7 native-resolution HD sky remains distinct in each biome',()=>{
 const colors=h.run("(()=>{const colors=[];for(let i=0;i<3;i++){quality='low';start(i);draw();colors.push([...hdCtx.getImageData(50,15,1,1).data].slice(0,3))}return colors})()");
 assert.equal(new Set(colors.map(rgb=>rgb.join(','))).size,3);
 const distance=(a,b)=>a.reduce((total,x,i)=>total+Math.abs(x-b[i]),0);
 assert.ok(distance(colors[0],colors[1])>100,'Waldanfang and Baumkronen must differ strongly');
 assert.ok(distance(colors[1],colors[2])>60,'Baumkronen and Moosruinen must differ strongly');
});
test('v0.7 each stage retains individual foreground tiles and bounded HD parallax',()=>{
 const colors=h.run("(()=>{const colors=[];for(let i=0;i<3;i++){stage=i;const tile=terrain({x:0,y:G,w:140},0);colors.push([...tile.getContext('2d').getImageData(35,17,1,1).data].slice(0,3));}return colors})()");
 assert.equal(new Set(colors.map(rgb=>rgb.join(','))).size,3);
 h.run('start(3);draw()');
 assert.equal(h.run('hdCacheStage'),3);
 assert.equal(h.run('hdCachedPlanes.length'),2);
 h.run('start(4);draw()');
 assert.equal(h.run('hdCachedPlanes.length'),0,'castle should not allocate forest trees');
 h.run('start(0);draw()');
 assert.equal(h.run('hdCacheStage'),0);
 assert.equal(h.run('hdCachedPlanes.length'),2);
 assert.equal(h.run('hdCachedPlanes[0].width'),1600);
});
test('v0.5.2 visual changes leave jump rules and game physics unchanged',()=>{
 assert.equal(h.run('JUMP.holdFrames'),14);
 assert.equal(h.run('JUMP.holdGravity'),.50);
 assert.equal(h.run('JUMP.cut'),.58);
 assert.equal(h.run('classes.mage.jump'),14.4);
});

test('v0.6 adds two fully playable levels and preserves old save data',()=>{
 const old=harness({class:'warrior',unlocked:3,stars:[3,2,1],xp:74,level:6,custom:'old-progress'});
 assert.equal(old.run('stages.length'),5);
 assert.equal(old.run('save.unlocked'),3);
 assert.equal(old.run('save.stars.length'),5);
 assert.equal(old.run('save.stars[2]'),1);
 assert.equal(old.run('save.custom'),'old-progress');
 assert.equal(old.run("stages[3].name.includes('Schlosstor')"),true);
 assert.equal(old.run("stages[4].boss"),true);
 old.run('save.unlocked=5;persist()');
 const again=harness(JSON.parse(old.storage.get('realm-runners-save-v2')));
 assert.equal(again.run('save.unlocked'),5);
});
test('v0.6 fifth level cannot finish until the Slime King is defeated',()=>{
 h.run("start(4);hero.x=2749;step(1)");
 assert.equal(h.run('scene'),'game');
 assert.equal(h.run('boss.engaged'),true);
 assert.equal(h.run('boss.hp'),56);
 h.run('boss.hurt=0;boss.hp=1;damageBoss(5);hero.x=WIDTH-40;step(1)');
 assert.equal(h.run('boss.alive'),false);
 assert.equal(h.run('scene'),'game','the short boss victory effect must be visible');
 h.run('for(let frame=0;frame<BOSS_VICTORY_FRAMES;frame++)step(1)');
 assert.equal(h.run('scene'),'end','boss death alone must finish without reaching any flag');
 const saved=JSON.parse(h.storage.get('realm-runners-save-v2'));
 assert.equal(saved.slimeKingWins>=1,true);
 assert.ok(saved.bestTimesBossV09['1-5'].mage>0);
});
test('v0.6 Slime King red health bar tracks damage and boss resets on death',()=>{
 h.run("start(4);hero.x=2070;step(1)");
 assert.equal(h.run('boss.engaged'),true);
 h.run('damageBoss(4)');
 assert.equal(h.run('boss.hp'),52);
 assert.equal(h.run("document.querySelector('#bossHealthFill').style.width"),String(52/56*100)+'%');
 assert.equal(h.run("document.querySelector('#bossHealthTrack').attrs['aria-valuenow']"),'52');
 h.run('die()');
 assert.equal(h.run('hero.hearts'),2);
 assert.equal(h.run('boss.hp'),56);
 assert.equal(h.run('boss.engaged'),false);
 assert.equal(h.run('bossGoo.length+bossWaves.length'),0);
});
test('v0.6 three classes can use their regular weapons against the boss',()=>{
 for(const kind of ['warrior','hunter','mage']){
  h.run(`save.class='${kind}';start(4);boss.engaged=true;hero.face=1;hero.y=G-43;hero.x=boss.x-${kind==='warrior'?65:175};performAttack();for(let k=0;k<30;k++)combatTick(1)`);
  assert.ok(h.run('boss.hp')<56,`${kind} must damage the boss`);
 }
});
test('v0.6 Slime King telegraphs and lands a shockwave stomp',()=>{
 h.run("start(4);boss.engaged=true;boss.phase='warn';boss.timer=1;hero.x=2100;hero.y=140;hero.on=false;bossTick(1,hero.y)");
 assert.equal(h.run('boss.phase'),'leap');
 for(let i=0;i<45;i++)h.run('bossTick(1,hero.y)');
 assert.equal(h.run('boss.slamCount'),1);
 assert.ok(h.run('bossWaves.length')>0);
 assert.equal(h.run('boss.phase'),'recover');
});
test('v0.6 ground shockwave harms nonjumping hero while jump avoids it',()=>{
 h.run("start(4);boss.engaged=true;hero.x=2170;hero.y=422;bossWaves=[{x:hero.x+hero.w/2-6,dir:1,ttl:30}]");
 h.run('bossTick(1,hero.y)');
 assert.equal(h.run('hero.hearts'),2);
 assert.equal(h.run('hero.x'),2060);
 h.run("start(4);boss.engaged=true;hero.x=2170;hero.y=315;hero.on=false;bossWaves=[{x:hero.x+hero.w/2-6,dir:1,ttl:30}]");
 h.run('bossTick(1,hero.y)');
 assert.equal(h.run('hero.hearts'),3);
});
test('v0.6 boss death grants rewards without changing historic records',()=>{
 h.run("save.class='hunter';save.bestTimes={'1-1':{hunter:72000}};save.bestTimesV05={'1-1':{hunter:76000}};start(4);boss.engaged=true;boss.hurt=0;boss.hp=2;damageBoss(2)");
 assert.equal(h.run('bossDefeated()'),true);
 assert.ok(h.run('hero.earned')>=120);
 assert.equal(h.run("save.bestTimes['1-1'].hunter"),72000);
 assert.equal(h.run("save.bestTimesV05['1-1'].hunter"),76000);
});

test('v0.6.1 boss stage is a boss-only castle arena with immediate spawn',()=>{
 h.run('start(4)');
 assert.equal(h.run('hero.x'),2060);
 assert.equal(h.run('stages[4].gaps.length'),0);
 assert.equal(h.run('bad.length'),0);
 assert.equal(h.run('spikes.length'),0);
 assert.equal(h.run('things.length'),0);
 assert.equal(h.run('movingPlatforms.length'),0);
 assert.ok(h.run('cam')>1500);
 h.run('for(let k=0;k<30;k++)step(1);draw()');
 assert.equal(h.run('scene'),'game');
 assert.equal(h.run('boss.engaged'),true);
});
test('v0.6.1 moving platforms carry their rider horizontally and vertically',()=>{
 h.run("start(3);hero.x=movingPlatforms[1].x+35;hero.y=movingPlatforms[1].y-hero.h;hero.on=true;hero.riding=movingPlatforms[1].id;hero.vy=0");
 const before=h.run('hero.x'),platformBefore=h.run('movingPlatforms[1].x');
 h.run('step(1)');
 const distance=h.run('movingPlatforms[1].x')-platformBefore;
 assert.ok(distance>0);
 assert.ok(Math.abs(h.run('hero.x')-before-distance)<.01);
 assert.equal(h.run('hero.riding'),'m1');
 h.run("start(3);hero.x=movingPlatforms[0].x+35;hero.y=movingPlatforms[0].y-hero.h;hero.on=true;hero.riding=movingPlatforms[0].id;hero.vy=0");
 const beforeY=h.run('hero.y'),platformY=h.run('movingPlatforms[0].y');
 h.run('step(1)');
 const diffY=h.run('movingPlatforms[0].y')-platformY;
 assert.ok(diffY>0);
 assert.ok(Math.abs(h.run('hero.y')-beforeY-diffY)<1.5);
});
test('v0.6.1 crumble platforms warn, fall, respawn and restart at initial location',()=>{
 h.run('start(3);hero.x=movingPlatforms[2].x+24;hero.y=movingPlatforms[2].y-hero.h-8;hero.vy=10;hero.on=false;step(1)');
 assert.equal(h.run("movingPlatforms[2].state"),'shaking');
 h.run('for(let i=0;i<35;i++)platformTick(1)');
 assert.equal(h.run("movingPlatforms[2].state"),'falling');
 assert.equal(h.run('activePlatforms().some(p=>p.id===\'c0\')'),false);
 h.run('for(let i=0;i<100;i++)platformTick(1)');
 assert.equal(h.run("movingPlatforms[2].state"),'gone');
 h.run('for(let i=0;i<220;i++)platformTick(1)');
 assert.equal(h.run("movingPlatforms[2].state"),'ready');
 assert.equal(h.run('movingPlatforms[2].y'),386);
 h.run('movingPlatforms[2].state=\'falling\';die()');
 assert.equal(h.run("movingPlatforms[2].state"),'ready');
});
test('v0.6.1 static early stages and physics are preserved',()=>{
 h.run('start(0)');
 assert.equal(h.run('movingPlatforms.length'),0);
 assert.equal(h.run('JUMP.holdFrames'),14);
 assert.equal(h.run('JUMP.holdGravity'),.5);
 const y=h.run('hero.y');h.run('input.jump=true;step(1)');
 assert.ok(h.run('hero.y')<y);
});
test('v0.6.1 original HD-pixel castle exterior and throne interior render',()=>{
 for(const stageIndex of [3,4]){
  h.run(`start(${stageIndex});cam=1840;draw()`);
  const pixel=h.canvas.getContext('2d').getImageData(300,155,1,1).data;
  assert.equal(pixel[3],255);
 }
 assert.equal(h.run("typeof drawCastleApproach"),'function');
 assert.equal(h.run("typeof drawCastleInterior"),'function');
 assert.equal(h.run("typeof drawCastleThrone"),'function');
});

test('v0.6.2 auto-win triggers after a short animation without visiting level exit',()=>{
 h.run("start(4);hero.x=2270;boss.engaged=true;boss.hp=1;boss.hurt=0;damageBoss(1)");
 assert.equal(h.run('scene'),'game');
 assert.equal(h.run('boss.defeatTimer'),42);
 assert.equal(h.run("document.querySelector('#bossHealthFill').style.width"),'0%');
 assert.equal(h.run("document.querySelector('#bossState').textContent"),'SCHLEIMKÖNIG BESIEGT!');
 assert.equal(h.run('bossGoo.length+bossWaves.length'),0);
 h.run('step(1)');
 assert.equal(h.run('hero.x'),2270,'player controls freeze during victory');
 h.run('for(let frame=0;frame<42;frame++)step(1)');
 assert.equal(h.run('scene'),'end');
 assert.equal(h.run('hero.hearts'),3);
 assert.equal(h.run('save.slimeKingWins')>0,true);
 const wins=h.run('save.slimeKingWins');
 h.run('for(let frame=0;frame<100;frame++)step(1)');
 assert.equal(h.run('save.slimeKingWins'),wins,'win rewarded exactly once');
});
test('v0.6.2 boss arena exit alone cannot finish before the final hit',()=>{
 h.run("start(4);hero.x=WIDTH-33;boss.engaged=true;step(1)");
 assert.equal(h.run('scene'),'game');
 h.run('boss.hurt=0;boss.hp=1;damageBoss(1)');
 h.run('for(let frame=0;frame<43;frame++)step(1)');
 assert.equal(h.run('scene'),'end');
});
test('v0.6.2 old boss best times are preserved and new ones use their own board',()=>{
 h.run("save.bestTimesPixelV051['1-5']={mage:75000};start(4);boss.engaged=true;boss.hp=1;boss.hurt=0;damageBoss(1);for(let i=0;i<42;i++)step(1)");
 assert.equal(h.run("save.bestTimesPixelV051['1-5'].mage"),75000);
 assert.ok(h.run("save.bestTimesBossV09['1-5'].mage")>0);
});
test('v0.6.2 foreground pixels are individually textured and separated from the backdrop',()=>{
 const sample=h.run("(()=>{start(0);draw();const tile=terrain(land()[0],0),q=tile.getContext('2d');const cap=[...q.getImageData(21,17,1,1).data].slice(0,3);const colors=[];for(let y=26;y<88;y+=4)for(let x=18;x<125;x+=4)colors.push([...q.getImageData(x,y,1,1).data].slice(0,3).join(','));return {cap,face:[...q.getImageData(21,33,1,1).data].slice(0,3),unique:new Set(colors).size}})()");
 assert.notDeepEqual(sample.cap,sample.face,'platform cap should contrast with block face');
 assert.ok(sample.unique>=4,'organic dirt must have several distinct pixel colors');
 assert.equal(h.run('pixelCanvas.width'),720);
 assert.equal(h.run('pixelCanvas.height'),405);
});

test('v0.7 all five levels render high-definition atmospheric backgrounds independently',()=>{
 for(let stageIndex=0;stageIndex<5;stageIndex++){
  h.run(`start(${stageIndex});draw()`);
  assert.equal(h.run('hdCanvas.width'),960);
  assert.equal(h.run('hdCanvas.height'),540);
  assert.equal(h.run("ctx===canvas.getContext('2d')"),true,'drawing context must always be restored');
  assert.equal(h.run('hdCtx.getImageData(50,60,1,1).data[3]'),255,'every HD backdrop needs full opacity');
 }
});
test('v0.7 960x540 background contains smooth HD color changes, pixel foreground stays isolated',()=>{
 h.run("quality='full';start(0);draw()");
 const details=h.run("(()=>{const hd=[],px=[];for(let x=600;x<635;x++){hd.push([...hdCtx.getImageData(x,130,1,1).data].slice(0,3).join(','));px.push(pixelCtx.getImageData(Math.round(x*.75),Math.round(130*.75),1,1).data[3]);}return {unique:new Set(hd).size,alpha:px.reduce((a,b)=>a+b,0)}})()");
 assert.ok(details.unique>=10,'HD foliage and graduated daylight should not be flat 8-pixel blocks');
 assert.equal(details.alpha,0,'all scenery must remain behind an alpha-transparent gameplay layer');
});
test('v0.7 backdrop cache holds only the current biome, including graphic quality changes',()=>{
 h.run("start(0);draw()");
 const cached=h.run('hdCachedPlanes[0]');
 h.run("start(1);quality='low';draw()");
 assert.equal(h.run('hdCacheStage'),1);
 assert.equal(h.run('hdCachedPlanes.length'),2);
 assert.notEqual(h.run('hdCachedPlanes[0]'),cached);
 h.run("start(4);draw()");
 assert.equal(h.run('hdCachedPlanes.length'),0);
 h.run("start(0);quality='full';draw()");
});

test('v0.8 all four non-boss levels have 4 enemy species; castle boss remains alone',()=>{
 for(let level=0;level<4;level++){
  h.run(`start(${level})`);
  const rosters=h.run('bad.map(e=>e.type)');
  assert.equal(rosters.length,9);
  assert.deepEqual([...new Set(rosters)].sort(),['bat','goblin','mushroom','slime']);
  assert.equal(h.run('bad.every(e=>e.hp===e.maxHp&&e.w>0&&e.h>0&&e.alive)'),true);
 }
 h.run('start(4)');
 assert.equal(h.run('bad.length'),0);
 assert.equal(h.run('enemyShots.length'),0);
 assert.equal(h.run('boss.alive'),true);
});
test('v0.8 bat telegraphs a dive and recovers without teleporting or spawning shots',()=>{
 h.run("start(0);hero.x=bad[1].x-75;hero.y=G-43;bad[1].attackCooldown=0;enemyTick(1)");
 assert.equal(h.run("bad[1].phase"),'windup');
 assert.equal(h.run("bad[1].type"),'bat');
 h.run('for(let i=0;i<29;i++)enemyTick(1)');
 assert.equal(h.run("bad[1].phase"),'dive');
 assert.ok(h.run("Math.abs(bad[1].vx)")>3);
 h.run('for(let i=0;i<35;i++)enemyTick(1)');
 assert.ok(['recover','patrol'].includes(h.run('bad[1].phase')));
 assert.equal(h.run('enemyShots.length'),0);
});
test('v0.8 mushroom warning generates limited, slow, directional spores',()=>{
 h.run("start(0);hero.x=bad[2].x-85;hero.y=G-43;bad[2].attackCooldown=0;enemyTick(1)");
 assert.equal(h.run("bad[2].phase"),'windup');
 assert.equal(h.run('enemyShots.length'),0);
 h.run('for(let i=0;i<33;i++)enemyTick(1)');
 assert.equal(h.run('enemyShots.length'),1);
 assert.ok(h.run('enemyShots[0].vx')<0);
 assert.ok(h.run('Math.hypot(enemyShots[0].vx,enemyShots[0].vy)')<3.5);
 h.run('for(let i=0;i<200;i++)enemyTick(1)');
 assert.ok(h.run('enemyShots.length')<=12,'projectile count bounded for iPhone');
});
test('v0.8 goblin warns before fast charge and enters recover',()=>{
 h.run("start(0);hero.x=bad[3].x-85;hero.y=G-43;bad[3].attackCooldown=0;enemyTick(1)");
 assert.equal(h.run("bad[3].phase"),'windup');
 h.run('for(let i=0;i<26;i++)enemyTick(1)');
 assert.equal(h.run("bad[3].phase"),'charge');
 const initial=h.run('bad[3].x');
 h.run('for(let i=0;i<7;i++)enemyTick(1)');
 assert.ok(initial-h.run('bad[3].x')>20,'charging goblin moves faster than a patrol');
 h.run('for(let i=0;i<35;i++)enemyTick(1)');
 assert.equal(h.run("bad[3].phase"),'recover');
});
test('v0.8 spores harm on contact and dash cancels them',()=>{
 h.run("start(0);hero.x=150;hero.y=G-43;hero.dash=0;enemyShots=[{x:165,y:G-20,vx:0,vy:0,radius:9,life:20}]");
 assert.equal(h.run('enemyHazardsHitHero(hero.y)'),true);
 assert.equal(h.run('hero.hearts'),2);
 assert.equal(h.run('enemyShots.length'),0,'restart clears spores');
 h.run("start(0);hero.x=150;hero.y=G-43;hero.dash=5;enemyShots=[{x:165,y:G-20,vx:0,vy:0,radius:9,life:20}]");
 assert.equal(h.run('enemyHazardsHitHero(hero.y)'),false);
 assert.equal(h.run('enemyShots.length'),0);
 assert.equal(h.run('hero.hearts'),3);
});
test('v0.8 airborne stomps and dash safely defeat new enemy species',()=>{
 h.run("start(0);hero.x=bad[1].x+1;hero.y=bad[1].y-hero.h-4;hero.vy=7;hero.dash=0");
 const previous=h.run('hero.y');h.run('hero.y+=7;enemyHazardsHitHero('+previous+')');
 assert.equal(h.run('bad[1].alive'),false,'flying bat can be stomped');
 assert.ok(h.run('hero.vy')<0,'stomp bounces hero');
 h.run("start(0);hero.x=bad[2].x+2;hero.y=bad[2].y;hero.dash=4;enemyHazardsHitHero(hero.y)");
 assert.equal(h.run('bad[2].hp'),1,'mushroom has 4 HP and dash deals 3');
 assert.equal(h.run('hero.hearts'),3);
});
test('v0.8 each class can damage enemies with correct vertical hitboxes',()=>{
 // Krieger sword hits the goblin at walking height.
 h.run("save.class='warrior';start(0);hero.x=bad[3].x-48;hero.y=G-43;hero.face=1;performAttack()");
 assert.ok(h.run('bad[3].hp')<5);
 assert.ok(h.run('combatTexts.length')>0,'floating damage numbers appear');
 // Jäger and Magier can strike a flying bat while jumping.
 for(const kind of ['hunter','mage']){
  h.run(`save.class='${kind}';start(0);hero.x=bad[1].x-95;hero.y=bad[1].y-9;hero.face=1;performAttack();for(let i=0;i<15;i++)combatTick(1)`);
  assert.ok(h.run('bad[1].hp')<2,`${kind} projectile strikes bat`);
 }
});
test('v0.8 holding attack repeats after class cooldown; release stops it',()=>{
 h.run("save.class='hunter';start(0);bad=[];hero.x=50;input.attack=true;for(let i=0;i<50;i++)combatTick(1)");
 assert.ok(h.run('projectiles.length')>=3,'held attack repeats on iPhone');
 h.run('input.attack=false');
 const before=h.run('projectiles.length');
 h.run('for(let i=0;i<8;i++)combatTick(1)');
 assert.ok(h.run('projectiles.length')<=before,'release cannot generate new projectiles');
});
test('v0.8 old best times and skills survive; new enemy records do not overwrite them',()=>{
 h.run("save.class='mage';save.bestTimesPixelV051['1-1']={mage:76000};save.bestTimesV08={};save.level=6;start(0);for(let i=0;i<25;i++)step(1);recordTime()");
 assert.equal(h.run("save.bestTimesPixelV051['1-1'].mage"),76000);
 assert.ok(h.run("save.bestTimesV09['1-1'].mage")>0);
 assert.equal(h.run('save.level'),6);
 assert.equal(h.run('save.skills.mage.includes(\'fireball_damage\')'),true);
});

test('v0.9 four adventure levels are 50 percent longer while boss arena stays compact',()=>{
 const cfg=h.run('stages.map(({width,gaps,ledges,enemies,spikes,stars,boss})=>({width,gaps,ledges,enemies,spikes,stars,boss}))');
 for(let i=0;i<4;i++){
  assert.equal(cfg[i].width,4200,'long adventure stage '+(i+1));
  assert.equal(cfg[i].gaps.length,5);
  assert.ok(cfg[i].ledges.length>=12);
  assert.ok(cfg[i].enemies.length>=9);
  assert.ok(cfg[i].spikes.length>=6);
  assert.equal(cfg[i].stars.length,3);
  assert.ok(cfg[i].stars[2][0]>3700,'last star should reward longer route');
  assert.ok(cfg[i].gaps.every(([a,b])=>b-a<=200&&b<4000));
  h.run(`start(${i})`);
  assert.equal(h.run('WIDTH'),4200);
  assert.ok(h.run('things.filter(x=>x.type===\'coin\').length')>35);
  assert.equal(h.run('bad.length'),9);
  // Reaching the former 2,800-unit finish must not complete the level.
  h.run('hero.x=2760;hero.y=G-43;step(1)');
  assert.equal(h.run('scene'),'game');
  h.run('bad=[];spikes=[];hero.x=WIDTH-35;hero.y=G-43;step(1)');
  assert.equal(h.run('scene'),'end');
 }
 h.run('start(4)');
 assert.equal(h.run('WIDTH'),2800);
 assert.equal(h.run('stages[4].ledges.length'),0,'no clutter/platform cheese inside castle');
 assert.equal(h.run('hero.x'),2060);
 assert.equal(h.run('bad.length'),0);
 assert.equal(h.run('spikes.length'),0);
});
test('v0.9 arena boss uses three explicit attacks with player-facing telegraphs',()=>{
 h.run("start(4);hero.x=2120;hero.y=140;hero.on=false;boss.engaged=true;boss.attackIndex=0;boss.phase='patrol';boss.timer=1");
 h.run('bossTick(1,hero.y)');
 assert.equal(h.run('boss.phase'),'warn');
 assert.equal(h.run('boss.targetX')>=2020,true);
 h.run('boss.phase=\'patrol\';boss.timer=1;bossTick(1,hero.y)');
 assert.equal(h.run('boss.phase'),'volleyWarn');
 h.run('for(let i=0;i<37;i++)bossTick(1,hero.y)');
 assert.equal(h.run('boss.volleyCount'),1);
 assert.equal(h.run('bossGoo.length'),2);
 assert.equal(h.run('boss.phase'),'volley');
 h.run("bossGoo=[];boss.phase='patrol';boss.timer=1;bossTick(1,hero.y)");
 assert.equal(h.run('boss.phase'),'chargeWarn');
 h.run('for(let i=0;i<37;i++)bossTick(1,hero.y)');
 assert.equal(h.run('boss.phase'),'charge');
 const before=h.run('boss.x');
 h.run('bossTick(1,hero.y)');
 assert.ok(Math.abs(h.run('boss.x')-before)>8);
});
test('v0.9 boss actively closes the distance even against safe ranged mage',()=>{
 h.run("save.class='mage';start(4);hero.x=2060;hero.y=G-43;boss.engaged=true;boss.phase='patrol';boss.timer=100");
 const x=h.run('boss.x');
 h.run('for(let i=0;i<24;i++)bossTick(1,hero.y)');
 assert.ok(x-h.run('boss.x')>55,'boss must close on ranged attacker');
 assert.equal(h.run('BOSS_HP'),56);
});
test('v0.9 phase two transforms at half health with brief protected telegraph',()=>{
 h.run("start(4);boss.engaged=true;hero.x=2090;hero.y=130;boss.hp=29;boss.hurt=0;bossGoo=[{x:2100,y:240,vx:0,vy:0,r:10,ttl:50}]");
 assert.equal(h.run('damageBoss(2)'),true);
 assert.equal(h.run('boss.hp'),27);
 assert.equal(h.run('boss.enraged'),true);
 assert.equal(h.run('boss.phase'),'phaseShift');
 assert.equal(h.run('bossGoo.length'),0,'phase transition clears old projectiles');
 assert.equal(h.run('damageBoss(5)'),false,'protected phase transition');
 assert.equal(h.run("document.querySelector('#bossState').textContent"),'PHASE II · ZORN DES KÖNIGS!');
 h.run('for(let i=0;i<59;i++)bossTick(1,hero.y)');
 assert.equal(h.run('boss.phase'),'patrol');
 h.run("boss.attackIndex=1;boss.timer=1;bossTick(1,hero.y)");
 assert.equal(h.run('boss.phase'),'volleyWarn');
 h.run('for(let i=0;i<28;i++)bossTick(1,hero.y)');
 assert.equal(h.run('bossGoo.length'),3,'angry phase fires three aimed projectiles');
});
test('v0.9 boss attack windups are dodgeable and contact remains punishable',()=>{
 h.run("start(4);boss.engaged=true;hero.x=2080;hero.y=G-43;boss.phase='warn';boss.timer=16");
 h.run('for(let i=0;i<12;i++)bossTick(1,hero.y)');
 assert.equal(h.run('hero.hearts'),3,'red warning cannot deal damage before attack');
 h.run("boss.phase='chargeWarn';boss.timer=20;boss.chargeDir=-1;boss.x=2360;hero.x=2150;hero.y=310;hero.on=false");
 h.run('for(let i=0;i<35;i++)bossTick(1,hero.y)');
 assert.equal(h.run('hero.hearts'),3,'jumping above a charge is safe');
 h.run("hero.y=G-43;hero.on=true;boss.phase='charge';boss.timer=5;boss.x=hero.x+16;boss.chargeDir=-1");
 h.run('bossTick(1,hero.y)');
 assert.equal(h.run('hero.hearts'),2,'an unprotected body collision should cost a heart');
});
test('v0.9 old records and player progression remain intact',()=>{
 h.run("save.class='hunter';save.bestTimesV08={'1-1':{hunter:35000}};save.bestTimesBossV062={'1-5':{hunter:48000}};save.bestTimesV09={};save.bestTimesBossV09={};start(0);for(let i=0;i<50;i++)step(1);recordTime()");
 assert.equal(h.run("save.bestTimesV08['1-1'].hunter"),35000);
 assert.equal(h.run("save.bestTimesBossV062['1-5'].hunter"),48000);
 assert.ok(h.run("save.bestTimesV09['1-1'].hunter")>0);
 h.run("start(4);for(let i=0;i<10;i++)step(1);boss.engaged=true;boss.hurt=0;boss.hp=1;damageBoss(1);for(let i=0;i<42;i++)step(1)");
 assert.equal(h.run('scene'),'end');
 assert.ok(h.run("save.bestTimesBossV09['1-5'].hunter")>0);
 assert.equal(h.run("save.bestTimesBossV062['1-5'].hunter"),48000);
 assert.equal(h.run('save.saveVersion'),5);
});
