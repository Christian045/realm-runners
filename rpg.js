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
  if(!/^1-[1-5]$/.test(level)||!save.bestTimesPixelV051[level]||typeof save.bestTimesPixelV051[level]!=='object'){
   delete save.bestTimesPixelV051[level];continue;
  }
  for(const kind of Object.keys(save.bestTimesPixelV051[level])){
   const ms=save.bestTimesPixelV051[level][kind];
   if(!classes[kind]||!Number.isFinite(ms)||ms<=0)delete save.bestTimesPixelV051[level][kind];
  }
 }
 // New enemy patrol/attack patterns change level timing. Keep v0.7 results
 // untouched and track fair v0.8 records for stages 1-1 through 1-4.
 if(!save.bestTimesV08||typeof save.bestTimesV08!=='object'||Array.isArray(save.bestTimesV08))save.bestTimesV08={};
 for(const level of Object.keys(save.bestTimesV08)){
  if(!/^1-[1-4]$/.test(level)||!save.bestTimesV08[level]||typeof save.bestTimesV08[level]!=='object'){
   delete save.bestTimesV08[level];continue;
  }
  for(const kind of Object.keys(save.bestTimesV08[level])){
   const ms=save.bestTimesV08[level][kind];
   if(!classes[kind]||!Number.isFinite(ms)||ms<=0)delete save.bestTimesV08[level][kind];
  }
 }
 // Faster automatic boss victory has its own board; earlier boss times survive.
 if(!save.bestTimesBossV062||typeof save.bestTimesBossV062!=='object'||Array.isArray(save.bestTimesBossV062))save.bestTimesBossV062={};
 for(const level of Object.keys(save.bestTimesBossV062)){
  if(level!=='1-5'||!save.bestTimesBossV062[level]||typeof save.bestTimesBossV062[level]!=='object'){
   delete save.bestTimesBossV062[level];continue;
  }
  for(const kind of Object.keys(save.bestTimesBossV062[level])){
   const ms=save.bestTimesBossV062[level][kind];
   if(!classes[kind]||!Number.isFinite(ms)||ms<=0)delete save.bestTimesBossV062[level][kind];
  }
 }
 const spent=Object.values(save.skills).reduce((sum,ids)=>sum+ids.length,0);
 save.skillPoints=Math.max(0,save.level-1-spent);
 save.slimeKingWins=Number.isFinite(Number(save.slimeKingWins))?Math.max(0,Math.floor(Number(save.slimeKingWins))):0;
 save.saveVersion=4;
}
ensureRpgSave();
let runFrames=0,attackWas=false,attackCooldown=0,projectiles=[],attackFlash=0,groundLoot=[];
function hasSkill(id){return save.skills[save.class].includes(id);}
function equipBonus(stat){return Object.values(save.equipment[save.class]).reduce((n,id)=>n+(itemCatalog[id]?.[stat]||0),0);}
function formatRunTime(ms){const seconds=Math.floor(ms/1000);return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0')+'.'+String(Math.floor(ms%1000/10)).padStart(2,'0');}
function currentTime(){return Math.round(runFrames*1000/60);}
function medal(ms){return ms<=70000?'GOLD':ms<=105000?'SILBER':ms<=150000?'BRONZE':'ZIEL';}
function recordTime(){
 const level='1-'+(stage+1),kind=save.class,ms=currentTime();
 const board=stage===BOSS_LEVEL?save.bestTimesBossV062:save.bestTimesV08;
 if(!board[level])board[level]={};
 if(!board[level][kind]||ms<board[level][kind])board[level][kind]=ms;
 persist();
 return ms;
}
function resetRpgRun(){runFrames=0;attackWas=false;attackCooldown=0;projectiles=[];attackFlash=0;groundLoot=[];combatTexts=[];}
let combatTexts=[];
function addCombatText(x,y,label,color='#ffe6b6'){
 combatTexts.push({x,y,text:String(label),color,life:35,max:35});
 if(combatTexts.length>36)combatTexts.shift();
}
function damageEnemy(e,amount){
 if(!e.alive||!Number.isFinite(amount)||amount<=0)return false;
 const oldHp=e.hp??2;
 e.hp=Math.max(0,oldHp-amount);
 e.maxHp=e.maxHp??2;
 e.hurt=10;
 e.kb=(hero?.face||1)*2.7;
 const centerX=e.x+(e.w||27)/2,centerY=e.y+(e.h||27)/2;
 burst(centerX,centerY,'#ffd495',11,2.3);
 addCombatText(centerX,centerY-14,'-'+Math.min(oldHp,amount),'#fff0bb');
 if(e.hp<=0){
  e.alive=false;hero.earned+=(ENEMY_TYPES[e.type]?.reward||15);
  dropLoot(e);burst(centerX,centerY,'#a8e2bd',18,2.8);
  addCombatText(centerX,centerY-31,'+XP','#c4f5b5');
 }
 return true;
}
function performAttack(){
 if(scene!=='game'||attackCooldown>0||!hero)return;
 const kind=save.class,bonus=equipBonus('damage');
 attackFlash=12;
 if(kind==='warrior'){
  const reach=hasSkill('sword_reach')?98:65;
  attackCooldown=hasSkill('whirlwind')?23:17;
  const swordCenterX=hero.x+hero.w/2,swordCenterY=hero.y+hero.h/2;
  for(const e of bad)if(e.alive){
   const r=enemyRect(e),centerX=r.x+r.w/2,centerY=r.y+r.h/2;
   const dx=centerX-swordCenterX,dy=Math.abs(centerY-swordCenterY);
   const inRange=hasSkill('whirlwind')?Math.abs(dx)<reach+r.w/2:dx*hero.face>=-r.w/2&&dx*hero.face<reach+r.w/2;
   if(inRange&&dy<51+r.h/2){
    damageEnemy(e,2+bonus+(hasSkill('sword_damage')?1:0));
   }
  }
  // The boss uses the same class weapons, upgrades and cooldowns as ordinary enemies.
  if(boss&&boss.alive&&boss.engaged&&Math.abs((boss.y+boss.h/2)-(hero.y+hero.h/2))<90){
   const dx=(boss.x+boss.w/2)-(hero.x+hero.w/2);
   if(hasSkill('whirlwind')?Math.abs(dx)<reach+boss.w/2:dx*hero.face>=-boss.w/2&&dx*hero.face<reach+boss.w/2)
    damageBoss(2+bonus+(hasSkill('sword_damage')?1:0));
  }
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
 // Holding the attack button repeats after cooldown: useful on iPhone.
 // A fresh tap still triggers immediately; release clears repeat pressure.
 if(input.attack&&attackCooldown<=0)performAttack();
 attackWas=input.attack;
 for(const number of combatTexts){number.y-=.65*dt;number.life-=dt;}
 combatTexts=combatTexts.filter(number=>number.life>0);
 for(const p of projectiles){
  p.x+=p.vx*dt;p.y+=p.vy*dt;p.life-=dt;
  for(const e of bad)if(e.alive){
   const r=enemyRect(e);
   if(p.x>r.x-5&&p.x<r.x+r.w+5&&p.y>r.y-5&&p.y<r.y+r.h+5){
    damageEnemy(e,p.damage);p.life=0;break;
   }
  }
  if(p.life>0&&boss&&boss.alive&&boss.engaged&&p.x>boss.x&&p.x<boss.x+boss.w&&p.y>boss.y&&p.y<boss.y+boss.h){
   damageBoss(p.damage);p.life=0;
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
 if(attackFlash>0&&save.class==='warrior'){
  const cx=hero.x+15,cy=hero.y+20,r=hasSkill('sword_reach')?88:67;
  const progress=1-attackFlash/12,start=hero.face>0?-1.25:Math.PI-1.25;
  ctx.strokeStyle='#24313d';ctx.lineWidth=11;ctx.beginPath();
  ctx.arc(cx,cy,r,start+progress*.7,start+.8+progress*.8);ctx.stroke();
  ctx.strokeStyle='#f0e7b8';ctx.lineWidth=5;ctx.beginPath();
  ctx.arc(cx,cy,r,start+progress*.7,start+.8+progress*.8);ctx.stroke();
  ctx.strokeStyle='#ffffffaa';ctx.lineWidth=2;ctx.beginPath();
  ctx.arc(cx,cy,r+4,start+progress*.7,start+.7+progress*.8);ctx.stroke();
 }
 for(const n of combatTexts){
  ctx.save();ctx.globalAlpha=Math.max(0,n.life/n.max);ctx.font='bold 13px monospace';
  ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle='#16212a';
  ctx.strokeText(n.text,Math.round(n.x),Math.round(n.y));
  ctx.fillStyle=n.color;ctx.fillText(n.text,Math.round(n.x),Math.round(n.y));
  ctx.restore();
 }
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
 const kind=save.class,levelTimes=(selected===BOSS_LEVEL?save.bestTimesBossV062:save.bestTimesV08)['1-'+(selected+1)]||{};
 const timeRows=Object.entries(classes).map(([id,c])=>'<div>'+c.label+': '+(levelTimes[id]?formatRunTime(levelTimes[id])+' '+medal(levelTimes[id]):'—')+'</div>').join('');
 const skills=skillCatalog[kind].map(([id,name,desc],i)=>'<button data-skill="'+id+'" '+(save.skills[kind].includes(id)||!save.skillPoints||(i>0&&!save.skills[kind].includes(skillCatalog[kind][i-1][0]))?'disabled':'')+'>'+(save.skills[kind].includes(id)?'✓ ':'✦ ')+name+' – '+desc+'</button>').join('');
 const items=save.inventory.filter(id=>{const o=itemCatalog[id];return o&&(!o.class||o.class===kind)}).map(id=>{
  const o=itemCatalog[id];return '<button data-equip="'+id+'" '+(save.equipment[kind][o.slot]===id?'disabled':'')+'>'+(save.equipment[kind][o.slot]===id?'✓ ':'')+o.name+'</button>';
 }).join('');
 root.innerHTML='<details><summary>[TIME] v0.8-Bestzeiten · '+stages[selected].name+'</summary>'+timeRows+'</details>'+
 '<details><summary>✦ Skilltree · '+save.skillPoints+' Punkte</summary><div class="rpg-options">'+skills+'</div></details>'+
 '<details><summary>[BAG] Ausrüstung · '+save.inventory.length+' Gegenstände</summary><div class="rpg-options">'+items+'</div></details>';
 root.querySelectorAll('[data-skill]').forEach(b=>b.onclick=()=>unlockSkill(b.dataset.skill));
 root.querySelectorAll('[data-equip]').forEach(b=>b.onclick=()=>equipItem(b.dataset.equip));
}
