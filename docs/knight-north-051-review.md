# Ritter Alpha 0.51 — Nord, Nordwest und Nordost: echte Angriffsvorschau

**Status: Nur für die überprüfbare Testansicht freigegeben, NICHT als fertiger Ritter und NICHT in der regulären Version aktiviert.**

## Was tatsächlich neu ist

- Neue transparente 72×72-Richtungsbilder aus der letzten Ritter-Vorlage — nicht aus den beschädigten Beschriftungs-Ausschnitten des früheren Modellblattes. Reihenfolge S, SW, W, NW, N, NE, E, SE.
- **Norden, Nordwesten und Nordosten** besitzen für **Attack 1, Attack 2, Attack 3, Special und Recovery** jeweils eigene Bild-Zeitfolgen. Insgesamt 120 gerenderte Sprite-Zellen (3 Richtungen × [8+8+10+8+6]).
- Bewegliche Elemente sind das **Schwert samt verbundenem Waffenarm**, nicht der ganze um den Mittelpunkt gedrehte Charakter. Helm, Torso, Umhang und Füße stammen aus der identischen Richtungsgrundfigur.
- Die drei Angriffe haben unterschiedliche Schwungbahnen: Eröffnungshieb, Gegenhieb und über Kopf angesetzter Finisher. Der Schaden bleibt auf dem bestehenden Kampf-Eventtakt; die Treffereffekte folgen für den Test den **sichtbaren Klingenspitzen nach oben**.
- Der neue Test-Ritter wird **90 %** der bisherigen Ausgabegröße gerendert, mit unverändertem Fußanker.
- Andere Richtungen behalten die bisherigen, noch nicht gezeichneten Aktionen. **Dies ist kein vollständiges 584-Frame-Set.**

## Öffnen

Wenn diese Änderungen über die Produktiv-Release-Pipeline für **isolierte Testansichten** veröffentlicht wurden:

`https://christian045.github.io/realm-runners/?v=0.51.0&previewKnightUp=1`

Dieser Parameter aktiviert die neue Rückseiten-Grafik. Ohne den Parameter bleibt der zuvor freigegebene Spiel-Renderer erhalten. Die vorhandene Vorschau `?previewPaintedKnight=1` bleibt eigenständig.

## Abnahme/Offene Arbeit

1. Animationskurven N/NW/NE im Dungeon spielen und mit dem Sprite-Labor vergleichen: Schwert sitzt in der Hand, klare Attack-1/2/3-Unterschiede, Verletzungen/Beine noch ungeprüft.
2. Die **angelegten Schwertarm-Zwischenposen sind technisch gebacken**, jedoch weiterhin ein Entwurf. Feine Handzeichnung und natürliche Schulter-/Hüft-Animation müssen vor einer Qualitätsfreigabe nachgearbeitet werden.
3. **Walk/Idle, Dash/Hurt/Death** für N/NW/NE und sämtliche Clips für SW/W/E/SE bleiben ausstehend; bis dahin kein Release als endgültiger Ritter.
4. Vor einer Produktivfreigabe müssen alle drei Combo-Schwünge mit echten iPhone- und Desktop-Szenen visuell abgenommen werden. Automatische Prüfungen reichen nicht für eine ästhetische Freigabe.

## Tests

- Node: Transparenz, Plattenabmessungen, 120 sichtbare Zellen, 8 unterschiedliche Blickrichtungen, keine abgeschnittenen Sprites, Schwertkontakt nach oben und unveränderte Fußlinie.
- Chromium/WebKit: echte Canvas-Frames und spielbarer Start in der Preview, gleichzeitig Absicherung, dass ohne Preview-Parameter der Standard-Ritter unverändert bleibt.
