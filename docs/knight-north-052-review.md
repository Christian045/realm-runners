# Ritter-Animationsblock 0.52 – Norden / Nordwest / Nordost

**Status: testbare, opt-in Sprite-Vorschau; keine automatische Freigabe des neuen Ritters in der regulären Spielversion.**

## Gelieferte Bewegungen

Alle **10 Clip-Arten** für **N (Zeile 4), NW (Zeile 3), NE (Zeile 5)** werden in der Vorschau über eigene vollständige Frame-Sequenzen dargestellt.

| Clip | Frames je Richtung | Status |
|---|---:|---|
| Idle | 6 | NEU, angelehnte Atmung ohne wandernde Stiefel |
| Walk | 8 | NEU, zwei unabhängig wechselnde Beine, kein Ganzkörper-Hüpfen |
| Hurt | 6 | NEU, Oberkörper-Rückstoß mit verbleibender Bodenhaftung |
| Dash | 8 | NEU, Ausweichabstoß, umhängende Rüstung bleibt gleich |
| Death | 8 | NEU, Kniefall und Oberkörperbruch statt starrer Ganzkörperrotation |
| Attack 1 / 2 / 3 | 8 / 8 / 10 | Aus 0.51; gerichtete Rücken-/Diagonal-Angriffe |
| Special | 8 | Aus 0.51; eigener Schlagbogen |
| Recovery | 6 | Aus 0.51; Rückkehr in den Kampfstand |

**108 neue Bildzellen** (36 pro Richtung); mit den 120 schon integrierten Rücken-Kampfzellen sind das **228 Animationszellen** für die drei oberen Richtungen (76 pro Richtung). Die Bildzellen wurden mit einem reproduzierbaren Pixel-Art-Pose-Generator aus der vorhandenen illustrierten Stahl-/Blau-/Gold-Grundfigur erzeugt. Sie sind nicht 108 separat von Hand gemalte Illustrationen.

**Einheitliche 72 × 72 Quellzelle**, feste Zeilenreihenfolge S, SW, W, NW, N, NE, E, SE. Rendermaßstab 90 % gegenüber dem früheren Test-Ritter; Fußanker und bestehende Hit-Events sind unverändert. Die neuen Bilder müssen keine falsche Ganzkörperrotation in der Game-Engine ausführen.

## Einbindung

In `src/knight-north-051.js` lädt `loadKnightNorthReviewSheets()` die bestehenden 0.51-Kampfsequenzen und ergänzt `assets/knight/north-052/*-up.png` für die fünf bislang fehlenden Animationen. Beim Spielen verwendet `src/knight-final.js` diese Bildzellen ausschließlich, wenn `previewKnightUp` in der URL gesetzt ist.

**Vorschau:** `https://christian045.github.io/realm-runners/?v=0.52.0&previewKnightUp=1`

Ohne diesen Parameter bleibt der zuvor stabile Ritter-Renderer aktiviert. **Noch offen:** vollständige Walk-/Attack-/Special-/Hurt-/Dash-/Death-Sequenzen für die vier seitlichen und unteren Diagonalrichtungen SW, W, E, SE sowie finale visuelle Qualitätsabnahme der gesamten Charakteranimation. Kein Produktionswechsel, bevor diese abgeschlossen sind.

## Test- und Qualitätsvorgaben

- `npm test`: prüft alle 108 neuen PNG-Zellen, Transparenz, Kontinuität der Knie/Stiefel, 8 individuelle Laufphasen und nicht rotierte Standbeine.
- `node tests/knight-north-052-browser.cjs` bei laufendem lokalen HTTP-Server: Chromium und WebKit bei 390×844, echte Spieler-Renderer-Ausgabe und Dungeonstart, Default-Renderer unberührt.
- Darstellungsfehler nicht mit vorhandenen Effekten kaschieren. Die erzeugten Zwischenbilder sind ein weiterer Produktionsstand, keine gestalterisch abgenommene Endanimation.

Reproduzierbarer Export bei vorhandenem Pillow: `python3 tools/generate-knight-north-motion-052.py`.
