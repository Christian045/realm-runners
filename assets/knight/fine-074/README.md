# Fein gezeichneter Ritter 0.74.0

Grundlage ist die vom Nutzer freigegebene zweite Spalte „Ritter neu“ in
`approved-reference.png`. Diese Version ersetzt die groben 72px-Quellen durch
neu gezeichnete vollständige Figuren mit einem etwa 72 Pixel hohen Körper.
Der Körper wird im Spiel nativ dargestellt. Die 128px-Zelle enthält zusätzliche
transparente Polsterung für Schwertbögen; sie vergrößert nicht den Ritter.

## Quellen und Aufbau

`source-S/SW/W/NW/N/NE/E/SE.png` sind acht generierte 8×6-Studien mit jeweils
48 vollständigen Bewegungsposen. Die Archivquellen unter `production-054`
waren ausschließlich Vorlagen für Blickrichtung und Bewegungsfolge. Aussehen
und Detailgrad stammen aus der freigegebenen neuen Zeichnung.

Die ersten N-, E- und SE-Studien wurden wegen falscher Schlag- oder
Blickrichtung verworfen und neu erzeugt. Nur die ausgewählten Quellen liegen
hier. Das Ausgangsraster enthält einzelne rote/gelbe Randreste; der Import
schließt diese Farbreste und getrennte Hintergrundteile bei der Freistellung
aus und prüft danach alle fertigen Zellen.

Wiederaufbau: `node tools/pack-knight-fine.cjs`.

Der Packer isoliert vollständige zusammenhängende Figuren vor dem Zuschneiden,
verwendet eine feste Skalierung je Richtung und richtet die ganze Figur auf
die gemeinsame Sohlenlinie aus. Kein Verformen einzelner Gliedmaßen. Er schreibt
zehn Laufzeitblätter mit insgesamt 608 Zellen sowie die Metadaten und die
Klingen-Kontaktpunkte in `src/knight-fine-contacts.js`.

Stand und Erholung verwenden je Richtung dieselbe vollständige Bereitschaftspose;
alle drei Angriffe beginnen und enden ebenfalls damit. Die langsame Atmung
bleibt eine minimale Ganzkörperbewegung um den Sohlenanker. Spezialangriff dreht
die vorhandenen acht Richtungen; Dash, Treffer und Tod verwenden die zugehörigen
Bewegungsphasen aus den Studien. 608 Zellen sind nicht 608 verschiedene Zeichnungen.

Die Kampfuhren bleiben bestehen. Kontaktbilder liegen bei Angriff 1/2/3 in
Frame 3/4/5; Effekte werden auf die sichtbare Klinge gesetzt.

## Erzeugungsspezifikation

Mit dem eingebauten Bildwerkzeug aus der freigegebenen Zeichnung erzeugt.
Hauptprompt und Richtungspräzisierungen stehen in `generation.md`.
Feste Merkmale: geschlossener runder Stahlhelm mit einer goldenen Mittelrippe,
schmaler Visiergrill, geschichtete Schulterplatten, gedämpfte Goldkanten,
dunkler blaugrauer Waffenrock, gerades Schwert rechts und kleiner Rundschild
links. Feine Pixelgruppen wie Jäger und Magier; keine bloße Farbkorrektur oder
Hochskalierung der alten Ritterbilder.
