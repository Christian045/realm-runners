# Jäger 0.73 – Prüfprotokoll, 14. November 2026

## Technische Prüfung

- `npm test`: 353 Tests, einschließlich vorhandener Spiel-, Ritter- und Magierregressionen.
- Sieben vollständig geladene 768×768-PNG-Atlanten, 96×96-Zellen, 448 belegte Frames.
- Acht getrennte Richtungen, acht Laufphasen einschließlich veränderter Hosenbein-/Stiefelpixel, feste Sohlenlinie, gepolsterte Zellen, kanonisches Alpha.
- Identische Start- und Rückkehrposen für Angriff, Spezial, Dash und Treffer; endgültige Todespose bleibt liegen.
- Gemessene Pfeilspitzen und Bogenhandpunkte liegen auf dem vollständigen Spannbild.
- Normaler Schuss / sieben Projektile beim Pfeilhagel: kein Schuss vor 1/2, korrekter Ursprung bei 1/2, keine Doppelung, auch bei großem Zeitschritt.
- Der Jäger-Schatten liegt wie beim Magier an der Sohle statt zehn Pixel darunter.
- Die Trainingshalle durchläuft den kompletten 96-Pixel-Schrittzyklus statt nur 72 Pixel.
- Rebuild aller sieben Spriteblätter: identische SHA-256-Prüfsummen.

## Echter Browser

Im sichtbaren Chrome 156 wurden `tests/hunter-qa.html` und das normale Spiel
geöffnet. Die Prüfseite lädt die tatsächlichen Produktionsmodule und prüft
selbständig: **448/448 Frames, 16/16 sichtbare Pfeilursprünge und 16/16
Schussabläufe**. Dies sind echte Browserprüfungen, keine Nachbildung in Canvas
für Node. Die Prüfergebnisse stehen auch im Screenshot.

Die Trainingshalle wurde durch alle sieben Zustände und acht Richtungen
bedient. Seitliches Laufen wurde zusätzlich bei 87,5 % geprüft: Bild 8 erscheint
bei Ritter, Magier und Jäger. Klassenauswahl, Dungeonstart, Bewegung, Dash sowie
Pfeilhagel mit sichtbarem Cooldown wurden im normalen Spiel bedient.

## Visuelle Prüfung

- Eigene Figur im gleichen Maßstab neben dem unveränderten Produktionsmagier und Ritter verglichen.
- Alle acht Reihen und acht Frames für Stand, Lauf, Angriff, Spezial, Dash, Treffer und Tod im Browser angesehen.
- Frontschuss nach unten und diagonaler Südwestschuss gezielt neu gezeichnet; Seitenprofil korrigiert.
- Separate Laufstudien nach der ersten Prüfung importiert, ruhige Standfigur mit minimaler Ganzkörperatmung statt wechselnder Standproportionen.
- Heller NW-Mattensaum und unverbundene Fremdpixel an Todesposen bereinigt.
- Im Dungeon den sichtbaren Luftspalt zum Schatten erkannt und korrigiert.

Screenshots unter `screenshots/` zeigen echte Browserausgaben. Die Aufnahmen
während der Entwicklung tragen zum Teil den DEV-Zusatz; sie sind keine
Konzeptgrafiken. Die Framegalerien dokumentieren die Sichtprüfung; die neue
Laufgalerie ersetzt die zuerst verworfene Laufserie.

## Weitere Browserautomatisierung

`tests/hunter-original-browser.cjs` ergänzt die CI um Decodierung aller Frames,
Menü, Trainingshalle und Dungeon in Chromium und WebKit. Lokaler Browserstart
über Playwright ist in dieser Ausführungsumgebung durch das Socket-Verbot
blockiert; deshalb wurden die sichtbare Chrome-Prüfung und die browserinterne
Prüfseite verwendet. Der vollständige CI-Status ist separat am GitHub-Commit
zu prüfen. Keine WebKit-Freigabe aus der lokalen Chrome-Prüfung ableiten.

Die persistente Speicherstruktur, Spielstände, Balancing und Fähigkeiten wurden
nicht verändert. Die Referenzgrafiken des Ritters und Magiers bleiben identisch.

## Veröffentlichung bestätigt

Der vollständige Chromium-/WebKit-Prüflauf für den veröffentlichten Spielcode
ist erfolgreich: https://github.com/Christian045/realm-runners/actions/runs/43537789336
(353 technische Tests; pro Browser 448 Frames und 56 Trainingszustände).

GitHub Pages hat Version 0.73.0 erfolgreich bereitgestellt:
https://github.com/Christian045/realm-runners/actions/runs/43538514185

Anschließend wurde die öffentliche Seite geöffnet, Version 0.73.0 in der
Oberfläche bestätigt und der neue Jäger im Dungeon gestartet.
`screenshots/live-dungeon.jpg` zeigt diese tatsächliche öffentliche Version.

Testlink: https://christian045.github.io/realm-runners/?v=0.73.0&debugAnimations=1
