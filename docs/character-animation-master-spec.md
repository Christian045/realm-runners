# Realm Runners — Master-Spec für Charakter-Art & Animation
**Status:** verbindliche Produktionsvorgabe · **Gültig für:** alle sechs Klassen · **Referenzklasse:** Ritter  
**Ziel:** ein geschlossenes, hochwertiges Dark-Fantasy-Pixel-Art-System, das im **tatsächlichen Dungeon** auf PC und iPhone überzeugt. Bestehender Code und die aktuelle Alpha 0.48 sind Ausgangsmaterial, **keine** automatische Qualitätsfreigabe.

## 1. Art Direction — eine visuelle Sprache

- **Originale, handgezeichnet wirkende Fantasy-Pixel-Art**, düstere mittelalterliche Atmosphäre; keine Kopien fremder Spielgrafiken. Inspirationsreferenzen (etwa Heroes of Hammerwatch) dienen ausschließlich zur Einordnung von Lesbarkeit, Dichte und Bewegungsqualität.
- **Kamera:** feste Top-down-/Dreiviertelansicht. Alle acht Richtungen müssen derselben Projektion folgen: **S, SW, W, NW, N, NE, E, SE** (dies entspricht bereits der Reihenfolge in \`RIG_ROWS\`).
- **Einheitliches Produktionsraster:** Ziel ist **72 × 72 Autorenpixel je vollständigem Frame**, bei **2× Nearest-Neighbor** als **144 × 144 Ausgabezelle**. Keine Filterunschärfe und keine nachträgliche Skalierung einzelner Körperteile. Für die übrigen Klassen sind neue Frames im gemeinsamen Raster zu zeichnen; bestehende 32×36-Art darf nicht einfach als Ersatz hochskaliert werden.
- **Gemeinsamer Anker:** Ausgabe \`(72,118)\`, Autorengrid \`(36,59)\`. Die Figur bleibt über alle Clips auf demselben Weltpunkt. Beim Gehen steht jeweils ein Fuß glaubwürdig am Boden; der andere darf sich sichtbar anheben. Der *Körper* darf leicht bobben, der Weltanker darf nicht springen.
- **Proportionen:** verbindliche Referenz des fertig abgenommenen Ritters für Kopf-/Helm-, Schulter-, Rumpf-, Arm-, Bein- und Waffenmaß. Andere Klassen dürfen bewusste Silhouetten-Unterschiede haben, aber keinen zufälligen Kopf- oder Maßstabwechsel zwischen Frames.
- **Licht:** einheitlich diffus von **links oben**; oben/links Lichtkanten, unten/rechts Schatten. Deutliche, kontrollierte 1-Pixel-Lichter; kein uneinheitliches Airbrush-Shading.
- **Palette:** dunkle Konturen, gedämpfte Metall-, Leder- und Stofffarben, wenige akzentuierte Highlights. Identitätsfarben: Ritter **Stahl/Blau/Gold**; Magier **Violett/Arkan** (Feuer/Eis unterscheidbar); Bogenschütze **Waldgrün/Braun**; Glaskanonier **Petrol/Kristall**; Beschwörer **Dunkelviolett/Türkis**; Alchemist **Ocker/Kupfer/Grün**.
- **Mobile first:** Waffen, Klasse, Blickrichtung, Beine und Hauptaktionspose müssen in der üblichen iPhone-Spielgröße lesbar bleiben. Details, die nur in 800%-Zoom funktionieren, sind sekundär.
- **Identitätskontinuität:** Helm/Gesicht, Kleidung, Rüstung, Farbbereiche, Körpergröße, Umhang, Waffenhand und Proportionen dürfen bei Clip- und Richtungswechsel **nicht** neu erfunden werden.

## 2. Master-Character & Sprite-Produktion

Für jede Klasse existiert genau **ein** freigegebenes Model Sheet mit: Vorder-, Rück-, Seiten- und vier Diagonalansichten, Farbpalette, identischen Körpermaßen, klar bezeichneten Waffen-/Handankern und Bodenanker.

1. **Zuerst Schlüsselposen**, dann die passenden Zwischenframes. Die Aushol- und Trefferpose werden als tatsächliche Ganzkörperbilder entwickelt; keine generischen, nur gedrehten Waffen am Stand-Sprite.
2. Jede Pose enthält **zusammenhängende Anatomie**: Hüfte→Knie→Stiefel, Schulter→Ellenbogen→Hand→Waffe. Auch unter Roben, Capes und Mänteln muss das Schreiten erkennbar sein.
3. **Idle, Walk, Attack, Combo, Special, Hurt, Dash, Death, Cast und Recovery** werden mit derselben Master-Figur ausgearbeitet. Nicht sinnvolle Zustände (z. B. Zauber-Cast beim Ritter) werden **begründet** in eine passende klassenspezifische Vorbereitungsanimation übersetzt, nicht in leere oder unsichtbare Frames.
4. Pro Clip **acht echte Ausrichtungen**. Spiegeln ist nur zulässig, wenn die Waffenhand, asymmetrische Rüstungen, Umhang, Haare und Effekte danach noch korrekt sind.
5. Die Produktions-Pipeline exportiert **vollständige Spritezellen** je Frame, einheitliche Metadaten und die dazugehörigen Quell-Sprites. Laufzeit-Rendering wählt die fertige Pose aus, statt die komplette Figur zu rotieren, zu dehnen oder aus unpassenden Sprites zusammenzukleben.

## 3. Animationsvertrag (verbindlich)

| Zustand | Zielbewegung | Mindestprüfung |
|---|---|---|
| Idle | Atmung, kleine Gewichtsverlagerung, minimale Stoffbewegung | stabiler Stand, Figur identisch |
| Walk | vollständiger Rechts-/Links-Schritt mit sichtbarem Fußheben und Aufsetzen | beide Beine laufen, keine Sprünge |
| Attack 1 | eigenständiges Ausholen → Hieb → Ausklang | Hand/Klinge verbunden, Hit am Kontakt |
| Attack 2 | klar unterscheidbarer Gegenhieb | anderer, glaubwürdiger Klingenweg |
| Attack 3 | kraftvoller Finisher oder Überkopfhieb | stärkere Vorbereitung, echter Impact |
| Special | zur Fähigkeit passende Ganzkörperpose | Start/Effekt/Kontakt synchron |
| Hurt | kurzes, klares Trefferfeedback | keine Teleportation/Größenänderung |
| Dash | gerichtetes Ausweichen mit lesbarer Silhouette | keine Schwebepose, keine falsche Richtung |
| Death | definierter Sturz/Kniefall/Bodenkontakt | keine kurz unsichtbare Figur |
| Cast | klarer Aufbau und Release für Zauberklassen | Quelle bleibt Hand/Stab/Waffe |
| Recovery | plausibler Rückweg zur Kampf- oder Laufhaltung | keine harte Frame-Naht |

**Taktung:** Die Framezahl (z. B. 6 Idle, 8 Walk, 8/8/10 Attack) ist ein Ausgangswert, **kein Beweis für Flüssigkeit**. Timings werden anhand realer Spielgeschwindigkeit und sichtbarer Trefferframes abgestimmt. Für mobile Eingaben muss auch ein kurzer Angriff alle wesentlichen Posen zeigen. Bei Angriff während des Laufens dürfen Bewegung und Angriff nicht unkontrolliert zwischen Clips flackern. Bewegungsrichtung, zuletzt gesetzte Zielrichtung und Action-Lock sind eindeutig priorisiert.

**Technische Zustandsdaten:** \`clip\`, \`facing\`, \`frame\`, \`elapsed\`, \`duration\`, \`footAnchor\`, \`weaponGrip\`, \`contactFrame\`, \`cancelWindow\`, \`recoveryEnd\`. Schaden, Projektilfreigabe, VFX und Audio referenzieren die **sichtbaren Events** und nicht einen separaten, versetzten Timer. Alle Richtungs- und Zeitberechnungen haben explizite Tests.

## 4. Klassenspezifische Choreografie

| Klasse | Waffe & Bewegung | Charakteristische Attacke |
|---|---|---|
| **Ritter — Qualitätsreferenz** | **Einhandschwert in eindeutig derselben Hand; kein Schild.** Gewichtiger Stand; feste Rüstung; minimale Umhang-Nachbewegung. | Drei klar unterschiedliche Hiebe mit Schulter, Ellenbogen, Rumpf, Schritt, exaktem Griff und nachvollziehbarem Klingenbogen. Keine zweite oder losgelöste Klinge. |
| **Magier** | Stab fest in Händen/Hand; Robe mit echten, sichtbaren Schritten. | Stab hebt sich, Kanalisierung, Feuer-/Eis-/Arkan-Geschoss startet an der Stabspitze, danach Recovery. |
| **Bogenschütze** | Bogen + Köcher, bei Nahkampf ggf. Dolch; Hand-/Sehnenpunkte passen. | Pfeil einlegen, spannen, lösen; Projektil aus dem Bogen und in tatsächlicher Zielrichtung. |
| **Glaskanonier** | **Gewehr statt Stab/Dolch**; beidhändiger Griff, klarer Lauf/Mündungsanker. | Anschlagen, präzise Schussabgabe, kleiner Rückstoß, Geschoss entsteht an der Mündung — nie am Torso. |
| **Beschwörer** | Leere/zaubernde Hand, dunkelmagische Akzente; Robe lässt Beinbewegungen erkennen. | Hand nach vorn, Projektil/Fluch aus der Hand; Begleiteranimationen getrennt und ohne versehentliche Verdopplung. |
| **Alchemist** | Flaschen und Wurfhand; eigenständige Körperpose. | Ausholen, erkennbare Flugbahn, Wurf-Release aus der Faust; PC-Mauszielung und iPhone-Langdruck stimmen überein. |

Alle Klassen verwenden die **gleiche technische Export- und Abnahmepipeline**, nicht dieselbe beliebig gefärbte Angriffsanimation.

## 5. Ingame-Pipeline und Tests

**Reihenfolge:** (1) gemeinsames Model Sheet und Palette → (2) vollständige Referenzframes des Ritters → (3) tatsächlicher Ritter-Renderer/Combat-Events → (4) Ritter im laufenden Dungeon auf Desktop und iPhone testen → (5) Goldstandard freigeben → (6) die übrigen fünf Klassen nacheinander nachziehen → (7) abschließende gemeinsame Stil- und Gameplay-Prüfung.

**Automatisierte Tests sind nötig, aber nicht ausreichend.** Für jede Klasse:

- alle Richtungen × alle Zustände × alle Frames: PNG-/Atlasmaße, Sichtbarkeit, Transparenzränder, stabile Ausrichtung, kein verlorener Helm/Schwertarm/Stiefel;
- **Beinbewegung**: linker und rechter Fuß wechseln erkennbar; mindestens ein glaubwürdiger Bodenkontakt pro Schrittphase; kein künstliches Hüpfen durch veränderte Gesamtskalierung;
- **Waffe/Hand**: Griff und Hand berühren sich in allen relevanten Frames; Gegnerkontakt, Projektilposition und Schlagspur entsprechen dem dargestellten Klingen-/Waffenweg;
- **Übergänge:** Idle↔Walk, Walk→Attack→Recovery, Richtungswechsel, Attack während Bewegung, Dash→Idle, Hurt, Death und niedrige FPS; nichts teleportiert oder flackert;
- **Realspiel:** automatischer Start aus dem tatsächlichen Hauptmenü, sichtbarer Charakter im Dungeon, PC-Browser, Chromium Mobile und **WebKit/iPhone**; Clips in realen Aufnahmevideos in normaler Spielgröße kontrollieren;
- **Sichtprüfung** einer Vergleichstafel (alle acht Richtungen, identische Größe) **und** der Echtzeitaufnahme. Keine Freigabe allein wegen bestandener Unit-Tests oder einer Menüvorschau.

## 6. Definition of Done / Veröffentlichungsregel

Eine Klasse ist **nur fertig**, wenn:
1. Alle geforderten, für sie sinnvollen Bewegungen existieren und sichtbar zusammenpassen.
2. Die Figur in sämtlichen Zuständen und Blickrichtungen dieselbe bleibt.
3. Lauf-, Waffen- und Spezialbewegungen flüssig, sinnvoll und in Echtzeit eindeutig lesbar sind.
4. Hitbox, Projektile, Sound und VFX mit den passenden Frame-Events synchron sind.
5. Das Ergebnis **im echten Spiel** auf PC und iPhone überprüft wurde; erkannte Fehler sind behoben.
6. Die automatischen Tests grün sind **und** die visuelle Abnahme stattgefunden hat.

**Keine Schein-Fertigstellung:** „320/560 Frames erzeugt“ oder „CI grün“ bedeutet nicht „handgezeichnete Animation auf Produktionsniveau“. Neue Choreografie muss sichtbar besser sein. Nicht freigegebene Art bleibt Entwicklungsstand, statt als fertiger Ersatz ausgegeben zu werden.

## 7. GitHub-Arbeitsregel

- Repository: \`Christian045/realm-runners\`; diese Spezifikation ist die feste Prüfliste für jede Art-/Animations-PR.
- Änderungen nicht ausschließlich in einem Debug-Menü oder Standalone-Preview vornehmen; **derselbe Renderer** muss im Gameplay laufen.
- Pro Klasse Quellgrafik, exportierte Sprites, Animationsdaten, Vergleichsansichten und Tests versionieren; bei Änderungen immer den eingebundenen Modulpfad und Browsercache prüfen.
- Kleine, überprüfbare Commits; Branch/PR mit eindeutigen Kriterien; nur getestete, visuell abgenommene Verbesserungen nach \`main\`.
- Nach Abschluss **kurz** berichten: tatsächlich geänderte Dateien/Features, Teststatus, produktiver Link und gegebenenfalls offene Punkte. Keine wiederholten Zwischenstands-Zusammenfassungen.
