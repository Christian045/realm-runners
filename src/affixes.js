import {distance,normalized} from './data.js?v=0.21.0';

// Passive powers are exclusive to the equipped item in each slot.
// Proc damage always bypasses secondary procs to prevent infinite effect loops.
export const AFFIXES=Object.freeze({
 chain:{name:'Kettenblitz',description:'Treffer springen auf einen nahen Feind über'},
 burn:{name:'Glut',description:'Treffer entzünden Gegner für 3 Sekunden'},
 poison:{name:'Giftklinge',description:'Treffer vergiften Gegner für 4 Sekunden'},
 frost:{name:'Frost',description:'Treffer verlangsamen Gegner'},
 cleave:{name:'Splitter',description:'Nahkampftreffer treffen weitere Gegner'},
 critHeal:{name:'Blutmond',description:'Kritische Treffer heilen 4 LP'},
 dashNova:{name:'Sturmtritt',description:'Ausweichen verletzt Gegner in der Nähe'},
 thorn:{name:'Dornen',description:'Angreifer erleiden Gegenschaden'},
 soul:{name:'Seelensammler',description:'Jeder fünfte Kill heilt 12 LP'},
 triple:{name:'Dreifachschuss',description:'Fernkampfangriffe feuern zusätzliche Geschosse'},
 splash:{name:'Explosion',description:'Treffer verursachen Flächenschaden'},
 execute:{name:'Henker',description:'Mehr Schaden an Gegnern unter 30 % LP'},
 shield:{name:'Barriere',description:'Jeder zehnte Treffer erzeugt einen Schutzschild'},
 coins:{name:'Goldrausch',description:'Besiegte Gegner geben zusätzlich Gold'},
 vampire:{name:'Lebensbiss',description:'Jeder Treffer heilt 1 LP'}
});
export const AFFIX_IDS=Object.freeze(Object.keys(AFFIXES));
export function rollAffix(random,rarity){
 if(rarity==='common')return null;
 return AFFIX_IDS[Math.floor(random()*AFFIX_IDS.length)];
}
export function equippedAffixes(player){
 return new Set(Object.values(player.equipment||{}).map(i=>i?.affix).filter(id=>AFFIXES[id]));
}
export function hasAffix(player,id){return equippedAffixes(player).has(id)}
export function onDash(game){
 if(!hasAffix(game.player,'dashNova'))return;
 const p=game.player;game.createEffect('ring',p.x,p.y,'#aaeaff',.36,94);
 for(const e of [...game.enemies])if(e.hp>0&&distance(p,e)<94+e.radius)
  game.hitEnemy(e,p.damage*.55,normalized(e.x-p.x,e.y-p.y),{proc:false});
}
export function beforeHit(game,e,damage){
 return hasAffix(game.player,'execute')&&e.hp/e.maxHp<.3?damage*1.38:damage;
}
export function afterHit(game,e,damage,critical,dir){
 const p=game.player,fx=equippedAffixes(p);
 if(fx.has('critHeal')&&critical&&!(p.statuses?.rot>0))p.hp=Math.min(p.maxHp,p.hp+4);
 if(fx.has('vampire')&&!(p.statuses?.rot>0))p.hp=Math.min(p.maxHp,p.hp+1);
 if(fx.has('burn'))e.burn=Math.max(e.burn||0,3);
 if(fx.has('poison'))e.poison=Math.max(e.poison||0,4);
 if(fx.has('frost'))e.slow=Math.max(e.slow||0,1.7);
 if(fx.has('chain')&&game.random()<.30){
  const target=game.enemies.find(n=>n!==e&&n.hp>0&&distance(n,e)<155);
  if(target){game.createEffect('lightning',e.x,e.y,'#9bd7ff',.24,60,Math.atan2(target.y-e.y,target.x-e.x));
   game.hitEnemy(target,damage*.5,normalized(target.x-e.x,target.y-e.y),{proc:false});}
 }
 if(fx.has('splash')&&game.random()<.3){
  game.createEffect('ring',e.x,e.y,'#f4ad75',.3,64);
  for(const n of [...game.enemies])if(n!==e&&n.hp>0&&distance(e,n)<75)
   game.hitEnemy(n,damage*.35,dir,{proc:false});
 }
 if(fx.has('cleave')&&p.kind==='warrior'){
  for(const n of [...game.enemies])if(n!==e&&n.hp>0&&distance(e,n)<70)
   game.hitEnemy(n,damage*.25,dir,{proc:false});
 }
 p.shieldHits=(p.shieldHits||0)+1;
 if(fx.has('shield')&&p.shieldHits%10===0){p.shield=10;game.createEffect('ring',p.x,p.y,'#88d6ff',.6,32)}
}
export function onHurt(game,damage){
 const p=game.player,fx=equippedAffixes(p);
 if(fx.has('thorn')){
  const near=game.enemies.filter(e=>e.hp>0&&distance(e,p)<85);
  for(const e of near)game.hitEnemy(e,Math.min(18,damage*.45),normalized(e.x-p.x,e.y-p.y),{proc:false});
 }
}
export function onKill(game,e){
 const fx=equippedAffixes(game.player);
 if(fx.has('soul')){
  game.player.soulKills=(game.player.soulKills||0)+1;
  if(game.player.soulKills%5===0){
   if(!(game.player.statuses?.rot>0))game.player.hp=Math.min(game.player.maxHp,game.player.hp+12);
   game.createEffect('text',game.player.x,game.player.y-38,'SEELEN +12','#b8a4ff',.8);
  }
 }
 if(fx.has('coins')&&e.type!=='boss')game.runCoins+=4;
}
export function statusTick(game,e,dt){
 const oldBurn=e.burn||0,oldPoison=e.poison||0;
 e.burn=Math.max(0,oldBurn-dt);e.poison=Math.max(0,oldPoison-dt);
 e.slow=Math.max(0,(e.slow||0)-dt);
 // Damage over time accumulates so small frame deltas don't round to zero.
 const dot=(oldBurn>0?5:0)+(oldPoison>0?3:0);
 if(dot&&e.hp>0&&e.type!=='boss'){ // Boss phase transitions cannot be bypassed by damage over time.
  e.dotAccum=(e.dotAccum||0)+dot*dt;
  const take=Math.floor(e.dotAccum);
  if(take>0){
   e.dotAccum-=take;e.hp=Math.max(0,e.hp-take);e.flash=Math.max(e.flash,.05);
   if(e.hp===0)game.killEnemy(e);
  }
 }
}
