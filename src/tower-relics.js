import {distance,normalized} from './data.js';

export const TOWER_RELICS=Object.freeze([
 {id:'storm',name:'Gewitterkrone',description:'Jeder vierte Treffer setzt einen Kettenblitz frei.',color:'#a4dfff'},
 {id:'embers',name:'Aschenherz',description:'Treffer entzünden Feinde; Feuer und Gift verstärken einander.',color:'#ffc088'},
 {id:'aegis',name:'Eid des Wächters',description:'Zu Beginn jeder Etage entsteht ein Schild über 22 LP.',color:'#b8e9d6'},
 {id:'echo',name:'Widerhall-Rune',description:'Spezialattacken werden um 18 % stärker.',color:'#cfb3ff'},
 {id:'phoenix',name:'Phönixfeder',description:'Überlebt einmal pro Lauf einen tödlichen Treffer.',color:'#ffb0a4'},
 {id:'hunger',name:'Seelenzahn',description:'Jeder dritte Kill heilt dich um 10 LP.',color:'#e5b2d8'}
]);
export const towerRelicById=id=>TOWER_RELICS.find(r=>r.id===id);
export function nextTowerRelic(game){
 const pool=TOWER_RELICS.filter(r=>!game.towerRelics?.includes(r.id));
 if(!pool.length)return null;
 return pool[(game.floorDepth-1)%pool.length];
}
export function grantTowerRelic(game){
 const relic=nextTowerRelic(game);
 if(!relic)return false;
 game.towerRelics??=[];game.towerRelics.push(relic.id);
 if(relic.id==='aegis')game.player.shield=Math.max(game.player.shield||0,22);
 game.createEffect('text',game.player.x,game.player.y-65,'RELIKT · '+relic.name,relic.color,1.5);
 return relic;
}
const owns=(g,id)=>g.towerRelics?.includes(id);
export function towerRelicDamage(game,e,damage){
 if(!game.tower)return damage;
 let d=damage;
 if(owns(game,'echo')&&game.player.castTimer>0)d*=1.18;
 if(owns(game,'embers')&&(e.burn>0||e.poison>0))d*=1.16;
 return d;
}
export function afterTowerRelicHit(game,e,damage){
 if(!game.tower)return;
 game.towerRelicHits=(game.towerRelicHits||0)+1;
 if(owns(game,'embers'))e.burn=Math.max(e.burn||0,2.4);
 if(owns(game,'storm')&&game.towerRelicHits%4===0){
  const target=game.enemies.find(n=>n!==e&&n.hp>0&&distance(n,e)<190);
  if(target){
   game.createEffect('lightning',e.x,e.y,'#a4dfff',.25,90,Math.atan2(target.y-e.y,target.x-e.x));
   game.hitEnemy(target,damage*.48,normalized(target.x-e.x,target.y-e.y),{proc:false});
  }
 }
}
export function towerRelicKill(game){
 if(!owns(game,'hunger'))return;
 game.towerRelicKills=(game.towerRelicKills||0)+1;
 if(game.towerRelicKills%3===0){
  if(!(game.player.statuses?.rot>0))game.player.hp=Math.min(game.player.maxHp,game.player.hp+10);
  game.createEffect('text',game.player.x,game.player.y-34,'SEELEN +10','#e5b2d8',.8);
 }
}
export function towerRelicSave(game){
 if(!owns(game,'phoenix')||game.towerPhoenixUsed)return false;
 game.towerPhoenixUsed=true;
 game.player.hp=Math.max(1,Math.ceil(game.player.maxHp*.40));
 game.player.invulnerable=2.25;
 game.hazards=game.hazards.filter(h=>h.time>0&&distance(h,game.player)>h.radius+25);
 game.createEffect('ring',game.player.x,game.player.y,'#ffb0a4',1.15,140);
 game.createEffect('text',game.player.x,game.player.y-60,'PHÖNIX-RETTUNG','#ffb0a4',1.1);
 return true;
}
export function towerRelicFloor(game){
 if(owns(game,'aegis')){
  game.player.shield=Math.max(game.player.shield||0,22);
  game.createEffect('ring',game.player.x,game.player.y,'#b8e9d6',.7,53);
 }
}
