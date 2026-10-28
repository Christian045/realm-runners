'use strict';
// In-game, locally bundled release notes. No network requests or user data.
const RELEASE_NOTES=[
 {v:'0.9.1',title:'Herzen, Münzen und Level-Feinschliff',items:[
  'Neuer Changelog-Button unten links mit allen bisherigen großen Updates.',
  'Drei große Pixel-Herzen zeigen den Gesundheitszustand direkt an.',
  'Treffer ziehen ein Herz ab: kurze Blinkphase und Rückstoß, aber kein Level-Neustart.',
  'Ein Sturz bringt dich auf die letzte sichere Fläche zurück – Fortschritt bleibt erhalten.',
  'Überarbeitete Goldmünzen mit dunkler Kontur und Glanz sowie ein echter Münzzähler.',
  'Gesammelte Münzen werden als Gold im Spielstand gespeichert.',
  'Bewegliche und einstürzende Plattformen vorerst vollständig deaktiviert.',
  'Einige zusätzliche Dornen machen die langen Level etwas anspruchsvoller.'
 ]},
 {v:'0.9.0',title:'Längere Level und der zornige Schleimkönig',items:[
  'Vier Abenteuerlevel sind jeweils rund 50 Prozent länger geworden.',
  'Mehr Sprungpassagen, Gegner, Dornen und ein Schlosstor am neuen Levelende.',
  'Der Schleimkönig hat 56 HP, verfolgt Magier und Jäger und nutzt drei Angriffsmuster.',
  'Ab halber Gesundheit wird der Boss in Phase II schneller und aggressiver.',
  'Neue Bestzeitenwertung für längere Level und den härteren Boss.'
 ]},
 {v:'0.8.0',title:'Neue Gegner und Kampf-Update',items:[
  'Fledermäuse greifen im Sturzflug an; Pilzmonster verschießen Sporen.',
  'Goblins stürmen nach einer gut sichtbaren Warnung los.',
  'Verbesserte Trefferzonen, Schadenszahlen und Lebensbalken.',
  'Angriffe funktionieren durch Gedrückthalten auch auf dem iPhone.'
 ]},
 {v:'0.7.0',title:'HD-Hintergründe',items:[
  'Wald und Schloss werden in einem eigenen HD-Canvas gezeichnet.',
  'Der spielbare Vordergrund bleibt scharfe Pixel-Art.',
  'Mehr Waldtiefe, weiches Licht und klarere Trennung zum Spieler.'
 ]},
 {v:'0.6.2',title:'Pixel-Kontrast und Boss-Sieg',items:[
  'Schärfere Boden- und Stein-Tiles, ruhigere Hintergrundfarben.',
  'Der Boss-Tod schließt das Bosslevel automatisch ab.',
  'Trefferanzeige und Siegesanimation des Schleimkönigs.'
 ]},
 {v:'0.6.1',title:'Schloss und Plattformmechaniken',items:[
  'Level 1-4 führt zum Tor eines großen Schlosses.',
  'Bewegliche und bröckelnde Plattformen kamen hinzu (seit 0.9.1 pausiert).',
  'Eigener Thronsaal für den Schleimkönig.'
 ]},
 {v:'0.6.0',title:'Zwei zusätzliche Level und Schleimkönig',items:[
  'Neue Level 1-4 und 1-5 mit Burgeingang und Bosskampf.',
  'Erster Schleimkönig mit roter Lebensleiste und Stampfattacke.'
 ]},
 {v:'0.5.0',title:'Präzisere Sprünge und Level-Neugestaltung',items:[
  'Variable Sprunghöhe, Coyote Time und Sprungpuffer.',
  'Drei überarbeitete Abenteuerlevel.',
  'Erste separate Bestzeitenwertung für neue Level.'
 ]},
 {v:'0.4.0',title:'RPG-Fortschritt',items:[
  'Klassen Krieger, Jäger und Magier mit eigenen Angriffen.',
  'XP, Skilltree, Inventar, Ausrüstung und Beute.',
  'Level-Zeitmessung, Medaillen und lokale persönliche Bestzeiten.'
 ]},
 {v:'0.1–0.3',title:'Grundlagen des Jump-and-Runs',items:[
  'Waldlevel, Spielfigur und klassische Jump-and-Run-Steuerung.',
  'Sprünge, Gegner, Münzen, Sterne und lokale Fortschrittsspeicherung.',
  'Grundlegende iPhone-Touch-Steuerung und Pixel-Art.'
 ]}
];
(function setupChangelog(){
 const btn=document.querySelector('#changelogBtn');
 const modal=document.querySelector('#changelogOverlay');
 const closeBtn=document.querySelector('#changelogClose');
 const entries=document.querySelector('#changelogEntries');
 if(!btn||!modal||!closeBtn||!entries)return;
 const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 entries.innerHTML=RELEASE_NOTES.map((note,i)=>'<details class="changelog-release"'+(i===0?' open':'')+'><summary><span class="release-version">v'+escape(note.v)+'</span> '+escape(note.title)+'</summary><ul>'+note.items.map(item=>'<li>'+escape(item)+'</li>').join('')+'</ul></details>').join('');
 let resumeAfterClose=false;
 function openChangelog(){
  resumeAfterClose=scene==='game';
  if(resumeAfterClose)pause();
  modal.classList.remove('hide');btn.setAttribute('aria-expanded','true');
  closeBtn.focus();
 }
 function closeChangelog(){
  if(modal.classList.contains('hide'))return;
  modal.classList.add('hide');btn.setAttribute('aria-expanded','false');
  if(resumeAfterClose&&scene==='pause')resume();
  resumeAfterClose=false;btn.focus();
 }
 btn.addEventListener('click',openChangelog);
 closeBtn.addEventListener('click',closeChangelog);
 modal.addEventListener('click',e=>{if(e.target===modal)closeChangelog();});
 document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!modal.classList.contains('hide')){
   e.preventDefault();e.stopPropagation();closeChangelog();
  }
 },true);
})();
