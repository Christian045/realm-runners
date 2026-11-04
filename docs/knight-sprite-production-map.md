# Realm Runners — Ritter: Produktionsmappe für echte Sprites (Art-Lock → Ingame)

**Status:** Produktionsspezifikation; **noch keine neuen gezeichneten Sprite-Assets.**  
**Verbindliche Vorlagen:** [Master-Spec](./character-animation-master-spec.md), [Ritter-Produktionsbrief](./knight-production-brief.md) und das zuletzt abgestimmte Ritter-Produktionsbild aus dem Chat. Das Produktionsbild ist **eine Designreferenz**, kein schneidbares Spritesheet: Figuren, Labels, Effekte, Schatten und abweichende Perspektiven müssen neu als saubere Einzelbilder gezeichnet werden.

## 1. Art-Lock: erst Design, dann Bewegung

Nur **ein Master-Design**, keine generischen Code-Figuren:
- Geschlossener geschichteter Stahlhelm mit schmalem dunklem Visier, stählerne Schulterplatten/Brustpanzer, dunkelblauer Waffenrock und kurzer Umhang, gezielte kleine Goldornamente, dunkles Leder.
- Kräftiger, anatomisch verständlicher Ritter; Kopf weder riesig noch übermäßig klein. Zwei erkennbare Beine mit getrennten Knien/Stiefeln. Keine platten Rechteckglieder.
- **Ein** mittelalterliches Einhandschwert, **anatomisch rechte Hand**, **kein Schild**. Die freie Hand kann ausgleichen, trägt aber keine zusätzliche Waffe.
- Licht von links oben; konsistente Kontur-, Material-, Schatten- und Glanzfarben. Keine Airbrush-Filter, keine fremden/kopierten Sprites und keine vermischte Auflösung.
- Feste Dreiviertel-Top-down-Perspektive. Charakteridentität und Waffenhand müssen in jeder Ansicht und allen Zuständen gleich bleiben.
- **Freigabegate A:** Zuerst eine **isolierte Süd-Idle-Figur auf transparentem Hintergrund** in Gameplay-Größe zeigen und abnehmen. Erst dann komplette Bewegungen ausarbeiten. Der bisherige programmatisch gezeichnete Ritter **ist keine akzeptierte Art-Vorlage**.

## 2. Lieferverzeichnis (einheitliche Namen)

```text
assets/knight/final/
  source/                          # editierbare Originale; pro Richtung und Clip
    knight_master.aseprite          # oder .kra/.psd + exportierte PNGs
    S/idle/knight_S_idle_f00.png
    S/idle/knight_S_idle_f01.png
    ...
    S/attack1/knight_S_attack1_f00.png
    ...
    NW/death/knight_NW_death_f07.png
  atlases/
    knight_idle.png
    knight_walk.png
    knight_attack1.png
    knight_attack2.png
    knight_attack3.png
    knight_recovery.png
    knight_special.png
    knight_dash.png
    knight_hurt.png
    knight_death.png
  knight.manifest.json
  previews/                        # rein zur Abnahme, nie im Spiel verwendet
    knight_turnaround.png
    knight_S_combat_strip.png
    knight_ingame_iphone.png
    knight_ingame_desktop.png
```

**Wichtig:** `source/*.png` sind isolierte **72 × 72 RGBA-Bilder** ohne Text, Bodenellipse oder UI-Rahmen. Ein Frame = **ein kompletter Körper samt einer einzigen Klinge**. Alpha-Transparenz; kein weißer/dunkler Hintergrund und keine losgelösten Overlay-Sprites. Die `.aseprite`-/`.kra`-/`.psd`-Datei bleibt editierbare maßgebliche Quelle. Aus Exporten entsteht das Atlas deterministisch; keine manuellen nachträglichen Offsets.

## 3. Exakter Atlasvertrag

- **Autorengrid:** 72 × 72 Pixel je Sprite (pixelgenau gezeichnet).
- **Ingame-Ausgabe:** 144 × 144 bei **Nearest-Neighbor 2×**; kein bilineares Scaling, keine Rotation des gesamten Ritters.
- **Anker Autorengrid:** `(36, 59)`; Ausgabeanker `(72, 118)` exakt wie in der bestehenden Runtime.
- **Koordinaten:** Ursprung links oben; Quell-Zelle bei `x = frameIndex × 72`, `y = directionIndex × 72`.
- **Feste Reihenfolge der 8 Zeilen:** `0=S, 1=SW, 2=W, 3=NW, 4=N, 5=NE, 6=E, 7=SE` (entspricht `RIG_ROWS`).
- **Eine PNG pro Animationsclip**, horizontal die Frames, vertikal die 8 Richtungen. Jede Zeile muss dieselbe Anzahl Frames besitzen.
- **JSON-Metadaten:** pro Clip `frames`, `file`, `fps` (Richtwert), optional `contactFrame`, `hold/cancel`; je Sprite `handGrip`, `bladeTip`, `supportFoot` in Quellkoordinaten. Anker pro Sprite bleibt identisch.

| Clip / PNG | Frames je Richtung | Atlasauflösung | 0-basierter Kontaktframe | Hinweis |
|---|---:|---:|---:|---|
| idle | 6 | 432 × 576 | – | Ruhiger 6er-Loop |
| walk | 8 | 576 × 576 | – | Zwei vollständige Schritte |
| attack1 | 8 | 576 × 576 | **4** | 5. gezeichneter Frame; seitlicher Einstieg |
| attack2 | 8 | 576 × 576 | **4** | 5. Frame; umgekehrte Bahn |
| attack3 | 10 | 720 × 576 | **5** | 6. Frame; kräftiger Überkopffinalschlag |
| recovery | 6 | 432 × 576 | – | Sichtbarer Übergang |
| special | 8 | 576 × 576 | **4** | 5. Frame; eigener Powerswing |
| dash | 6 | 432 × 576 | – | Körper bleibt als Ganzes erkennbar |
| hurt | 5 | 360 × 576 | – | Kurze Reaktion |
| death | 8 | 576 × 576 | – | Gelenkbasierter Sturz |

**Gesamt:** `6+8+8+8+10+6+8+6+5+8 = 73` Frames pro Richtung und **584 einzeln gezeichnete vollständige Frames** über acht Richtungen; 10 PNG-Atlanten. Der Sprite-Exporter muss pro Clip exakt `frames × 8` Einzelbilder auflösen.

**Aktuelle Alpha 0.49 weicht davon ab:** Im Code werden **Dash 8**, **Hurt 6** und damit **608** Frames pro Ritter erzeugt; die drei Trefferframes sind aktuell `attack1=3`, `attack2=4`, `attack3=5`, und `special=3` (jeweils nullbasiert in der Framegrafik). Diese Produktionsmappe definiert das **Zielset**, nicht die bestehenden Dateien. Bei der späteren Integration alle State-Timings, Hit-/Effekt-Events und Tests kontrolliert auf das *neue* Sprite-Set umstellen. **Nie** Framezahl/Hitframe nur in einer Datei ändern; Kampftreffer müssen mit dem Sichtkontakt synchron sein.

## 4. Was exakt zuerst gezeichnet und exportiert wird

| Gate | Zu zeichnen | Akzeptanz im tatsächlichen Dungeon |
|---|---|---|
| **A — Model Lock** | Süd-Idle f00, Rück-/Seiten-/Diagonal-Model-Skizzen, Palette | Süd-Figur ist optisch genauso hochwertig wie die vereinbarte Designreferenz und in Phone-Größe lesbar |
| **B — Lauf Süd** | `S/idle` f00–f05 und `S/walk` f00–f07 | Zwei Beine bewegen sich wirklich unabhängig, Füße stehen auf dem Boden, Helmgröße bleibt identisch |
| **C — Schlagen Süd** | `S/attack1` f00–f07, `S/attack2` f00–f07, `S/attack3` f00–f09, `S/recovery` f00–f05 | Drei klar verschiedene Schwertbahnen, Schulter-Hüfte-Fuß arbeiten, keine doppelte Klinge; Hand bleibt verbunden |
| **D — Flanken** | alle sechs Clips aus B/C für `SW, SE, W, E` | Echte seitliche/diagonale Silhouetten, Blick- und Zielrichtung stimmen |
| **E — Rücken** | dieselben sechs Clips für `NW, NE, N` | Rücken, Knie, Rüstung und anatomische Waffenhand konsistent |
| **F — übrige Aktionen** | `special, dash, hurt, death`, je 8 Richtungen | Vollständiges Verhalten in echter Spielszene |
| **G — Finalisierung** | Endgültige PNGs + Manifest + Dokumentation + Browser/iPhone-Testvideos | Bestehende prozedurale Ritter-Frames ersetzt, visuelle Abnahme vor produktivem Merge |

**Keine Serie mit 584 Frames zeichnen, bevor Süd (Gate A–C) akzeptiert wurde.** Nicht erneut die Animationszahl erhöhen, wenn das Einzelmodell noch nicht stimmt.

## 5. Süd: verpflichtender erster Ingame-Abnahmesatz

**Sofortige Probe** (isolierte transparente Frames, 0-basierter Index):

- **Idle:** f00, f02, f05; f05 → f00 muss ohne Sprung loopen.
- **Walk:** f00 (linker Kontakt), f02 (rechter Fuß in der Luft), f04 (rechter Kontakt), f06 (linker Fuß in der Luft). Die **acht** Frames werden trotzdem vollständig exportiert und als Loop geprüft.
- **Attack 1:** f00 Grundhaltung, f02 Ausholen, **f04 Kontakt**, f06 Auffangen, f07 Recovery-Anschluss.
- **Attack 2:** f00 Anschlusspose, f02 Gegen-Ausholen, **f04 Kontakt**, f06 Abfangen, f07 Recovery-Anschluss.
- **Attack 3:** f00 Start, f03 maximale Spannung, **f05 Kontakt**, f07 schweres Nachziehen, f09 Übergang.
- **Recovery:** f00 Endschwung, f02 Schwert abfangen, f05 fließender Übergang zu Idle/Walk.

Zu prüfen als **Ingame-Videosequenz** bei normaler Spielgeschwindigkeit: ruhig stehen → diagonal gehen → nach Süden drehen → Attack 1 → Attack 2 → Attack 3 → Recovery → weiterlaufen. Prüfen auf **390×844 WebKit/iPhone** und Desktop. Fehler in der Schild-/Schwert-Hand, Fußanker oder Stil dürfen nicht von Effekten verdeckt werden.

## 6. Exporte, Laufzeit und Freigabe

1. Referenzillustration als **Art-Ziel**, nicht als direkte Sprite-Sheet-Quelle. Neue echte Richtungs-/Aktionsframes müssen gezeichnet oder kunstgerecht erstellt und im **gleichen Design** geprüft werden.
2. Pro Clip exakt vollständige transparente 72px-Zellen exportieren und zu PNG packen; visuellen Größen-/Farb-/Ankerabgleich; keine Engine-Interpolations- oder Ganzkörperrotations-Tricks.
3. Manifest lesen, korrekten `directionIndex` und `frameIndex` zur Laufzeit auswählen; **dieselbe Quelle** für Charakterauswahl und Dungeon, niemals nur im Debug-Labor.
4. Fußanker, Handgriff, Klingenspitze und Impact-Events an den realen Sprites messen; VFX am Klingenweg, nicht am Mittelpunkt des Ritters.
5. Node-/Browser-Tests + visuelle Aufnahme (PC/iPhone) vor Merge. Freigabe ausschließlich, wenn **das neue Artwork ingame** funktioniert und der visuelle Stil tatsächlich abgenommen wurde.

**Definition of Done:** Die PNG-Atlanten sind ein durchgehend gezeichnetes, hochwertiges Set, und der Ritter sieht im Dungeon genauso aus wie das abgesprochene Design. Ein grün durchgelaufener Test oder eine gute Konzeptillustration alleine sind ausdrücklich **nicht ausreichend**.
