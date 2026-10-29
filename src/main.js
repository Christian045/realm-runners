import {CLASSES} from './data.js';
import {loadProgress,upgradeCost} from './progression.js';
import {Input} from './input.js';
import {Game} from './game.js';
import {Renderer} from './render.js';
import {TALENTS,RARITIES,describeStats,talentCost} from './loot.js';
import {installTouchGuard} from './touch-guard.js';

const $=id=>document.getElementById(id);
const canvas=$('gameCanvas');
installTouchGuard(canvas);
const renderer=new Renderer(canvas),input=new Input(canvas);
const progress=loadProgress();
const game=new Game(progress,input,()=>refreshPanel());
let selected=progress.selectedClass;
const icons={warrior:'⚔',hunter:'➶',mage:'✦'};
const label=key=>({vitality:'Lebenskraft',strength:'Waffenschmiede'})[key];
const upgradeDescription=key=>key==='vitality'?'+12 LP pro Stufe':'+8% Schaden pro Stufe';
const btn=(action,text,cls='secondary',extra='')=>'<button type="button" class="'+cls+'" data-action="'+action+'" '+extra+'>'+text+'</button>';
function refreshPanel(){
 const overlay=$('overlay'),panel=$('panelContent'),playing=game.mode==='playing';
 overlay.classList.toggle('hidden',playing);
 $('hud').classList.toggle('hidden',!game.player);
 $('pauseBtn').classList.toggle('hidden',!playing);
 $('inventoryBtn').classList.toggle('hidden',!playing);
 $('abilityHud').classList.toggle('hidden',!game.player);
 $('bossHud').classList.toggle('hidden',!playing||!game.getActiveBoss());
 $('biomeText').classList.toggle('hidden',!playing);
 $('mobileControls').style.display=playing?'':'none';
 if(playing)return;
 const title=$('overlay').querySelector('h1'),chapter=$('overlay').querySelector('.chapter');
 if(game.mode==='menu'){
  title.innerHTML='REALM<br><em>RUNNERS</em>';chapter.textContent='DUNGEON REBORN';
  panel.innerHTML='<div class="section-label">WÄHLE DEINEN HELDEN</div><div class="class-grid">'+
   Object.entries(CLASSES).map(([id,c])=>'<button class="class-card '+(selected===id?'active':'')+'" data-action="class:'+id+'"><span class="class-icon">'+icons[id]+'</span><strong>'+c.name+'</strong><small>'+c.subtitle+'</small></button>').join('')+'</div>'+
   btn('start','DUNGEON BETRETEN','primary')+
   '<div class="section-label">PERMANENTE VERBESSERUNGEN · '+progress.gold+' ◆</div><div class="meta-row">'+
   ['vitality','strength'].map(k=>'<div class="meta-card"><strong>'+label(k)+' · '+progress.upgrades[k]+'/5</strong>'+upgradeDescription(k)+
    '<button data-action="buy:'+k+'" '+(progress.gold<upgradeCost(progress,k)||progress.upgrades[k]>=5?'disabled':'')+'>'+(progress.upgrades[k]>=5?'MAXIMUM':'KAUFEN · '+upgradeCost(progress,k)+' ◆')+'</button></div>').join('')+'</div>'+
   '<div class="section-label">KLASSENTALENTE · '+CLASSES[selected].name.toUpperCase()+'</div><div class="talent-grid">'+
   TALENTS[selected].map(t=>{
    const level=progress.talents?.[selected]?.[t.id]||0,price=talentCost(level);
    return '<div class="talent-card"><strong>'+t.name+' · '+level+'/3</strong><small>'+t.description+'</small>'+
     '<button data-action="talent:'+selected+':'+t.id+'" '+(level>=3||progress.gold<price?'disabled':'')+'>'+
     (level>=3?'MAXIMAL':'FREISCHALTEN · '+price+' ◆')+'</button></div>';
   }).join('')+'</div>'+
   '<p class="footnote">WASD bewegen · Maus zielen · Linksklick/F angreifen · Leertaste/Shift ausweichen · Q Spezialfähigkeit · I Inventar<br>Auf dem Handy: Stick und Aktionsknöpfe. Alte Spielstände bleiben erhalten.</p>';
 }else if(game.mode==='upgrade'){
  title.textContent='RELIKT';chapter.textContent='WÄHLE DEINE MACHT';
  panel.innerHTML='<p>Die Kammer ist gesäubert. Wähle eine Verbesserung für diesen Durchgang.</p><div class="upgrade-grid">'+
   game.upgradeChoices.map(u=>'<button class="upgrade-card" data-action="upgrade:'+u.id+'"><strong>✦ '+u.name+'</strong><span>'+u.description+'</span></button>').join('')+'</div>';
 }else if(game.mode==='shrine'){
  title.textContent='ALTER SCHREIN';chapter.textContent='DREI WEGE · EINE ENTSCHEIDUNG';
  panel.innerHTML='<p>In dieser stillen Kammer kannst du eine Gabe wählen.</p>'+
   '<div class="upgrade-grid">'+
   btn('shrine:heal','HEILUNG · 42 % LP WIEDERHERSTELLEN','secondary')+
   btn('shrine:power','SEGEN · +12 % SCHADEN FÜR DIESEN RUN','secondary')+
   btn('shrine:risk','OPFER · 20 LP FÜR SELTENE AUSRÜSTUNG','secondary',game.player.hp<=25?'disabled':'')+
   '</div>';
 }else if(game.mode==='inventory'){
  title.textContent='AUSRÜSTUNG';chapter.textContent='WAFFEN · RÜSTUNG · RELIKTE';
  const p=game.player;
  const equipped=['weapon','armor','charm'].map(slot=>{
   const k={weapon:'WAFFE',armor:'RÜSTUNG',charm:'RELIKT'}[slot],item=p.equipment[slot];
   return '<div class="equip-slot"><strong>'+k+'</strong><span style="color:'+(item?RARITIES[item.rarity].color:'#91ada8')+'">'+
    (item?item.name:'Nicht ausgerüstet')+'</span></div>';
  }).join('');
  const items=p.inventory.map(item=>'<button class="inventory-item" data-action="equip:'+item.id+'" '+
   (p.equipment[item.slot]?.id===item.id?'disabled':'')+'>'+
   '<strong style="color:'+RARITIES[item.rarity].color+'">'+item.name+'</strong>'+
   '<small>'+RARITIES[item.rarity].name+' · '+item.slot.toUpperCase()+' · '+describeStats(item)+'</small>'+
   '<span>'+(p.equipment[item.slot]?.id===item.id?'AUSGERÜSTET':'AUSRÜSTEN')+'</span></button>').join('');
  panel.innerHTML='<div class="equip-grid">'+equipped+'</div><div class="section-label">GEFUNDENE AUSRÜSTUNG · '+p.inventory.length+'/18</div>'+
   '<div class="inventory-list">'+(items||'<p>Du hast noch keine Gegenstände gefunden.</p>')+'</div>'+
   btn('closeInventory','ZUM SPIEL ZURÜCK','primary');
 }else if(game.mode==='paused'){
  title.textContent='PAUSE';chapter.textContent='ATME DURCH';
  panel.innerHTML='<p>Der Dungeon wartet auf dich.</p>'+btn('resume','WEITERSPIELEN','primary')+btn('menu','ZUM HAUPTMENÜ');
 }else if(game.mode==='dead'||game.mode==='victory'){
  const won=game.mode==='victory';
  title.textContent=won?'SIEG!':'GEFALLEN';chapter.textContent=won?'DER SCHLEIMKÖNIG IST BESIEGT':'EIN NEUER RUN WARTET';
  panel.innerHTML='<p>'+(won?'Du hast das Herz des Dungeons bezwungen.':'Deine Reise endet hier. Gesammeltes Gold und dauerhafte Verbesserungen bleiben erhalten.')+'</p>'+
   '<div class="summary"><div>KAMMERN<strong>'+game.clearCount+'</strong></div><div>GOLD<strong>+'+game.earnedGold+'</strong></div><div>ZEIT<strong>'+Math.floor(game.time/60)+':'+String(Math.floor(game.time%60)).padStart(2,'0')+'</strong></div></div>'+
   btn('restart','NOCH EIN RUN','primary')+btn('menu','ZUM HAUPTMENÜ');
 }
}
$('panelContent').addEventListener('click',e=>{
 const element=e.target.closest('button[data-action]');if(!element)return;
 const [action,value,extra]=element.dataset.action.split(':');
 if(action==='class'){selected=value;game.chooseClass(value)}
 if(action==='start'||action==='restart')game.start(selected);
 if(action==='buy')game.purchase(value);
 if(action==='talent')game.purchaseTalent(value,extra);
 if(action==='shrine')game.chooseShrine(value);
 if(action==='equip')game.equip(value);
 if(action==='closeInventory')game.toggleInventory();
 if(action==='upgrade')game.selectUpgrade(value);
 if(action==='resume'){game.mode='playing';game.notify()}
 if(action==='menu'){game.mode='menu';game.notify()}
});
$('pauseBtn').addEventListener('click',()=>{if(game.mode==='playing'){game.mode='paused';game.notify()}});
$('inventoryBtn').addEventListener('click',()=>game.toggleInventory());
window.addEventListener('keydown',e=>{
 if(e.code==='Escape'){
  if(game.mode==='playing'){game.mode='paused';game.notify()}
  else if(game.mode==='paused'){game.mode='playing';game.notify()}
 }
 if(e.code==='KeyI'&&!e.repeat)game.toggleInventory();
 if(e.code==='Enter'&&game.mode==='menu')game.start(selected);
});
function updateHud(){
 const hud=game.getHud();if(!hud)return;
 $('hpText').textContent=hud.hp+' / '+hud.maxHp;
 $('hpFill').style.width=Math.max(0,hud.hp/hud.maxHp*100)+'%';
 $('roomText').textContent=hud.rooms+' / 9';
 $('coinText').innerHTML=hud.coins+' <span class="coin">◆</span>';
 $('biomeText').textContent={crypt:'GRUFT',fungal:'PILZGROTTE',flooded:'ÜBERFLUTETE HALLEN'}[hud.biome]||'DUNGEON';
 $('inventoryBtn').textContent='RUCKSACK ('+hud.inventory+')';
 $('classTag').textContent=hud.className.toUpperCase();
 $('dashLabel').textContent=hud.dash>0?'DASH '+hud.dash.toFixed(1)+'s':'DASH BEREIT';
 $('abilityLabel').textContent=hud.ability>0?'Q: '+hud.ability.toFixed(1)+'s':'Q: '+CLASSES[game.player.kind].ability;
 const boss=hud.boss;
 $('bossHud').classList.toggle('hidden',!boss||game.mode!=='playing');
 if(boss){
  $('bossName').textContent=boss.name;
  $('bossFill').style.width=(100*boss.hp/boss.maxHp)+'%';
  $('bossPhase').textContent=boss.phase===2?'PHASE II · ENTFESSELT':'PHASE I';
  $('bossHud').classList.toggle('enraged',boss.phase===2);
  const names={volley:'GIFT-SALVE',slam:'SCHLAG AUS DEM HIMMEL',charge:'ANSTURM',nova:'SPORENSTURM',summon:'VERSTÄRKUNG',lances:'RUNENLANZEN',triple:'DREIFACH-SCHLAG',spiral:'ARKANER WIRBEL'};
  $('bossHint').textContent=boss.transitioning?'PHASENWECHSEL · KURZE VERSCHNAUFPAUSE':boss.attack?'WARNUNG · '+names[boss.attack]:'BEOBACHTE SEINE BEWEGUNGEN';
 }
}
let last=0,accumulator=0,hudTime=0;
function frame(now){
 const delta=Math.min(.05,(now-last)/1000||0);last=now;
 if(game.mode==='playing'){
  accumulator+=delta;
  let steps=0;
  while(accumulator>=1/60&&steps<4){renderer.updateCamera(game);game.update(1/60,game.camera);accumulator-=1/60;steps++}
  if(steps===4)accumulator=0;
 }else accumulator=0;
 renderer.updateCamera(game);
 renderer.draw(game);
 if(now-hudTime>90){updateHud();hudTime=now}
 requestAnimationFrame(frame);
}
refreshPanel();requestAnimationFrame(frame);
