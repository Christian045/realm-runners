# Realm Runners – Dungeon Reborn (Alpha 0.12.2)

## Alpha 0.12.2 – Live-Kampf & Browser-Cache

- Gegenereignisse nun gegen echte, generierte Kampfräume mit stillstehendem Spieler getestet: sieben normale, sieben Turm- und ein Elite-Kampf.
- Verhindert ein veraltetes, trotz neuer HTML-/Hauptscript-Version gecachtes Kampfmodul: `main.js?v=0.12.2` importiert nun explizit `game.js?v=0.12.2`.
- Browser-Regression prüft die wirklich geladene Kampfmodul-URL sowie tatsächliche Treffer an einem stehenden Spieler. Bestehende Spielstände und Steuerung bleiben unverändert.



## Alpha 0.12.1 – Fehlerbehebung: Gegner greifen wieder an

- Nahkampfgegner stoppen wie bisher kurz vor dem Helden, lösen jetzt aber in dieser Reichweite einen echten, kurzen, angekündigten Nahkampfangriff aus. Zuvor stoppten sie bei +8 Pixeln Abstand und trafen nur bei +3 Pixeln: Wer stillstand, wurde nie angegriffen.
- Gegnerschläge haben eine 0,3-Sekunden-Vorwarnung und eigene Abklingzeit. Verlässt der Held währenddessen die Reichweite oder deckt eine Wand die Sicht, geht der Angriff fehl; keine unsichtbaren Treffer durch Wände.
- Funktioniert in normalem Dungeon, Endlosmodus und Zehn-Etagen-Turm. Bossmechaniken, fernkämpfende Gegner, Etagenlänge, Spielstände und die iPhone-Steuerung bleiben erhalten.
- Regressionstests: stationärer Held, wiederholte Treffer, Turmgegner, Ausweichen, Wände und Bogenschützen.



## Alpha 0.12 – Tower & Boss Overhaul

- **Etagenlänge unverändert:** Im Turm bleiben genau sieben Räume pro Etage und weiterhin zehn Etagen. Normale Dungeons mit 13 Räumen und Endlosmodus sind unverändert.
- **Der Ewige Herrscher:** Drei voneinander getrennte Angriffspools (I: Markierungen, Kreuzfeuer, Dash; II: Meteore, Orbit, Beschwörung, Runenlanzen, Seelenstrahlen; III: Finsternis-Nova, Spiralwand, Strahlen, Dash und zusätzliche verzögerte Arenafallen). Phasengrenzen bei 55 % und 30 %, Warnungen vor jedem Schlag und Schutzfenster beim Phasenwechsel.
- **Gegner-Spezialfähigkeiten:** Geister teleportieren nach sichtbarer Warnung, schwere Nahkämpfer stürmen nach einer Anlaufphase, Kultisten erzeugen verzögerte Sigill-Fallen und eiserne Wächter parieren frontale Treffer mit begrenzter Schutzdauer. Spezialfähigkeiten nutzen das vorhandene Kollision- und Gefahrenzonensystem.
- **Zehn visuell eigene Etagen:** Unterschiedliche Inschriften, Wandbanner, Wellenzeichen, Sporen-, Ketten-, Seelen- und Runendekorationen; farbig beleuchtete Bossarenen und ein eigener mehrstufiger Thronraum auf Etage 10. Dekorationen sind nicht Teil der Kollision.
- **Turm-Relikte:** Sechs neue, sammelbare Runen (Gewitterkrone, Aschenherz, Wächterschild, Widerhall, Phönixfeder, Seelenzahn) als vierte Option nach einem Etagenboss. Verschiedene Schaden-/Heil-/Rettungs-Synergien, ohne rekursive Trefferprocs.
- **Zeitwertung und Belohnungen:** Bestzeit für jede Etage, persönliche Bestzeit eines gesamten Turmlaufs und erneute Siegesfeier mit besonderen Effekten. Rekorde werden abwärtskompatibel im vorhandenen `realm-runners-roguelite-v1`-Schlüssel gespeichert.
- **Tests:** automatisierte Boss-/KI-/Relikt-/Rekordtests plus Chromium und WebKit mit Touch-Steuerung.



## Alpha 0.11 – Turm der zehn Prüfungen

- **Neuer eigenständiger Spielmodus** direkt im Hauptmenü: 10 Etagen mit eigenen Gegnergruppen und je einem Etagenboss, zuletzt der **Ewige Herrscher** als Superboss mit **drei Phasen**. Der normale Dungeon und der Endlos-Modus bleiben erhalten und sind gegenseitig exklusiv zur Turm-Herausforderung.
- **Schnelle Etagen:** Statt jedes Mal 13 große Kammern zu durchlaufen, bestehen Turm-Etagen aus 7 abwechslungsreichen Räumen, darunter Kampfräume, Elite, Schatzkammer, Schrein und ein Bossraum. Karten bleiben garantiert zusammenhängend.
- **Zehn verschiedene Bosskonzepte:** Festgelegte Namen, Farben, Gegner- und Angriffskombinationen. Die Telegraphen warnen vor Schussfächern, Zielmarkierungen, Spiralen, Ansturm, Meteoriten und Kreuzangriffen; Etage 10 hat zusätzlich die Finsternis-Nova.
- **Vier neue Gegnertypen:** Geister, eiserne Wächter, Kultisten und Berserker/Brutes mit eigener Pixel-Art und Grundwerten. Kultisten und Bogenschützen benötigen freie Sicht zum Schießen.
- **Belohnungswahl:** Nach Boss 1–9 darfst du vor der nächsten Etage zwischen Heilung, einem seltenen Relikt oder dauerhaftem Schaden für diesen Run wählen. Ausrüstung, Talente, Gold und HP werden von Etage zu Etage übernommen.
- **Progression:** Bestleistung und abgeschlossene Turmläufe werden in bestehendem, rückwärtskompatiblem Save-Key gespeichert; neue Erfolge bei Etage 5 und beim vollständigen Sieg. Der Endboss endet mit Sieg, kein unendlicher Loop.
- **Checks:** Tower-Modus, Boss-Phasen (55 / 30 %), zehn Etagen, Belohnungen, Speicherdaten, Minimap, Safari-/Chrome-Kontrollen getestet.



## Alpha 0.10 – Dungeon Overhaul

- **Unregelmäßige Dungeons:** 13 logisch verknüpfte Räume auf einem 5×5-Adressraster statt einer gefüllten 3×3-Matrix. Neun geometrische Raumformen (groß, kompakt, lang, hoch, Kreuz, L-Form, versetzt, Zickzack, Bogen), 14 Cover-Layouts und garantierte drei Kacheln breite Verbindungen mit Torbögen.
- **Erkundung und Abzweigungen:** Dynamische Minimap zeigt nur bereits bekannte Räume und deren Verbindung, inklusive Verzweigungen. Geheimkammern bleiben bis zum Betreten versteckt. Jeder Seed liefert einen zusammenhängenden begehbaren Pfad bis zum Boss.
- **Neue Raummechaniken:** Bibliothek mit Runenrätsel und einem Schlüssel für das Gewölbe, Fallenräume mit angekündigten verzögerten Explosionen, Lager mit Heilung/Erkundung/Handel, versiegeltes Gewölbe mit Schlüssel-/Gold-/Lebenspunkte-Optionen. Schmiede, Prüfung, Schrein und bestehende Lootkammern bleiben erhalten.
- **Taktische Gegner-KI:** Spawnpositionen beachten wirkliche Kollisionen und Abstand zum Helden. Gegner navigieren bei Hindernissen mit begrenzter BFS-Wegsuche. Bogenschützen prüfen Sichtlinien, weichen in Nahdistanz zurück und nutzen seitliches Positionieren – ohne durch Mauern zu schießen.
- **Visuelles Design:** Thematische Torbögen, Räume mit eigener Möblierung (Regale, Lagerfeuer, Truhen, Gewölbe, Fallenwarnung); Wandfackeln nur auf Hindernisflächen. iPhone-Touch-Bedienung, Klassensystem, Boss-Phasen, Loot und Speicherstände bleiben erhalten.
- **Tests:** Seed-basierte Flood-Fill-Erreichbarkeit, Szenarioprüfungen für besondere Räume, Pfad- und Sichtlinien sowie Chromium-/WebKit-Smoke-Tests.



**Top-down-Roguelite / Hack-and-Slash** auf Basis der bisherigen JavaScript-/HTML5-Canvas-Technik.
Das bisherige Jump-and-Run wurde technisch und spielerisch neu aufgebaut. Der alte Stand bleibt im `main`-Branch bis zum Merge der Umstellung erhalten.

## Spielen

Lokal im Projektordner:

```sh
python3 -m http.server 8000
```

Danach **http://localhost:8000** im Browser öffnen. Kein Build erforderlich.

## Alpha 0.9.0 – Pixel-Art & Animationssystem

- **Eigenes Sprite-Atlas-System:** In `src/sprites.js` liegen handgezeichnete Pixelmuster für Krieger, Jäger, Magier, Schleim, Pilz, Bogenschütze, Goblin und beide Bosse. Alle Frames werden browserintern in transparenten, winzigen Canvas-Atlanten gerendert und wiederverwendet. Keine externen oder lizenzpflichtigen Assets.
- **Animationen:** Idle, Laufen, Angriff, Zauber, Dash, Treffer und Tod. Animationszustände hängen an der Spielmechanik statt an rein zufälligen Effekten. Bildschirmrichtung und Pixelmaßstab werden berücksichtigt; Besiegte zeigen ein kurzes Verblassen statt sofort zu verschwinden.
- **Kachel-Atlas:** `src/tileset.js` erzeugt 24×24-Pixel-Bausteine, scharf auf die 48×48-Weltkacheln hochskaliert. Sechs Farbthemen mit acht deterministischen Variationen, echten Mauerfugen, Bodenkacheln, Pilz-/Moosdetails, Wasserpfützen und Säulen.
- **Performance / Touch:** Bereits gebaute Sprites und Tiles werden gecacht. Kollision, Kamera, iPhone-Touch-Gesten, Hitboxen, Speicherdaten und die Kampfmechanik bleiben unverändert. Falls ein Browser keine Atlas-Textur erstellen kann, bleibt ein einfacher Grafik-Fallback.
- **Tests:** Eigene Node-Tests für Pixel-Atlas, State-Priorität, Blickrichtungen, alle Biome, Cache-Nutzung und Trefferanimationen plus bestehende Browser-/WebKit-Tests.

## Update Alpha 0.6–0.8 – Combat-Polish, Raumvielfalt und Endgame

- **Kampfgefühl (0.6):** 35–75 ms Hitstop beim Treffen, echte kritische Trefferanzeigen, Rückstoß, kurze Kamerawackler, zusätzliche Animationen und originale synthetisierte Soundeffekte. Kein externer Audio-Download, kein Autoplay.
- **Elite-Modifikatoren:** flink, gepanzert, arkan, explosiv (sichtbare Verzögerung vor der Explosion) und vampirisch.
- **Dungeon-Variety (0.7):** 14 statt 6 Raumlayouts, weitere stimmige Boden- und Ruinendetails, optionale Ereigniskammern mit Schmiede oder gefährlicher Kampfprüfung.
- **Gegenstandseffekte (0.7):** 15 mögliche Spezialeffekte auf seltenen oder besseren Gegenständen; darunter Kettenblitz, Feuer, Gift, Frost, Krit-Heilung, Dash-Nova, Dornen, Lebensraub, Flächentreffer und Dreifachschuss. Nur ausgerüstete Effekte zählen, pro Treffer maximal eine nicht rekursive Auslösung.
- **Spezialisierungen (0.8):** je drei Varianten pro Klasse (Standard plus zwei neue Spielweisen); freischaltbar über zwei Runs oder einen Boss-Sieg. Modifikatoren verändern LP, Schaden, Tempo, Krit-Chance, Angriffs- und Fähigkeitstempo.
- **Langzeitmotivation (0.8):** vier Herausforderungen mit klaren Freischaltbedingungen und Goldmultiplikatoren; sieben dauerhaft gespeicherte Erfolge mit einmaligen Goldprämien.
- **Endlos-Abstieg:** nach dem ersten Boss-Sieg freischaltbar. Jeder Boss führt in eine neue, schwerere Etage, ohne Ausrüstung oder Run-Gold zurückzusetzen. Endet erst mit dem Tod.
- **Speicherstände:** Der vorhandene Roguelite-Schlüssel bleibt erhalten und wird um Erfolge/Statistiken erweitert; ältere Jump-and-Run-Saves bleiben unberührt.
- **Tests:** neuer Suite-Block für Item-Procs, Kartenlayout, Challenges, Meta-Fortschritt, Ereignisse und Endlosmodus plus Touch-Browserchecks.

## Erweiterung Alpha 0.3–0.5

- **Räume statt identischer Arenen:** Sechs Grundriss-Vorlagen (Säulen, Arkaden, Ruinen, offene Hallen, Kreuzungen, Alkoven) mit garantierten, drei Tiles breiten Wegen. Jeder Dungeon enthält Schreine, Schatzkammern, Elitekammern und geheime Räume.
- **Erkundung:** Nebel des Krieges für nicht entdeckte Räume; die Minimap deckt Nachbarräume erst beim Erkunden auf.
- **Entscheidungen:** Schreine bieten Heilung, einen Schadenssegen oder einen riskanten Tausch von Lebenspunkten gegen hochwertige Beute.
- **Loot:** Zwölf Gegenstandstypen für drei Slots (Waffe, Rüstung, Relikt), vier Seltenheiten, Werte und ein Inventar (I bzw. Rucksack-Schaltfläche). Fundstücke werden beim Aufheben eingesammelt und der erste Gegenstand je Slot automatisch angelegt.
- **Klassentalente:** Drei permanente Talentpfade pro Klasse mit je drei Stufen, im Hauptmenü für Gold aufrüstbar. Die bisherigen Spielstände werden ohne Löschung erweitert.
- **Biome:** Gruft, Pilzgrotte und versunkene Hallen erhalten eigene Gegnergewichtungen und Bodenfarben. Elitegegner sind stärker und schießen zusätzliche Geschosse.
- **Zweiter Boss:** Alternierend zum Schleimkönig kann der Runenwächter erscheinen. Eigene Warnmuster, Runenlanzen, Dreifachschläge, Ansturm, Arkanspirale, Beschwörungen sowie eine zweite Phase ab 55 % LP.
- **Qualität:** Neue Pfadfindungs-, Loot-, Talent-, Boss- und Touch-Browser-Regressionstests.

## Fix in Alpha 0.2.1 – Safari Doppeltipp-Zoom

- Verhindert, dass iOS Safari durch Doppeltippen in Canvas-Ecken die Webseite vergrößert.
- Unterdrückt native Pinch-/Zoom-Gesten auf dem Spielfeld; die Touch-Aktionsknöpfe bleiben unabhängig bedienbar.
- Verhindert Doppeltipp-Zoom auf nicht-interaktiven Menü-Hintergründen, während Menübuttons weiterhin funktionieren und Menübereiche vertikal scrollen.
- Testet Doppeltipp-Ecken und Touch-Interaktionen zusätzlich mit WebKit. Ein echter iPhone-Test ist trotzdem erforderlich.

## Neu in Alpha 0.2 – Schleimkönig und Dungeon-Atmosphäre

- **Schleimkönig mit zwei Phasen:** Phase II beginnt bei 55 % Lebenspunkten und besitzt eine sichtbare, kurze Übergangsphase.
- **Phase I:** Gift-Salve, gezielter Flächenschlag (markierter Bereich), geradliniger Ansturm (markierter Korridor).
- **Phase II:** schnellere Salven und Anstürme, radialer Sporensturm sowie beschworene Schleime/Pilze.
- Alle großen Angriffe zeigen **vor ihrer Ausführung Warnflächen**; der Ansturm verfolgt nicht nachträglich die Bewegung des Spielers.
- Großer Boss-Lebensbalken inklusive Phasenanzeige und Angriffshinweisen.
- Räume bekommen seedbasierte visuelle Identitäten: Gruft, Pilzgrotte, versunkene Halle, Reliquienkammer, Heiligtum und Thronsaal.
- Pixel-Fackeln mit Lichtschein, Ruinen, Bodensiegel, Pilze, Staubpartikel, Spinnweben und Vignette. Die Dekoration verändert keine begehbaren Flächen.
- Neue Tests für den Phasenwechsel, Treffer-Telegraphen, Ansturm, Spawn und den Boss-Tod.

## Spielloop

1. Eine der drei Klassen **Krieger, Jäger oder Magier** auswählen.
2. Einen Seed-basierten Dungeon aus **neun verbundenen Räumen** erkunden.
3. Gegnerkammern betreten, Türen versiegeln und die Gegner besiegen.
4. Gold, Heilung und pro Run wechselnde Relikt-Upgrades sammeln.
5. Im Bossraum den **Schleimkönig** besiegen oder bei Tod neu starten.
6. Gold wird auch bei Niederlagen teilweise mitgenommen; dauerhafte Stärkungs-Upgrades können im Menü gekauft werden.

Die Räume verwenden zufällige Verbindungen, garantieren aber einen begehbaren Weg zum Boss. Ein Run wird deterministisch aus einem Seed aufgebaut. Noch nicht implementiert: Online-Multiplayer, aufwendige Inventar-Ausrüstung, persistente laufende Runs, mehrere Biome und vollständige Content-Balance.

## Steuerung

| Plattform | Aktion |
| --- | --- |
| Windows / Mac | WASD oder Pfeiltasten laufen |
| PC | Maus zielen; Linksklick, F oder J angreifen |
| PC | Leertaste / Shift Dash, Q / E Spezialfähigkeit |
| PC | Escape pausieren, Enter im Menü starten, I Inventar öffnen |
| Touch | Virtueller Stick links; Angriff, Dash und Spezialfähigkeit rechts |

### Klassen

- **Krieger**: gerichteter Schwerthieb, Wirbelsturm, hohe LP.
- **Jäger**: schneller Pfeilbeschuss, Pfeilhagel, hohes Bewegungstempo.
- **Magier**: magische Geschosse mit kleiner Explosion, Arkanschlag.

## Architektur

| Modul | Aufgabe |
| --- | --- |
| `src/main.js` | Bootstrap, Menüs, HUD, feste Update-Schritte |
| `src/game.js` | Run-State, Spieler, Kampf, Gegner, Loot, Raumfortschritt |
| `src/dungeon.js` | Seed-RNG, zusammenhängende Raumgraphen, Tile-Kollision |
| `src/render.js` | Canvas-Welt, Kreaturen, Effekte, Kamera, Minimap |
| `src/boss.js` | Zwei-Phasen-Boss-KI, Angriffswarnungen, Bossfähigkeiten |
| `src/warden.js` | Zweiter Boss: Runenwächter, Angriffstaktiken und Warnflächen |
| `src/loot.js` | Ausrüstung, Seltenheitsgrade, Klassenbeschränkungen und Talente |
| `src/atmosphere.js` | Visuelle Raumthemen, Fackeln, Lichteffekte und Boss-Warnzonen |
| `src/input.js` | Keyboard, Maus und Touch |
| `src/touch-guard.js` | iOS-Safari-Gestenschutz ohne Eingriff in die Spielsteuerung |
| `src/data.js` | Klassen, Gegnertypen, Upgrade-Definitionen |
| `src/progression.js` | Save-Schema, Legacy-Import, persistente Käufe |
| `styles.css` | Menü, HUD, responsive Touch-UI |
| `tests/` | Deterministische Unit-Tests und Browser-Smoke-Test |

`src/game.js` enthält derzeit die Gameplay-Orchestrierung. Bei einem Ausbau sollten Kampf, Gegner-KI und Loot in weitere Systeme extrahiert werden, ohne den öffentlichen Zustand zu verändern.

## Speicherkompatibilität

- Neue Daten liegen separat in `localStorage['realm-runners-roguelite-v1']`.
- Die **alten Spielstände** unter `realm-runners-save-v2` werden **nicht gelöscht oder überschrieben**.
- Beim ersten Start wird die zuvor gewählte Klasse übernommen und höchstens 250 Gold als Startguthaben gutgeschrieben.
- Der Fortschritt bleibt an Browser und Website-Ursprung gebunden.

## Tests

```sh
npm install
npm test
npx playwright install chromium
# In einem separaten Terminal: python3 -m http.server 8000
npm run test:browser
```

Die Unit-Tests prüfen Raum-Erreichbarkeit, Seeds, Speicherstände, Käufe, Klassen, Angriffe und Dungeon-Fortschritt sowie die Bossphasen und Angriffsmechaniken. Browser-Smoke-Tests prüfen Desktop- und Touch-Grundabläufe. GitHub Actions führt beides bei Push und PR aus.

## Migration

Der Feature-Branch enthält **bewusst keine alten Platformer-Module** (`forest.js`, `level_design.js`, `platforms.js` usw.). Es handelt sich um eine neue Projektstruktur, nicht um einen zusätzlichen Spielmodus. Ein Merge in `main` sollte erst erfolgen, wenn die Browser-Tests grün und Desktop-/Mobil-Steuerung manuell überprüft sind.
