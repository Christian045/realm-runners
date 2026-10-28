# Realm Runners – Dungeon Reborn (Alpha 0.2)

**Top-down-Roguelite / Hack-and-Slash** auf Basis der bisherigen JavaScript-/HTML5-Canvas-Technik.
Das bisherige Jump-and-Run wurde technisch und spielerisch neu aufgebaut. Der alte Stand bleibt im `main`-Branch bis zum Merge der Umstellung erhalten.

## Spielen

Lokal im Projektordner:

```sh
python3 -m http.server 8000
```

Danach **http://localhost:8000** im Browser öffnen. Kein Build erforderlich.

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
| PC | Escape pausieren, Enter im Menü starten |
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
| `src/atmosphere.js` | Visuelle Raumthemen, Fackeln, Lichteffekte und Boss-Warnzonen |
| `src/input.js` | Keyboard, Maus und Touch |
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
