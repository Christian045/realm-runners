# Jäger-Laufprobe – Prüfung vom 14.11.2026

Die acht freigegebenen Standansichten und die 64 Laufzellen sind als steuerbare
Probe verfügbar. Kein Wechsel der veröffentlichten Dungeon-Grafiken.

## Beobachtete Browserprüfung

Die öffentliche Laufprobe wurde in Chrome geöffnet und bedient:

- Alle 64 Einzelbilder über den Laufbildregler angewählt; Richtungs- und
  Bildanzeige jeweils überprüft.
- In allen acht Richtungen auf Anhalten gewechselt und die Standanzeige geprüft.
- Den zeitgesteuerten Wechsel Stand → Lauf → Stand beobachtet.
- Seitliche, diagonale und rückwärtige Laufbilder in der vollständigen
  Bilderübersicht mit den freigegebenen Standbildern verglichen. Figur,
  Kleidung und Kurzbogen bleiben visuell zusammengehörig.
- Die Tastatursteuerung bewegt die Figur und kehrt nach Loslassen zum Stand zurück.

Screenshot: `screenshots/locomotion-review.jpg`.

Die unveränderten Standpixel, gleiche Diagonalgeschwindigkeit und gemeinsame
Fußanker sind zusätzlich durch die vorhandenen automatisierten Tests abgedeckt.
Das ist eine Stand-/Laufprobe; die Kampfanimationen dieser neuen Figur sind
weiterhin offen.

## Korrigierter Browsertest

Der Richtungsselektor im automatisierten Browsertest war mehrdeutig:
`[data-row="0"]` erfasst sowohl den Richtungsknopf als auch die Statusanzeige.
Alle Richtungsaktionen zielen jetzt ausdrücklich auf die Knöpfe in `#directions`.
Ohne diese Korrektur bricht Playwright bereits beim ersten Richtungswechsel ab.

Die Browserprüfung kann gezielt mit `HUNTER_BROWSER_ENGINES=chromium` und einem
vorhandenen `CHROMIUM_EXECUTABLE_PATH` gestartet werden. Standardmäßig bleiben
Chromium und WebKit aktiv. Die hier dokumentierte Sichtprüfung erfolgte in
Chrome; eine lokale WebKit-Prüfung wurde nicht ausgeführt.

## Verifizierte Prüfseite

https://rawcdn.githack.com/Christian045/realm-runners/502120a08f2bf5f7455e1972ee4f8d873d98b92c/tests/hunter-locomotion-review.html

## Nachprüfung: Bogenfehler

Der Nutzer hat zurecht Bogenfehler bei S, N, SW und NW gemeldet. Die erste
Sichtprüfung hat diese übersehen. Der Zuschnitt nach starren Spalten übernahm
fremde Bogenspitzen und schnitt eigene Spitzen ab. Die Quellfiguren werden jetzt
vor dem Zuschneiden vollständig getrennt. Zusätzlich wurde die variierende
NW-Holz-/Sehnenzeichnung durch einen begrenzten, mit dem Bildwerkzeug
überarbeiteten Hand-/Bogenbereich vereinheitlicht. Alle acht NW-Phasen haben
jetzt dieselben Griff-/Bogenpixel; die restlichen Körperpixel sind bytegleich
mit der ursprünglichen Laufanimation.

363 automatische Tests bestanden. Die aktualisierte öffentliche Probe wurde
in Chrome geladen und alle 32 Einzelbilder der gemeldeten vier Richtungen
sowie die Rückkehr zum Stand erneut bedient. NW wurde außerdem mit langsamem
Tempo angesehen. Screenshot: `screenshots/locomotion-bow-fixed.jpg`.

Aktuelle geprüfte Probe:
https://rawcdn.githack.com/Christian045/realm-runners/97333e819709a8c4d22bff2d8c53a1db937a80d6/tests/hunter-locomotion-review.html
