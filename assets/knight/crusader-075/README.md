# Kreuzritter 0.75.0

Die acht Quellstudien `source-{S,SW,W,NW,N,NE,E,SE}.png` sind neue,
transparent freigestellte 8×6-Pixel-Art-Animationen. Das unter
`reference.png` gespeicherte Bild fixiert die Gestaltung: kantiger,
geschlossener Stahlhelm, heller Waffenrock mit rotem Brustkreuz,
ein kurzes Einhandschwert; keine zweite Waffe und kein Schild.
Die Rückenansichten zeigen das schlichte helle Gewand ohne Brustkreuz.

Die Quellstudien wurden mit der integrierten Bildgenerierung als
Stilübertragung aus dem bisherigen Ritter-Bewegungsraster erstellt.
Jede Richtung erhielt denselben Acht-Ansichten-Stilanker und ihre
alte 8×6-Bewegungsvorlage, sodass Stand, Schritte, Schwertbewegungen
und Todesablauf erhalten bleiben. Die alten Vorlagen gaben nur die
Posen vor, nicht das Aussehen der neuen Figur.

## Reproduzierbarer Spielatlas

```sh
node tools/pack-knight-fine.cjs crusader-075
```

Der Packer trennt je Richtung 48 vollständige Figuren, übernimmt das
kleine native 72px-Körpermaß, hält die Sohle auf y=111 und erstellt
die zehn transparenten 128px-Atlanten mit insgesamt 608 Spielzellen.
Außerdem wird `src/knight-crusader-contacts.js` mit den Klingenenden
in den drei Schwertkombos geschrieben. Vier problematische Kreuzhiebe
haben überprüfte Kontakt-Koordinaten, damit der Treffer nicht am Helm
oder an den Stiefeln erscheint.

## Abnahme

- `node --test tests/knight-crusader.test.js`: alle 608 Zellen, Bodenkontakt,
  Bildübergänge, Schritt-/Angriffsvariation, Kreuz nur auf der Vorderseite,
  24 Kontakte an sichtbarem Klingenstahl
- `node tools/review-knight-crusader.cjs`: visuelle Kontaktprüfung als Montage
- `node tools/browser-test-server.cjs tests/knight-production-browser.cjs`:
  Browserprüfung im Menü, Trainingslab und Dungeon

**Grafikprompts:** `style-transfer`; jedes der acht Blätter verwendet
`reference.png` als Identitätsvorlage und die gleichnamige alte
`fine-074/source-*.png` als reine Raster-/Posevorlage. Forderungen
waren unveränderte 8 Spalten × 6 Reihen, Figur in der jeweiligen
Blickrichtung, fest verbundene Klinge, sichtbare laufende Beine,
transparentes Raster und derselbe detaillierte Pixel-Art-Stil wie
Jäger und Magier.
