# Gemeinsamer Standversuch – acht Richtungen

Arbeitsstand, keine Animations- oder Veröffentlichungsfreigabe. Alle acht neuen
Standposen stammen aus einem gemeinsamen 4×2-Zeichensatz und verwenden denselben
kräftigen Südwest-Jäger aus `original-073/idle.png` als einzige Charaktervorlage.
Der Magier wurde ausschließlich für Kamera und Pixeldichte referenziert.

- `source.png`: gemeinsam erzeugter Zeichensatz, eingebautes Bildwerkzeug.
- `idle.png`: acht native transparente 96×96-Zellen, S/SW/W/NW/N/NO/O/SO.
- `atlas.json`: gemeinsame Skalierung, Fußanker und tatsächliche Quellbereiche.
- Wiederaufbau: `node tools/pack-hunter-identity-idle.cjs`.
- Vergleich mit den echten Magiergrafiken: `tests/hunter-identity-review.html`.

Eine gemeinsame Skalierung für alle Richtungen, keine separat angepasste
Körpergröße und keine zusammengesetzten Körperteile. Standfußlinie y=88.
Die Figur trägt den kurzen Holzbogen mit einer Hand tief seitlich am Körper.
Kleidung, Kapuze, Rüstung, Gürtel und Köcher sollen beim Drehen erhalten bleiben.

Dieser Stand ersetzt weder die bisherigen Lauf-/Schussgrafiken noch die normale
Live-Version. Die visuelle Beurteilung der acht Ansichten erfolgt vor Animationen.
Insbesondere die Verdeckung des Bogens in Rückansichten bleibt im Vergleich zu
prüfen; die technische Zellenprüfung beweist keine vollständige Charaktertreue.

## Durchgeführte Prüfung

Acht Zellen technisch geprüft: jeweils 96×96, sichtbare Körperhöhe 72 Pixel,
Sohlenzeile 87, Randabstände, ausschließlich Alpha 0/255. Erneutes Packen ergibt
eine bytegleiche PNG-Datei. In Chrome wurden alle acht Ansichten neben den
unveränderten echten Magier-Standzellen im gleichen Maßstab angesehen. Die
Browserprüfung meldet 8/8 geladene, transparente und geerdete Zellen. Der echte
Browser-Screenshot liegt unter `docs/hunter-073/screenshots/identity-idle-review.jpg`.

Prüfseite dieses Standversuchs:
https://rawcdn.githack.com/Christian045/realm-runners/d5a8c52aed8713a9da280b662e87cbb2e48b9bb4/tests/hunter-identity-review.html

Dies ist eine visuelle Standprobe, kein im Dungeon fertig animierter Charakter.

## Verwendeter Grafikauftrag

Use case: identity-preserve. Asset type: ACTUAL PIXEL GAME SPRITES, coherent 8-direction IDLE character rotation sheet, not an illustration or concept poster. Input image1 is THE ONE canonical hunter to preserve exactly; image2 is mage ONLY for top-down camera angle and pixel density. Primary request: rotate the SAME exact stocky hunter through all eight directions, while replacing the long vertical bow with ONE identical slim wooden shortbow carried one-handed low at side. Output EXACT FOUR equal columns by TWO equal rows, eight full-body figures on clean genuinely transparent background. Row1 left-to-right SOUTH/front, SOUTHWEST/front-left three-quarter, WEST/exact left profile, NORTHWEST/back-left three-quarter. Row2 left-to-right NORTH/exact straight back, NORTHEAST/back-right three-quarter, EAST/exact right profile, SOUTHEAST/front-right three-quarter. No labels, grid lines, backgrounds or floor shadows. DESIGN LOCK: copy canonical reference hunter's same olive forestgreen pointed hood with tan opening trim; same visible youthful round face and dark eyes wherever face naturally visible; same broad compact chest and thick arms; same olive short shoulder cape over brown LEATHER ARMOR with diagonal chest straps and small brass buckles; same flared short leather waist panels with green edging; same wide brown belt and central brass buckle; same thick dark brown trouser legs and chunky brown boots; same leather bracers and brown quiver with THREE clearly visible white-fletched arrows over the CHARACTER'S RIGHT shoulder. Show the same chest thickness and clothing layers in profile and rear, not a skinny unarmored person in side views. All these garments rotate with him; don't invent new chest buttons, remove straps or recolor. WEAPON LOCK: small simple dark brown wooden recurve SHORTBOW, total length about34px relative to72px hunter height, slender1-2px limbs, clear open curve and taut pale tan string. Carry in CHARACTER'S LEFT hand at HIP HEIGHT, relaxed arm; right arm hangs empty. Bow tilted about35degrees, low beside body with the curve pointing slightly forward in his current direction, never upright next to face like a staff. Correct anatomical handedness and quiver side rotate coherently, don't mirror the gear to the other shoulder. North view hood/spine/hips vertically aligned, level shoulders, bow held one-handed beside left hip partly occluded in front, right hand empty. Feet flat in a balanced standing pose, no stepping. Same body volume,72px body height, rooted feet and proportions ALL eight cells. Practical game pixel art EXACTLY matching reference density, hard-edged tiny pixel clusters, no smooth painterly shading or giant chibi redesign. Same neutral upperleft lighting across all views. Each full figure has generous transparent margin inside its equal cell, whole shortbow and quiver inside cell. Draw as one coherent character turntable, not eight separately redesigned people.
