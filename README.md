# Realm Runners — v0.5 Gameplay · Smaragdwald

Ein Jump-'n'-Run mit RPG-Fortschritt für **Windows-Browser und iPhone Safari**.

**Spielen: https://christian045.github.io/realm-runners/**

## Neu in v0.5 (Gameplay-Phase)

- **Variables Springen:** kurz tippen für einen niedrigen, länger halten für einen höheren Sprung; auf Tastatur und iPhone-Touch.
- **Coyote Time (7 Frames)** und **Jump Buffer (7 Frames)** für präzisere Sprünge.
- **Alle drei Level neu aufgebaut:** Waldanfang mit breiten Einstiegsplattformen, Baumkronen mit vertikalen Routen und Moosruinen mit anspruchsvollen Sprungfolgen.
- **Checkpoints entfernt:** bei einem Treffer oder Sturz beginnt der ganze Versuch wieder bei Levelanfang. Timer, Gegner, Münzen und Sterne werden zurückgesetzt; die verbleibenden Herzen werden übernommen. Nach drei Fehlern erscheint „Erneut spielen“.
- **Schneller Neustart:** Taste R oder nach Game Over „Erneut spielen“.
- Neue Bestzeiten stehen unter `bestTimesV05`. Die vorherigen `bestTimes` (v0.4) und alle RPG-Daten bleiben unverändert erhalten.
- Bestehende HD-2D-Grafik zunächst beibehalten. Die geplante Umstellung auf einen einheitlichen Pixelstil folgt als separater Schritt.

## Funktionen aus v0.4

- Zeitmessung pro Level, lokale Bestzeiten pro Klasse und Bronze-/Silber-/Goldmedaillen. Die Zeit wird nur während des aktiven Spielens gezählt.
- Angriffe: Krieger-Schwerthieb, Jäger-Pfeilschuss, Magier-Feuerball; Taste K/F unter Windows, eigener Touch-Button am iPhone.
- Skilltree pro Klasse mit drei aufeinander aufbauenden Verbesserungen; Skillpunkte aus Levelaufstiegen.
- Loot durch besiegte Gegner, Inventar und klassenbezogene Ausrüstung inklusive Waffen- und Bewegungsvorteilen.
- Speicherung ergänzt den bestehenden v2-Schlüssel um Skills, Ausrüstung, Inventar und Bestzeiten. Eine globale Online-Bestenliste ist noch nicht enthalten.

## Bestand aus v0.3

- Originale, prozedural gezeichnete Waldgrafik im HD-2D-Stil: drei separat bewegte Wald-Ebenen, atmosphärischer Nebel, Lichtstrahlen, Blattwerk, Farne, Pilze und strukturierte Moosplattformen. Moosruinen erhalten Steinbögen.
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

1. Die Spieladresse im bisherigen Browser öffnen und neu laden. Im Menü muss **v0.5** stehen. Bei altem Cache einmal `?v=0.5` anhängen (gleicher Ursprung, gleicher Spielstand).
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

Pixelstil für Plattformen, Hintergründe, Gegner, Effekte und Benutzeroberfläche (separate Grafik-Phase v0.5); danach

Sound und Musik, zusätzliche Animationsframes, mehr Levelgeheimnisse, Klassenfähigkeiten/Skilltrees und Bosse. Frostgipfel, Glutberge und Himmelsruinen sind weiterhin Vorschauen.
