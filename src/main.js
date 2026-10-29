import {CLASSES} from './data.js?v=0.15.0';
import {loadProgress,upgradeCost} from './progression.js?v=0.20.0';
import {ENEMY_NAMES,totalKills,formatPlayTime} from './statistics.js?v=0.20.0';
import {Input} from './input.js?v=0.19.3';
import {Game} from './game.js?v=0.20.0';
import {Renderer} from './render.js?v=0.19.4';
import {TALENTS,RARITIES,describeStats,talentCost} from './loot.js?v=0.16.0';
import {ITEM_SETS,RUN_POWERS,setPieces} from './buildcraft.js?v=0.16.0';
import {installTouchGuard} from './touch-guard.js';
import {CHALLENGES,ACHIEVEMENTS,challengeUnlocked} from './motivation.js';
import {AudioFeedback} from './audio.js';
import {TOWER_LENGTH,towerTransitionOptions} from './tower.js?v=0.17.0';
import {towerDifficultySummary} from './difficulty-director.js?v=0.18.0';
import {nextTowerRelic} from './tower-relics.js';
import {SPECIALIZATIONS,specializationUnlocked} from './specializations.js';

const $=id=>document.getElementById(id);
const canvas=$('gameCanvas');
installTouchGuard(canvas);
const renderer=new Renderer(canvas),input=new Input(canvas);
const progress=loadProgress();
const game=new Game(progress,input,()=>refreshPanel());
const audio=new AudioFeedback();game.sound=id=>audio.play(id);
let selected=progress.selectedClass,menuTab='play';
const icons={warrior:'⚔',hunter:'➶',mage:'✦',glasscannon:'◇',summoner:'♜',alchemist:'⚗'};
const label=key=>({vitality:'Lebenskraft',strength:'Waffenschmiede'})[key];
const upgradeDescription=key=>key==='vitality'?'+12 LP pro Stufe':'+8% Schaden pro Stufe';
const achievementTitle=()=>progress.achievements?.noHitWin?'✦ UNBERÜHRBAR':
 progress.achievements?.thousandRuns?'✦ EWIGER WANDERER':
 progress.achievements?.boss100?'✦ BOSSJÄGER':
 progress.achievements?.damage10k?'✦ MEISTER DER KLINGEN':'';
const fmtTime=s=>{s=Math.max(0,Math.floor(s||0));return Math.floor(s/3600)?Math.floor(s/3600)+':'+String(Math.floor(s/60)%60).padStart(2,'0')+':'+String(s%60).padStart(2,'0'):Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
const btn=(action,text,cls='secondary',extra='')=>'<button type="button" class="'+cls+'" data-action="'+action+'" '+extra+'>'+text+'</button>';

const safeText=value=>String(value).replace(/[&<>"']/g,char=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[char]);
const numberText=value=>Math.floor(Number(value)||0).toLocaleString('de-DE');
function statisticsNavigation(){
 return '<nav class="castle-tabs" aria-label="Menübereiche">'+
  '<button type="button" data-action="menuTab:play" aria-pressed="'+(menuTab==='play')+'" class="'+(menuTab==='play'?'selected':'')+'">⚔ SPIELEN</button>'+
  '<button type="button" data-action="menuTab:stats" aria-pressed="'+(menuTab==='stats')+'" class="'+(menuTab==='stats'?'selected':'')+'">▤ STATISTIKEN</button></nav>';
}
function renderStatistics(){
 const stats=progress.statistics;
 const cards=[
  ['Gesamtspielzeit',formatPlayTime(stats.playTime)],
  ['Runs abgeschlossen',numberText(progress.runs)],
  ['Erfolgreiche Runs',numberText(stats.victories)],
  ['Tode',numberText(stats.deaths)],
  ['Boss-Siege',numberText(progress.bossKills)],
  ['Gegner besiegt',numberText(totalKills(stats))],
  ['Schaden verursacht',numberText(stats.damageDealt)],
  ['Schaden erlitten',numberText(stats.damageTaken)]
 ];
 const monsterList=Object.entries(ENEMY_NAMES).filter(([type])=>type!=='boss')
  .sort((a,b)=>(stats.kills[b[0]]||0)-(stats.kills[a[0]]||0)||a[1].localeCompare(b[1]))
  .map(([type,label])=>'<div class="stats-row"><span>'+safeText(label)+'</span><strong>'+
   numberText(stats.kills[type]||0)+'</strong></div>').join('');
 const bosses=Object.entries(stats.bosses).sort((a,b)=>b[1]-a[1])
  .map(([name,count])=>'<div class="stats-row"><span>'+safeText(name)+'</span><strong>'+
   numberText(count)+'</strong></div>').join('')||
   '<p class="stats-empty">Noch keine Boss-Siege seit Einführung der Statistik.</p>';
 const runList=stats.recentRuns.map(run=>{
  const className=CLASSES[run.classKind]?.name||'Krieger';
  const date=run.date?new Date(run.date).toLocaleDateString('de-DE'):'';
  return '<div class="stats-run"><div><strong class="'+(run.won?'won':'lost')+'">'+
   (run.won?'SIEG':'NIEDERLAGE')+'</strong><span>'+safeText(run.mode)+' · '+
   safeText(className)+' · '+date+'</span></div><small>Etage '+run.floor+
   ' · '+formatPlayTime(run.seconds)+' · '+numberText(run.kills)+' Kills · '+
   numberText(run.damageDealt)+' Schaden</small></div>';
 }).join('')||'<p class="stats-empty">Noch keine abgeschlossenen Runs seit dem Statistik-Update.</p>';
 return '<section class="stats-dashboard" aria-label="Spielstatistiken">'+
  '<div class="section-label">DEINE SPIELERCHRONIK</div>'+
  '<div class="stats-metrics">'+cards.map(([label,value])=>
   '<div class="stats-metric"><span>'+label+'</span><strong>'+value+'</strong></div>').join('')+'</div>'+
  '<div class="stats-columns"><section><h2>GEGNER BESIEGT</h2><div class="stats-row boss-total"><span>Alle Bosse</span><strong>'+
    numberText(stats.kills.boss||0)+'</strong></div>'+monsterList+'</section>'+
  '<section><h2>BOSSE NACH NAME</h2>'+bosses+
    '<h2 class="stats-recent-heading">LETZTE RUNS</h2><div class="stats-runs">'+runList+'</div></section></div>'+
  '<p class="stats-footnote">Bereits vorhandene Runs und Boss-Siege wurden aus deinem bisherigen Spielstand übernommen. Spielzeit, Tode, einzelne Gegnerkills und Run-Ergebnisse werden ab Version 0.20.0 gezählt. Angefangene oder abgebrochene Runs werden nicht als Sieg oder Tod gewertet.</p>'+
  '</section>';
}

function refreshPanel(){
 const overlay=$('overlay'),panel=$('panelContent'),playing=game.mode==='playing';
 const panelShell=overlay.querySelector('.panel'),isMenu=game.mode==='menu';
 // Keep advanced tabs, the selected item and the scroll position when a
 // purchase, equipment change or mode choice causes a full panel re-render.
 const sameScreen=!playing&&overlay.dataset.renderMode===game.mode;
 const previousView=sameScreen?{
  scroll:panelShell.scrollTop,
  items:panel.querySelector('.inventory-list')?.scrollTop||0,
  expanded:[...panel.querySelectorAll('.castle-advanced')].map((node,i)=>node.open?i:-1).filter(i=>i>=0),
  focused:panel.contains(document.activeElement)?document.activeElement?.dataset?.action:null
 }:null;
 if(overlay.dataset.renderMode!==game.mode)input.resetTransient();
 overlay.dataset.renderMode=game.mode;
 overlay.classList.toggle('hidden',playing);
 overlay.classList.toggle('castle-menu',isMenu);
 overlay.classList.toggle('stats-tab',isMenu&&menuTab==='stats');
 // Menu typography is intentionally cinematic; gameplay decisions use compact dialogs.
 overlay.classList.toggle('dialog-view',!playing&&!isMenu);
 overlay.classList.toggle('dialog-inventory',game.mode==='inventory');
 overlay.classList.toggle('dialog-choice',['event','shrine','shop','upgrade','stageclear'].includes(game.mode));
 $('hud').classList.toggle('hidden',!game.player);
 $('pauseBtn').classList.toggle('hidden',!playing);
 $('inventoryBtn').classList.toggle('hidden',!playing);
 $('abilityHud').classList.toggle('hidden',!playing);
 $('statusHud').classList.toggle('hidden',!playing);
 $('bossHud').classList.toggle('hidden',!playing||!game.getActiveBoss());
 $('mobileControls').style.display=playing?'':'none';
 if(playing)return;
 const title=$('overlay').querySelector('h1'),chapter=$('overlay').querySelector('.chapter');
 if(game.mode==='menu'){
  title.innerHTML='REALM<br><em>RUNNERS</em>';chapter.textContent=menuTab==='stats'?'DEINE CHRONIK':'DUNGEON REBORN';
  if(menuTab==='stats'){panel.innerHTML=renderStatistics()}else{
  panel.innerHTML='<div class="castle-stage"><span class="castle-stage-caption">DIE HALLE DER HELDEN</span><div class="castle-hero"><canvas data-hero="'+selected+'" width="32" height="36" aria-label="Ausgewählter Charakter"></canvas></div><span class="castle-hero-name">'+CLASSES[selected].name+'</span><span class="castle-hero-sub">'+CLASSES[selected].subtitle+'</span>'+(achievementTitle()?'<span class="castle-hero-title">'+achievementTitle()+'</span>':'')+'</div><div class="section-label">WÄHLE DEINEN HELDEN</div><div class="class-grid">'+
   Object.entries(CLASSES).map(([id,c])=>'<button class="class-card '+(selected===id?'active':'')+'" data-action="class:'+id+'"><canvas class="class-preview" data-hero="'+id+'" width="32" height="36" aria-hidden="true"></canvas><strong>'+c.name+'</strong><small>'+c.subtitle+'</small></button>').join('')+'</div>'+
   (selected==='summoner'?'<div class="section-label">DIENER FÜR DEN NÄCHSTEN RUN</div><div class="castle-servants">'+
    [['guardian','WÄCHTER','Nahkampf, Schild'],['ranger','SCHÜTZE','Fernkampf'],['spirit','GEIST','Heilung']].map(([id,name,role])=>
    '<button data-action="servant:'+id+'" class="servant-card '+(game.servantChoice===id?'selected':'')+'"><strong>'+name+'</strong><small>'+role+'</small></button>').join('')+'</div>':'')+
   '<details class="castle-advanced"><summary>KLASSE ANPASSEN · SPEZIALISIERUNG</summary><div class="section-label">SPEZIALISIERUNG</div><div class="specialization-grid">'+
   SPECIALIZATIONS[selected].map(spec=>{
    const unlocked=specializationUnlocked(progress,spec.id);
    return '<button class="specialization-card '+(game.specialization===spec.id?'active':'')+'" data-action="specialization:'+spec.id+'" '+
     (!unlocked?'disabled':'')+'><strong>'+spec.name+(game.specialization===spec.id?' ✓':'')+'</strong>'+
     '<small>'+(unlocked?spec.description:spec.unlock==='boss'?'Besiege einen Boss':'Spiele zwei Runs')+'</small></button>';
   }).join('')+'</div>'+
   '</details><details class="castle-advanced"><summary>HERAUSFORDERUNG EINSTELLEN</summary><div class="section-label">HERAUSFORDERUNG</div><div class="challenge-grid">'+
   Object.entries(CHALLENGES).map(([id,m])=>{
    const unlocked=challengeUnlocked(progress,id);
    return '<button data-action="challenge:'+id+'" class="challenge-card '+(game.runMode===id?'active':'')+'" '+(!unlocked?'disabled':'')+'>'+
     '<strong>'+m.name+(game.runMode===id?' ✓':'')+'</strong><small>'+(unlocked?m.description:m.unlock)+
     ' · '+Math.round(m.multiplier*100)+'% Gold</small></button>';
   }).join('')+'</div>'+
   '</details><div class="section-label castle-mode-title">WÄHLE DEIN ABENTEUER</div><div class="castle-mode-list"><button data-action="normal" class="mode-toggle '+(!game.tower&&!game.endless?'selected':'')+'">⚔ NORMALER DUNGEON<small>13 Räume · Beute · Bosse · neue Ausrüstung</small></button>'+
   '<button data-action="endless" class="mode-toggle '+(game.endless?'selected':'')+'" '+(progress.bossKills<1?'disabled':'')+'>'+
     (game.endless?'✓ ENDLOS-ABSTIEG AKTIV':'∞ ENDLOS-ABSTIEG')+
     '<small>'+(progress.bossKills<1?'Besiege zuerst einen Boss':'Etagen werden schwieriger · deine Ausrüstung bleibt erhalten')+'</small></button>'+
   '<button data-action="tower" class="mode-toggle tower-toggle '+(game.tower?'selected':'')+'">'+
    (game.tower?'✓ TURM DER ZEHN PRÜFUNGEN AKTIV':'♛ TURM DER ZEHN PRÜFUNGEN')+
    '<small>10 Etagen · auf jeder Etage andere Feinde und ein Boss · der ewige Herrscher als Endgegner</small>'+
    '<small>Bestleistung: '+(progress.towerBest||0)+'/10 · Siege: '+(progress.towerWins||0)+
    (progress.towerBestTime?' · Rekord: '+fmtTime(progress.towerBestTime):'')+'</small></button></div>'+
   btn('start',game.tower?'TURM BESTEIGEN':game.endless?'ENDLOS-ABSTIEG STARTEN':'DUNGEON BETRETEN','primary')+
   '<details class="castle-advanced"><summary>VERBESSERUNGEN · '+progress.gold+' ◆</summary><div class="section-label">PERMANENTE VERBESSERUNGEN · '+progress.gold+' ◆</div><div class="meta-row">'+
   ['vitality','strength'].map(k=>'<div class="meta-card"><strong>'+label(k)+' · '+progress.upgrades[k]+'/5</strong>'+upgradeDescription(k)+
    '<button data-action="buy:'+k+'" '+(progress.gold<upgradeCost(progress,k)||progress.upgrades[k]>=5?'disabled':'')+'>'+(progress.upgrades[k]>=5?'MAXIMUM':'KAUFEN · '+upgradeCost(progress,k)+' ◆')+'</button></div>').join('')+'</div>'+
   '</details><details class="castle-advanced"><summary>KLASSENTALENTE · '+CLASSES[selected].name.toUpperCase()+'</summary><div class="section-label">KLASSENTALENTE · '+CLASSES[selected].name.toUpperCase()+'</div><div class="talent-grid">'+
   TALENTS[selected].map(t=>{
    const level=progress.talents?.[selected]?.[t.id]||0,price=talentCost(level,t),max=t.branch?1:3;
    const required=t.branch&&(progress.talents?.[selected]?.[t.requires]||0)<t.requiredLevel;
    const source=TALENTS[selected].find(x=>x.id===t.requires);
    return '<div class="talent-card '+(t.branch?'talent-branch':'')+'"><strong>'+
     (t.branch?'◆ ':'')+t.name+' · '+level+'/'+max+'</strong><small>'+t.description+'</small>'+
     (t.branch?'<small>'+(required?'BENÖTIGT: '+source?.name+' STUFE '+t.requiredLevel:'KLASSENMEISTERSCHAFT ✓')+'</small>':'')+
     '<button data-action="talent:'+selected+':'+t.id+'" '+(level>=max||required||progress.gold<price?'disabled':'')+'>'+ 
     (level>=max?'MAXIMAL':'FREISCHALTEN · '+price+' ◆')+'</button></div>';
   }).join('')+'</div>'+
   '</details><details class="castle-advanced"><summary>ERFOLGE</summary><div class="section-label">ERFOLGE · '+ACHIEVEMENTS.filter(a=>progress.achievements?.[a.id]).length+'/'+ACHIEVEMENTS.length+'</div>'+
   '<div class="achievement-list">'+ACHIEVEMENTS.map(a=>'<div class="achievement '+(progress.achievements?.[a.id]?'unlocked':'')+'">'+
     '<span>'+(progress.achievements?.[a.id]?'★':'◇')+'</span><div><strong>'+a.name+'</strong><small>'+a.description+' · '+Math.min(a.target,a.metric.split('.').reduce((v,key)=>v?.[key],progress)||0)+'/'+a.target+' · +'+a.reward+' ◆</small></div></div>').join('')+'</div>'+
   '</details><button class="sound-toggle" data-action="sound">'+(audio.enabled?'♪ TON AN':'♪ TON AUS')+'</button>'+
   '<p class="footnote">WASD bewegen · Maus zielen · Linksklick/F angreifen · Leertaste/Shift ausweichen · Q Spezialfähigkeit · I Inventar<br>Handy: Stick und Aktionsknöpfe. Dein bisheriger Spielstand bleibt erhalten.</p>';
  }
  panel.innerHTML=statisticsNavigation()+panel.innerHTML;
 }else if(game.mode==='stageclear'){
  const stage=game.currentTowerStage();
  title.textContent='ETAGE '+game.floorDepth+' GESCHAFFT!';
  chapter.textContent=stage.boss+' BESIEGT';
  panel.innerHTML='<p>Du hast '+stage.name+' überstanden. Auf Etage '+(game.floorDepth+1)+
   ' wartet ein neuer Gegnertrupp und ein weiterer Boss. Wähle eine Stärkung für deinen Aufstieg.</p>'+
   '<p class="stage-time">NÄCHSTE ETAGE: '+towerDifficultySummary(game.floorDepth+1)+'</p>'+
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
 }else if(game.mode==='shop'){
  title.textContent='DUNGEON-HÄNDLER';chapter.textContent='SELTENE WAREN · RUN-GOLD';
  panel.innerHTML='<p>Der Händler verkauft Ausrüstung für diesen Durchgang. Dein Gold: <strong>'+game.runCoins+' ◆</strong></p>'+
   '<div class="upgrade-grid">'+game.shopStock.map(offer=>
    '<button class="upgrade-card" data-action="shop:'+offer.id+'" '+
    (offer.sold||game.runCoins<offer.price||game.player.inventory.length>=18?'disabled':'')+'>'+
    '<strong style="color:'+RARITIES[offer.item.rarity].color+'">'+
    (offer.sold?'VERKAUFT · ':'')+safeText(offer.item.name)+'</strong>'+
    '<span>'+RARITIES[offer.item.rarity].name+' · '+describeStats(offer.item)+'</span>'+
    '<small>KAUFEN · '+offer.price+' ◆</small></button>').join('')+'</div>'+
    btn('shop:leave','HÄNDLER VERLASSEN','primary');
 }else if(game.mode==='upgrade'){
  title.textContent='RELIKT';chapter.textContent='WÄHLE DEINE MACHT';
  panel.innerHTML='<p>Die Kammer ist gesäubert. Wähle eine Verbesserung für diesen Durchgang.</p><div class="upgrade-grid">'+
   game.upgradeChoices.map(u=>'<button class="upgrade-card '+(RUN_POWERS[game.player.kind].some(r=>r.id===u.id)?'build-choice':'')+'" data-action="upgrade:'+u.id+'"><strong>✦ '+u.name+'</strong><span>'+u.description+'</span></button>').join('')+'</div>'+
   '<p class="build-summary">DEIN BUILD: '+(game.player.upgradeIds.filter(id=>RUN_POWERS[game.player.kind].some(r=>r.id===id)).map(id=>RUN_POWERS[game.player.kind].find(r=>r.id===id).name).join(' · ')||'Noch keine Klassenfähigkeit')+'</p>';
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
  const equipped=['weapon','armor','charm','amulet','ring1','ring2'].map(slot=>{
   const k={weapon:'WAFFE',armor:'RÜSTUNG',charm:'RELIKT',amulet:'AMULETT',ring1:'RING I',ring2:'RING II'}[slot],item=p.equipment[slot];
   return '<div class="equip-slot"><strong>'+k+'</strong><span style="color:'+(item?RARITIES[item.rarity].color:'#91ada8')+'">'+
    (item?item.name:'Nicht ausgerüstet')+'</span></div>';
  }).join('');
  const items=p.inventory.map(item=>'<button class="inventory-item" data-action="equip:'+item.id+'" '+
   (p.equipment[item.slot]?.id===item.id?'disabled':'')+'>'+
   '<strong style="color:'+RARITIES[item.rarity].color+'">'+item.name+'</strong>'+
   '<small>'+RARITIES[item.rarity].name+' · '+item.slot.toUpperCase()+' · '+describeStats(item)+'</small>'+
   '<span>'+(p.equipment[item.slot]?.id===item.id?'AUSGERÜSTET':'AUSRÜSTEN')+'</span></button>').join('');
  const setSummary='<div class="section-label">AUSRÜSTUNGSSETS · BONI AB ZWEI TEILEN</div><div class="equip-grid">'+
   Object.entries(ITEM_SETS).map(([id,set])=>'<div class="equip-slot"><strong style="color:'+set.color+'">'+
    set.name+' · '+setPieces(p,id)+'/2'+(setPieces(p,id)>=2?' ✓':'')+'</strong><small>'+set.description+'</small></div>').join('')+'</div>';
  const buildSummary='<div class="section-label">AKTIVER BUILD</div><p>'+
   (p.masteries?.map(id=>TALENTS[p.kind].find(t=>t.id===id)?.name||id).join(' · ')||'Noch keine Meisterschaft')+
   ' · '+(p.upgradeIds.filter(id=>RUN_POWERS[p.kind].some(t=>t.id===id)).map(id=>RUN_POWERS[p.kind].find(t=>t.id===id).name).join(' · ')||'Keine Run-Fähigkeit')+'</p>';
  panel.innerHTML='<div class="equip-grid equip-grid-six">'+equipped+'</div>'+setSummary+buildSummary+'<div class="section-label">GEFUNDENE AUSRÜSTUNG · '+p.inventory.length+'/18</div>'+
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
    (progress.statistics.recentRuns.length?(()=>{
     const run=progress.statistics.recentRuns[0];
     return '<div class="run-report"><strong>DEIN RUN IM ÜBERBLICK</strong>'+
      '<span>Spielzeit: '+fmtTime(run.seconds)+' · Gegner: '+run.kills+
      ' · Bosse: '+run.bosses+'</span>'+
      '<span>Schaden: '+run.damageDealt+' verursacht · '+run.damageTaken+' erlitten</span>'+
      (game.runMode==='nohit'?'<span>'+(won?'NO-HIT SIEG ✓':'NO-HIT VERSUCH BEENDET')+'</span>':'')+'</div>';
    })():'')+
   (game.achievementsEarned?.length?'<p class="earned-achievements">NEUE ERFOLGE: '+game.achievementsEarned.map(a=>a.name+' (+'+a.reward+' ◆)').join(' · ')+'</p>':'')+
   btn('restart','NOCH EIN RUN','primary')+btn('menu','ZUM HAUPTMENÜ');
 }
 // Screen-specific title sizing prevents long German headings from overflowing.
 title.classList.toggle('long-title',!isMenu&&(title.textContent||'').trim().length>17);
 if(game.mode==='menu'){
  for(const preview of panel.querySelectorAll('canvas[data-hero]')){
   const frame=renderer.sprites.frame(preview.dataset.hero,'idle',0,'down');
   if(!frame)continue;
   const paint=preview.getContext('2d');if(!paint)continue;
   paint.imageSmoothingEnabled=false;paint.clearRect(0,0,32,36);paint.drawImage(frame,0,0);
  }
 }
 if(previousView){
  const sections=[...panel.querySelectorAll('.castle-advanced')];
  for(const i of previousView.expanded)if(sections[i])sections[i].open=true;
  panelShell.scrollTop=previousView.scroll;
  const list=panel.querySelector('.inventory-list');
  if(list)list.scrollTop=previousView.items;
  const target=[...panel.querySelectorAll('button[data-action]')]
   .find(button=>button.dataset.action===previousView.focused&&!button.disabled);
  target?.focus({preventScroll:true});
 }
}
$('panelContent').addEventListener('click',e=>{
 const element=e.target.closest('button[data-action]');if(!element)return;
 const [action,value,extra]=element.dataset.action.split(':');
 if(action==='menuTab'){
  if(game.mode==='menu'&&['play','stats'].includes(value)){
   menuTab=value;
   $('overlay').querySelector('.panel').scrollTop=0;
   refreshPanel();
  }
  return;
 }
 if(action==='class'){selected=value;game.chooseClass(value)}
 if(action==='challenge')game.setChallenge(value);
 if(action==='specialization')game.selectSpecialization(value);
 if(action==='servant')game.setServant(value);
 if(action==='normal'){game.setTower(false);game.setEndless(false)}
 if(action==='endless')game.setEndless(!game.endless);
 if(action==='tower')game.setTower(!game.tower);
 if(action==='towerReward')game.chooseTowerReward(value);
 if(action==='sound'){audio.toggle();refreshPanel()}
 if(action==='event')game.chooseEvent(value);
 if(action==='shop')game.chooseShop(value);
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
 if(e.code==='Escape'&&!e.repeat){
  if(game.mode==='playing'){game.mode='paused';game.notify()}
  else if(game.mode==='paused'){game.mode='playing';game.notify()}
  else if(game.mode==='inventory')game.toggleInventory();
 }
 if(e.code==='KeyI'&&!e.repeat&&['playing','inventory'].includes(game.mode))game.toggleInventory();
 // Enter on a focused menu control should activate that control, not start a run.
 if(e.code==='Enter'&&!e.repeat&&game.mode==='menu'&&menuTab==='play'&&
  !e.target?.closest?.('button,summary,input,select,textarea,a,[role="button"]'))game.start(selected);
});
function updateHud(){
 const hud=game.getHud();if(!hud)return;
 $('hpText').textContent=hud.hp+' / '+hud.maxHp;
 $('hpFill').style.width=Math.max(0,hud.hp/hud.maxHp*100)+'%';
 $('roomText').textContent=(hud.tower?'TURM '+hud.floor+'/10':'E'+hud.floor)+' · '+hud.rooms+' / '+(hud.totalRooms-1);
 $('coinText').innerHTML=hud.coins+' <span class="coin">◆</span>';
 $('inventoryBtn').textContent='RUCKSACK ('+hud.inventory+')';
 const dash=$('dashLabel'),ability=$('abilityLabel');
 dash.textContent=hud.dash>0?'DASH · '+hud.dash.toFixed(1)+'s':'DASH ✓';
 dash.classList.toggle('ready',hud.dash<=0);
 const abilityName=CLASSES[game.player.kind].ability;
 ability.textContent=hud.ability>0?'Q · '+hud.ability.toFixed(1)+'s':'Q · '+abilityName;
 ability.title=abilityName;
 ability.classList.toggle('ready',hud.ability<=0);
 const states=game.player?.statuses||{};
 const statusLabels={poison:'GIFT',burn:'FEUER',stun:'BETÄUBT',slow:'LANGSAM',rot:'FÄULNIS',mark:'TODESMARKE'};
 const statuses=Object.entries(statusLabels).filter(([key])=>states[key]>0)
  .map(([key,label])=>'<span class="'+key+'">'+label+' · '+states[key].toFixed(1)+'s</span>').join('');
 $('statusHud').innerHTML=statuses;
 $('statusHud').classList.toggle('hidden',!statuses||game.mode!=='playing');
 const boss=hud.boss;
 $('bossHud').classList.toggle('hidden',!boss||game.mode!=='playing');
 if(boss){
  $('bossName').textContent=boss.name;
  $('bossFill').style.width=(100*boss.hp/boss.maxHp)+'%';
  $('bossPhase').textContent=boss.phase===3?'PHASE III · LETZTER ZORN':boss.phase===2?'PHASE II · ENTFESSELT':'PHASE I';
  $('bossHud').classList.toggle('enraged',boss.phase===2);
  const names={volley:'GIFT-SALVE',slam:'SCHLAG AUS DEM HIMMEL',charge:'ANSTURM',nova:'SPORENSTURM',summon:'VERSTÄRKUNG',lances:'RUNENLANZEN',triple:'DREIFACH-SCHLAG',spiral:'ARKANER WIRBEL',soulbeam:'SEELENSTRAHLEN',spiralwall:'SPIRALWELLE',blades:'FINSTERNISKLINGEN',pincer:'ZANGENANGRIFF',fracture:'BODENSPALTEN',sweep:'KRISTALLBARRIERE',fan:'GESCHOSSFÄCHER',mark:'MARKIERTER EINSCHLAG',ring:'RUNDUM-WELLE',dash:'STURMANGRIFF',cross:'KREUZFEUER',meteor:'METEORITEN',orbit:'SPIRALSALVE',eclipse:'FINSTERNIS-NOVA'};
  const hint=$('bossHint');
  hint.textContent=boss.transitioning?'PHASENWECHSEL':boss.attack?'ACHTUNG · '+(names[boss.attack]||'BOSSANGRIFF'):'';
  hint.classList.toggle('hidden',!boss.transitioning&&!boss.attack);
 }
}
let last=0,accumulator=0,hudTime=0,lastMenuPreview=-1;
function animateMenuPreviews(now){
 if(game.mode!=='menu'||document.hidden)return;
 const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const tick=reducedMotion?0:Math.floor(now/380);
 if(tick===lastMenuPreview)return;
 lastMenuPreview=tick;
 for(const preview of document.querySelectorAll('#panelContent canvas[data-hero]')){
  const sprite=renderer.sprites.frame(preview.dataset.hero,'idle',tick%4,'down');
  const paint=preview.getContext('2d');
  if(!sprite||!paint)continue;
  paint.imageSmoothingEnabled=false;
  paint.clearRect(0,0,preview.width,preview.height);
  paint.drawImage(sprite,0,0,preview.width,preview.height);
 }
}
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
 animateMenuPreviews(now);
 if(now-hudTime>90){updateHud();hudTime=now}
 requestAnimationFrame(frame);
}
window.addEventListener('pagehide',()=>game.saveStatistics());
document.addEventListener('visibilitychange',()=>{if(document.hidden)game.saveStatistics()});
refreshPanel();requestAnimationFrame(frame);
