'use strict';
// v0.4 RPG extension. Keep the v2 storage key and all unknown save fields.
const itemCatalog={
  oak_staff:{name:'Eichenstab',slot:'weapon',class:'mage',damage:1},
  ember_staff:{name:'Glutstab',slot:'weapon',class:'mage',damage:2},
  hunting_bow:{name:'Jagdbogen',slot:'weapon',class:'hunter',damage:1},
  swift_bow:{name:'Windbogen',slot:'weapon',class:'hunter',damage:2},
  iron_sword:{name:'Eisenschwert',slot:'weapon',class:'warrior',damage:1},
  steel_sword:{name:'Stahlschwert',slot:'weapon',class:'warrior',damage:2},
  leather_boots:{name:'Lederstiefel',slot:'armor',speed:.18},
  moss_cloak:{name:'Moosumhang',slot:'armor',speed:.3}
};
const starters={mage:'oak_staff',hunter:'hunting_bow',warrior:'iron_sword'};
const skillCatalog={
 mage:[['fireball_damage','Heiße Flamme','+1 Feuerball-Schaden'],['fireball_speed','Feuerfokus','Schnellere Feuerbälle'],['double_fireball','Doppelfeuer','Zwei Feuerbälle']],
 hunter:[['arrow_damage','Scharfe Spitzen','+1 Pfeilschaden'],['arrow_speed','Schnellschuss','Kürzere Abklingzeit'],['triple_arrow','Dreifachschuss','Drei Pfeile']],
 warrior:[['sword_damage','Stahlhieb','+1 Nahkampfschaden'],['sword_reach','Langer Hieb','Mehr Reichweite'],['whirlwind','Wirbelhieb','Größerer Wirkungsbereich']]
};
function ensureRpgSave(){
 if(!save.skills||typeof save.skills!=='object'||Array.isArray(save.skills))save.skills={};
 for(const kind of Object.keys(classes)){
  if(!Array.isArray(save.skills[kind]))save.skills[kind]=[];
  save.skills[kind]=[...new Set(save.skills[kind].filter(id=>skillCatalog[kind].some(s=>s[0]===id)))];
 }
 if(!Array.isArray(save.inventory))save.inventory=[];
 save.inventory=save.inventory.filter(id=>!!itemCatalog[id]).slice(0,100);
 if(!save.equipment||typeof save.equipment!=='object'||Array.isArray(save.equipment))save.equipment={};
 for(const kind of Object.keys(classes)){
  if(!save.inventory.includes(starters[kind]))save.inventory.push(starters[kind]);
  const current=save.equipment[kind];
  if(!current||typeof current!=='object')save.equipment[kind]={};
  for(const slot of ['weapon','armor']){
   const id=save.equipment[kind][slot];
   if(id&&!save.inventory.includes(id))delete save.equipment[kind][slot];
   else if(id&&(!itemCatalog[id]||itemCatalog[id].slot!==slot||(itemCatalog[id].class&&itemCatalog[id].class!==kind)))delete save.equipment[kind][slot];
  }
  if(!save.equipment[kind].weapon)save.equipment[kind].weapon=starters[kind];
 }
 if(!save.bestTimes||typeof save.bestTimes!=='object'||Array.isArray(save.bestTimes))save.bestTimes={};
 for(const level of Object.keys(save.bestTimes)){
  if(!/^1-[123]$/.test(level)||typeof save.bestTimes[level]!=='object'||!save.bestTimes[level]){delete save.bestTimes[level];continue;}
  for(const kind of Object.keys(save.bestTimes[level]))if(!classes[kind]||!Number.isFinite(save.bestTimes[level][kind])||save.bestTimes[level][kind]<=0)delete save.bestTimes[level][kind];
 }
 // Layout changes invalidate comparisons but never erase historical v0.4 records.
 if(!save.bestTimesV05||typeof save.bestTimesV05!=='object'||Array.isArray(save.bestTimesV05))save.bestTimesV05={};
 for(const level of Object.keys(save.bestTimesV05)){
  if(!/^1-[123]$/.test(level)||typeof save.bestTimesV05[level]!=='object'||!save.bestTimesV05[level]){delete save.bestTimesV05[level];continue;}
  for(const kind of Object.keys(save.bestTimesV05[level])){
   const ms=save.bestTimesV05[level][kind];
   if(!classes[kind]||!Number.isFinite(ms)||ms<=0)delete save.bestTimesV05[level][kind];
  }
 }
 // New physics means v0.5.1 runs are not directly comparable to v0.5.0 times.
 // Preserve both old leaderboards and expose the Pixel Edition board separately.
 if(!save.bestTimesPixelV051||typeof save.bestTimesPixelV051!=='object'||Array.isArray(save.bestTimesPixelV051))save.bestTimesPixelV051={};
 for(const level of Object.keys(save.bestTimesPixelV051)){
  if(!/^1-[123]$/.test(level)||!save.bestTimesPixelV051[level]||typeof save.bestTimesPixelV051[level]!=='object'){
   delete save.bestTimesPixelV051[level];continue;
  }
  for(const kind of Object.keys(save.bestTimesPixelV051[level])){
   const ms=save.bestTimesPixelV051[level][kind];
   if(!classes[kind]||!Number.isFinite(ms)||ms<=0)delete save.bestTimesPixelV051[level][kind];
  }
 }
 const spent=Object.values(save.skills).reduce((sum,ids)=>sum+ids.length,0);
 save.skillPoints=Math.max(0,save.level-1-spent);
 save.saveVersion=3;
}
ensureRpgSave();
let runFrames=0,attackWas=false,attackCooldown=0,projectiles=[],attackFlash=0,groundLoot=[];
function hasSkill(id){return save.skills[save.class].includes(id);}
function equipBonus(stat){return Object.values(save.equipment[save.class]).reduce((n,id)=>n+(itemCatalog[id]?.[stat]||0),0);}
function formatRunTime(ms){const seconds=Math.floor(ms/1000);return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0')+'.'+String(Math.floor(ms%1000/10)).padStart(2,'0');}
function currentTime(){return Math.round(runFrames*1000/60);}
function medal(ms){return ms<=70000?'🥇':ms<=105000?'🥈':ms<=150000?'🥉':'✓';}
function recordTime(){
 const level='1-'+(stage+1),kind=save.class,ms=currentTime();
 if(!save.bestTimesPixelV051[level])save.bestTimesPixelV051[level]={};
 if(!save.bestTimesPixelV051[level][kind]||ms<save.bestTimesPixelV051[level][kind])save.bestTimesPixelV051[level][kind]=ms;
 persist();
 return ms;
}
function resetRpgRun(){runFrames=0;attackWas=false;attackCooldown=0;projectiles=[];attackFlash=0;groundLoot=[];}
function damageEnemy(e,amount){
 if(!e.alive)return;
 e.hp=(e.hp??2)-amount;
 burst(e.x+13,e.y+10,'#f4c585',7,2);
 if(e.hp<=0){e.alive=false;hero.earned+=15;dropLoot(e);burst(e.x+13,e.y+14,'#a8e2bd',12,2);}
}
function performAttack(){
 if(scene!=='game'||attackCooldown>0||!hero)return;
 const kind=save.class,bonus=equipBonus('damage');
 attackFlash=10;
 if(kind==='warrior'){
  const reach=hasSkill('sword_reach')?98:65;
  attackCooldown=hasSkill('whirlwind')?23:17;
  for(const e of bad)if(e.alive&&Math.abs(e.y-hero.y)<65&&
   (hasSkill('whirlwind')?Math.abs(e.x-hero.x)<reach:(e.x-hero.x)*hero.face>=-20&&(e.x-hero.x)*hero.face<reach))
   damageEnemy(e,2+bonus+(hasSkill('sword_damage')?1:0));
 }else{
  const mage=kind==='mage',triple=hasSkill('triple_arrow'),double=hasSkill('double_fireball');
  attackCooldown=mage?29:(hasSkill('arrow_speed')?14:22);
  const offsets=mage&&double?[-8,8]:triple?[-13,0,13]:[0];
  for(const offset of offsets)projectiles.push({x:hero.x+15+hero.face*20,y:hero.y+20+offset,
    vx:hero.face*(mage?(hasSkill('fireball_speed')?12:9):13),vy:triple?offset*.045:0,
    mage,life:90,damage:1+bonus+(hasSkill(mage?'fireball_damage':'arrow_damage')?1:0)});
 }
}
function dropLoot(e){
 // Deterministic per stage/enemy for reproducible runs and tests.
 const index=stages[stage].enemies.findIndex(x=>Math.abs(x-e.home)<2);
 if(index<0||index%2!==0)return;
 const pool={mage:'ember_staff',hunter:'swift_bow',warrior:'steel_sword'};
 const id=index===0?pool[save.class]:(stage%2?'moss_cloak':'leather_boots');
 groundLoot.push({x:e.x+12,y:e.y-12,id});
}
function combatTick(dt){
 runFrames+=dt;attackCooldown=Math.max(0,attackCooldown-dt);attackFlash=Math.max(0,attackFlash-dt);
 if(input.attack&&!attackWas)performAttack();
 attackWas=input.attack;
 for(const p of projectiles){
  p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
  for(const e of bad)if(e.alive&&p.x>e.x-5&&p.x<e.x+32&&p.y>e.y-6&&p.y<e.y+34){
   damageEnemy(e,p.damage);p.life=0;break;
  }
 }
 projectiles=projectiles.filter(p=>p.life>0&&p.x>=0&&p.x<WIDTH&&p.y>=0&&p.y<H);
 for(const item of groundLoot)if(!item.taken&&Math.abs(item.x-hero.x)<33&&Math.abs(item.y-hero.y)<66){
  item.taken=true;if(!save.inventory.includes(item.id))save.inventory.push(item.id);
  persist();burst(item.x,item.y,'#f3d9a2',14,2);
 }
}
function drawCombatEffects(){
 for(const p of projectiles){
  if(p.mage){glow(p.x,p.y,20,'#f0a04c88');ellipse(ctx,p.x,p.y,8,8,'#ffaf57');ellipse(ctx,p.x-2,p.y-2,3,3,'#ffecb0');}
  else{line(ctx,p.x-14*(p.vx>0?1:-1),p.y,p.x,p.y,'#f6dda3',3);}
 }
 for(const loot of groundLoot)if(!loot.taken){glow(loot.x,loot.y,18,'#e0d2a066');ellipse(ctx,loot.x,loot.y,7,8,'#e7ce83');}
 if(attackFlash>0&&save.class==='warrior'){ctx.strokeStyle='#e4f3c8';ctx.lineWidth=5;ctx.beginPath();const cx=hero.x+15,cy=hero.y+20,r=hasSkill('sword_reach')?80:60;ctx.arc(cx,cy,r,hero.face>0?-.85:Math.PI-.85,hero.face>0?.85:Math.PI+.85);ctx.stroke();}
}
function unlockSkill(id){
 const tree=skillCatalog[save.class],index=tree.findIndex(x=>x[0]===id);
 if(index<0||save.skillPoints<1||save.skills[save.class].includes(id))return false;
 if(index>0&&!save.skills[save.class].includes(tree[index-1][0]))return false;
 save.skills[save.class].push(id);ensureRpgSave();persist();renderRpgMenu();return true;
}
function equipItem(id){
 const item=itemCatalog[id];
 if(!item||!save.inventory.includes(id)||(item.class&&item.class!==save.class))return false;
 save.equipment[save.class][item.slot]=id;persist();renderRpgMenu();return true;
}
function renderRpgMenu(){
 const root=$('#rpgPanels');if(!root)return;
 const kind=save.class,levelTimes=save.bestTimesPixelV051['1-'+(selected+1)]||{};
 const timeRows=Object.entries(classes).map(([id,c])=>'<div>'+c.label+': '+(levelTimes[id]?formatRunTime(levelTimes[id])+' '+medal(levelTimes[id]):'—')+'</div>').join('');
 const skills=skillCatalog[kind].map(([id,name,desc],i)=>'<button data-skill="'+id+'" '+(save.skills[kind].includes(id)||!save.skillPoints||(i>0&&!save.skills[kind].includes(skillCatalog[kind][i-1][0]))?'disabled':'')+'>'+(save.skills[kind].includes(id)?'✓ ':'✦ ')+name+' – '+desc+'</button>').join('');
 const items=save.inventory.filter(id=>{const o=itemCatalog[id];return o&&(!o.class||o.class===kind)}).map(id=>{
  const o=itemCatalog[id];return '<button data-equip="'+id+'" '+(save.equipment[kind][o.slot]===id?'disabled':'')+'>'+(save.equipment[kind][o.slot]===id?'✓ ':'')+o.name+'</button>';
 }).join('');
 root.innerHTML='<details><summary>⏱ Pixel-Bestzeiten · '+stages[selected].name+'</summary>'+timeRows+'</details>'+
 '<details><summary>✦ Skilltree · '+save.skillPoints+' Punkte</summary><div class="rpg-options">'+skills+'</div></details>'+
 '<details><summary>🎒 Ausrüstung · '+save.inventory.length+' Gegenstände</summary><div class="rpg-options">'+items+'</div></details>';
 root.querySelectorAll('[data-skill]').forEach(b=>b.onclick=()=>unlockSkill(b.dataset.skill));
 root.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>equipItem(b.dataset.equip));
}
