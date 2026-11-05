# Ritter: Acht-Richtungen-Abschlussprüfung (Alpha 0.53)

**Ergebnis:** Alle zehn Animationsarten sind in der separaten, spielbaren Grafikvorschau für jede der acht Richtungen implementiert. **Künstlerische Endfreigabe: ausstehend.** Standard-Ritter im normalen Spiel bleibt unverändert.

## Technische Bestandsaufnahme

| Bereich | Abdeckung | Ergebnis |
|---|---|---|
| Süd (S) | Idle 6, Walk 8, Attack 1/2 je 8, Attack 3 10, Recovery 6, Special 8, Dash 8, Hurt 6, Death 8 | 76 Runtime-Zellen, aus 73 illustrierten Quellzellen mit definierten Framezuordnungen |
| NW / N / NE | dieselben zehn Clips | 228 eigenständige Runtime-Zellen; neue Richtungsangriffe und unabhängig animierte Stand-/Lauf-/Schadens-/Dash-/Sterbe-Frames |
| SW / W / E / SE | dieselben zehn Clips | 304 unabhängige Runtime-Zellen (je 76) |
| **Gesamtes Acht-Wege-Set** | **8 Richtungen × 76 Runtime-Frames** | **608 Zellen**; einzelne Quellposes können sich ähneln oder wiederholt werden |
| Größe und Anker | 72 × 72 px Quelle, nearest-neighbor auf 2×, zusätzliche Preview-Skalierung auf 90 % | Einheitliche nominale Fußverankerung, richtungsabhängige Atlas-Reframing-Korrektur |
| Schwertangriffe | Attack 1/2/3 und Special in 8 Richtungen | Sichtbare Posen und Treffer-Events; Klingenspitzen-VFX nach Richtung in der Vorschau |
| Lauf-/Standloops | Alle 8 Richtungen | Automatischer Dauerloop-Test; kein Stop nach dem ersten Schrittzyklus |
| Hurt / Dash / Death | Alle 8 Richtungen | Bildfolgen vorhanden, auf transparenten Einzelzellen gebacken |

**Nicht verwechseln:** 608 Runtime-Zellen bedeuten nicht 608 manuell einzeln gezeichnete Meister-Sprites. Teile der Zwischenbilder wurden durch artikulierte Pixel-Manipulation aus gemeinsamem Original-Artwork gebacken. Vollständige technische Abdeckung ist nicht gleich endgültig akzeptierte Bildqualität.

## Freigabegates

1. **Asset-Format:** PNG-Atlasraster, 72px Zellen, Zeilenreihenfolge S/SW/W/NW/N/NE/E/SE – geprüft.
2. **Bewegungsabdeckung:** Idle/Walk/Attack1/Attack2/Attack3/Recovery/Special/Dash/Hurt/Death × 8 – geprüft.
3. **Laufbewegung:** Zwei wechselnde Stiefel, identischer Standanker, Loop über die erste Periode hinaus – automatisch geprüft.
4. **Waffenführung:** Unterschiedliche Angriffsphasen, keine zweite statische Schwertgrafik, Impact am Klingenweg – automatisierte Prüfungen und Bildgalerien vorhanden.
5. **Leistung/Browser:** Chromium, WebKit und mobile 390×844 Spieltests; Regression für den bisherigen Renderer. Die alten Legacy-Galerien werden mit kleineren Zwischencanvases ausgegeben, um CI-Ressourcenüberschreitungen zu vermeiden.
6. **Visuelle Detailabnahme:** Qualität von Helm/Armen, Schwertkontakt, Laufbewegung, Oberkörperdrehung und Übergängen in echter Spielgeschwindigkeit – **nicht abschließend durch automatisierte Tests feststellbar**. Beurteilung im tatsächlichen Spiel erforderlich.
7. **Standard-Release:** **gesperrt**, bis die visuelle Abnahme erfolgt und ggf. korrigierte Frames eingecheckt und erneut geprüft wurden.

## Testlinks

- Vollständiger Ritter in der isolierten Vorschau: https://christian045.github.io/realm-runners/?v=0.53.0&previewKnightFinal=1
- Normaler Spielstart ohne neues Artwork: https://christian045.github.io/realm-runners/

Zusätzliche Informationen: `src/knight-side-053.js`, `src/knight-north-051.js`, `src/knight-final.js`, `tests/knight-side-053.test.js`, `tests/knight-side-053-browser.cjs`.

**Definition of Done:** Erst wenn die tatsächlichen Bewegungen und Grafiken im Spiel überzeugen, wird der neue Ritter für alle freigeschaltet. Eine erfolgreiche CI-Suite alleine darf die Freigabe nicht auslösen.


## Korrektur der Atlas-Zusammensetzung (5. November 2026)

Bei der Codeprüfung wurde ein tatsächlicher Transparenzfehler in der 0.53-Vorschau gefunden:
Die neuen Ritterposen wurden in Nord- und Seitenrichtungen teilweise **über** die
alten statischen Silhouetten gemalt. Dadurch konnten die alten Stiefel,
Waffen und Mantelanteile sichtbar bleiben (Doppelbilder/Geisterspuren).
Außerdem konnten die auf 105,5–108 % vergrößerten Seitenzellen auf angrenzende
Atlaszellen und Richtungszeilen übermalen.

**Korrektur:** Jede ersetzte Zeile wird vor dem Import gelöscht; jede normalisierte
Zelle wird separat auf ihr 72×72-Raster begrenzt. Die neue Browser-Regression
`tests/knight-atlas-isolation-browser.cjs` vergleicht alle **532** erneuerten
Nord- und Seitenzellen mit separat gerenderten PNG-Quellzellen in Chromium und
WebKit. Die bestehende Standardversion bleibt weiterhin unangetastet;
die künstlerische Endfreigabe des Ritters steht nach wie vor aus.
