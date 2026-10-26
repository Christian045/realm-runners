# Realm Runners v0.6.2 – HD-Pixel-Kontrast und direkter Boss-Siegn Jump-'n'-Run mit RPG-Fortschritt für **Windows-Browser und iPhone Safari**.

**Spielen: https://christian045.github.io/realm-runners/**

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

## Testanleitung

1. Die Spieladresse im bisherigen Browser öffnen und neu laden. Im Menü muss **v0.5.2** stehen. Bei altem Cache einmal `?v=0.5.2` anhängen (gleicher Ursprung, gleicher Spielstand).
2. Vor dem Start bisherige Klasse, XP, Level, Sterne und Freischaltungen vergleichen.
3. iPhone quer halten: kurzen Sprung antippen, dann den Sprungknopf lange halten und einen deutlich höheren Sprung erreichen. Gleichzeitig rechts halten und bei Bedarf Dash oder Angriff benutzen; losgelassene Finger dürfen andere Eingaben nicht abbrechen.
4. App wechseln und zurückkehren: Pause. „Fortsetzen“ drücken. Hoch-/Querformat drehen und alle fünf Tasten prüfen.
5. Münze/Stern sammeln, Gegner von oben und per Dash besiegen. Partikel und Animationen beobachten. Hintergrund-Ebenen bewegen sich unterschiedlich schnell.
6. Checkpoint erreichen, Schaden/Abgrund ausprobieren, Zielflagge erreichen. Nach Neuladen müssen XP, Sterne und Freischaltungen erhalten sein.
7. Alle Klassen und drei Level ausprobieren. Bei Ruckeln im Menü oder Pausenmenü Grafik auf „Sparsam“ stellen.
8. Windows: dieselben Gameplay-Prüfungen mit Tastatur durchführen; Escape und Fokuswechsel testen.

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
