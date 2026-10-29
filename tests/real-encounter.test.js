import test from 'node:test';
import assert from 'node:assert/strict';
import {Game} from '../src/game.js';
import {defaultProgress} from '../src/progression.js';
import {distance} from '../src/data.js';
const input={
 movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,
 consumeDash:()=>false,consumeAbility:()=>false
};
function simulate(seed,tower,kind='warrior'){
 const g=new Game(defaultProgress(),input);
 g.setTower(tower);g.start(kind,seed);
 const room=g.dungeon.rooms.find(r=>r.type==='combat');
 assert.ok(room,'a real combat chamber must exist');
 g.player.x=room.cx;g.player.y=room.cy;g.entrance(room);
 const enemies=g.enemies.map(e=>({type:e.type,x:e.x,y:e.y,speed:e.speed,radius:e.radius}));
 const hp=g.player.hp;
 const trace=[];
 for(let tick=0;tick<750&&g.mode==='playing';tick++){
  g.update(1/60);
  if(tick%90===0)trace.push({t:tick/60,hp:g.player.hp,
   enemies:g.enemies.map(e=>({type:e.type,d:Math.round(distance(e,g.player)),
    cd:+e.cooldown?.toFixed(2),wind:+e.windup?.toFixed(2),special:e.special?.kind||null}))});
  if(g.player.hp<hp)break;
 }
 assert.ok(g.player.hp<hp,JSON.stringify({seed,tower,kind,room:room.id,
  player:{x:g.player.x,y:g.player.y},enemies,trace}));
}
test('actual generated normal-dungeon enemies attack a completely idle hero',()=>{
 for(const seed of [5,27,71,150,400,990,12345])simulate(seed,false);
});
test('actual generated tower enemies attack a completely idle hero',()=>{
 for(const seed of [5,27,71,150,400,990,12345])simulate(seed,true);
});
test('combat starts while idle and an attacker does not require player movement input',()=>{
 const game=new Game(defaultProgress(),input);game.start('warrior',300);
 const room=game.dungeon.rooms.find(r=>r.type==='elite');
 game.player.x=room.cx;game.player.y=room.cy;game.entrance(room);
 const hp=game.player.hp;
 for(let frame=0;frame<850&&game.mode==='playing'&&game.player.hp===hp;frame++)game.update(1/60);
 assert.ok(game.player.hp<hp,'elite must hit stationary player at least once');
});
