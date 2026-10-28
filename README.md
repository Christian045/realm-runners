# Realm Runners v0.13 – natürliche Landschaften und flüssige Laufwege

**Spielen: https://christian045.github.io/realm-runners/?v=0.13.0**

## Neu in v0.13

- **Echte Landschaftsformen:** Kontinuierliche Erdhügel, breite Senken und ebene Erholungspassagen. Gezeichnete Oberkante und Kollision verwenden dieselbe Höhenfunktion; die Figur folgt Steigungen und Gefällen ohne kleine Hüpfer.
- **Sonnenpfad:** sanfte Hügel, Senken und niedrige verwurzelte Baumstämme. **Baumkronen:** breite, feste Holzwege mit sichtbar geerdeten Stämmen und Ästen auf verschiedenen Höhen.
- **Versunkene Ruinen:** drei zusammenhängende Gruppen aus zerbrochenen Steintreppen und Mauerresten. **Königstraße:** breite, abgestufte Steinpodeste und der ruhige befestigte Anlauf zum Burgtor.
- **Keine verstreuten Boden-Spikes mehr:** Die Abwechslung entsteht durch Wegform, Sprünge und gezielte Gegner. Keine neuen Pfeilfallen, Schockwellen oder beweglichen/einstürzenden Plattformen.
- **Alles steht auf dem Boden:** Gegner patrouillieren auf dem Höhenprofil und kehren vor Abgründen oder Mauern um. Münzen und Vordergrund-Dekoration folgen den neuen Höhen. Sterne belohnen die festen oberen Wege.
- **Echte Wände an festen Stufen:** Baumstamm- und Mauerblöcke lassen sich überspringen, aber nicht seitlich durchlaufen. Baumäste bleiben von unten durchspringbar.
- **Erhalten:** die vier Level-Längen 7.380 / 7.740 / 7.920 / 8.100, Klassen, Sprungparameter, Touch-Steuerung und der gesamte Schleimkönig-Kampf.
- **Speicherkompatibilität:** neue Abenteuerrekorde unter `bestTimesV13`. `bestTimesV12`, `bestTimesV11` und alle älteren Zeiten bleiben erhalten; der unveränderte Boss verwendet weiterhin `bestTimesBossV11`. Gold, XP, Ausrüstung, Skills und Freischaltungen bleiben bestehen.

### v0.13 auf Windows und iPhone prüfen

1. Die obige URL im bisherigen Browser öffnen. Im Menü muss **„LEBENDIGE LAUFWEGE · 0.13.0“** stehen. Keine Website-Daten löschen.
2. Sonnenpfad: über die erste Hügelkuppe laufen; auch bergab muss die Figur am Boden bleiben. Den niedrigen Stamm überspringen und auf seinem festen Rand landen.
3. Baumkronen: die festen Äste von unten anspringen; ihre oberen Wege ausprobieren. Ruinen: die drei Treppengruppen vorwärts und rückwärts durchspringen. Königstraße: die breiten Stufen und das Burgtor erreichen.
4. Auf jedem Level Münzen und Sterne sammeln; Gegner auf erhöhtem/abgesenktem Grund prüfen. Keine schwebenden Pickups oder im Boden steckenden Gegner.
5. Auf dem iPhone Bewegung halten und mit einem zweiten Finger kurz/lange springen, Dash und Angriff nutzen. App-Wechsel, Pause und Fortsetzen prüfen.
6. Einen Abschnitt abschließen und neu laden: XP, Gold, Sterne und Freischaltungen bleiben erhalten. Alte v0.11-Zeiten werden erhalten, neue Abenteuerrekorde getrennt geführt.
7. Level 1-5: Bossraum, sichtbare Seitenwände, Angriffe und Phase II wie vorher testen.

Die automatisierten Tests prüfen auch komplette Streckendurchläufe mit allen drei Klassen, ohne Dash oder Bewegungsausrüstung. Browser-Tests in Chromium/WebKit ersetzen keinen echten iPhone-Test.

---

## Frühere Updates

## Neu in v0.12 – Levelideen statt zufälliger Dornen

Die großen, bodenorientierten Level und die zentrale Bossarena aus v0.11 bleiben unverändert. Statt willkürlich verteilter Metallstacheln sind die vier Spielabschnitte nun als **handgebaute, logisch platzierte Herausforderungen** gestaltet:

- **1-1 Sonnenpfad:** Fünf überspringbare, auf sicherem Waldboden liegende Baumstämme; fünf natürliche Dornenhecken, sonst genügend Raum für Gegnerbegegnungen und Ruhephasen.
- **1-2 Baumkronen:** Fünf niedrige, echte Wurzelhürden, die von den Waldbäumen ausgehen, fünf klar erkennbar dunkle Wurzeldornen und weiterhin optionale hohe Wege mit Sternen.
- **1-3 Versunkene Ruinen:** Fünf eingestürzte Steinhaufen, sechs passende Steinboden-Stachelfallen und zwei deutlich angekündigte Pfeilscharten, fest an tragenden Ruinenpfeilern montiert.
- **1-4 Königstraße:** Fünf solide, nicht-stachelige Burgbarrikaden, nur vier Metallfallen sowie zwei Pfeilscharten an stehenden Wehrtürmen.
- **Physische Hindernisse:** 29–39 Pixel hohe Baumstämme/Wurzeln/Steine/Barrikaden stoppen normales Durchlaufen; ihre Oberseiten sind begehbar, alle drei Klassen können sie mit einem normalen Sprung überwinden. Keine Spezialfähigkeit oder Dash nötig.
- **Pfeilfallen mit Vorwarnung:** 42 Simulationsframes orangefarbenes **!** und eine Schusslinie zeigen die Richtung; danach genau ein Pfeil, gefolgt von einer langen Pause. Springen oder Dash vermeidet Treffer. Bei Kontakt geht nur ein Herz verloren (mit alter Blink-Immunität).
- **Autorenprüfung der Platzierung:** Kollisionsobjekte stehen auf durchgehendem Boden, mit freiem Anlauf und Auslauf; keine gleichzeitig gestapelten Gegner, Dornen oder Abgründe. Vor den Levelausgängen bleibt ein langer ruhiger Laufabschnitt.
- **Eindeutige Grafik:** Dunkle Konturen und klar verschiedene Pixel-Formen für Holz, Wurzeln, Mauerwerk und Holzschilde; Dornen im Wald wirken organisch, Metallfallen stehen nur dort, wo es Ruinen und Burg gibt.
- **Neue Zeitwertung:** `bestTimesV12` erfasst die überarbeiteten Strecken separat. Rekorde v0.4–v0.11, Gold, Sterne, RPG-Fortschritt und der unveränderte Boss-Zeitenstand bleiben erhalten.
- Bewegliche oder einstürzende Plattformen und Fledermäuse/Goblins bleiben weiterhin deaktiviert.

**iPhone-Check:** Die URL mit `?v=0.12.0` aufrufen. Die Startmarkierung ist „THEMEN-LEVEL & FALLEN · 0.12.0“. In den Ruinen und auf der Königstraße besonders die gut sichtbaren Warnzeichen und das Ausweichen testen. Keine Safari-Websitedaten löschen.




### v0.11 – lange Bodenstrecken und eine zentral sichtbare Bossarena

**Spielen: https://christian045.github.io/realm-runners/**

## Neu in v0.11 – Laufstrecken statt Plattform-Ketten

- **Ca. 80 % längere Level:** Sonnenpfad 7.380 statt 4.100, Baumkronen 7.740 statt 4.300, Versunkene Ruinen 7.920 statt 4.400 und Königstraße 8.100 statt 4.500 Welt-Einheiten.
- **Bodenorientiertes Leveldesign:** Längere Laufstrecken und klar gesetzte Abgründe, Dornen und Schleim-/Pilzmonster-Begegnungen. Weniger unnötige Luftplattformen: nur noch 4, 5, 6 bzw. 4 klar erhöhte Hochwege. Ihre Baum- und Steinstützen reichen sichtbar bis zum Boden. Keine Hochwege im letzten Abschnitt vor dem Ausgang.
- **Sauberer Levelausgang:** Jeweils eine längere, fast freie Zielgerade ohne Plattform-Haufen; die vorhandenen Tor- und Abschlussanimationen bleiben erhalten. Der Schlosseingang und die Burgmauer wurden an das Ende der neuen 8.100er-Königstraße versetzt.
- **Zentraler Bossraum ohne unsichtbare Wand:** Die Schlossarena belegt genau die sichtbare 960×540-Canvas-Welt. Kamera fixiert, Spieler links der Mitte, König rechts der Mitte, beide echte, sichtbare Raumwände direkt am Bildschirmrand. Es gibt keine plötzlich mitten im Raum endende Spielfläche mehr.
- **Kampf bleibt erhalten:** Schleimkönig weiterhin 56 HP, Stampf- und Schockwellenangriff, Schleimsalve, Ansturm sowie Phase II, aber seine Warnungen, Projektile und die Spielerbewegung verwenden jetzt die neue gesamte Arena.
- **Faire Zeiten:** Neue `bestTimesV11` und `bestTimesBossV11` mit angepassten Medaillen, alle früheren Rekorde und der ganze RPG-Spielstand bleiben bestehen.
- **Pixel-Look, Münzen und Sterne:** Die bisherigen gut erkennbaren Icons, die sparsam platzierten Münzen, statischen Plattformen und HD-Hintergründe bleiben erhalten.

**iPhone-Test:** `?v=0.11.0` an die Spiel-URL anhängen. Kontrolliere **„LÄNGERE STRECKEN & BOSSARENA · 0.11.0“** und prüfe besonders, ob du bis zur sichtbaren rechten Schlosswand laufen kannst. Safari-Website-Daten keinesfalls löschen.



## Neu in v0.10.1 – saubere Kulissen und ruhigere Sammelobjekte

- **Keine schwebende Dekoration über Abgründen:** Alle größeren Bäume, Wipfelstämme, Tempel-Torbögen und Burgtürme sind jetzt auf ihren echten Grundflächen geprüft. Insbesondere die Ruinenbögen haben zwei geerdete Säulen; die Königstraße setzt ihre Türme nicht mehr auf Luft. Hängende Pflanzen wachsen sichtbar aus Ästen statt aus dem Nichts.
- **Bodenobjekte dürfen nicht über Gruben hinausragen:** Pilze, Felsen, Kristalle und Fackeln erhalten dieselbe Fundamentprüfung. Der große Burgeingang bleibt erreichbar und stimmig.
- **Weniger Münzen:** Statt einer durchgehenden Münzreihe liegen nun nur 11–13 bewusst platzierte Münzen pro Abenteuerlevel auf sicheren Bodenabschnitten. Abgründe, Dornen und das Leveltor bleiben frei; Bossraum und Sterne sind unverändert.
- **Changelog nur noch im echten Hauptmenü:** Der „📜 Updates“-Knopf erscheint ausschließlich in der Weltübersicht. Auf der Levelauswahl, im laufenden Spiel, beim Pausieren und am Levelende ist er ausgeblendet und kann nicht geöffnet werden.
- Alle vorhandenen Spielstände, Goldbestände, Sterne, Bestzeiten und Kampffunktionen bleiben erhalten.

**Auf dem iPhone:** Neue Version `?v=0.10.1` aufrufen und auf **„KULISSEN & LEVELPOLITUR · 0.10.1“** achten. Website-Daten nicht löschen.



## Neu in v0.10 – eine Welt, vier eigenständige Abenteuer

- **Weltkarte:** Zuerst „Welt 1 · Smaragdwald“ auswählen, danach auf einer eigenen Ebene die fünf Levelkarten ansehen und den freigeschalteten Abschnitt starten. Weitere Welten sind als gesperrte Vorschauen gekennzeichnet.
- **Bestzeiten auf der Karte:** Jede Karte zeigt die Anzahl gesammelter Sterne, den Freischaltstatus, den Schwierigkeitsgrad und die persönliche Bestzeit der ausgewählten Klasse; die Spielstände anderer Klassen bleiben erhalten.
- **Sonnenpfad (4.100 Einheiten):** Helle Lichtungen, breite Wege, leichte Baumstamm-Sprünge.
- **Baumkronen (4.300):** Hohe Ranken, gestaffelte Äste und sechs anspruchsvollere Abgründe.
- **Versunkene Ruinen (4.400):** Alte Steinbögen, enge Passagen, zerfallenes Mauerwerk und Dornengruppen.
- **Königstraße (4.500):** Wehranlagen, Höhenwege und der schlüssige Weg durch das Schlosstor.
- **Saubere Levelabschlüsse:** Kein Zielflaggen-Auslösen oder unsichtbarer rechter Rand mehr. Jedes Abenteuer endet an einem thematisch passenden, sichtbar leuchtenden Tor mit eigener Eintrittsanimation.
- **Pixel-Sterne:** Goldene Sterne mit dunkler Kontur und Highlights im Level und als eigenes Symbol neben dem Sternenzähler oben links, passend zu Herz- und Münz-Icons.
- **Zufällige Gegner:** Nur Schleime und Pilzmonster erscheinen an festgelegten Stellen in neuer Mischung pro Versuch, beide Arten garantiert. Goblins und Fledermäuse sind für eine spätere Welt zurückgestellt.
- **Neue Bestzeiten:** Die geänderten vier Abenteuerlevel bekommen `bestTimesV10`. Ältere Zeiten und die Bestzeiten des unveränderten Bosskampfes bleiben erhalten.
- Beibehalten: 3 Herzen mit Treffer-Immunität, permanente Münzen, starre Plattformen, Bosskampf mit Phase II, HD-Kulissen, Klassen-RPG und iPhone-Multitouch.

**Safari-Tipp:** `?v=0.10.0` an die Spiel-URL anhängen; keine Website-Daten löschen. Im Menü erscheint „WELTKARTE & NEUE LEVEL · 0.10.0“.


## Neu in v0.9.1 – Herzen und Münzen statt Level-Neustart

- **Versionsverlauf:** Ein pixeliger **„📜 Updates“-Button unten links** öffnet ein scrollbares Changelog von den frühen Versionen bis v0.9.1. Während des Spiels wird automatisch pausiert und beim Schließen fortgesetzt. Funktioniert über Touch und Tastatur.
- **Drei große Pixel-Herzen im HUD:** Bei einem Treffer wird ein Herz leer, die Figur blinkt rund 1,4 Sekunden und bekommt einen kurzen Rückstoß. In dieser Zeit ist sie gegen weitere Treffer geschützt. **Position, gesammelte Sterne/Münzen, Gegnerstatus, Timer und Boss-HP bleiben erhalten.** Erst mit dem letzten verlorenen Herz ist Game Over.
- **Abgründe:** Statt eines Level-Resets wird die Figur auf die letzte sichere Plattform zurückgesetzt, mit einem verlorenen Herz. Ein Sturz während der Immunitätsphase kostet kein weiteres Herz.
- **Überarbeitete Goldmünzen:** Klar gerasterte, konturierte Gold-Pixelcoins statt kleiner Ellipsen. Oben links ist die **echte Anzahl in diesem Versuch gesammelter Münzen** zu sehen, nicht aus XP geschätztes Geld. Jede Münze wird dauerhaft als `save.gold` im bestehenden Spielstand gespeichert. Im Menü zeigt die Fortschrittsanzeige dein Gesamtgold.
- **Nur statische Plattformen:** Bewegliche Aufzüge, fahrende Brücken und einstürzende Plattformen sind **vorerst aus dem Spiel entfernt**. Der frühere Code bleibt im Repository zur späteren Wiedereinführung, wird aber nicht geladen oder ausgeführt.
- **Leicht höhere Schwierigkeit:** Die langen Level 1-1 bis 1-4 besitzen nun jeweils acht statt sechs gut sichtbare Dornenfallen. Die Sprungphysik, Level-Längen und Gegner-KI bleiben unverändert.
- **Bosskampf:** Der Schleimkönig mit 56 HP und Phase II bleibt herausfordernd, aber auch hier führen Treffer jetzt zu Herzverlust und kurzer Immunität **ohne Boss-Neustart**. Das Besiegen des Königs schließt das Level weiterhin automatisch ab.
- Alle Klassen, Touch-Buttons, XP, Fähigkeiten, Ausrüstung, alten Bestzeiten und Level-Freischaltungen bleiben kompatibel.

**Auf dem iPhone:** In der Startansicht steht **„HERZEN & MÜNZEN · 0.9.1“**. Für Safari ohne Löschen von Spielständen `?v=0.9.1` an die Spiel-URL anhängen.



## Neu in v0.9 – vier lange Abenteuerlevel und Soulslike-Bosskampf

- **Level 1-1 bis 1-4 sind jeweils 4.200 statt 2.800 Welt-Einheiten lang (+50 %).** Zusätzliche Sprünge und fünf statt drei Abgründe, mehr Plattformen, insgesamt neun normale Gegner sowie mehr Dornen und Sammelmünzen je Level. Die drei Sterne bleiben erhalten, der dritte liegt jetzt im neuen letzten Drittel.
- **Level 1-4:** längere Schlosszufahrt mit einer dritten beweglichen Plattform und einer weiteren einstürzenden Steinplatte. Das große Burgtor steht passend am Ende der längeren Strecke.
- **Level 1-5:** absichtlich kompakte und optisch aufgeräumte Schlossarena (2.800 Welt-Einheiten und keine verstreuten Plattformen, normalen Gegner, Dornen oder Gräben).
- **Schleimkönig (56 HP):** verfolgt den Spieler aktiv, besonders wenn ein Magier oder Jäger auf Distanz bleibt. Drei abwechselnde Angriffsmuster:
  - Stampfangriff mit rot markierter Landezone und beidseitigen, überspringbaren Boden-Schockwellen.
  - Gerichtete Schleim-Salve nach einer auffälligen Warnung; die Geschosse lassen sich durch Bewegung, Sprünge und Dash vermeiden.
  - Schneller Boden-Ansturm mit roter Bodenwarnung; im Sprung überqueren oder mit Dash ausweichen.
- **Phase II bei unter 50 % HP:** Der König verändert seine Farbe, die Lebensleiste wird als zweite Phase beschriftet, er erhält eine kurze klar erkennbare Verwandlungsphase. Anschließend jagt er schneller, seine Warnfenster und Erholungspausen verkürzen sich, die Salven enthalten drei Geschosse.
- **Schwer, aber lesbar:** Jeder größere Angriff ist vorab sichtbar, nach den Attacken gibt es kurze Konterfenster. Schwerthiebe, Pfeile, Magie, Dash und gezielte Sprungangriffe funktionieren weiter. Der Boss-Tod beendet das Level automatisch wie bisher.
- **Neue Bestzeitenwertung v0.9:** Die längeren Level und der härtere Boss bekommen getrennte Bestzeitentabellen (`bestTimesV09` und `bestTimesBossV09`). Alle bisherigen Bestzeiten von v0.4 bis v0.8, RPG-Skills, Ausrüstung, XP und Freischaltungen bleiben erhalten.
- HD-Hintergründe, iPhone-Multitouch, variable Sprunghöhe und das Pixel-Art-Gameplay bleiben erhalten.

**iPhone-Test:** Auf dem Startbildschirm muss **„LANGE LEVEL · BOSS-PHASE II · 0.9.0“** stehen. Nutze bei Bedarf `?v=0.9.0` gegen den Safari-Cache. Spiele Level 1-4 bis zum weiter nach hinten verlegten Schlosseingang. Im Bossraum besonders die drei roten/orangen Vorwarnungen und die deutlich schnellere zweite Phase prüfen. Keinesfalls Safari-Website-Daten löschen, um Fortschritt zu erhalten.



## Neu in v0.8 – mehr Abwechslung im Kampf

- **Fledermaus:** schwebt über dem Boden, kündigt einen Sturzflug mit orangem Warnsymbol an und erholt sich anschließend. Kann mit Sprüngen, Dash, Schwert, Pfeilen oder Magie besiegt werden.
- **Pilzmonster:** besitzt vier Lebenspunkte, gibt eine gut sichtbare Warnung und verschießt langsam fliegende orange Sporen. Über die Geschosse springen oder sie per Dash neutralisieren.
- **Goblin:** fünf Lebenspunkte, patrouilliert und stürmt nach einer Warnung schnell auf die Spielfigur zu. Nach dem Sprint braucht er eine Erholungsphase.
- Alle vier normalen Level enthalten weiterhin den bekannten Schleim und je einen neuen Gegnertyp. Der Schleimkönig bleibt im **reinen Bosslevel 1-5 ohne normale Gegner**.
- **Besseres Trefferfeedback:** pixelige Warnungen, HP-Leisten für verletzte Gegner, Trefferblinken, Zahlen für Schaden und XP sowie dynamischere Schwertanimationen.
- **Angriff gedrückt halten:** Schwerthiebe, Pfeile und Feuerbälle werden entsprechend der jeweiligen Abklingzeit wiederholt, auch auf dem iPhone per Touch. Bestehende Skill-Upgrades und Waffen wirken weiterhin.
- **Waffen- und Trefferkorrekturen:** echte Gegnerhitboxen auch für fliegende Gegner; naher Schwertangriff kann einen auf die Figur zustürmenden Gegner im selben Frame stoppen. Sprungangriffe von oben und Dash bleiben gültig.
- **Eigene v0.8-Bestzeiten:** neue Gegnermuster ändern die Schwierigkeitskurve; neue Rekorde werden in `bestTimesV08` gespeichert, frühere Bestzeiten bleiben unberührt. XP, Loot, Ausrüstung, Skills und Freischaltungen bleiben kompatibel.
- HD-Hintergründe, fünf Level, bewegliche/einstürzende Plattformen, Sprungphysik und automatische Boss-Sieg-Animation sind unverändert.

**iPhone-Hinweis:** Im Menü muss **„GEGNER-UPDATE 0.8.0“** stehen. Nachladen mit `?v=0.8.0` ist möglich, ohne Website-Daten zu löschen. Bei gefährlichen Attacken auf das **orange Warnsymbol** achten; den Angriffsknopf kannst du nun gedrückt halten.



## Neu in v0.7.0 – HD-2D-Kulisse, klarer Pixel-Vordergrund

- **Zwei komplett unabhängige Canvas-Ebenen:** Alle Hintergründe werden in voller logischer Auflösung von **960 × 540 Pixeln** gezeichnet und weich geglättet; Spieler, Waffen, Items, Gegner, Plattformen und Gefahren bleiben auf einer **transparenten 720 × 405-Pixel-Art-Ebene** mit Nearest-Neighbor-Upscaling. Die alte Verpixelung des Hintergrunds entfällt vollständig.
- **HD-Wälder mit malerischer Tiefe:** Farbverläufe am Himmel, abgestufte Bergketten, organische Baumstämme und Äste, schattierte Blätter, fein gezeichnete Farne/Lianen und weiche Sonnenstrahlen. Farbpalette und Dekoration unterscheiden sich nach Level.
- **HD-Schloss:** Der Innenraum erhält weich beleuchtete Buntglasfenster, natürliche Lichtreflexe und ein stimmungsvoll dunkles Ambiente. Im Schlosszugang bleiben das Tor und die Burgsilhouette hinter den spielbaren Elementen.
- **Sichtbarkeit:** Die HD-Kulisse ist entsättigt und relativ kontrastarm, damit die hellen Plattformränder, Sprite-Outlines, Angriffswarnungen und roten Gefahren die höchste Aufmerksamkeit bekommen. Keine Farb- oder Nebelschicht wird über den Spielfiguren gerendert.
- **Mobiloptimiert:** Nur zwei prozedurale Parallax-Leinwände für das aktuell gespielte Level werden im Speicher gehalten. Ein Qualitätsmodus reduziert HD-Effekte, ohne die Gameplay-Ebene oder Kollisionsgeometrie zu verändern. Es werden keine externen Asset-Dateien benötigt.
- **Unverändert:** Fünf Level, bewegliche/einstürzende Plattformen, Touch-Steuerung, Sprungphysik, Boss-Stampfattacke, automatischer Boss-Sieg, XP, Ausrüstung, Freischaltungen und alle Bestzeiten.

Im Titelbildschirm muss **„HD-HINTERGRÜNDE 0.7.0“** stehen. Zum Cache-Bypass auf dem iPhone `?v=0.7.0` an die Adresse anhängen. Bestehende Spielstände nicht löschen.



## Neu in v0.6.2 – klare Tiefe und direkter Bossabschluss

- **Spieler und Gefahren im Vordergrund:** Der Pixelrenderer zeichnet mit 720 × 405 Pixeln (statt 480 × 270) und ohne Weichzeichnung. Plattformen besitzen feste, helle Oberkanten, schwarze Konturen, getrennte Erd- und Steinblöcke mit einzelnen 16-Pixel-Tiles und kleinen Materialdetails.
- **Klar zurückgesetzter Hintergrund:** Wald- und Burg-Silhouetten sind dunkler, weniger gesättigt und weniger kontrastreich. Beleuchtungspartikel wurden reduziert. Kein Nebel über spielbaren Blöcken, Spielfigur oder Gegnern.
- **Eigenständiger Retro-Pixel-Look** mit klassischer Sandbox-Pixelspiel-Anmutung. Keine externen Grafiken aus anderen Spielen werden verwendet.
- **Schleimkönig: 0 HP = automatischer Levelabschluss.** Die rote Boss-Lebensleiste fällt auf 0, „BOSS BESIEGT!“ wird etwa 0,7 Sekunden gezeigt, anschließend erscheint ohne Zielflagge oder Laufen zum Ausgang der normale Siegbildschirm samt XP, gespeicherten Bestzeiten und Sieg-Zähler.
- **Neue faire Boss-Bestzeiten:** Erfolge der automatischen Siege werden getrennt unter `bestTimesBossV062` gespeichert. Historische Boss-Rekorde bleiben in `bestTimesPixelV051` erhalten.
- Springen, Gegner-KI, zwei bewegliche und zwei fallende Plattformen, das Schloss, Ausrüstung und bestehende Spielstände bleiben unverändert.

Die Version im Startmenü muss **„KONTRAST-UPDATE 0.6.2“** anzeigen. Der iPhone-Cache wird mit `?v=0.6.2` umgangen, ohne Spielstände zu löschen.



## Neu in Version 0.6.1

- Level 1-4 „Zum Schlosstor“ führt vom leuchtenden Wald über fahrende und bröckelnde Plattformen zum großen Burgtor.
- Zwei bewegliche Plattformen: eine schwebende Querbrücke und ein vertikaler Aufzug.
- Zwei einstürzende Steinplatten: Bei Berührung wackeln sie, fallen nach kurzer Zeit und werden später wieder aufgebaut.
- Level 1-5 ist ein reiner Bosskampf im Schloss. Keine normalen Gegner, Dornen oder Lücken; der Schleimkönig wartet direkt in der Thronsaal-Arena.
- Ein neuer, detaillierter Pixel-Hintergrund zeigt die Burgmauern, Fenster, Säulen, Banner und den Thron. Vordergrund und Charakter heben sich klarer ab.
- Alle bestehenden Spielstände, Waffen, Skills und Bestzeiten bleiben erhalten. Sprungphysik, Bossattacken und mobile Touch-Steuerung sind unverändert.

Auf dem iPhone sollte im Menü „SCHLOSS-UPDATE 0.6.1“ stehen. Mit dem Versionsparameter `?v=0.6.1` lässt sich eine alte zwischengespeicherte HTML-Seite umgehen. Bitte keine Website-Daten löschen.


## Neu in v0.6: Zwei Level + Schleimkönig

- **Level 1-4 · Leuchtpilz-Sumpf:** neue lila/türkise Pixel-Welt mit leuchtenden Pilzen, fünf Gegnern, neuen Sprungabständen und drei Sternen.
- **Level 1-5 · Thron des Schleimkönigs:** dunkler Königsthron, Bodenpassagen, drei Sterne und ein Bosskampf am Ende.
- **Schleimkönig (20 HP):** roter Lebensbalken mit zugänglichem Fortschrittswert. Alle drei Klassen können den Boss mit ihren normalen Waffen und Verbesserungen treffen.
- **Zwei Angriffsarten:** gerichtete Schleimgeschosse und eine angekündigte Stampfattacke mit auslaufenden Boden-Schockwellen; bei niedriger Gesundheit beschleunigen die Angriffe. Springe über Schockwellen und weiche den Geschossen aus.
- Das Ziel öffnet sich **erst nach dem Sieg**. Ein erfolgreicher Durchlauf vergibt zusätzliche XP und zählt deine Siege über den Schleimkönig.
- Nach Treffer oder Sturz beginnt das Level wie gewohnt ohne Checkpoint erneut; der Boss erhält wieder volle HP und der Spieler verliert ein Herz.
- **Speicherkompatibilität:** Bestehende drei Sterne-Wertungen werden zu fünf Einträgen erweitert; alte XP, Skilltrees, Ausrüstung, Bestzeiten und Freischaltungen bleiben erhalten. Die neuen Level werden nach Abschluss des vorherigen Levels freigeschaltet.
- Pixel-Stil mit klarer Charakterkontur, hellen Plattformkanten, roten Gefahren und zurückhaltenderen Hintergründen – für bessere Lesbarkeit auf dem iPhone. Sprungphysik und bisherige Level bleiben bestehen.

**iPhone-Test:** Nach der Veröffentlichung im Hauptmenü `BOSS-UPDATE 0.6.0` prüfen, Level 1-3 abschließen, Level 1-4 freischalten, dann nach dessen Abschluss den Schleimkönig in 1-5 mit dem Touch-Angriffsbutton bekämpfen. Die Stampf-Warnung erscheint am Boden; über die danach auslaufenden roten Wellen springen. Safari-Neuladen darf keinen Fortschritt löschen.



## Sichtbares Pixel-Welten-Update v0.5.2

- **Waldanfang:** klar hellgrüner, sonniger Pixel-Wald mit goldenen Blumen, breiten Hügeln und hellen Moos-Tiles.
- **Baumkronen:** tiefblauer Himmel, türkise Baumkronen, schwebende Bauminseln und pixelige Wasserfälle, mit neuen türkis-blauen Plattform-Tiles.
- **Moosruinen:** violetter Abendhimmel, gebrochene Säulen, beleuchtete Ruinenfenster und steinerne Pixel-Plattformen.
- Individuelle Parallax-Paletten und dekorative Pixel-Details. Plattform-Kollisionen, Gegner, Skilltree und Speicherstände bleiben gleich.
- Beim Laden muss im Hauptmenü **„PIXEL-WELTEN · VERSION 0.5.2“** stehen. Andernfalls einmal die Seite aktualisieren und `?v=0.5.2` an die Spieladresse anhängen. Die Version der JS-Dateien ist ebenfalls aktualisiert.
- **Sprungphysik unverändert zu v0.5.1.** Die letzte Nachricht zum Sprung war unvollständig; hierfür werden keine neuen Werte angenommen.

## Pixel Edition v0.5.1

- **Einheitlicher Pixelstil:** Die gesamte Spiellandschaft rendert in 480 × 270 Pixeln und wird ohne Unschärfe auf die Spielgröße hochskaliert. Wald, Parallax-Ebenen, Plattform-Tiles, Ruinen, Gegner, Partikel und Angriffe folgen diesem Look.
- **Pixel-Menüs und Touch-Steuerung:** klare rechteckige Buttons, monospaced Typografie, kontrastreiche Rahmen – ohne Webfont oder zusätzliche Downloads.
- **Maximale Sprunghöhe ca. 12–13 % niedriger:** längeres Halten bleibt nützlich, kurze Tipp-Sprünge, Coyote Time und Jump Buffer bleiben unverändert.
- **Erreichbarkeit:** die längste Lücke in Moosruinen wurde für die neue Höhe verkürzt.
- **Faire Rekorde:** v0.5.1-Zeiten werden unter `bestTimesPixelV051` geführt; `bestTimesV05` und `bestTimes` bleiben erhalten. XP, Klassen, Skills, Inventar und Ausrüstung sind weiterhin kompatibel.
- Grafiken werden weiterhin ohne externe Grafik-Assets mit HTML Canvas erzeugt. Grafikqualität „Voll / Sparsam“ bleibt vorhanden.

## Neu in v0.5 (Gameplay-Phase)

- **Variables Springen:** kurz tippen für einen niedrigen, länger halten für einen höheren Sprung; auf Tastatur und iPhone-Touch.
- **Coyote Time (7 Frames)** und **Jump Buffer (7 Frames)** für präzisere Sprünge.
- **Alle drei Level neu aufgebaut:** Waldanfang mit breiten Einstiegsplattformen, Baumkronen mit vertikalen Routen und Moosruinen mit anspruchsvollen Sprungfolgen.
- **Checkpoints entfernt:** bei einem Treffer oder Sturz beginnt der ganze Versuch wieder bei Levelanfang. Timer, Gegner, Münzen und Sterne werden zurückgesetzt; die verbleibenden Herzen werden übernommen. Nach drei Fehlern erscheint „Erneut spielen“.
- **Schneller Neustart:** Taste R oder nach Game Over „Erneut spielen“.
- Neue Bestzeiten stehen unter `bestTimesV05`. Die vorherigen `bestTimes` (v0.4) und alle RPG-Daten bleiben unverändert erhalten.
- Diese v0.5-Gameplayphase wurde anschließend mit der Pixel Edition v0.5.1 visuell vereinheitlicht.

## Funktionen aus v0.4

- Zeitmessung pro Level, lokale Bestzeiten pro Klasse und Bronze-/Silber-/Goldmedaillen. Die Zeit wird nur während des aktiven Spielens gezählt.
- Angriffe: Krieger-Schwerthieb, Jäger-Pfeilschuss, Magier-Feuerball; Taste K/F unter Windows, eigener Touch-Button am iPhone.
- Skilltree pro Klasse mit drei aufeinander aufbauenden Verbesserungen; Skillpunkte aus Levelaufstiegen.
- Loot durch besiegte Gegner, Inventar und klassenbezogene Ausrüstung inklusive Waffen- und Bewegungsvorteilen.
- Speicherung ergänzt den bestehenden v2-Schlüssel um Skills, Ausrüstung, Inventar und Bestzeiten. Eine globale Online-Bestenliste ist noch nicht enthalten.

## Aus früheren Versionen übernommen

- Prozedurale Waldkulisse mit drei bewegten Parallax-Ebenen, jetzt in klar gezeichneten Pixel-Tiles und mit gestuften Farbpaletten.
- Pixel-Figuren mit Lauf-, Sprung- und Ruheanimationen, bewegten Umhängen und eigener Klassen-Ausrüstung (Schwert, Bogen, Stab).
- Animierte Waldgeister, schwebende Sterne und rotierende Münzen.
- Partikel beim Springen, Landen, Dash, Sammeln, Schaden, Gegnerbesiegen sowie zusätzlichen Treffereffekten; Glühwürmchen und Blätter.
- Wald-Menü, kompakte Anzeigen, Dash-Bereitschaft und Pause. App-Wechsel/Fokusverlust pausiert und löst gehaltene Tasten.
- Mehrere Finger und Tastatur können gleichzeitig verwendet werden. 60-Hz-Simulation unabhängig von 60-/120-Hz-Displays.
- Grafikschalter „Voll / Sparsam“, begrenzte Partikelzahl, gecachte Grafik und Berücksichtigung von „Bewegung reduzieren“.

Die Grafik ist originale Canvas-/Pixel-Art mit simulierter Tiefe, keine 3D-Engine. Das Spiel bleibt ein weiterentwickelbarer Prototyp. Die Klassen-Bewegungswerte und RPG-Belohnungen bleiben erhalten; Sprungphysik und Plattformverläufe wurden in v0.5 angepasst.

## Steuerung

- **Windows:** A/D oder ←/→ bewegen; Leertaste, W oder ↑ springen; Shift oder J Dash; K/F Angriff; R Level-Neustart; Escape Pause/Fortsetzen.
- **iPhone:** Links/Rechts gedrückt halten, gleichzeitig Sprung, Dash oder ⚔ drücken. Querformat empfohlen. Oben rechts: Pause.
- Gegner von oben oder mit einem Dash besiegen. Drei Herzen; keine Checkpoints. Bei Fehlern startet ein frischer Versuch am Levelanfang, die verbleibenden Herzen bleiben. Zielflagge beendet den Abschnitt.

## Bestehende Spielstände

Der Schlüssel **`realm-runners-save-v2`** bleibt erhalten und das Datenformat wird erweitert: Klasse, Level, XP, freigeschaltete Abschnitte und beste Sterne werden übernommen. Zusätzliche Felder werden nicht gelöscht. Grafikpräferenz wird separat gespeichert.

Der Fortschritt bleibt lokal in demselben Browser und derselben Website-Adresse. Browserdaten nicht löschen. Ein Wechsel von Browser, Gerät oder URL-Ursprung überträgt keinen Spielstand. Gespeichert wird der RPG-Fortschritt; die aktuelle Position innerhalb eines Levels wird wie zuvor nicht dauerhaft gespeichert.

## Weitere Gameplay-Prüfungen

Die aktuelle Anleitung steht oben unter „v0.13 auf Windows und iPhone prüfen“. Für Tastatur: A/D oder Pfeile, Leertaste springen, Shift Dash, K/F Angriff, R Neustart, Escape Pause. Drei Herzen und kurze Treffer-Immunität; Stürze bringen dich zur letzten sicheren Fläche, ohne Münzen, Sterne oder Gegner zurückzusetzen. Keine Checkpoints und kein Level-Neustart bei einem einzelnen Treffer. Die vier Abenteuer enden am jeweiligen Tor; der Bossabschluss erfolgt automatisch nach seinem Tod.

## Entwicklung und automatisierte Tests

Kein Build erforderlich; HTML, game.js, rpg.js und forest.js werden direkt ausgeliefert. Lokal über HTTP starten:

```sh
python3 -m http.server 8000
```

Dann http://localhost:8000 öffnen. Entwicklungsabhängigkeiten und Tests:

```sh
npm install
npm test
npx playwright install --with-deps chromium webkit
# In einem zweiten Terminal läuft der HTTP-Server auf Port 8000:
npm run test:browser
```

`tests/regression.cjs` prüft die Spielregressionen mit echtem Canvas-Rasterizer und simuliertem DOM: Speicherkompatibilität, alle Klassen/Level, Physik, Belohnungen, Gegner, variable Sprunghöhen, Neustart ohne Checkpoints und Mehrfinger-Eingaben, Pause, Partikelbudget und 60/120 Hz. `tests/browser.cjs` prüft Chromium und WebKit, Darstellung in Hoch-/Querformat sowie Konsolenfehler. Screenshots entstehen unter `test-output/`.

GitHub Actions führt beide Tests bei Push auf `main` aus. WebKit-Tests ersetzen keinen Test auf einem echten iPhone; Multitouch im Browser-Test verwendet synthetische Pointer-Ereignisse. Reale Geräte-Performance und Safari-App-Wechsel bitte mit obiger Anleitung prüfen.

## Veröffentlichung

GitHub Pages: Branch `main`, Ordner `/(root)`. Neue Commits werden automatisch bereitgestellt. Kein Service Worker, keine externen Grafik-CDNs oder Webfonts.

## Nächste Ausbaustufen

Mehr Biome, Bosskämpfe und zusätzliche animierte Pixel-Frames; danach

Sound und Musik, zusätzliche Animationsframes, mehr Levelgeheimnisse, Klassenfähigkeiten/Skilltrees und Bosse. Frostgipfel, Glutberge und Himmelsruinen sind weiterhin Vorschauen.
