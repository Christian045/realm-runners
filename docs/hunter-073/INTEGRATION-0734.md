# Jäger 0.73.4 – Integration

Der freigegebene Jäger ist der Standard im Menü, in der Trainingshalle und im
Dungeon. Stand und Lauf verwenden exakt dieselben Pixel wie die freigegebene
Probe: acht Standansichten, 64 Laufbilder, gemeinsamer Fußanker [48,88],
96-Pixel-Schrittlänge und korrigierter Kurzbogen.

`hunter-motion.js` enthält die gemeinsame Richtungs-/Phasenwahl.
`hunter-identity.js` bindet den vorhandenen Laufatlas in den Klassenrenderer ein.
`hero-aim.js` nutzt acht auf der tatsächlichen neuen Standgrafik gemessene
Kurzbogenpunkte für Schuss und Pfeilhagel. Anzahl, Schaden und Auslösezeitpunkte
werden unverändert durch das Kampfsystem bestimmt.

Neue Spann-/Aktionsblätter wurden noch nicht gezeichnet: Schuss, Pfeilhagel und
Treffer zeigen vorläufig die neue Standpose mit den vorhandenen Effekten.
Dash verwendet den neuen Laufzyklus, Tod einen einfachen Fall der ganzen Figur.
Das sind vorläufige Aktionsbewegungen, kein fertig ausgearbeitetes Kampfset.
Die früheren Körpergrafiken werden nicht in die neue Figur hineingemischt.

## Prüfung

367 automatische Tests bestanden, darunter Pixelgleichheit der 72 Stand-/
Laufzellen, starre NW-Bogenform, unveränderte Standgrafik, Richtungen,
Bodenkontakt sowie 16 normale/Spezial-Schussabläufe am neuen Kurzbogen.

Chrome: richtige Spielseite mit 0.73.4 geöffnet; 56 Kombinationen aus Zustand
und Richtung in der Trainingshalle bedient; anschließend echter Dungeon mit
acht Bewegungsrichtungen, Anhalten, Schuss, Pfeilhagel und Dash geprüft.

Zusätzliche CI-Prüfung `hunter-identity-browser.cjs`: Standardauswahl,
72 Stand-/Laufzellen, 16 Schussabläufe, Menü, Trainingshalle und Dungeon in
Chromium und WebKit. Die archivierte 448-Zellen-Prüfung läuft ausdrücklich
unter `originalHunter=1`, der frühere Kurzbogenversuch unter `hunterShortbow=1`.

Vollständiger CI-Lauf erfolgreich, einschließlich beider Browser:
https://github.com/Christian045/realm-runners/actions/runs/43600403349

Veröffentlichung über PR #67; Spielversion 0.73.4.
