# Laufanimation auf Basis der freigegebenen Standansichten

Arbeitsstand: Stand und Lauf in acht Richtungen. Die normale Live-Version
verwendet weiterhin ihre bisherigen Grafiken. Dieser Satz wird noch nicht
mit älteren Kampfanimationen zu einer scheinbar fertigen Klasse vermischt.

## Dateien

- `walk.png`: 768×768, acht Richtungen mit jeweils acht echten 96×96-Zellen.
- `source-0.png` bis `source-3.png`: Zeichenstudien S/SW, W/NW, N/NO, O/SO;
  jeweils Referenzstand und acht Laufphasen. Die Zeichenstudien wurden aus
  den jeweiligen bereits freigegebenen Ansichten abgeleitet.
- `atlas.json`: gemessene Quellbereiche, feste Skalierung je Quellrichtung
  anhand ihrer Referenzpose und gemeinsamer Fußanker [48,88]. Keine dynamische
  Größenanpassung pro Laufphase oder beim Drehen im Renderer.
- Stand: unverändert `../identity-idle-0733/idle.png`, einschließlich derselben
  Dateiprüfsumme. Die neu gezeichneten Referenzspalten ersetzen diesen Stand nicht.
- Wiederaufbau: `node tools/pack-hunter-locomotion.cjs`.

Die Grafik wurde mit dem eingebauten Bildwerkzeug erstellt. Vollständige
Körperzellen werden auf das Spielraster übertragen; keine geometrischen Beine,
kein Zerlegen und Zusammensetzen des Körpers, keine Magierpixel als Körperbasis.
Die ersten zwei dichten 8×8-Versuche wurden wegen falscher Diagonalansichten
und wechselnder Körpergröße verworfen. Sie sind nicht Teil dieses Assetsatzes.

## Laufprobe und Integration

`src/hunter-locomotion.js` lädt die unveränderten Standposen und die neuen
64 Laufbilder. Es nutzt dieselbe Richtungswahl, dieselbe Klassenlaufgeschwindigkeit
und denselben 96-Pixel-Distanzzähler wie das Spiel. Diagonale Bewegung wird
normalisiert; Stillstand hält den Distanzzähler an und zeigt die Originalstandpose.
Jede Darstellung verwendet ein vollständiges Sprite ohne Größenatmung.

`tests/hunter-locomotion-review.html` ist die steuerbare Bewegungsprobe:
acht Richtungen, Einzelbilder, langsames Tempo, Stand/Lauf-Wechsel und
WASD/Pfeiltasten. Das freigegebene Standbild und der echte Magier werden
im gleichen Maßstab daneben gezeigt. Die Frameübersicht zeigt alle 64 Bilder.

Kampf, Dash, Treffer und Tod gehören nicht zu diesem Laufarbeitsschritt.
Der neue Renderer meldet diese Zustände ausdrücklich als nicht enthalten,
statt eine anders gekleidete ältere Figur einzublenden. Er ist deshalb noch
nicht als vollständiger Klassenrenderer in den normalen Dungeon geschaltet.

## Prüfung

### Korrektur der Bogenreste beim Laufen

Die Zeichenstudien sind als neun Figuren pro Reihe angeordnet, ihre Silhouetten
liegen aber nicht vollständig innerhalb von neun gleich breiten Bildstreifen.
Insbesondere bei S/SW und N/NO überschreiten Bogenspitzen diese rechnerischen
Grenzen. Der alte Zuschnitt übernahm dann ein abgetrenntes Bogenstück der
Nachbarfigur oder schnitt die eigene Bogenspitze ab.

Der Packer trennt jetzt zuerst die vollständigen zusammenhängenden Figuren im
Quellbild und ordnet sie je Reihe von links nach rechts zu. Erst dann werden sie
in die Spielzellen übertragen. Auch die linke Rückdiagonale wird so als ganze
Figur verarbeitet. Die freigegebene Standdatei und die Zeichenstudien bleiben
unverändert. `atlas.json` dokumentiert die tatsächlichen Quellgrenzen jeder Phase.
Ein Regressionstest prüft ausdrücklich Bogenenden jenseits der rechnerischen
Zellengrenze sowie den Ausschluss fremder Bogenreste.

Die neuen technischen Tests prüfen die unveränderte freigegebene Standdatei,
die tatsächliche Standdarstellung in allen Richtungen, alle 64 Laufzellen,
Transparenz, Randabstände, gemeinsame Sohlenlinie, begrenzten Körperhub und
acht verschiedene Unterkörperbilder je Richtung. Bewegungsprüfungen prüfen
gleiches Tempo/Schrittlänge diagonal und gerade, Anhalten und Wiederanlaufen.
Pixelbelegung und acht unterschiedliche Bilder allein beweisen keine gute
Anatomie; deshalb erfolgt zusätzlich die Sichtprüfung der bewegten Laufprobe.

`tests/hunter-locomotion-browser.cjs` prüft Chromium und WebKit: alle 64
Einzelbilder, acht Rückkehrposen, zeitgesteuerte Übergänge, diagonale
Tastaturbewegung und fehlerfreie Grafikladung. Screenshots landen in test-output.

## Verwendete Grafikaufträge

### Quelle 0

Use case identity-preserve. ACTUAL final pixel-game locomotion frames. Reference is TWO user-approved standing sprites of ONE character, top and bottom. Preserve EACH corresponding approved facing's EXACT face, hood outline, torso width, chest straps, brassbuckles, squarebeltbuckle, shortwaistpanels, sleeves, chunkyboots, quiver,colors and small thin diagonally carried onehandedshortbow. Do NOT redesign any costume, face or body proportions. Produce exactly NINE columns TWO rows,18sprites equallyspaced on TRANSPARENT background. Column0 in eachrow is exactreference standingpose unchanged, columns1..8 samefigure walkingin samefacing. Same headheight/size, broadcompacttorso and clothes throughout; heightdifference atmost1pixelatfinal72pxfigure scale. Grounded relaxed WALK notrunning. Walk columns1..8: nearfootcontactforward, planteddown, oppositefootpassing, oppositefootadvancing, oppositefootcontactforward, planteddown, nearfootpassing, nearfootadvancing. Col1andcol5 must show OPPOSITE leadinglegs: nearlegforwardcol1, nearlegBACKcol5. Two legs alternate visibly in everydirection. Keep onebootsoleplanted oncommonfloor baseline ALWAYS, neverbothfeetlifted/bothkneesbent, never a floating pose. Lowheel/toelift only2pixelsfinalscale. Upperbodyverticalbob atmost1pixel, do not shrinkbody orhood aslegs bend. Bootstrideclear but modest walking pace, not exaggeratedsprint. Empty rightarm relaxeddown withsmallcountermotion, leftarm carries SAME shortbow LOW at hip andONEhanded asreference, never raisedfist and no twohandedcarry. Bowthinbrownwoodcurvewithvisiblepaletautstring, nostaff/longbow, no growingweapon. Quiver/capetiny secondaryswayonly. Stablebodyroot allframes, fullbody no cropping, generous clearcellmargins. Crisp tiny pixelclusters at96pxgame-tile density, hardedges,no smoothpainting. No shadows text labels grid borders decorations. This is a sequence of EDITS of the approvedfigures, notnewinterpretations. TOP row stays SOUTH/front, matching TOP reference EXACTLY. BOTTOM row stays SOUTHWEST/down-left three-quarter, matching BOTTOM reference EXACTLY. Do not turn eitherfigure towardcamera duringwalking.

### Quelle 1

Use case identity-preserve. ACTUAL final pixel-game locomotion frames. Reference is TWO user-approved standing sprites of ONE character, top and bottom. Preserve EACH corresponding approved facing's EXACT face, hood outline, torso width, chest straps, brassbuckles, squarebeltbuckle, shortwaistpanels, sleeves, chunkyboots, quiver,colors and small thin diagonally carried onehandedshortbow. Do NOT redesign any costume, face or body proportions. Produce exactly NINE columns TWO rows,18sprites equallyspaced on TRANSPARENT background. Column0 in eachrow is exactreference standingpose unchanged, columns1..8 samefigure walkingin samefacing. Same headheight/size, broadcompacttorso and clothes throughout; heightdifference atmost1pixelatfinal72pxfigure scale. Grounded relaxed WALK notrunning. Walk columns1..8: nearfootcontactforward, planteddown, oppositefootpassing, oppositefootadvancing, oppositefootcontactforward, planteddown, nearfootpassing, nearfootadvancing. Col1andcol5 must show OPPOSITE leadinglegs: nearlegforwardcol1, nearlegBACKcol5. Two legs alternate visibly in everydirection. Keep onebootsoleplanted oncommonfloor baseline ALWAYS, neverbothfeetlifted/bothkneesbent, never a floating pose. Lowheel/toelift only2pixelsfinalscale. Upperbodyverticalbob atmost1pixel, do not shrinkbody orhood aslegs bend. Bootstrideclear but modest walking pace, not exaggeratedsprint. Empty rightarm relaxeddown withsmallcountermotion, leftarm carries SAME shortbow LOW at hip andONEhanded asreference, never raisedfist and no twohandedcarry. Bowthinbrownwoodcurvewithvisiblepaletautstring, nostaff/longbow, no growingweapon. Quiver/capetiny secondaryswayonly. Stablebodyroot allframes, fullbody no cropping, generous clearcellmargins. Crisp tiny pixelclusters at96pxgame-tile density, hardedges,no smoothpainting. No shadows text labels grid borders decorations. This is a sequence of EDITS of the approvedfigures, notnewinterpretations. TOP row stays WEST/exact left profile, matching TOP reference EXACTLY. BOTTOM row stays NORTHWEST/back-left three-quarter: back of hood, no face, matching BOTTOM reference EXACTLY. Do not turn eitherfigure towardcamera duringwalking.

### Quelle 2

Use case identity-preserve. ACTUAL final pixel-game locomotion frames. Reference is TWO user-approved standing sprites of ONE character, top and bottom. Preserve EACH corresponding approved facing's EXACT face, hood outline, torso width, chest straps, brassbuckles, squarebeltbuckle, shortwaistpanels, sleeves, chunkyboots, quiver,colors and small thin diagonally carried onehandedshortbow. Do NOT redesign any costume, face or body proportions. Produce exactly NINE columns TWO rows,18sprites equallyspaced on TRANSPARENT background. Column0 in eachrow is exactreference standingpose unchanged, columns1..8 samefigure walkingin samefacing. Same headheight/size, broadcompacttorso and clothes throughout; heightdifference atmost1pixelatfinal72pxfigure scale. Grounded relaxed WALK notrunning. Walk columns1..8: nearfootcontactforward, planteddown, oppositefootpassing, oppositefootadvancing, oppositefootcontactforward, planteddown, nearfootpassing, nearfootadvancing. Col1andcol5 must show OPPOSITE leadinglegs: nearlegforwardcol1, nearlegBACKcol5. Two legs alternate visibly in everydirection. Keep onebootsoleplanted oncommonfloor baseline ALWAYS, neverbothfeetlifted/bothkneesbent, never a floating pose. Lowheel/toelift only2pixelsfinalscale. Upperbodyverticalbob atmost1pixel, do not shrinkbody orhood aslegs bend. Bootstrideclear but modest walking pace, not exaggeratedsprint. Empty rightarm relaxeddown withsmallcountermotion, leftarm carries SAME shortbow LOW at hip andONEhanded asreference, never raisedfist and no twohandedcarry. Bowthinbrownwoodcurvewithvisiblepaletautstring, nostaff/longbow, no growingweapon. Quiver/capetiny secondaryswayonly. Stablebodyroot allframes, fullbody no cropping, generous clearcellmargins. Crisp tiny pixelclusters at96pxgame-tile density, hardedges,no smoothpainting. No shadows text labels grid borders decorations. This is a sequence of EDITS of the approvedfigures, notnewinterpretations. TOP row stays NORTH/straight back square shoulders, matching TOP reference EXACTLY. BOTTOM row stays NORTHEAST/back-right three-quarter: back of hood, no face, matching BOTTOM reference EXACTLY. Do not turn eitherfigure towardcamera duringwalking.

### Quelle 3

Use case identity-preserve. ACTUAL final pixel-game locomotion frames. Reference is TWO user-approved standing sprites of ONE character, top and bottom. Preserve EACH corresponding approved facing's EXACT face, hood outline, torso width, chest straps, brassbuckles, squarebeltbuckle, shortwaistpanels, sleeves, chunkyboots, quiver,colors and small thin diagonally carried onehandedshortbow. Do NOT redesign any costume, face or body proportions. Produce exactly NINE columns TWO rows,18sprites equallyspaced on TRANSPARENT background. Column0 in eachrow is exactreference standingpose unchanged, columns1..8 samefigure walkingin samefacing. Same headheight/size, broadcompacttorso and clothes throughout; heightdifference atmost1pixelatfinal72pxfigure scale. Grounded relaxed WALK notrunning. Walk columns1..8: nearfootcontactforward, planteddown, oppositefootpassing, oppositefootadvancing, oppositefootcontactforward, planteddown, nearfootpassing, nearfootadvancing. Col1andcol5 must show OPPOSITE leadinglegs: nearlegforwardcol1, nearlegBACKcol5. Two legs alternate visibly in everydirection. Keep onebootsoleplanted oncommonfloor baseline ALWAYS, neverbothfeetlifted/bothkneesbent, never a floating pose. Lowheel/toelift only2pixelsfinalscale. Upperbodyverticalbob atmost1pixel, do not shrinkbody orhood aslegs bend. Bootstrideclear but modest walking pace, not exaggeratedsprint. Empty rightarm relaxeddown withsmallcountermotion, leftarm carries SAME shortbow LOW at hip andONEhanded asreference, never raisedfist and no twohandedcarry. Bowthinbrownwoodcurvewithvisiblepaletautstring, nostaff/longbow, no growingweapon. Quiver/capetiny secondaryswayonly. Stablebodyroot allframes, fullbody no cropping, generous clearcellmargins. Crisp tiny pixelclusters at96pxgame-tile density, hardedges,no smoothpainting. No shadows text labels grid borders decorations. This is a sequence of EDITS of the approvedfigures, notnewinterpretations. TOP row stays EAST/exact right profile, matching TOP reference EXACTLY. BOTTOM row stays SOUTHEAST/down-right three-quarter, matching BOTTOM reference EXACTLY. Do not turn eitherfigure towardcamera duringwalking.
