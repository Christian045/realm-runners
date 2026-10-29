import {CLASSES} from './data.js?v=0.15.0';
import {loadProgress,upgradeCost} from './progression.js';
import {Input} from './input.js';
import {Game} from './game.js?v=0.15.0';
import {Renderer} from './render.js?v=0.15.0';
import {TALENTS,RARITIES,describeStats,talentCost} from './loot.js';
import {installTouchGuard} from './touch-guard.js';
import {CHALLENGES,ACHIEVEMENTS,challengeUnlocked} from './motivation.js';
import {AudioFeedback} from './audio.js';
import {TOWER_LENGTH,towerTransitionOptions} from './tower.js?v=0.15.0';
import {nextTowerRelic} from './tower-relics.js';
import {SPECIALIZATIONS,specializationUnlocked} from './specializations.js';

const $=id=>document.getElementById(id);
const canvas=$('gameCanvas');
installTouchGuard(canvas);
const renderer=new Renderer(canvas),input=new Input(canvas);
const progress=loadProgress();
const game=new Game(progress,input,()=>refreshPanel());
const audio=new AudioFeedback();game.sound=id=>audio.play(id);
let selected=progress.selectedClass;
const icons={warrior:'⚔',hunter:'➶',mage:'✦'};
const label=key=>({vitality:'Lebenskraft',strength:'Waffenschmiede'})[key];
const upgradeDescription=key=>key==='vitality'?'+12 LP pro Stufe':'+8% Schaden pro Stufe';
const fmtTime=s=>{s=Math.max(0,Math.floor(s||0));return Math.floor(s/3600)?Math.floor(s/3600)+':'+String(Math.floor(s/60)%60).padStart(2,'0')+':'+String(s%60).padStart(2,'0'):Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
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
   Object.entries(CLASSES).map(([id,c])=>'<button class="class-card '+(selected===id?'active':'')+'" data-action="class:'+id+'"><canvas class="class-preview" data-hero="'+id+'" width="32" height="36" aria-hidden="true"></canvas><strong>'+c.name+'</strong><small>'+c.subtitle+'</small></button>').join('')+'</div>'+
   '<div class="section-label">SPEZIALISIERUNG</div><div class="specialization-grid">'+
   SPECIALIZATIONS[selected].map(spec=>{
    const unlocked=specializationUnlocked(progress,spec.id);
    return '<button class="specialization-card '+(game.specialization===spec.id?'active':'')+'" data-action="specialization:'+spec.id+'" '+
     (!unlocked?'disabled':'')+'><strong>'+spec.name+(game.specialization===spec.id?' ✓':'')+'</strong>'+
     '<small>'+(unlocked?spec.description:spec.unlock==='boss'?'Besiege einen Boss':'Spiele zwei Runs')+'</small></button>';
   }).join('')+'</div>'+
   '<div class="section-label">HERAUSFORDERUNG</div><div class="challenge-grid">'+
   Object.entries(CHALLENGES).map(([id,m])=>{
    const unlocked=challengeUnlocked(progress,id);
    return '<button data-action="challenge:'+id+'" class="challenge-card '+(game.runMode===id?'active':'')+'" '+(!unlocked?'disabled':'')+'>'+
     '<strong>'+m.name+(game.runMode===id?' ✓':'')+'</strong><small>'+(unlocked?m.description:m.unlock)+
     ' · '+Math.round(m.multiplier*100)+'% Gold</small></button>';
   }).join('')+'</div>'+
   '<button data-action="endless" class="mode-toggle '+(game.endless?'selected':'')+'" '+(progress.bossKills<1?'disabled':'')+'>'+
     (game.endless?'✓ ENDLOS-ABSTIEG AKTIV':'∞ ENDLOS-ABSTIEG')+
     '<small>'+(progress.bossKills<1?'Besiege zuerst einen Boss':'Etagen werden schwieriger · deine Ausrüstung bleibt erhalten')+'</small></button>'+
   '<button data-action="tower" class="mode-toggle tower-toggle '+(game.tower?'selected':'')+'">'+
    (game.tower?'✓ TURM DER ZEHN PRÜFUNGEN AKTIV':'♛ TURM DER ZEHN PRÜFUNGEN')+
    '<small>10 Etagen · auf jeder Etage andere Feinde und ein Boss · der ewige Herrscher als Endgegner</small>'+
    '<small>Bestleistung: '+(progress.towerBest||0)+'/10 · Siege: '+(progress.towerWins||0)+
    (progress.towerBestTime?' · Rekord: '+fmtTime(progress.towerBestTime):'')+'</small></button>'+
   btn('start',game.tower?'TURM BESTEIGEN':game.endless?'ENDLOS-ABSTIEG STARTEN':'DUNGEON BETRETEN','primary')+
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
   '<div class="section-label">ERFOLGE · '+ACHIEVEMENTS.filter(a=>progress.achievements?.[a.id]).length+'/'+ACHIEVEMENTS.length+'</div>'+
   '<div class="achievement-list">'+ACHIEVEMENTS.map(a=>'<div class="achievement '+(progress.achievements?.[a.id]?'unlocked':'')+'">'+
     '<span>'+(progress.achievements?.[a.id]?'★':'◇')+'</span><div><strong>'+a.name+'</strong><small>'+a.description+' · '+Math.min(a.target,progress[a.metric]||0)+'/'+a.target+' · +'+a.reward+' ◆</small></div></div>').join('')+'</div>'+
   '<button class="sound-toggle" data-action="sound">'+(audio.enabled?'♪ TON AN':'♪ TON AUS')+'</button>'+
   '<p class="footnote">WASD bewegen · Maus zielen · Linksklick/F angreifen · Leertaste/Shift ausweichen · Q Spezialfähigkeit · I Inventar<br>Handy: Stick und Aktionsknöpfe. Dein bisheriger Spielstand bleibt erhalten.</p>';
 }else if(game.mode==='stageclear'){
  const stage=game.currentTowerStage();
  title.textContent='ETAGE '+game.floorDepth+' GESCHAFFT!';
  chapter.textContent=stage.boss+' BESIEGT';
  panel.innerHTML='<p>Du hast '+stage.name+' überstanden. Auf Etage '+(game.floorDepth+1)+
   ' wartet ein neuer Gegnertrupp und ein weiterer Boss. Wähle eine Stärkung für deinen Aufstieg.</p>'+
   '<div class="tower-progress">'+Array.from({length:TOWER_LENGTH},(_,i)=>
    '<span class="'+(i<game.floorDepth?'cleared':i===game.floorDepth?'next':'')+'">'+(i+1)+'</span>').join('')+'</div>'+
   '<p class="stage-time">ETAGEN-BESTZEIT: '+fmtTime(progress.towerStageRecords?.[game.floorDepth])+
    ' · GESAMTZEIT: '+fmtTime(game.time)+'</p>'+
   '<div class="upgrade-grid">'+towerTransitionOptions().map(x=>{
    const relic=x.id==='sigil'?nextTowerRelic(game):null;
    const disabled=x.id==='sigil'&&!relic;
    return '<button class="upgrade-card" data-action="towerReward:'+x.id+'" '+(disabled?'disabled':'')+'>'+
     '<strong>✦ '+x.name+'</strong><span>'+x.description+
     (relic?'<small class="relic-preview">NÄCHSTES RELIKT: '+relic.name+' · '+relic.description+'</small>':'')+
     '</span></button>';
   }).join('')+'</div>';
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
 }else if(game.mode==='event'){
  const room=game.activeEvent,kind=room?.eventKind;
  if(kind==='library'){
   title.textContent='VERGESSENE BIBLIOTHEK';chapter.textContent='DAS RÄTSEL DER DREI RUNEN';
   const riddles=['Ich tanze und verzehre Holz, doch ohne Nahrung sterbe ich.',
    'Ich falle vom Himmel und fülle die Flüsse, doch habe keine Gestalt.',
    'Ich erscheine nachts am Himmel und lenke die Gezeiten.'];
   panel.innerHTML='<p>In einer staubigen Schriftrolle steht:</p><p class="rune-riddle">'+riddles[room.runeAnswer]+'</p>'+
    '<p>Welche Rune löst das Siegel? Bei einer falschen Antwort verlierst du 16 LP.</p>'+
    '<div class="upgrade-grid">'+
    btn('event:rune0','ᚠ · FEUER','secondary')+
    btn('event:rune1','ᛚ · WASSER','secondary')+
    btn('event:rune2','ᛟ · MOND','secondary')+
    '</div>';
  }else if(kind==='camp'){
   title.textContent='VERLASSENES LAGER';chapter.textContent='EINE RUHEPAUSE';
   panel.innerHTML='<p>Ein warmes Feuer, alte Vorräte und eine Karte auf einem Tisch.</p><div class="upgrade-grid">'+
    btn('event:rest','AUSRUHEN · 38 % LP HEILEN','secondary')+
    btn('event:scout','KARTE LESEN · UMGEBUNG AUFDECKEN','secondary')+
    btn('event:trade','HANDEL · 35 GOLD FÜR SELTENE BEUTE','secondary',game.runCoins<35?'disabled':'')+
    '</div>';
  }else if(kind==='vault'){
   title.textContent='VERSIEGELTES GEWÖLBE';chapter.textContent='DER GOLDENE SCHLÜSSEL';
   panel.innerHTML='<p>Hinter dem Tor liegt hochwertige Ausrüstung. Du kannst einen Runenschlüssel benutzen, das Schloss bezahlen oder die Tür gewaltsam öffnen.</p>'+
    '<div class="upgrade-grid">'+
    btn('event:key','RUNENSCHLÜSSEL EINSETZEN','secondary',!game.libraryKey?'disabled':'')+
    btn('event:gold','60 GOLD ZAHLEN','secondary',game.runCoins<60?'disabled':'')+
    btn('event:force','AUFBRECHEN · 25 LP OPFERN','secondary',game.player.hp<=35?'disabled':'')+
    btn('event:leave','GEWÖLBE VERLASSEN','secondary')+'</div>';
  }else{
   title.textContent=kind==='forge'?'VERGESSENE SCHMIEDE':'VERFLUCHTER ALTAR';
   chapter.textContent=kind==='forge'?'EINE GABE DES FEUERS':'WAGEN ODER WEITERZIEHEN';
   panel.innerHTML=kind==='forge'
    ?'<p>Ein alter Amboss glüht zwischen den Ruinen. Wähle eine Belohnung.</p>'+
     btn('event:reforge','SCHMIEDEFUND · SELTENE AUSRÜSTUNG + 12 GOLD','primary')+
     btn('event:repair','RUHEPAUSE · +32 LP','secondary')
    :'<p>Der Altar fordert einen Elitekampf. Besiegst du die Gegner, winken zusätzliche Belohnungen.</p>'+
     btn('event:challenge','PRÜFUNG ANNEHMEN · STÄRKERE GEGNER','primary')+
     btn('event:leave','WEITERZIEHEN · +15 GOLD','secondary');
  }
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
  title.textContent=won?(game.tower?'TURM BEZWUNGEN!':'SIEG!'):'GEFALLEN';
  chapter.textContent=won?(game.tower?'DER EWIGE HERRSCHER IST BESIEGT':'DER BOSS IST BESIEGT'):
   game.tower?'DER AUFSTIEG ENDET AUF ETAGE '+game.floorDepth:'EIN NEUER RUN WARTET';
  panel.innerHTML='<p>'+(won?
   game.tower?'Du hast alle zehn Etagen überlebt und den ewigen Herrscher endgültig besiegt!':'Du hast das Herz des Dungeons bezwungen.':
   'Deine Reise endet hier. Gesammeltes Gold und dauerhafte Verbesserungen bleiben erhalten.')+'</p>'+
   (game.tower?'<div class="tower-victory">'+(won?'♛ DER TURM IST DEIN!':'DER TURM FORDERT SEINEN TRIBUT')+
    '<small>Spielzeit: '+fmtTime(game.time)+(won&&game.towerNewRecord?' · NEUER REKORD!':'')+'</small>'+
    '<small>Persönlicher Rekord: '+(progress.towerBestTime?fmtTime(progress.towerBestTime):'Noch kein vollständiger Sieg')+
    ' · Turm-Relikte: '+game.towerRelics.length+'/6</small></div>':'')+
   '<div class="summary"><div>KAMMERN<strong>'+game.clearCount+'</strong></div><div>GOLD<strong>+'+game.earnedGold+'</strong></div><div>ETAGE<strong>'+game.floorDepth+'</strong></div></div>'+
   (game.achievementsEarned?.length?'<p class="earned-achievements">NEUE ERFOLGE: '+game.achievementsEarned.map(a=>a.name+' (+'+a.reward+' ◆)').join(' · ')+'</p>':'')+
   btn('restart','NOCH EIN RUN','primary')+btn('menu','ZUM HAUPTMENÜ');
 }
 if(game.mode==='menu'){
  for(const preview of panel.querySelectorAll('canvas[data-hero]')){
   const frame=renderer.sprites.frame(preview.dataset.hero,'idle',0,'down');
   if(!frame)continue;
   const paint=preview.getContext('2d');if(!paint)continue;
   paint.imageSmoothingEnabled=false;paint.clearRect(0,0,32,36);paint.drawImage(frame,0,0);
  }
 }
}
$('panelContent').addEventListener('click',e=>{
 const element=e.target.closest('button[data-action]');if(!element)return;
 const [action,value,extra]=element.dataset.action.split(':');
 if(action==='class'){selected=value;game.chooseClass(value)}
 if(action==='challenge')game.setChallenge(value);
 if(action==='specialization')game.selectSpecialization(value);
 if(action==='endless')game.setEndless(!game.endless);
 if(action==='tower')game.setTower(!game.tower);
 if(action==='towerReward')game.chooseTowerReward(value);
 if(action==='sound'){audio.toggle();refreshPanel()}
 if(action==='event')game.chooseEvent(value);
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
 $('roomText').textContent=(hud.tower?'TURM '+hud.floor+'/10':'E'+hud.floor)+' · '+hud.rooms+' / '+(hud.totalRooms-1);
 $('coinText').innerHTML=hud.coins+' <span class="coin">◆</span>';
 $('biomeText').textContent=hud.tower?hud.stageName.toUpperCase():({crypt:'GRUFT',fungal:'PILZGROTTE',flooded:'ÜBERFLUTETE HALLEN'}[hud.biome]||'DUNGEON');
 $('inventoryBtn').textContent='RUCKSACK ('+hud.inventory+')';
 $('classTag').textContent=hud.className.toUpperCase();
 $('dashLabel').textContent=hud.dash>0?'DASH '+hud.dash.toFixed(1)+'s':'DASH BEREIT';
 $('abilityLabel').textContent=hud.ability>0?'Q: '+hud.ability.toFixed(1)+'s':'Q: '+CLASSES[game.player.kind].ability;
 const boss=hud.boss;
 $('bossHud').classList.toggle('hidden',!boss||game.mode!=='playing');
 if(boss){
  $('bossName').textContent=boss.name;
  $('bossFill').style.width=(100*boss.hp/boss.maxHp)+'%';
  $('bossPhase').textContent=boss.phase===3?'PHASE III · LETZTER ZORN':boss.phase===2?'PHASE II · ENTFESSELT':'PHASE I';
  $('bossHud').classList.toggle('enraged',boss.phase===2);
  const names={volley:'GIFT-SALVE',slam:'SCHLAG AUS DEM HIMMEL',charge:'ANSTURM',nova:'SPORENSTURM',summon:'VERSTÄRKUNG',lances:'RUNENLANZEN',triple:'DREIFACH-SCHLAG',spiral:'ARKANER WIRBEL',soulbeam:'SEELENSTRAHLEN',spiralwall:'SPIRALWELLE',blades:'FINSTERNISKLINGEN',pincer:'ZANGENANGRIFF',fracture:'BODENSPALTEN',sweep:'KRISTALLBARRIERE',fan:'GESCHOSSFÄCHER',mark:'MARKIERTER EINSCHLAG',ring:'RUNDUM-WELLE',dash:'STURMANGRIFF',cross:'KREUZFEUER',meteor:'METEORITEN',orbit:'SPIRALSALVE',eclipse:'FINSTERNIS-NOVA'};
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
