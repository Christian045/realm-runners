# Knight sprite release candidate 0.53 — 8 Richtungen / 10 Clips

## Status

**Spielbare opt-in Vorschau, nicht ungeprüft als Standard freigegeben.**

`?previewKnightFinal=1` aktiviert eine durchgehende Bild-Animation für jede Richtung. Die normale Veröffentlichung bleibt weiterhin beim bisherigen stabilen Renderer. Wir schalten erst um, wenn die **tatsächlich im Dungeon betrachtete Grafik** akzeptiert wurde, nicht lediglich bei grünem CI.

## Umfang und Herkunft

| Richtungsgruppe | Zeilen (0-basiert) | Bildzellen | Herkunft |
|---|---|---:|---|
| Süd | 0 | 76 Runtime-Zellen | 73 unterschiedliche PNG-Quellzellen aus 0.50; Dash/Hurt auf 0.49-Framezahlen abgebildet |
| Nordwest, Nord, Nordost | 3, 4, 5 | 228 | Separate illustrierte Rücken-Porträts, 0.51-Kampf und 0.52-Gang/Idle/Death |
| Südwest, West, Ost, Südost | 1, 2, 6, 7 | **304 neu** | 0.53-Pixel-Pose-Baker auf echten gemalten Basisfiguren |

**Gesamt in der Vorschau:** 8 × 76 = **608 Raster-Zellen**, zehn Zustände je Richtung. Das bedeutet **keine 608 unabhängig handgemalten Bilder**; etliche Phasen werden aus vorhandenen bemalten Körperteilen zusammengesetzt. Das ist ein technischer Integrationsstand, keine automatische visuelle Abnahme.

**Zellformat:** 72×72 transparent, 2× Pixel-Art-Sampling. Vorschau-Skala 90 % der früheren Ausgabe (144 × 144 → ca. 130 × 130 Weltpixel); identischer Fußanker am Weltpunkt. Weder Ganzkörperrotation noch Spiegelung in der Runtime.

**Clips je Richtung:** idle 6, walk 8, attack1 8, attack2 8, attack3 10, recovery 6, special 8, dash 8, hurt 6, death 8. *Es ist dieselbe bestehende 0.49-Kampfclock*, keine Änderung an HP, Reichweite, Schadensberechnung oder Gegnern.

## Richtungssynchronisation

- Trefferkontakt ist im gerenderten Bild und der Spiel-Event-Timeline synchronisiert: attack1 f03, attack2 f04, attack3 f05, special f03 (nullbasiert).
- 0.53-Blade-Tip-Messungen verankern Trefferpartikel für SW/W/E/SE am tatsächlich gezeichneten Klingenkontakt. 0.51 übernimmt dasselbe für NW/N/NE. Süd folgt der 0.49-Kontaktlogik.
- Walk und Idle loopen kontinuierlich und behalten einen stabilen Fußanker. Hurt, Dash und Death werden als eigene Bildfolgen abgerufen.
- Das Programm lädt die zehn neuen Seitenatlanten ausschließlich bei `?previewKnightFinal=1`. `?previewKnightUp=1` bleibt die historische N/NW/NE-Vorschau.

## Testlink

`https://christian045.github.io/realm-runners/?v=0.53.0&previewKnightFinal=1`

Süd, Südwest, West, Nordwest, Nord, Nordost, Ost, Südost im Dungeon nach und nach anlaufen und für jede Blickrichtung Attack 1–3 auslösen. Auf PC und iPhone die Größe, Stiefel, Waffenhand, Recovery, Dash, Treffer, Death und Anbindungen im Gameplay beurteilen.

## Qualitätsgate

1. **Automatisch:** Node-Tests prüfen 304 Seitenzellen auf Bildinhalt, 4-Facing-Silhouetten, Schnittkanten, Fußbereiche, individuelle Schwerttipps am Kontaktframe und Endlos-Loops. Browserprüfung validiert die voll zusammengesetzte 8-Richtungs-Grafik sowie die echte Spiel-Render-Pipeline und den **Default-Fallback**.
2. **Visuell:** Jede der 80 Richtung/Clip-Kombinationen muss am iPhone und PC in Bewegung überzeugen. Besonders kritisch sind Überlappungen aus altem Schwert/neu gezeichneter Klinge, mechanisch wirkende Schulterwinkel, Fußverlust im Seitenprofil und abrupte Perspektivwechsel. Bei Mängeln **nicht** als Standard aktivieren.
3. Erst nach Behebung der visuellen Fehler/Abnahme `previewKnightFinal` als Standard-Quelle übernehmen und die Notwendigkeit von Testparametern beseitigen. Keine ungeprüfte Live-Umstellung.

**Quellcode für reproduzierbare Bild-Exporte:** `tools/generate-knight-side-053.py` (Pillow; Quelle `assets/knight/north-051/facings-v051.png`, Ausgabe `assets/knight/side-053/*-side.png`). Der Generator arbeitet mit einem separaten Kontaktpose-Set, beweglichen Greaves und einem verbundenen Schwertgriff.
