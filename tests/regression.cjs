// Run: NODE_PATH=<directory containing @napi-rs/canvas> node tests/regression.cjs
// Headless JS + real Canvas rasterization. Not a substitute for Safari device tests.
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..');
function harness(initial){const elements=new Map(),listeners={},storage=new Map(initial?[['realm-runners-save-v2',JSON.stringify(initial)]]:[]);let raf;
 class El {constructor(){this.dataset={};this.listeners={};this.style={};this.attrs={};this.classes=new Set();this.classList={add:k=>this.classes.add(k),remove:k=>this.classes.delete(k),toggle:(k,flag)=>flag===undefined?(this.classes.has(k)?this.classes.delete(k):this.classes.add(k)):(flag?this.classes.add(k):this.classes.delete(k)),contains:k=>this.classes.has(k)};}setAttribute(k,v){this.attrs[k]=String(v);}addEventListener(k,f){(this.listeners[k]??=[]).push(f)}setPointerCapture(){}focus(){}querySelectorAll(){return [];}dispatch(type,data){for(const f of this.listeners[type]||[])f({preventDefault(){},...data});}}
 const canvas=createCanvas(960,540);elements.set('#view',canvas);const buttons=['left','right','jump','dash','attack'].map(k=>{let el=new El();el.dataset.control=k;return el});
 const sandbox={console,Math,JSON,Number,Map,Set,Object,Array,devicePixelRatio:1,innerWidth:960,innerHeight:540,performance:{now:()=>1000},matchMedia:()=>({matches:false}),localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},addEventListener:(k,f)=>(listeners[k]??=[]).push(f),requestAnimationFrame:f=>raf=f,document:{hidden:false,querySelector:s=>{if(!elements.has(s))elements.set(s,new El());return elements.get(s)},querySelectorAll:()=>buttons,addEventListener:(k,f)=>(listeners[k]??=[]).push(f),createElement:tag=>tag==='canvas'?createCanvas(1,1):new El()}};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(root,'game.js'),'utf8'),sandbox);vm.runInContext(fs.readFileSync(path.join(root,'rpg.js'),'utf8'),sandbox);vm.runInContext(fs.readFileSync(path.join(root,'boss.js'),'utf8'),sandbox);vm.runInContext(fs.readFileSync(path.join(root,'enemies.js'),'utf8'),sandbox);vm.runInContext(fs.readFileSync(path.join(root,'castle_art.js'),'utf8'),sandbox);vm.runInContext(fs.readFileSync(path.join(root,'hd_background.js'),'utf8'),sandbox);vm.runInContext(fs.readFileSync(path.join(root,'level_design.js'),'utf8'),sandbox);vm.runInContext(fs.readFileSync(path.join(root,'world_map.js'),'utf8'),sandbox);vm.runInContext(fs.readFileSync(path.join(root,'forest.js'),'utf8'),sandbox);vm.runInContext(fs.readFileSync(path.join(root,'changelog.js'),'utf8'),sandbox);
 return {run:s=>vm.runInContext(s,sandbox),canvas,buttons,storage,emit:(k,e)=>{for(const f of listeners[k]||[])f({preventDefault(){},...e})}};
}
let checks=0;function test(name,fn){fn();checks++;console.log('PASS',name);}
const h=harness({class:'mage',unlocked:3,stars:[3,2,1],xp:87,level:4,custom:'preserved'});
test('v0.2 progress and unknown fields survive loading and saving',()=>{h.run('persist()');const data=JSON.parse(h.storage.get('realm-runners-save-v2'));for(const [k,v] of Object.entries({class:'mage',unlocked:3,xp:87,level:4,custom:'preserved'}))assert.deepEqual(data[k],v);assert.deepEqual(data.stars,[3,2,1,0,0]);assert.equal(data.saveVersion,10);});
test('all levels and classes render; terrain cache bounded',()=>{for(let s=0;s<5;s++)for(const c of ['warrior','hunter','mage']){h.run(`save.class='${c}';start(${s});for(let i=0;i<40;i++)step(1);draw()`);}assert.ok(h.run('terrainCache.size')<=64);});
test('ground collision and jump',()=>{h.run('start(0);for(let i=0;i<60;i++)step(1)');assert.equal(h.run('hero.on'),true);const y=h.run('hero.y');h.run('input.jump=true;step(1)');assert.ok(h.run('hero.y')<y);});
test('coin and star rewards emit particles',()=>{h.run("start(0);things=[{x:hero.x+15,y:hero.y+20,type:'star',taken:false}];step(1)");assert.equal(h.run('hero.stars'),1);assert.equal(h.run('hero.earned'),25);assert.ok(h.run('particles.length')>0);});
test('stomping enemy',()=>{h.run('start(0);hero.x=450;hero.y=394;hero.vy=5;step(1)');assert.equal(h.run('bad[0].alive'),false);assert.ok(h.run('hero.vy')<0);});
test('dash damages either enemy type and starts cooldown',()=>{h.run('start(0);hero.x=425;hero.y=422;input.dash=true;step(1)');assert.ok(h.run('bad[0].hp<bad[0].maxHp'));assert.ok(h.run('dashCooldown')>0);});
test('v0.9.1 damage keeps position, coins, stars and timer while draining one heart',()=>{
 h.run("start(0);things[0].taken=true;for(let i=0;i<30;i++)step(1);hero.x=1700;die(1750)");
 assert.equal(h.run('hero.x'),1672);
 assert.equal(h.run('hero.hearts'),2);
 assert.ok(h.run('currentTime()')>=500);
 assert.equal(h.run('things[0].taken'),true);
 assert.equal(h.run('scene'),'game');
 assert.equal(h.run('invincible'),86);
});
test('v0.9.1 falling resumes from last safe ground, without restarting the level',()=>{
 h.run("start(0);hero.safeX=260;hero.safeY=G-43;hero.x=650;hero.y=700;things[0].taken=true;for(let i=0;i<30;i++)step(1)");
 assert.equal(h.run('hero.hearts'),2);
 assert.ok(Math.abs(h.run('hero.x')-260)<1);
 assert.equal(h.run('things[0].taken'),true);
 assert.ok(h.run('currentTime()')>0);
});
test('completion unlocks level, saves XP and best stars',()=>{h.run('save.unlocked=1;save.level=1;save.xp=90;save.stars=[2,0,0,0,0];start(0);hero.stars=1;hero.earned=25;hero.x=stages[0].exitX-30;hero.y=G-43;step(1);for(let i=0;i<74;i++)step(1)');assert.equal(h.run('scene'),'end');const s=JSON.parse(h.storage.get('realm-runners-save-v2'));assert.equal(s.level,2);assert.equal(s.xp,85);assert.equal(s.unlocked,2);assert.equal(s.stars[0],2);});
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
test('v0.8 local leaderboard records best time per class',()=>{h.run("save.class='mage';start(0);for(let i=0;i<80;i++)step(1);recordTime()");const first=h.run("save.bestTimesV13['1-1'].mage");h.run('start(0);for(let i=0;i<100;i++)step(1);recordTime()');assert.equal(h.run("save.bestTimesV13['1-1'].mage"),first);});
test('v0.4 skills unlock in order and survive persistence',()=>{h.run("save.class='mage';save.level=5;ensureRpgSave()");assert.equal(h.run("unlockSkill('double_fireball')"),false);assert.equal(h.run("unlockSkill('fireball_damage')"),true);assert.ok(JSON.parse(h.storage.get('realm-runners-save-v2')).skills.mage.includes('fireball_damage'));});
test('v0.4 mage projectile damages an enemy',()=>{h.run("save.class='mage';start(0);hero.x=370;hero.y=420;hero.face=1;performAttack();for(let i=0;i<12;i++)combatTick(1)");assert.ok(h.run('bad[0].hp<bad[0].maxHp||!bad[0].alive'));});
test('v0.4 inventory equips class-specific items',()=>{h.run("save.class='mage';save.inventory.push('ember_staff');equipItem('ember_staff')");assert.equal(h.run("save.equipment.mage.weapon"),'ember_staff');assert.equal(h.run("equipItem('swift_bow')"),false);});

// Guard against missing or stale runtime scripts in the published HTML.
test('v0.4 HTML loads RPG systems before forest startup',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const game=html.indexOf('src="game.js?v=0.13.0"');
 const rpg=html.indexOf('src="rpg.js?v=0.13.0"');
 const boss=html.indexOf('src="boss.js?v=0.13.0"');
 const enemies=html.indexOf('src="enemies.js?v=0.13.0"');
 const castleArt=html.indexOf('src="castle_art.js?v=0.13.0"');
 const hd=html.indexOf('src="hd_background.js?v=0.13.0"');
 const layout=html.indexOf('src="level_design.js?v=0.13.0"');
 const worldMap=html.indexOf('src="world_map.js?v=0.13.0"');
 const forest=html.indexOf('src="forest.js?v=0.13.0"');
 const changelog=html.indexOf('src="changelog.js?v=0.13.0"');
 assert.ok(game>=0 && rpg>game && boss>rpg && enemies>boss && castleArt>enemies && hd>castleArt && layout>hd && worldMap>layout && forest>worldMap && changelog>forest,'runtime scripts must load in order');
 assert.ok(html.includes('id="rpgPanels"'));
 assert.ok(html.includes('data-control="attack"'));
 assert.ok(html.includes('LEBENDIGE LAUFWEGE · 0.13.0'));assert.ok(html.includes('id="changelogBtn"'));assert.ok(html.includes('id="changelogOverlay"'));assert.ok(!html.includes('src="platforms.js'));
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
 h.run("save.class='warrior';start(0);hero.x=1102;hero.on=true;input.right=true;step(1)");
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
 assert.ok(geometry.filter(s=>!s.boss).every(s=>s.ledges.length>=4&&s.stars.length===3));
 assert.ok(geometry.find(s=>s.boss).enemies.length===0);
 for(const s of geometry){
  for(const [a,b] of s.gaps)assert.ok(a>150&&b-a<=210&&b<8000);
  for(const x of s.spikes)assert.ok(s.gaps.every(([a,b])=>x+44<a||x>b));
 }
 assert.equal(h.run("typeof checkpoints"),'undefined');
});
test('v0.5 failed runs do not overwrite earned XP or best times',()=>{
 h.run("save.class='mage';save.bestTimes={'1-1':{mage:72851}};save.xp=47;start(0);hero.x=1600;die()");
 assert.equal(h.run('save.xp'),47);
 assert.equal(h.run("save.bestTimes['1-1'].mage"),72851);
 assert.ok(h.run('hero.x')>1500);
 assert.equal(h.run('hero.hearts'),2);
});
test('v0.5 third death shows retry and R key restarts with full hearts',()=>{
 h.run("start(0);die();invincible=0;die();invincible=0;die()");
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
 assert.ok(h.run("save.bestTimesV13['1-1'].mage")>0);
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
 assert.equal(old.run("stages[3].name.includes('Königstraße')"),true);
 assert.equal(old.run("stages[4].boss"),true);
 old.run('save.unlocked=5;persist()');
 const again=harness(JSON.parse(old.storage.get('realm-runners-save-v2')));
 assert.equal(again.run('save.unlocked'),5);
});
test('v0.6 fifth level cannot finish until the Slime King is defeated',()=>{
 h.run("start(4);hero.x=WIDTH-55;step(1)");
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
 assert.ok(saved.bestTimesBossV11['1-5'].mage>0);
});
test('v0.6 Slime King red health bar tracks damage and boss resets on death',()=>{
 h.run("start(4);hero.x=265;step(1)");
 assert.equal(h.run('boss.engaged'),true);
 h.run('damageBoss(4)');
 assert.equal(h.run('boss.hp'),52);
 assert.equal(h.run("document.querySelector('#bossHealthFill').style.width"),String(52/56*100)+'%');
 assert.equal(h.run("document.querySelector('#bossHealthTrack').attrs['aria-valuenow']"),'52');
 h.run('die()');
 assert.equal(h.run('hero.hearts'),2);
 assert.equal(h.run('boss.hp'),52,'boss HP must persist through a player hit');
 assert.equal(h.run('boss.engaged'),true,'boss fight continues');
 assert.equal(h.run('invincible'),86);
});
test('v0.6 three classes can use their regular weapons against the boss',()=>{
 for(const kind of ['warrior','hunter','mage']){
  h.run(`save.class='${kind}';start(4);boss.engaged=true;hero.face=1;hero.y=G-43;hero.x=boss.x-${kind==='warrior'?65:175};performAttack();for(let k=0;k<30;k++)combatTick(1)`);
  assert.ok(h.run('boss.hp')<56,`${kind} must damage the boss`);
 }
});
test('v0.6 Slime King telegraphs and lands a shockwave stomp',()=>{
 h.run("start(4);boss.engaged=true;boss.phase='warn';boss.timer=1;hero.x=295;hero.y=140;hero.on=false;bossTick(1,hero.y)");
 assert.equal(h.run('boss.phase'),'leap');
 for(let i=0;i<45;i++)h.run('bossTick(1,hero.y)');
 assert.equal(h.run('boss.slamCount'),1);
 assert.ok(h.run('bossWaves.length')>0);
 assert.equal(h.run('boss.phase'),'recover');
});
test('v0.6 ground shockwave harms nonjumping hero while jump avoids it',()=>{
 h.run("start(4);boss.engaged=true;hero.x=270;hero.y=422;bossWaves=[{x:hero.x+hero.w/2-6,dir:1,ttl:30}]");
 h.run('bossTick(1,hero.y)');
 assert.equal(h.run('hero.hearts'),2);
 assert.ok(Math.abs(h.run('hero.x')-270)<=28,'boss hit knocks player locally instead of restarting');
 h.run("start(4);boss.engaged=true;hero.x=270;hero.y=315;hero.on=false;bossWaves=[{x:hero.x+hero.w/2-6,dir:1,ttl:30}]");
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
 assert.equal(h.run('hero.x'),245);
 assert.equal(h.run('stages[4].gaps.length'),0);
 assert.equal(h.run('bad.length'),0);
 assert.equal(h.run('spikes.length'),0);
 assert.equal(h.run('things.length'),0);
 assert.equal(h.run('typeof movingPlatforms'),'undefined');
 assert.equal(h.run('cam'),0,'one-screen boss room never scrolls');
 h.run('for(let k=0;k<30;k++)step(1);draw()');
 assert.equal(h.run('scene'),'game');
 assert.equal(h.run('boss.engaged'),true);
});
test('v0.9.1 all adventure stages use static platforms only',()=>{
 for(let stageIndex=0;stageIndex<5;stageIndex++){
  h.run(`start(${stageIndex})`);
  assert.equal(h.run('typeof activePlatforms'),'undefined');
  assert.equal(h.run('typeof platformTick'),'undefined');
  assert.equal(h.run('typeof drawDynamicPlatforms'),'undefined');
  assert.equal(h.run('typeof stages[stage].moving'),'undefined');
  assert.equal(h.run('typeof stages[stage].crumbling'),'undefined');
  assert.ok(h.run('solids().every(p=>!p.kind)'));
 }
});
test('v0.6.1 static early stages and physics are preserved',()=>{
 h.run('start(0)');
 assert.equal(h.run('typeof movingPlatforms'),'undefined');
 assert.equal(h.run('JUMP.holdFrames'),14);
 assert.equal(h.run('JUMP.holdGravity'),.5);
 const y=h.run('hero.y');h.run('input.jump=true;step(1)');
 assert.ok(h.run('hero.y')<y);
});
test('v0.6.1 original HD-pixel castle exterior and throne interior render',()=>{
 for(const stageIndex of [3,4]){
  h.run(`start(${stageIndex});cam=stage===BOSS_LEVEL?0:WIDTH-W;draw()`);
  const pixel=h.canvas.getContext('2d').getImageData(300,155,1,1).data;
  assert.equal(pixel[3],255);
 }
 assert.equal(h.run("typeof drawCastleApproach"),'function');
 assert.equal(h.run("typeof drawCastleInterior"),'function');
 assert.equal(h.run("typeof drawCastleThrone"),'function');
});

test('v0.6.2 auto-win triggers after a short animation without visiting level exit',()=>{
 h.run("start(4);hero.x=410;boss.engaged=true;boss.hp=1;boss.hurt=0;damageBoss(1)");
 assert.equal(h.run('scene'),'game');
 assert.equal(h.run('boss.defeatTimer'),42);
 assert.equal(h.run("document.querySelector('#bossHealthFill').style.width"),'0%');
 assert.equal(h.run("document.querySelector('#bossState').textContent"),'SCHLEIMKÖNIG BESIEGT!');
 assert.equal(h.run('bossGoo.length+bossWaves.length'),0);
 h.run('step(1)');
 assert.equal(h.run('hero.x'),410,'player controls freeze during victory');
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
 assert.ok(h.run("save.bestTimesBossV11['1-5'].mage")>0);
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

test('v0.10 all levels randomly mix only slimes and mushrooms, boss stays solo',()=>{
 for(let level=0;level<4;level++){
  h.run(`start(${level})`);
  let list=h.run('bad.map(e=>e.type)');
  assert.ok(list.length>=7);
  assert.deepEqual([...new Set(list)].sort(),['mushroom','slime']);
  assert.ok(list.every(t=>['mushroom','slime'].includes(t)));
  assert.ok(h.run('bad.every(e=>e.x<stages[stage].exitX-175)'),'door area stays clear');
  const first=JSON.stringify(list);
  h.run(`start(${level})`);
  list=h.run('bad.map(e=>e.type)');
  assert.notEqual(JSON.stringify(list),first,'reroll guarantees different layout of types');
 }
 h.run('start(4)');assert.equal(h.run('bad.length'),0);
});
test('v0.10 mushroom telegraph fires a directed spore and is dodgeable',()=>{
 h.run("start(0);hero.x=bad.find(e=>e.type==='mushroom').x-85;hero.y=G-43;bad.find(e=>e.type==='mushroom').attackCooldown=0;enemyTick(1)");
 assert.equal(h.run("bad.find(e=>e.type==='mushroom').phase"),'windup');
 h.run('for(let i=0;i<33;i++)enemyTick(1)');
 assert.equal(h.run('enemyShots.length'),1);
 assert.ok(h.run('enemyShots[0].vx')<0);
 assert.ok(h.run('Math.hypot(enemyShots[0].vx,enemyShots[0].vy)')<3.5);
});
test('v0.10 original stomp and dash defeat randomized enemies fairly',()=>{
 h.run("start(0);hero.x=bad[0].x+1;hero.y=bad[0].y-hero.h-4;hero.vy=7;hero.dash=0");
 const p=h.run('hero.y');h.run('hero.y+=7;enemyHazardsHitHero('+p+')');
 assert.equal(h.run('bad[0].alive'),false);
 assert.ok(h.run('hero.vy')<0);
 h.run("start(0);const m=bad.find(e=>e.type==='mushroom');hero.x=m.x+2;hero.y=m.y;hero.dash=4;enemyHazardsHitHero(hero.y)");
 assert.ok(h.run("bad.some(e=>e.type==='mushroom'&&e.hp===1)"));
 assert.equal(h.run('hero.hearts'),3);
});
test('v0.10 all class weapons hit only active enemy types',()=>{
 for(const kind of ['warrior','hunter','mage']){
  h.run(`save.class='${kind}';start(0);hero.face=1;hero.x=bad[0].x-${kind==='warrior'?48:90};hero.y=G-43;performAttack();for(let i=0;i<20;i++)combatTick(1)`);
  assert.ok(h.run('bad[0].hp<bad[0].maxHp||!bad[0].alive'),kind+' hits either species');
 }
});
test('v0.10 spore impacts spend only one heart and dash clears them',()=>{
 h.run("start(0);hero.x=150;hero.y=G-43;hero.dash=0;enemyShots=[{x:165,y:G-20,vx:0,vy:0,radius:9,life:20}]");
 assert.equal(h.run('enemyHazardsHitHero(hero.y)'),true);assert.equal(h.run('hero.hearts'),2);
 assert.equal(h.run('enemyShots.length'),0);
 h.run("start(0);hero.x=150;hero.y=G-43;hero.dash=5;enemyShots=[{x:165,y:G-20,vx:0,vy:0,radius:9,life:20}]");
 assert.equal(h.run('enemyHazardsHitHero(hero.y)'),false);assert.equal(h.run('enemyShots.length'),0);
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
 assert.ok(h.run("save.bestTimesV13['1-1'].mage")>0);
 assert.equal(h.run('save.level'),6);
 assert.equal(h.run('save.skills.mage.includes(\'fireball_damage\')'),true);
});

test('v0.10 distinct curated level geometry and themed exit animation',()=>{
 const cfg=h.run('stages.map(s=>({width:s.width,gaps:s.gaps,ledges:s.ledges,enemies:s.enemies,spikes:s.spikes,stars:s.stars,exitX:s.exitX,motif:s.motif}))');
 assert.deepEqual([...cfg.slice(0,4).map(s=>s.width)],[7380,7740,7920,8100]);
 assert.deepEqual([...cfg.slice(0,4).map(s=>s.gaps.length)],[5,7,7,6]);
 assert.equal(new Set(cfg.slice(0,4).map(s=>s.motif)).size,4);
 assert.equal(new Set(cfg.slice(0,4).map(s=>JSON.stringify(s.ledges))).size,4);
 for(let i=0;i<4;i++){
  assert.ok(cfg[i].stars.length===3&&cfg[i].enemies.length>=9);
  assert.ok(cfg[i].gaps.every(([a,b])=>b-a<=200&&b<cfg[i].width-250));
  assert.ok(cfg[i].spikes.every(x=>cfg[i].gaps.every(([a,b])=>x+44<a||x>b)));
  h.run(`start(${i})`);
  assert.equal(h.run('WIDTH'),cfg[i].width);
  assert.ok(h.run('things.filter(a=>a.type===\'coin\').length')>=9);
  h.run('bad=[];spikes=[];hero.x=WIDTH-75;hero.y=G-43;step(1)');
  assert.equal(h.run('scene'),'game','invisible edge may not end level');
  h.run('hero.x=stages[stage].exitX-30;hero.y=G-43;hero.on=true;hero.vy=0;step(1)');
  assert.equal(h.run('exitActive'),true);
  assert.equal(h.run('scene'),'game');
  h.run('for(let frame=0;frame<73;frame++)step(1)');
  assert.equal(h.run('scene'),'game');
  h.run('step(1)');
  assert.equal(h.run('scene'),'end','short exit animation completes level');
 }
 h.run('start(4)');assert.equal(h.run('WIDTH'),h.run('W'),'boss room occupies one viewport');
 assert.equal(h.run('bad.length'),0);
});
test('v0.9 arena boss uses three explicit attacks with player-facing telegraphs',()=>{
 h.run("start(4);hero.x=305;hero.y=140;hero.on=false;boss.engaged=true;boss.attackIndex=0;boss.phase='patrol';boss.timer=1");
 h.run('bossTick(1,hero.y)');
 assert.equal(h.run('boss.phase'),'warn');
 assert.equal(h.run('boss.targetX')>=h.run('BOSS_ARENA_LEFT'),true);
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
 h.run("save.class='mage';start(4);hero.x=245;hero.y=G-43;boss.engaged=true;boss.phase='patrol';boss.timer=100");
 const x=h.run('boss.x');
 h.run('for(let i=0;i<24;i++)bossTick(1,hero.y)');
 assert.ok(x-h.run('boss.x')>55,'boss must close on ranged attacker');
 assert.equal(h.run('BOSS_HP'),56);
});
test('v0.9 phase two transforms at half health with brief protected telegraph',()=>{
 h.run("start(4);boss.engaged=true;hero.x=285;hero.y=130;boss.hp=29;boss.hurt=0;bossGoo=[{x:290,y:240,vx:0,vy:0,r:10,ttl:50}]");
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
 h.run("start(4);boss.engaged=true;hero.x=285;hero.y=G-43;boss.phase='warn';boss.timer=16");
 h.run('for(let i=0;i<12;i++)bossTick(1,hero.y)');
 assert.equal(h.run('hero.hearts'),3,'red warning cannot deal damage before attack');
 h.run("boss.phase='chargeWarn';boss.timer=20;boss.chargeDir=-1;boss.x=525;hero.x=330;hero.y=310;hero.on=false");
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
 assert.ok(h.run("save.bestTimesV13['1-1'].hunter")>0);
 h.run("start(4);for(let i=0;i<10;i++)step(1);boss.engaged=true;boss.hurt=0;boss.hp=1;damageBoss(1);for(let i=0;i<42;i++)step(1)");
 assert.equal(h.run('scene'),'end');
 assert.ok(h.run("save.bestTimesBossV11['1-5'].hunter")>0);
 assert.equal(h.run("save.bestTimesBossV062['1-5'].hunter"),48000);
 assert.equal(h.run('save.saveVersion'),10);
});

test('v0.10 world overview and level selection show records for active class',()=>{
 h.run("menuView='worlds';menu();save.unlocked=3;save.class='mage';save.bestTimesV13['1-1']={mage:92000,hunter:87000};menu()");
 assert.equal(h.run('scene'),'menu');
 assert.ok(h.run("document.querySelector('#worlds').innerHTML").includes('Smaragdwald'));
 assert.ok(h.run("document.querySelector('#worlds').innerHTML").includes('Frostgipfel'));
 assert.ok(h.run("document.querySelector('#worlds').innerHTML").includes('GESPERRT'));
 h.run("menuView='levels';menu()");
 const markup=h.run("document.querySelector('#levels').innerHTML");
 assert.ok(markup.includes('Sonnenpfad'));
 assert.ok(markup.includes('Baumkronen'));
 assert.ok(markup.includes('Moosruinen'));
 assert.ok(markup.includes('Königstraße'));
 assert.ok(markup.includes('Schleimkönig'));
 assert.ok(markup.includes('01:32.00'),'best mage time is printed on its level card');
 assert.equal(h.run('worldBestTime(0)'),92000);
 assert.equal(h.run("document.querySelector('#worldMapInfo').innerHTML").includes('01:32.00'),true);
 assert.equal((markup.match(/<button data-level=/g)||[]).length,5);
 assert.equal((markup.match(/ disabled/g)||[]).length,2);
 h.run("save.class='hunter';menu()");
 assert.equal(h.run('worldBestTime(0)'),87000);
 assert.ok(h.run("document.querySelector('#levels').innerHTML").includes('01:27.00'));
 h.run("save.unlocked=5;menuView='worlds';menu()");
});
test('v0.10 pixel star is a distinct crisp sprite on map and in HUD',()=>{
 h.run("start(0);things=[{x:hero.x+15,y:hero.y+20,type:'star',taken:false}];step(1);draw()");
 assert.equal(h.run('hero.stars'),1);
 assert.ok(h.run("document.querySelector('#hudLeft').innerHTML").includes('viewBox="0 0 24 24"'));
 assert.ok(h.run("document.querySelector('#hudLeft').innerHTML").includes('star-counter'));
 assert.equal(h.run('typeof drawWorldStar'),'function');
 assert.equal(h.run('typeof drawLevelExit'),'function');
});
test('v0.10 each level exit refuses passing from far away or while airborne',()=>{
 for(let i=0;i<4;i++){
  h.run(`start(${i});hero.x=WIDTH-55;hero.y=G-43;hero.on=true;step(1)`);
  assert.equal(h.run('exitActive'),false,'right boundary no longer wins');
  assert.equal(h.run('scene'),'game');
  h.run("hero.x=stages[stage].exitX-30;hero.y=G-90;hero.on=false");
  assert.equal(h.run('tryEnterLevelExit()'),false,'no airborne exit activation');
 }
});
test('v0.9.1 heart HUD uses three clear pixel icons and updates immediately',()=>{
 h.run('start(0)');
 assert.ok(h.run("document.querySelector('#hudLeft').innerHTML").includes('heart-row'));
 assert.equal((h.run("document.querySelector('#hudLeft').innerHTML").match(/class="hud-heart/g)||[]).length,3);
 h.run('die()');
 assert.equal(h.run('hero.hearts'),2);
 assert.equal((h.run("document.querySelector('#hudLeft').innerHTML").match(/hud-heart empty/g)||[]).length,1);
 assert.equal(h.run("document.querySelector('#hudLeft').attrs['aria-label']").includes('2 von 3 Herzen'),true);
 assert.equal(h.run('scene'),'game');
 assert.equal(h.run('invincible'),h.run('DAMAGE_INVULNERABLE_FRAMES'));
});
test('v0.9.1 blinking grants consistent grace period and no reset of enemy progress',()=>{
 h.run("start(0);for(let i=0;i<25;i++)step(1);bad[0].hp=1;things[0].taken=true;hero.x=500;die(480)");
 const after=h.run('hero.x'),timer=h.run('currentTime()');
 assert.equal(h.run('hero.hearts'),2);
 assert.equal(h.run('die()'),false);
 assert.equal(h.run('hero.hearts'),2,'repeated damage must not drain hearts immediately');
 assert.equal(h.run('bad[0].hp'),1,'injured enemies remain injured');
 assert.equal(h.run('things[0].taken'),true,'coins are not reset');
 assert.equal(h.run('currentTime()'),timer,'damage does not alter the run timer');
 assert.ok(Math.abs(after-500)<=28);
 h.run('invincible=0;die()');
 assert.equal(h.run('hero.hearts'),1);
 assert.equal(h.run('scene'),'game');
 h.run('invincible=0;die()');
 assert.equal(h.run('scene'),'end','only the third heart loss ends the level');
});
test('v0.9.1 falling during blink immunity preserves hearts and rescues to stable ledge',()=>{
 h.run("start(0);hero.safeX=240;hero.safeY=G-43;hero.x=590;hero.y=720;invincible=50");
 const hearts=h.run('hero.hearts');
 h.run('step(1)');
 assert.equal(h.run('hero.hearts'),hearts);
 assert.equal(h.run('hero.x'),240);
 assert.equal(h.run('hero.y'),h.run('G-53'));
 assert.equal(h.run('scene'),'game');
});
test('v0.9.1 coin collection adds true gold, uses one-time pickups and survives reload',()=>{
 h.run("start(0);hero.x=65;hero.y=G-43;things=[{x:hero.x+15,y:hero.y+20,type:'coin',taken:false}]");
 const gold=h.run('save.gold');
 h.run('step(1)');
 assert.equal(h.run('hero.coins'),1);
 assert.equal(h.run('hero.earned'),5);
 assert.equal(h.run('save.gold'),gold+1);
 assert.ok(h.run("document.querySelector('#hudLeft').innerHTML").includes('coin-counter'));
 h.run('for(let i=0;i<20;i++)step(1)');
 assert.equal(h.run('save.gold'),gold+1,'coin cannot be picked up twice');
 assert.equal(JSON.parse(h.storage.get('realm-runners-save-v2')).gold,gold+1);
 const loaded=harness(JSON.parse(h.storage.get('realm-runners-save-v2')));
 assert.equal(loaded.run('save.gold'),gold+1);
});
test('v0.13 ground hazards replaced by natural landforms; moving platforms stay disabled',()=>{
 const geom=h.run('stages.map(s=>({width:s.width,gaps:s.gaps,spikes:s.spikes,moving:s.moving,crumbling:s.crumbling}))');
 for(let i=0;i<4;i++){
  assert.equal(geom[i].spikes.length,0);
  assert.ok(geom[i].spikes.every(x=>geom[i].gaps.every(([a,b])=>x+44<a||x>b)));
  assert.equal(geom[i].moving,undefined);
  assert.equal(geom[i].crumbling,undefined);
 }
});

test('v0.10.1 every large background set piece has solid terrain under its feet',()=>{
 const sceneAnchors=h.run('SCENERY_ANCHORS');
 const check=(i,x,w,label)=>assert.equal(h.run('hasSceneryFoundation('+x+','+w+','+i+')'),true,
  'floating '+label+' in stage '+(i+1)+' at '+x);
 for(const x of sceneAnchors.grove.trees)check(0,x+36,28,'tree trunk');
 for(const x of sceneAnchors.grove.logs)check(0,x,78,'fallen log');
 for(const x of sceneAnchors.canopy.trees)check(1,x+24,44,'canopy trunk and connected vines');
 for(const x of sceneAnchors.ruins.arches){
  check(2,x,24,'left ruin pillar');
  check(2,x+141,25,'right ruin pillar');
 }
 for(const x of sceneAnchors.castle.towers)check(3,x,125,'castle wall/tower');
 for(const [x,w] of [[6940,135],[7330,145],[7700,130],[7900,135]])
  check(3,x,w,'distant castle approach tower');
 assert.equal(h.run('hasSceneryFoundation(1695,25,2)'),false,'gap cannot support a pillar');
 assert.equal(h.run('hasSceneryFoundation(3470,135,3)'),false,'old hovering castle tower must fail');
 for(let i=0;i<4;i++)h.run('start('+i+');draw()');
});
test('v0.10.1 authored coins are scarce, safe and never hover above a gap',()=>{
 const counts=[15,16,15,16];
 for(let i=0;i<4;i++){
  h.run('start('+i+')');
  const state=h.run('({coins:things.filter(a=>a.type===\'coin\'),gaps:stages[stage].gaps,spikes,exitX:stages[stage].exitX,spots:stages[stage].coinSpots})');
  assert.equal(state.coins.length,counts[i],'sparse curated coin count in '+(i+1));
  assert.equal(state.spots.length,counts[i]);
  const xs=state.coins.map(a=>a.x);
  assert.equal(new Set(xs).size,xs.length);
  for(const coin of state.coins){
   assert.ok(coin.x<state.exitX-110,'no pickup obscures exit');
   assert.ok(h.run('hasSceneryFoundation('+(coin.x-22)+',44,'+i+')'),'coin has solid ground support');
   assert.ok(state.spikes.every(p=>coin.x<p.x-58||coin.x>p.x+p.w+58),'coin stays away from spikes');
  }
 }
 h.run('start(4)');assert.equal(h.run("things.filter(x=>x.type==='coin').length"),0);
});
test('v0.11 stages extend ~80 percent with ground-first Mario/Sonic-style routing',()=>{
 const cfg=h.run('stages.slice(0,4).map(s=>({width:s.width,exitX:s.exitX,gaps:s.gaps,ledges:s.ledges,spikes:s.spikes,enemies:s.enemies,stars:s.stars,coins:s.coinSpots}))');
 assert.deepEqual([...cfg.map(s=>s.width)],[7380,7740,7920,8100]);
 assert.deepEqual([...cfg.map(s=>s.ledges.length)],[4,5,15,12]);
 const older=[4100,4300,4400,4500];
 for(let i=0;i<4;i++){
  const c=cfg[i];
  assert.ok(Math.abs(c.width/older[i]-1.8)<.005,'level grows approximately 80 percent');
  const totalGap=c.gaps.reduce((n,[a,b])=>n+b-a,0);
  assert.ok(totalGap<c.width*.17,'walking ground dominates the level');
  assert.ok(c.gaps.length>=5&&c.gaps.length<=7);
  assert.ok(c.gaps.every(([a,b])=>b-a<=185&&b<c.exitX-500),'no huge/late pits');
  assert.ok(c.ledges.every(([x,y,w])=>
   y<=425&&y>=300&&x+w<c.exitX-650&&
   h.run('hasSceneryFoundation('+(x+16)+',12,'+i+')')&&
   h.run('hasSceneryFoundation('+(x+w-30)+',14,'+i+')')),
   'all elevated routes are meaningful, rooted and far from exits');
  assert.ok(c.spikes.every(x=>x<c.exitX-500));
  assert.ok(c.enemies.every(x=>x<c.exitX-475));
  assert.ok(c.stars.length===3,'3 stars remain in each adventure');
  assert.equal(c.coins.length,[15,16,15,16][i],'coins remain relatively sparse');
 }
});
test('v0.11 every mandatory ground gap is jumpable without Dash in all three classes',()=>{
 const gaps=h.run('stages.slice(0,4).map(s=>s.gaps)');
 for(const kind of ['warrior','hunter','mage'])for(let level=0;level<4;level++){
  for(const [from,to] of gaps[level]){
   h.run(`save.class='${kind}';start(${level});bad=[];spikes=[];things=[];
    hero.x=${from-23};hero.y=G-hero.h;hero.vy=0;hero.on=true;
    input.right=true;input.jump=true;
    for(let frame=0;frame<90;frame++){if(frame===31)input.jump=false;step(1);}
    input.right=false;input.jump=false;`);
   const state=h.run('({x:hero.x,y:hero.y,on:hero.on,hearts:hero.hearts,scene})');
   assert.equal(state.scene,'game',kind+' stage '+level+' gap '+from+'..'+to);
   assert.equal(state.hearts,3,kind+' fell into the gap at '+from+'..'+to);
   assert.ok(state.x>to+28,kind+' did not cross gap '+from+'..'+to);
   assert.ok(state.on&&h.run('solids().some(p=>hero.x+hero.w>p.x&&hero.x<p.x+p.w&&Math.abs(hero.y+hero.h-surfaceY(p,hero.x+hero.w/2))<3)'),
    kind+' did not safely land beyond '+from+'..'+to+' at '+JSON.stringify(state));
  }
 }
});
test('v0.11 the boss occupies the entire visible viewport, not a hidden sub-arena',()=>{
 h.run('start(4)');
 assert.equal(h.run('WIDTH'),h.run('W'));
 assert.equal(h.run('cam'),0);
 assert.equal(h.run('hero.x'),245);
 assert.equal(h.run('boss.x'),650);
 assert.equal(h.run('boss.engaged'),true,'boss fight active on room entry');
 assert.equal(h.run('stages[4].gaps.length'),0);
 assert.ok(h.run('BOSS_ARENA_LEFT')<24&&h.run('BOSS_ARENA_RIGHT')>930);
 assert.ok(h.run('Math.abs((hero.x+hero.w/2+boss.x+boss.w/2)/2-W/2)')<80);
 h.run("boss.phase='phaseShift';boss.timer=600;hero.x=BOSS_ARENA_RIGHT-hero.w-20;input.right=true;for(let i=0;i<15;i++)step(1);input.right=false");
 assert.equal(h.run('hero.x'),h.run('BOSS_ARENA_RIGHT-hero.w-4'),'right boundary at visible wall');
 assert.equal(h.run('cam'),0);
 h.run('hero.x=BOSS_ARENA_LEFT+20;input.left=true;for(let i=0;i<15;i++)step(1);input.left=false');
 assert.equal(h.run('hero.x'),h.run('BOSS_ARENA_LEFT+3'),'left boundary at visible wall');
 assert.equal(h.run('cam'),0);
 h.run('draw()');
 const pixels=h.run("(()=>{const c=pixelCanvas.getContext('2d');return [c.getImageData(6,225,1,1).data[3],c.getImageData(713,225,1,1).data[3]]})()");
 assert.ok(pixels.every(a=>a>0),'both visible room boundaries are drawn');
});
test('v0.11 fresh longer-course and arena records preserve all old personal bests',()=>{
 h.run("save.class='hunter';save.bestTimesV10={'1-1':{hunter:90000}};save.bestTimesBossV09={'1-5':{hunter:52000}};start(0);for(let i=0;i<35;i++)step(1);recordTime()");
 assert.equal(h.run("save.bestTimesV10['1-1'].hunter"),90000);
 assert.ok(h.run("save.bestTimesV13['1-1'].hunter")>0);
 h.run("start(4);for(let i=0;i<8;i++)step(1);boss.hurt=0;boss.hp=1;damageBoss(1);for(let i=0;i<BOSS_VICTORY_FRAMES;i++)step(1)");
 assert.equal(h.run('scene'),'end');
 assert.equal(h.run("save.bestTimesBossV09['1-5'].hunter"),52000);
 assert.ok(h.run("save.bestTimesBossV11['1-5'].hunter")>0);
 assert.equal(h.run('save.saveVersion'),10);
});
test('v0.10.1 release notes are restricted to the real main world menu',()=>{
 const all=h.run('RELEASE_NOTES.map(note=>note.v)');
 assert.deepEqual([...all],['0.13.0','0.12.0','0.11.0','0.10.1','0.10.0','0.9.1','0.9.0','0.8.0','0.7.0','0.6.2','0.6.1','0.6.0','0.5.0','0.4.0','0.1–0.3']);
 assert.ok(h.run("document.querySelector('#changelogEntries').innerHTML").includes('Phase II'));
 h.run("menuView='worlds';menu()");
 assert.equal(h.run("document.querySelector('#changelogBtn').classes.has('hide')"),false);
 assert.equal(h.run("document.querySelector('#changelogBtn').attrs['aria-hidden']"),'false');
 h.run("document.querySelector('#changelogBtn').dispatch('click',{})");
 assert.equal(h.run('scene'),'menu','opening patch notes from main menu never pauses a running game');
 assert.equal(h.run("document.querySelector('#changelogOverlay').classes.has('hide')"),false);
 h.run("document.querySelector('#changelogClose').dispatch('click',{})");
 assert.equal(h.run("document.querySelector('#changelogOverlay').classes.has('hide')"),true);
 h.run("menuView='levels';menu()");
 assert.equal(h.run("document.querySelector('#changelogBtn').classes.has('hide')"),true);
 h.run("document.querySelector('#changelogBtn').dispatch('click',{})");
 assert.equal(h.run("document.querySelector('#changelogOverlay').classes.has('hide')"),true);
 h.run("start(0)");
 assert.equal(h.run("document.querySelector('#changelogBtn').classes.has('hide')"),true);
 h.run("document.querySelector('#changelogBtn').dispatch('click',{})");
 assert.equal(h.run('scene'),'game','hidden updates never pause an active level');
 h.run('pause()');
 assert.equal(h.run("document.querySelector('#changelogBtn').classes.has('hide')"),true);
 h.run("menuView='worlds';menu()");
 assert.equal(h.run("document.querySelector('#changelogBtn').classes.has('hide')"),false);
});

test('v0.13 land contours are continuous, shallow and level at every gap and exit',()=>{
 for(let i=0;i<4;i++){
  h.run(`start(${i})`);
  const profile=h.run('stages[stage].profile');
  assert.ok(new Set(profile.map(k=>k[1])).size>=3);
  for(let j=1;j<profile.length;j++)assert.ok(Math.abs((profile[j][1]-profile[j-1][1])/(profile[j][0]-profile[j-1][0]))<=.4);
  assert.ok(h.run('stages[stage].gaps.every(([a,b])=>courseGroundY(a)===G&&courseGroundY(b)===G)'));
  assert.equal(h.run('courseGroundY(stages[stage].exitX)'),465);
 }
});
test('v0.13 every adventure can be traversed with the original jumps and all classes',()=>{
 const route=harness();
 for(let i=0;i<4;i++)for(const kind of ['warrior','hunter','mage']){
  const result=route.run(`(()=>{
   save.class='${kind}';save.equipment[save.class]={};start(${i});bad=[];things=[];
   let held=0,maxX=hero.x;
   for(let f=0;f<3000&&scene==='game';f++){
    const foot=hero.y+hero.h;
    const gap=stages[stage].gaps.some(([a,b])=>hero.x+hero.w<=a+8&&a-hero.x-hero.w<12);
    const wall=courseLedges().some(p=>p.volume&&p.y<foot-5&&p.x>=hero.x+hero.w-1&&p.x-hero.x-hero.w<38);
    if(hero.on&&(gap||wall)&&!input.jump)held=27;
    input.right=true;input.jump=held>0;if(held>0)held--;
    step(1);maxX=Math.max(maxX,hero.x);
   }
   return {scene,hearts:hero.hearts,x:hero.x,maxX,exit:stages[stage].exitX};
  })()`);
  assert.equal(result.hearts,3,kind+' fell in '+i+': '+JSON.stringify(result));
  assert.equal(result.scene,'end',kind+' cannot finish '+i+': '+JSON.stringify(result));
 }
});
test('v0.13 grounded banks block sideways movement; no invisible pass-through',()=>{
 h.run("save.class='warrior';start(0);bad=[];things=[];hero.x=1340;hero.y=G-43;input.right=true;for(let i=0;i<35;i++)step(1)");
 assert.equal(h.run('hero.x'),1360);
 h.run('input.jump=true;for(let i=0;i<35;i++)step(1)');
 assert.ok(h.run('hero.x')>1460);assert.equal(h.run('hero.hearts'),3);
});
test('v0.13 enemies and coins track relief, historic v11 and boss records survive',()=>{
 for(let i=0;i<4;i++){
  h.run(`start(${i});for(let f=0;f<240;f++)enemyTick(1)`);
  assert.ok(h.run('bad.every(e=>hasSceneryFoundation(e.x,e.w)&&Math.abs(e.y+e.h-courseGroundY(e.x+e.w/2))<.001)'));
  assert.ok(h.run("things.filter(a=>a.type==='coin').every(a=>courseTopY(a.x)-a.y>=40&&courseTopY(a.x)-a.y<=66)"));
 }
 h.run("save.class='mage';save.bestTimesV11={'1-1':{mage:123456}};save.bestTimesV12={'1-1':{mage:112233}};save.bestTimesBossV11={'1-5':{mage:65432}};start(0);runFrames=900;recordTime()");
 assert.equal(h.run("save.bestTimesV11['1-1'].mage"),123456);assert.equal(h.run("save.bestTimesV12['1-1'].mage"),112233);
 assert.equal(h.run("save.bestTimesBossV11['1-5'].mage"),65432);
 assert.ok(h.run("save.bestTimesV13['1-1'].mage")>0);
});
test('v0.13 walking up and down hill seams keeps exact ground contact',()=>{
 h.run("save.class='hunter';save.equipment.hunter={};start(0);bad=[];things=[];hero.x=530;hero.y=courseGroundY(545)-hero.h;input.right=true");
 for(let i=0;i<90;i++){
  h.run('step(1)');
  assert.equal(h.run('hero.on'),true);
  assert.ok(h.run('Math.abs(hero.y+hero.h-courseGroundY(hero.x+15))')<.01);
 }
});
test('v0.13 pause cancels a buffered touch jump instead of replaying it on resume',()=>{
 h.run('start(0);hero.jumpBuffer=7;pause();resume();step(1)');
 assert.equal(h.run('hero.jumpBuffer'),0);assert.equal(h.run('hero.on'),true);
});
test('v0.13 changing biomes immediately releases old terrain and HD canvas memory',()=>{
 h.run('start(0);draw();globalThis.oldGround=[...courseGroundCache.values()][0].c;globalThis.oldHD=hdCachedPlanes[0];start(1);draw()');
 assert.equal(h.run('oldGround.width'),1);assert.equal(h.run('oldHD.width'),1);
 assert.ok(h.run('courseGroundCache.size')<20);assert.equal(h.run('hdCachedPlanes.length'),2);
});
// Export representative v0.13 scenes for visual review with the actual rasterizer.
for(const [level,x,label] of [[0,530,'hills'],[0,1350,'roots'],[1,1110,'branches'],[2,1050,'stairs'],[3,1460,'causeway']]){
 h.run(`start(${level});hero.x=${x};hero.y=courseGroundY(hero.x+15)-43;cam=Math.max(0,hero.x-250);quality='full';draw()`);
 fs.writeFileSync(path.join(root,'test-output',`v013-${label}.png`),h.canvas.toBuffer('image/png'));
}
console.log(`${checks} total regression checks passed.`);
