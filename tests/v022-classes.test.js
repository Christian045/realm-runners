import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js?v=0.22.0';
import {defaultProgress} from '../src/progression.js';
import {Input} from '../src/input.js';
import {drawCrystalRifle,drawSummonerTome} from '../src/weapon-visuals.js';

const input={
 movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),
 attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false
};
const newGame=(kind='summoner')=>{
 const g=new Game(defaultProgress(),input);g.start(kind,12345);
 g.player.direction={x:1,y:0};return g;
};
const enemy=(g,dist=85)=>({hp:230,maxHp:230,x:g.player.x+dist,y:g.player.y,
 type:'slime',radius:18,knock:{x:0,y:0},homeRoom:0,elite:false,flash:0});

test('glass cannon uses a crystal rifle rather than a mage staff or dagger',()=>{
 const renderContext={
  save(){},restore(){},translate(){},rotate(){},scale(){},fillRect(){},
  beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){}
 };
 assert.doesNotThrow(()=>drawCrystalRifle(renderContext,{kind:'glasscannon',
  x:100,y:100,direction:{x:1,y:0},attackTimer:.1}));
 assert.doesNotThrow(()=>drawSummonerTome(renderContext,{kind:'summoner',
  x:100,y:100,direction:{x:1,y:0}}));
});

test('summoner does very little personal damage but permanent bat heals on attacks',()=>{
 const g=newGame('summoner');assert.equal(g.player.damage,8);
 g.servant.kind='bat';g.servant.cooldown=0;g.servant.x=g.player.x+27;
 g.servant.y=g.player.y;
 const mob=enemy(g,65);g.enemies=[mob];
 g.player.hp=70;
 g.updateServant(.1);
 assert.ok(mob.hp<230,'bat must attack autonomously');
 assert.ok(g.player.hp>70,'bat should heal when damaging nearby enemies');
});

test('imp launches rapid fireballs and increases gold loot',()=>{
 const g=newGame('summoner');g.servant.kind='imp';g.servant.x=g.player.x+20;
 g.servant.y=g.player.y;g.servant.cooldown=0;
 g.enemies=[enemy(g,165)];
 g.updateServant(.05);
 assert.equal(g.projectiles.at(-1)?.summonShot,'imp');
 assert.equal(g.projectiles.at(-1)?.magic,true);
 assert.ok(g.servant.cooldown<=.48);
 const slain=enemy(g,160);slain.hp=0;g.killEnemy(slain);
 assert.equal(g.loot.find(x=>x.type==='coin').value,Math.round(8*1.3));
});

test('spirit independently fires magic projectiles rather than only healing',()=>{
 const g=newGame('summoner');g.servant.kind='spirit';g.servant.cooldown=0;
 g.enemies=[enemy(g,160)];
 g.updateServant(.05);
 assert.equal(g.projectiles.at(-1)?.summonShot,'spirit');
 assert.equal(g.projectiles.at(-1)?.magic,true);
});

test('giant is strong, distinct from permanent pet and expires after 3.8 seconds',()=>{
 const g=newGame('summoner');
 const original=g.servant;g.ability();
 assert.equal(g.giant.kind,'giant');
 assert.equal(g.giant.life,3.8);
 assert.equal(g.servant,original,'ability cannot replace selected servant');
 const mob=enemy(g,70);g.enemies=[mob];
 g.updateServant(.7);
 assert.ok(mob.hp<230,'giant should damage enemies');
 for(let i=0;i<7;i++)g.updateServant(.5);
 assert.equal(g.giant,null,'giant must expire naturally');
 assert.equal(g.servant,original,'permanent pet stays for whole run');
});

test('alchemist throws an arcing bomb that detonates on the ground, not on first enemy',()=>{
 const g=newGame('alchemist');
 // Cursor target for the tests. The projectile must land at the target.
 g.input={...input,target:(p,camera,r)=>({x:p.x+175,y:p.y+20})};
 g.attack();
 const bomb=g.projectiles.at(-1);
 assert.equal(bomb.flask,true);
 assert.equal(bomb.alchemy,'burn');
 assert.ok(Math.abs(bomb.targetX-(g.player.x+175))<.001);
 assert.ok(Math.abs(bomb.targetY-(g.player.y+20))<.001);
 const mob=enemy(g,175);g.enemies=[mob];
 g.updateProjectiles(.12);
 assert.ok(bomb.arcHeight>0,'bomb must arc in flight');
 assert.equal(mob.hp,230,'passing a mob cannot cause an early detonation');
 for(let i=0;i<60&&!g.puddles.length;i++)g.updateProjectiles(1/60);
 assert.equal(g.puddles.length,1,'bomb must produce persistent area damage');
 assert.ok(mob.hp<230,'landing explosion must harm mobs in its area');
 assert.ok(g.puddles[0].life>=3,'area effect persists after landing');
 const hp=mob.hp;g.updatePuddles(.5);
 assert.ok(mob.hp<hp,'standing in the splash zone deals additional damage');
});
test('input cursor target is clamped and mobile aim is retained',()=>{
 const i=Object.create(Input.prototype);
 i.canvas={width:960,height:540,getBoundingClientRect:()=>({left:0,top:0,width:960,height:540})};
 i.mouse={x:600,y:200,active:true};
 i.stick={x:0,y:0};i.keys=new Set();i.aim={x:1,y:0};
 const p={x:400,y:200};
 const camera={x:0,y:0,scale:1};
 assert.deepEqual(i.target(p,camera,150),{x:550,y:200});
 i.mouse.active=false;
 assert.deepEqual(i.target(p,camera,150),{x:550,y:200});
});
