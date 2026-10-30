import test from 'node:test';
import assert from 'node:assert/strict';
import {generateDungeon,SPECIAL_ROOMS} from '../src/dungeon.js?v=0.24.0';
import {Game} from '../src/game.js?v=0.24.0';
import {defaultProgress} from '../src/progression.js';
import {ENEMY_DATA,TILE} from '../src/data.js';
import {normalEncounterPlan,pickNormalEnemy,ENCOUNTER_RECIPES} from '../src/encounter-planner.js?v=0.24.0';
import {roomDressings} from '../src/visual-world.js?v=0.24.0';
import {generateItem} from '../src/loot.js';

const idle={
 movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,
 consumeDash:()=>false,consumeAbility:()=>false
};
test('combat is distributed from early to late dungeon and every curated room remains',()=>{
 for(let seed=1;seed<=160;seed++){
  const d=generateDungeon(seed);
  assert.equal(d.rooms.length,16);
  assert.equal(d.rooms.filter(r=>r.type==='combat').length,4);
  for(const type of SPECIAL_ROOMS)assert.equal(d.rooms.filter(r=>r.type===type).length,1,
   'must preserve '+type+' seed '+seed);
  const stages=d.rooms.filter(r=>r.type==='combat').map(r=>r.encounterTier);
  assert.ok(Math.max(...stages)>=3,'must contain a dangerous late fight seed '+seed);
  assert.ok(Math.min(...stages)<=1,'must contain an approachable early fight seed '+seed);
  const repeat=generateDungeon(seed);
  assert.deepEqual(d.rooms.map(r=>[r.type,r.encounterTier,r.sceneSeed]),
   repeat.rooms.map(r=>[r.type,r.encounterTier,r.sceneSeed]),'seed must be deterministic');
 }
});

test('all tactical themes create different structured groups and capped waves',()=>{
 const themes=new Set();
 for(let seed=1;seed<=160;seed++){
  const d=generateDungeon(seed);
  for(const room of d.rooms.filter(r=>r.type==='combat')){
   const plan=normalEncounterPlan(room,3,.5);
   themes.add(plan.style);
   assert.ok(plan.initial>=4&&plan.initial<=7);
   assert.ok(plan.reinforcements>=0&&plan.reinforcements<=2);
   if(plan.tier>=3)assert.equal(plan.reinforcements,2);
   if(plan.tier===0)assert.equal(plan.reinforcements,0);
   const types=Array.from({length:plan.initial+plan.reinforcements},(_,i)=>
    pickNormalEnemy(plan,i,()=>.4));
   assert.ok(new Set(types).size>=3,'room needs distinct combat roles');
   for(const type of types)assert.ok(ENEMY_DATA[type],'unknown enemy '+type);
  }
 }
 assert.deepEqual([...themes].sort(),Object.keys(ENCOUNTER_RECIPES).sort());
});

test('real game spawns valid formations and reinforcement waves in normal mode',()=>{
 for(const seed of [1,3,9,31,79,117,203,423,901]){
  const game=new Game(defaultProgress(),idle);
  game.start('warrior',seed);
  for(const room of game.dungeon.rooms.filter(r=>r.type==='combat')){
   game.enemies=[];
   game.clearCount=2;
   game.spawnRoom(room);
   assert.equal(game.enemies.length,room.normalPlan.initial);
   const wave=room.normalPlan.reinforcements;
   assert.equal(room.reinforcements,wave);
   for(const enemy of game.enemies){
    assert.ok(game.dungeon.canMove(enemy.x,enemy.y,enemy.radius,false));
    assert.ok(enemy.hp>0&&enemy.damage>0);
   }
   if(wave){
    const before=game.enemies.length;
    game.spawnReinforcements(room);
    assert.equal(room.reinforcements,0);
    assert.ok(game.enemies.length>before);
    assert.ok(game.enemies.length<=before+wave);
   }
  }
 }
});

test('visual details are grounded and do not add new colliders',()=>{
 for(let seed=1;seed<=70;seed++){
  const d=generateDungeon(seed),before=d.tiles.slice();
  for(const room of d.rooms){
   const marks=roomDressings(d,room).filter(item=>item.kind==='groundmark');
   assert.ok(marks.length>0,'room '+room.id+' must look distinctive');
   for(const mark of marks){
    assert.equal(d.tileAt(Math.floor(mark.x/TILE),Math.floor(mark.y/TILE)),0);
    assert.ok(Number.isFinite(mark.x)&&Number.isFinite(mark.y));
   }
  }
  assert.deepEqual(d.tiles,before,'floor detail never changes collision tiles');
 }
});

test('regular enemies cannot drop mythical equipment and tower format stays separate',()=>{
 const rand=(()=>{let i=0;return()=>((i++*37)%997)/997})();
 for(let i=0;i<2000;i++){
  assert.notEqual(generateItem(rand,9,'mage',false,false).rarity,'mythic');
  assert.notEqual(generateItem(rand,9,'mage',true,false).rarity,'mythic');
 }
 for(let seed=1;seed<=70;seed++){
  const tower=generateDungeon(seed,{tower:true,biome:'crypt',floor:7});
  assert.equal(tower.rooms.length,7);
  assert.equal(tower.rooms.filter(r=>r.type==='boss').length,1);
  assert.equal(tower.rooms.filter(r=>r.type==='shop').length,0);
 }
});
