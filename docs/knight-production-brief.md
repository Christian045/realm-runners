# Ritter — verbindlicher Produktionsauftrag (Realm Runners)

Referenz: [Master-Spec](./character-animation-master-spec.md) · Grundlage: neuer Ritter ab Alpha 0.48 · Ziel: tatsächlich flüssige 8-Richtungsanimationen im Dungeon, nicht nur ein Sprite-Labor.

## Identität des Ritters
Düstere, detaillierte Fantasy-Pixel-Art bei festem **72×72-Quellraster** und **144×144-Pixel-Ganzkörperausgabe**, Anker **(72,118)**. Geschlossener Stahlhelm, blauer Mantel/Waffenrock, ein goldener Akzent, klare Panzerhandschuhe, zwei voneinander erkennbare Beine, **ein einziges Einhandschwert in der rechten anatomischen Hand; kein Schild**. Gleiche Rüstung, Kopfgröße, Farben und Beleuchtung links oben in **S, SW, W, NW, N, NE, E, SE**.

## Verbindliche Animationsabnahme
| Clip | Produktionsanweisung | Abnahmepunkt |
| --- | --- | --- |
| Idle | Dezentes Atmen und Gewichtsverlagern, Waffe kontrolliert in der Hand | Kein unruhiges Zittern, sichtbarer Helm |
| Walk | 8 aufeinanderfolgende Schrittphasen; beide Beine beugen und strecken sich abwechselnd | Bodenanker fix, keine schwebenden Stiefel, auch bei N/S |
| Attack 1 | Kurzes Ausholen, Schulterzug, Seitenschlag, Kontakt, Rückzug | Sichtbare Klinge geht mit der Faust, Impact in Kontaktframe 3 |
| Attack 2 | Gegenhieb als eigene Bahn mit leichtem Oberkörpereinsatz | Kontaktframe 4, deutlich anders als Attack 1 |
| Attack 3 | Schwerer Finisher: große Vorbereitung, entschlossener Überkopfhieb, sichtbarer Nachlauf | 10 Frames, Kontaktframe 5 |
| Recovery | Unterarm/Schulter beruhigen sich nach Attacke, Rückkehr zur Ausgangshaltung | Keine harte Pose beim Übergang zu Idle oder Walk |
| Special | Eigener Schwert-/Wirbelangriff, verständliche Trefferpose | Kontaktframe 3, Effekt folgt Spieler und Klinge |
| Dash | Zielgerichteter Schrittausfall statt schwebender Ganzkörperverschiebung | Stiefel sichtbar und Ausrichtung korrekt |
| Hurt | Erkennbares kurzes Zusammenzucken | Erhaltene Proportionen, kein Flackern |
| Death | Knie geben nach, Oberkörper sackt ab, Helm folgt | Kein künstliches Drehen oder Skalieren der **gesamten Figur** |

Für den Ritter ist kein magischer Cast nötig; Spezialbereitschaft und Rückbewegung übernehmen diese Funktion. Die übrigen Klassen bekommen eigene Cast-Sets nach der Master-Spec.

## Engine-Vertrag
- Ein durchgehendes Charaktermodell. Keine separaten Schwert- oder Schild-Overlays im Live-Loop.
- `knight-reborn.js`: Quellpose, unveränderliche Faustposition, Hitframe und berechneter Klingenendpunkt.
- `knight-final.js`: vollständige Rasterblätter; `knight-animation.js`: ein Action-Clock, Richtungsbindung und Recovery; `game.js`: Kampfereignis an identischem Schwertkontakt.
- Bewegung/Angriff, Richtungswechsel, Wiederholungsangriffe, Treffer, Dash und Sterben müssen sich ohne Modell- oder Fußsprünge aneinanderreihen.
- Mobile WebKit- und Desktop-Browserchecks **im gestarteten Spiel** sind Pflicht. Automatische Tests prüfen Sichtbarkeit, Anker, Schwertverbindung, alle Richtungen und exakte Hitzeiten.
- **Freigabe nur nach visueller Ingame-Sichtung**, nicht bloß nach einer Anzahl erzeugter Frames oder grüner CI.

## Umsetzung im Code
- Alpha 0.49: sichtbare Recovery-Frames, anatomischer statt rotierter Todesablauf und schlanke Schlagspuren nahe der wirklichen Klingenspitze.
- Art-Feinzeichnung, natürliche Inbetween-Posen und optische Abnahme auf realem iPhone bleiben die entscheidenden Qualitätskriterien. Die Engine-Änderung allein erklärt den Ritter nicht für abschließend freigegeben.
