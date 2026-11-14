# Jäger 0.73 – Produktionsgrafik

Eigenständige, neu erzeugte Rastergrafik; keine Pixel des Magiers und keine
Sprites des Jägers bis 0.72 werden als Körpergrundlage geladen oder verarbeitet.
Die neuen Originalbilder wurden mit dem eingebauten Bildgenerator erstellt und
als komplette Figuren in native 96×96-Pixel-Zellen importiert. Es werden keine
Körperteile zur Laufzeit zusammengesetzt.

## Verbindliche Gestaltung

Stilreferenzen: `assets/heroes/mage/knight-style-063/atlas.png`,
`assets/heroes/mage/locomotion-067/locomotion.png` sowie die fertige Ritterserie
`assets/knight/production-054/`. Der Körper des Jägers ist rund 72 native Pixel
hoch. Kurzer grüner Überwurf, braune Lederrüstung, Kreuzgurte, Messingschnallen,
sichtbare Hosenbeine und Stiefel, eigenes bärtiges Gesicht, Pfeilköcher und
Holzbogen unterscheiden ihn vom Magier.

## Produktions-Prompts

Die folgenden finalen Aufgaben wurden je Blickrichtung mit dem neuen Jäger als
Identitätsreferenz verwendet:

| Grafik | Anforderung an die tatsächlichen Spielbilder |
| --- | --- |
| Grundfigur | Ein vollständiger, nach Süden blickender Jäger auf transparentem Hintergrund; kompakte Anatomie und Schattierungsdichte des Magiers; eigenständige Kleidung und Gesicht. |
| Ganze Aktionsserie | 8 Spalten × 7 Reihen: Stand, Laufen, Angriff, Pfeilhagel, Dash, Treffer, Tod; feste Blickrichtung, unverändertes Kostüm und Maßstab. |
| Seitenansicht | Reines Westprofil wie die Seitenperspektive des Referenzmagiers; ein Auge, Nase links, keine frontale Brust; alle sieben vollständigen Zustände. |
| Südlicher Bogenschuss | 8 × 2 komplette Figuren: Bogen quer vor dem Körper, Pfeilspitze sichtbar nach unten; ab Bild 5 keine Pfeile mehr auf der Sehne. Normaler Schuss und drei sichtbare Pfeile beim Spezialangriff. |
| Südwestlicher Bogenschuss | Gleiche Sequenzen mit Pfeilschaft von rechts oben nach links unten; Spitze unterhalb und links der Bogenhand. |
| Eigene Laufstudien | Je Richtung 4 × 2 vollständige Figuren: links Kontakt/Belastung, rechts Durchschwingen/Vorgriff, rechts Kontakt/Belastung, links Durchschwingen/Vorgriff; beide Knie und beide Stiefel tatsächlich bewegen, Oberkörper zusammenhängend. |
| Transparenzkorrektur NW | Nur die graue/transluzente Matte und hellen Säume entfernen; gesamte 8×7-Anordnung, Figuren und Ausrüstung bewahren. |

S, SW, W, NW und N sind eigenständige Ansichten. NO, O und SO spiegeln komplette
Figuren samt Bogen und gemessenen Sockets, entsprechend der Produktionskonvention
des Magiers. Es werden keine Körperteile separat gespiegelt.

## Reproduzierbarer Import

Die fünf `source-*.png` enthalten die vollständigen nativen Ausgangsfiguren
(8 Spalten × 7 Reihen). `source-layout.json` dokumentiert die gemeinsamen
Fußanker und Zellmaße. Die Originalillustrationen wurden nur zugeschnitten,
transparent normalisiert und auf Spielgröße rasterisiert. Die native Figur
wird zunächst einzeln gerastert; erst anschließend werden Zellen gepackt, damit
identische Rückkehrposen bitgenau gleich bleiben.

`node tools/pack-hunter-original.cjs` erzeugt daraus die sieben Laufzeitblätter
und `src/hunter-anchors.js`. Alle sieben PNG-Dateien wurden nach dem Neubauen
mit SHA-256 gegen den vorherigen Stand verglichen: identisch.

Optionaler Neuimport: `node tools/pack-hunter-original.cjs --import /pfad/zu/rohbildern`.
Rohbilder heißen `S.png`, `SW.png`, `W.png`, `NW.png`, `N.png`, dazu je Richtung
`*-walk.png` (4×2) und `S-shots.png` / `SW-shots.png` (8×2).
