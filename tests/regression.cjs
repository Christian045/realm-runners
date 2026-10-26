// Run: NODE_PATH=<directory containing @napi-rs/canvas> node tests/regression.cjs
// Headless JS + real Canvas rasterization. Not a substitute for Safari device tests.
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {createCanvas}=require('@napi-rs/canvas');
const root=path.resolve(__dirname,'..');
function harness(initial){const elements=new Map(),listeners={},storage=new Map(initial?[['realm-runners-save-v2',JSON.stringify(initial)]]:[]);let raf;
 class El {constructor(){this.dataset={};this.listeners={};this.classList={add(){},remove(){},toggle(){}};}addEventListener(k,f){(this.listeners[k]??=[]).push(f)}setPointerCapture(){}querySelectorAll(){return [];}dispatch(type,data){for(const f of this.listeners[type]||[])f({preventDefault(){},...data});}}
 const canvas=createCanvas(960,540);elements.set('#view',canvas);const buttons=['left','right','jump','dash','attack'].map(k=>{let el=new El();el.dataset.control=k;return el});
 const sandbox={console,Math,JSON,Number,Map,Set,Object,Array,devicePixelRatio:1,innerWidth:960,innerHeight:540,performance:{now:()=>1000},matchMedia:()=>({matches:false}),localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},addEventListener:(k,f)=>(listeners[k]??=[]).push(f),requestAnimationFrame:f=>raf=f,document:{hidden:false,querySelector:s=>{if(!elements.has(s))elements.set(s,new El());return elements.get(s)},querySelectorAll:()=>buttons,addEventListener:(k,f)=>(listeners[k]??=[]).push(f),createElement:tag=>tag==='canvas'?createCanvas(1,1):new El()}};
 vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(root,'game.js'),'utf8'),sandbox);vm.runInContext(fs.readFileSync(path.join(root,'rpg.js'),'utf8'),sandbox);vm.runInContext(fs.readFileSync(path.join(root,'forest.js'),'utf8'),sandbox);
 return {run:s=>vm.runInContext(s,sandbox),canvas,buttons,storage,emit:(k,e)=>{for(const f of listeners[k]||[])f({preventDefault(){},...e})}};
}
let checks=0;function test(name,fn){fn();checks++;console.log('PASS',name);}
const h=harness({class:'mage',unlocked:3,stars:[3,2,1],xp:87,level:4,custom:'preserved'});
test('v0.2 progress and unknown fields survive loading and saving',()=>{h.run('persist()');const data=JSON.parse(h.storage.get('realm-runners-save-v2'));for(const [k,v] of Object.entries({class:'mage',unlocked:3,stars:[3,2,1],xp:87,level:4,custom:'preserved'}))assert.deepEqual(data[k],v);assert.equal(data.saveVersion,3);});
test('all levels and classes render; terrain cache bounded',()=>{for(let s=0;s<3;s++)for(const c of ['warrior','hunter','mage']){h.run(`save.class='${c}';start(${s});for(let i=0;i<40;i++)step(1);draw()`);}assert.ok(h.run('terrainCache.size')<=24);});
test('ground collision and jump',()=>{h.run('start(0);for(let i=0;i<60;i++)step(1)');assert.equal(h.run('hero.on'),true);const y=h.run('hero.y');h.run('input.jump=true;step(1)');assert.ok(h.run('hero.y')<y);});
test('coin and star rewards emit particles',()=>{h.run("start(0);things=[{x:hero.x+15,y:hero.y+20,type:'star',taken:false}];step(1)");assert.equal(h.run('hero.stars'),1);assert.equal(h.run('hero.earned'),25);assert.ok(h.run('particles.length')>0);});
test('stomping enemy',()=>{h.run('start(0);hero.x=420;hero.y=394;hero.vy=5;step(1)');assert.equal(h.run('bad[0].alive'),false);assert.ok(h.run('hero.vy')<0);});
test('dash defeats enemy and starts cooldown',()=>{h.run('start(0);hero.x=406;hero.y=422;input.dash=true;step(1)');assert.equal(h.run('bad[0].alive'),false);assert.ok(h.run('dashCooldown')>0);});
test('damage restarts entire run with one fewer heart',()=>{h.run("start(0);things[0].taken=true;for(let i=0;i<30;i++)step(1);hero.x=1700;die()");assert.equal(h.run('hero.x'),50);assert.equal(h.run('hero.hearts'),2);assert.equal(h.run('currentTime()'),0);assert.equal(h.run('things[0].taken'),false);});
test('fall restarts the level without a checkpoint',()=>{h.run('start(0);hero.y=700;step(1)');assert.equal(h.run('hero.hearts'),2);assert.equal(h.run('hero.x'),50);});
test('completion unlocks level, saves XP and best stars',()=>{h.run('save.unlocked=1;save.level=1;save.xp=90;save.stars=[2,0,0];start(0);hero.stars=1;hero.earned=25;hero.x=2750;step(1)');assert.equal(h.run('scene'),'end');const s=JSON.parse(h.storage.get('realm-runners-save-v2'));assert.equal(s.level,2);assert.equal(s.xp,85);assert.equal(s.unlocked,2);assert.equal(s.stars[0],2);});
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
test('v0.4 local leaderboard records best time per class',()=>{h.run("save.class='mage';start(0);for(let i=0;i<80;i++)step(1);recordTime()");const first=h.run("save.bestTimesPixelV051['1-1'].mage");h.run('start(0);for(let i=0;i<100;i++)step(1);recordTime()');assert.equal(h.run("save.bestTimesPixelV051['1-1'].mage"),first);});
test('v0.4 skills unlock in order and survive persistence',()=>{h.run("save.class='mage';save.level=5;ensureRpgSave()");assert.equal(h.run("unlockSkill('double_fireball')"),false);assert.equal(h.run("unlockSkill('fireball_damage')"),true);assert.ok(JSON.parse(h.storage.get('realm-runners-save-v2')).skills.mage.includes('fireball_damage'));});
test('v0.4 mage projectile damages an enemy',()=>{h.run("save.class='mage';start(0);hero.x=370;hero.y=420;hero.face=1;performAttack();for(let i=0;i<12;i++)combatTick(1)");assert.ok(h.run('bad[0].hp<2||!bad[0].alive'));});
test('v0.4 inventory equips class-specific items',()=>{h.run("save.class='mage';save.inventory.push('ember_staff');equipItem('ember_staff')");assert.equal(h.run("save.equipment.mage.weapon"),'ember_staff');assert.equal(h.run("equipItem('swift_bow')"),false);});

// Guard against missing or stale runtime scripts in the published HTML.
test('v0.4 HTML loads RPG systems before forest startup',()=>{
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 const game=html.indexOf('src="game.js?v=0.5.2"');
 const rpg=html.indexOf('src="rpg.js?v=0.5.2"');
 const forest=html.indexOf('src="forest.js?v=0.5.2"');
 assert.ok(game>=0 && rpg>game && forest>rpg,'game.js -> rpg.js -> forest.js must load in that order');
 assert.ok(html.includes('id="rpgPanels"'));
 assert.ok(html.includes('data-control="attack"'));
 assert.ok(html.includes('PIXEL-WELTEN  ·  VERSION 0.5.2'));
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
 const geometry=h.run('stages.map(s=>({gaps:s.gaps,ledges:s.ledges,stars:s.stars,enemies:s.enemies,spikes:s.spikes}))');
 const signatures=new Set(geometry.map(s=>JSON.stringify(s.gaps)));
 assert.equal(signatures.size,3);
 assert.ok(geometry.every(s=>s.ledges.length>=5&&s.stars.length===3));
 for(const s of geometry){
  for(const [a,b] of s.gaps)assert.ok(a>150&&b-a<=210&&b<2700);
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
test('Pixel Edition: half-resolution pixel buffer, nearest-neighbour upscale and context restoration',()=>{
 h.run('innerWidth=960;innerHeight=540;size();start(0);draw()');
 assert.equal(h.run('pixelCanvas.width'),480);
 assert.equal(h.run('pixelCanvas.height'),270);
 assert.equal(h.run("ctx===canvas.getContext('2d')"),true);
 const data=h.canvas.getContext('2d').getImageData(200,140,2,2).data;
 for(let i=4;i<16;i+=4)for(let j=0;j<4;j++)assert.equal(data[i+j],data[j]);
 assert.ok(data[3]>0);
});
test('Pixel Edition: previous time trials remain untouched after recording new runs',()=>{
 h.run("save.class='mage';save.bestTimes={'1-1':{mage:69000}};save.bestTimesV05={'1-1':{mage:72000}};start(0);for(let i=0;i<90;i++)step(1);recordTime()");
 assert.equal(h.run("save.bestTimes['1-1'].mage"),69000);
 assert.equal(h.run("save.bestTimesV05['1-1'].mage"),72000);
 assert.ok(h.run("save.bestTimesPixelV051['1-1'].mage")>0);
});
test('Pixel Edition: maximum terrain gap remains passable without forced long dash',()=>{
 const gapLengths=h.run('stages.flatMap(s=>s.gaps.map(([a,b])=>b-a))');
 assert.ok(Math.max(...gapLengths)<=185);
});

test('v0.5.2 sky palette is visibly different in each biome',()=>{
 const colors=h.run("(()=>{const colors=[];for(let i=0;i<3;i++){quality='low';start(i);draw();colors.push([...pixelCtx.getImageData(50,15,1,1).data].slice(0,3))}return colors})()");
 assert.equal(new Set(colors.map(rgb=>rgb.join(','))).size,3);
 const distance=(a,b)=>a.reduce((total,x,i)=>total+Math.abs(x-b[i]),0);
 assert.ok(distance(colors[0],colors[1])>100,'Waldanfang and Baumkronen must differ strongly');
 assert.ok(distance(colors[1],colors[2])>60,'Baumkronen and Moosruinen must differ strongly');
});
test('v0.5.2 each stage has unique tile colors and parallax planes',()=>{
 const colors=h.run("(()=>{const colors=[];for(let i=0;i<3;i++){stage=i;const tile=terrain({x:0,y:G,w:140},0);colors.push([...tile.getContext('2d').getImageData(35,17,1,1).data].slice(0,3));}return colors})()");
 assert.equal(new Set(colors.map(rgb=>rgb.join(','))).size,3);
 assert.equal(h.run('planeSets.length'),3);
 assert.ok(h.run('planeSets.every(set=>set.length===3)'));
});
test('v0.5.2 visual changes leave jump rules and game physics unchanged',()=>{
 assert.equal(h.run('JUMP.holdFrames'),14);
 assert.equal(h.run('JUMP.holdGravity'),.50);
 assert.equal(h.run('JUMP.cut'),.58);
 assert.equal(h.run('classes.mage.jump'),14.4);
});
