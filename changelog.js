'use strict';
// In-game, locally bundled release notes. No network requests or user data.
const RELEASE_NOTES=[
 {v:'0.16.0',title:'Richtige Abschnitte bereinigt und schlanke Bäume',items:[
  'Versunkene Ruinen und Königstraße: die großen aufgesetzten Stein-/Stufenblöcke sind entfernt. Der Weg folgt dem zusammenhängenden Gelände.',
  'Große schwarze Ruinentore und rechteckige Straßentürme weichen kleinen verwitterten Steinresten; Dekoration bleibt sparsam.',
  'Baumkronen bekommt die Bäume mit begehbaren Ästen zurück: deutlich schlankere Stämme, dünne auslaufende Äste und kleinere Kronen.',
  'Sonnenpfad, Level-Längen, Sprungphysik, Touch-Steuerung und der Schleimkönig bleiben erhalten.',
  'Neue Rekorde nur für die drei überarbeiteten Abschnitte; alte Zeiten und RPG-Fortschritt bleiben gespeichert.'
 ]},
 {v:'0.15.0',title:'Baumkronen ohne Brücken',items:[
  'Alle fünf Brücken-/Astplattformen in Baumkronen sind vollständig aus der Spielgeometrie entfernt.',
  'Zusammenhängende bewachsene Felsrücken und breitere Hügel ersetzen die frei stehenden Konstruktionen.',
  'Auch dekorative Querbalken und Pfosten entfallen. Moos und kleine Farne wachsen direkt auf dem Boden.',
  'Die drei Sterne liegen als erreichbare Sprungziele über den Kuppen; alle Klassen können den Abschnitt ohne Dash abschließen.',
  'Nur Baumkronen bekommt neue Bestzeiten. Die anderen Level, der Boss, Steuerung und vorhandene Spielstände bleiben erhalten.'
 ]},
 {v:'0.14.0',title:'Aufgeräumtes Menü und natürliche Baumformen',items:[
  'Update-Texte stehen ausschließlich im Updates-Fenster. Die Steuerungshilfe ist einklappbar.',
  'Welt und Level können per Doppelklick oder Doppeltippen direkt gestartet werden. Einzelklick öffnet die Welt beziehungsweise wählt ein Level aus.',
  'Enter startet den ausgewählten Abschnitt, Escape führt zur Weltübersicht zurück. Auswählen erhält Kartenfokus und Scrollposition.',
  'Die dicken eckigen Baumstammkästen wurden durch niedrige, runde Stämme mit sichtbaren Jahresringen ersetzt.',
  'Holzdecks auf Pfosten sind durch kürzere, organische Äste ersetzt. Verzweigte Baumstämme tragen die Äste sichtbar bis zum Boden.',
  'Klassen, Sprungphysik, Level-Längen, Bossraum und RPG-Fortschritt bleiben erhalten. Neue Zeiten unter bestTimesV14; frühere Rekorde bleiben bestehen.'
 ]},
 {v:'0.13.0',title:'Zusammenhängende Landschaften und natürliche Laufwege',items:[
  'Sonnenpfad: echte sanfte Erdhügel, breite Senken und niedrige verwurzelte Baumstämme.',
  'Baumkronen: feste, breite Holzwege und Äste mit sichtbar geerdeten Stämmen.',
  'Ruinen: begehbare, zerbrochene Treppen und niedrige Mauerreste. Königstraße: breite Steinstufen bis zur Burg.',
  'Die verstreuten Boden-Spikes sind entfernt. Höhen, Sprünge und gezielte Gegner bilden die Herausforderungen.',
  'Gegner, Münzen und Dekoration folgen dem neuen Boden; echte Kollisionskanten an den festen Stufen.',
  'Längen, Sprungphysik und Bossraum bleiben erhalten. Eigene v0.13-Levelrekorde, historische Zeiten und RPG-Fortschritt bleiben bestehen.'
 ]},

 {v:'0.12.0',title:'Leveldesign mit sinnvollen Hindernissen',items:[
  'Jeder Abschnitt hat passende echte Hindernisse: Waldbaumstämme, Wurzelhürden, eingestürzte Ruinensteine und Burgbarrikaden.',
  'Hindernisse stehen auf tragendem Boden, lassen sich überspringen und sind nicht mit Gegnern und Dornen überladen.',
  'Unpassende Metallstacheln im Wald wurden durch natürliche Dornenbüsche und Wurzeln ersetzt; die Zahl wurde reduziert.',
  'In den Ruinen und der Burg sitzen wenige gut angekündigte Pfeilfallen direkt an vorhandenen Säulen und Türmen.',
  'Pfeilfallen zeigen vor dem Angriff ein oranges ! und eine Schusslinie; Sprünge oder Dash schützen.',
  'Ruhige Abschnitte wechseln sich mit Sprüngen und Kämpfen ab; Weltlänge, Boss und bewährte Steuerung bleiben gleich.',
  'Neue Level-Bestzeiten für v0.12, ältere Rekorde bleiben im Spielstand.'
 ]},

 {v:'0.11.0',title:'Längere Bodenlevel und zentraler Bossraum',items:[
  'Alle vier Abenteuerstrecken sind rund 80 Prozent länger geworden.',
  'Lange Bodenwege statt vieler niedriger Plattformen; nur vier bis sechs abgestützte erhöhte Wege pro Level.',
  'Keine Plattform-Ketten mehr kurz vor den Ausgängen, längere klare Zielgeraden.',
  'Die Königstraße führt jetzt weiter bis zum passend versetzten Schlosstor.',
  'Der Schleimkönig kämpft in einem mittig gestalteten, bildschirmbreiten Schlossraum mit sichtbaren Seitenwänden.',
  'Neue Bestzeiten und Medaillen für längere Strecken sowie die neue Bossarena; alte Rekorde bleiben erhalten.'
 ]},

 {v:'0.10.1',title:'Kulissen am Boden, weniger Münzen, Updates im Hauptmenü',items:[
  'Bäume, Hängepflanzen, Ruinentore und Burgmauern stehen jetzt auf überprüften Bodenflächen statt über Abgründen.',
  'Burgzufahrt und Boden-Dekorationen wurden auf tragfähige Positionen angepasst.',
  'Münzen erscheinen seltener, gezielt auf sicherem Boden und nicht mehr als durchgehende Reihen.',
  'Der Versionsverlauf ist ausschließlich in der Haupt-Weltübersicht erreichbar.'
 ]},

 {v:'0.10.0',title:'Vier einzigartige Level, Weltkarte und neue Ausgänge',items:[
  'Startmenü neu geordnet: zuerst Welt 1 auswählen, dann eine Karte mit fünf Abschnitten.',
  'Für jedes Level siehst du die Sterne, Freischaltung und Bestzeit deiner aktuellen Klasse direkt auf der Karte.',
  'Sonnenpfad, Baumkronen, Versunkene Ruinen und Königstraße haben jetzt eigene Routen, Hindernisse und Kulissen.',
  'Keine unsichtbare Zielgrenze oder Standardflagge mehr: thematische Portale und eine sanfte Eintrittsanimation.',
  'Sterne erscheinen als gut sichtbare, goldene Pixel-Icons – im Level und im HUD.',
  'Goblins und Fledermäuse pausieren. An den Gegnerpositionen erscheinen bei jedem Versuch zufällig Schleime oder Pilzmonster.',
  'Für die völlig neuen Levelkarten starten eigene v0.10-Bestzeiten; ältere Rekorde bleiben erhalten.'
 ]},

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
 // Only available from the world overview; never blocks game controls.
 function openChangelog(){
  if(scene!=='menu'||menuView!=='worlds')return;
  cancelMenuTap();modal.classList.remove('hide');btn.setAttribute('aria-expanded','true');
  closeBtn.focus();
 }
 function closeChangelog(){
  if(modal.classList.contains('hide'))return;
  modal.classList.add('hide');btn.setAttribute('aria-expanded','false');
  btn.focus();
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
