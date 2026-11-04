# Alpha 0.50.0 — erster gezeichneter Ritter in der Runtime

**Status: optionale spielbare Art-Vorschau, kein fertiges 584-Frame-Set.**

Die **tatsächlichen Bildpixel** der im Chat erstellten Sprite-Übersicht wurden aus dem Layout extrahiert, transparent freigestellt und als separierte PNG-Strips übernommen (72 × 72 Quellpixel, Ausgabe 2× Nearest-Neighbor). **Spielvorschau:** `?previewPaintedKnight=1` aktiviert diese Rasterbilder für den Ritter im Hauptmenü und im Dungeon. Normaler Spielstart behält bewusst Alpha 0.49 für die sieben bislang nicht durchgezeichneten Aktionsrichtungen; keine unbemerkte Gameplay-Verschlechterung.

- Süd: **73 unterschiedliche Bildzellen** über Idle, Walk, Attack 1–3, Recovery, Special, Dash, Hurt und Death. Die Zahl bezeichnet die Quellenbilder; einige KI-generierte Quellframes sind visuell ähnlich oder besitzen überzeichnete/abgeschnittene Lichtspuren.
- 8 Richtungen: **8 echte gemalte statische Grundansichten**, jede mit eigener Silhouette.
- **Noch offen:** Für die anderen sieben Richtungen fehlen die spezifisch gezeichneten Lauf-, Angriff-, Verletzungs-, Spezial- und Sterbeframes. Bis sie vorliegen, rendert die Runtime in diesen Richtungen die statische Originalansicht des neuen Designs. Das ist besser als ein erzwungener Wechsel zur Südansicht, aber keine abgeschlossene Bewegung.
- Damage-Clock unverändert: Im neuen sichtbaren Süd-Atlas sind die gezeichneten Kontaktposen auf die bisherigen Hit-Frames gemappt; Schadensberechnung und Gegnerwerte wurden nicht geändert.
- Falls PNG-Bilder nicht geladen werden können, bleibt der bereits vorhandene ältere Renderer als bewusstes Ausfallsystem erhalten.
- Eingebaute Node-Tests prüfen Dateiformate, alle 73 Quellframes und die 8 eindeutigen Blickrichtungen. Eine tatsächliche visuelle Prüfung im laufenden Browser/iPhone und ein kompletter Neuzeichnungsdurchgang in allen Richtungen sind noch erforderlich.

**Nächste Art-Gates:** Vier Süd-Kampfanimationen ohne abgeschnittene VFX beurteilen, **Walk / Attack 1–3** auf West/Ost/SW/SE malen, danach N/NW/NE. Erst dann als vollständigen Ritter freigeben. Für den Test: https://christian045.github.io/realm-runners/?v=0.50.0&previewPaintedKnight=1 . Die technische Produktionserwartung bleibt in [der Produktionsmappe](./knight-sprite-production-map.md).
