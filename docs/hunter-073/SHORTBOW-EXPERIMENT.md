# Kurzbogen-Versuch – 14. November 2026

Entwicklungsstand auf dem Branch `fix/hunter-side-north-0732`, keine Veröffentlichung
der normalen Spielversion. Zum Zuschalten `?hunterShortbow=1&debugAnimations=1`
verwenden. Die Kennzeichnung steht im Menü und in der Trainingshalle.

## Enthalten

- Ganze, eigenständige 96×96-Spielzellen für W, O und N; die übrigen fünf
  Richtungen bleiben im Versuch unverändert und sind noch nicht auf Kurzbogen umgestellt.
- Kurzer, schlanker Holzbogen, der im Stand und Lauf einhändig tief getragen wird.
- Neu gezeichnete gerade Rückansicht, sichtbar nach Norden gerichtete Pfeile.
- Separate Fußanker und gemessene Pfeilspitzen; der Schusszeitpunkt bleibt bei 1/2.
- Menü, Trainingshalle und Dungeon verwenden dieselbe zugeschaltete Variante.
- Normale Spielgrafiken, Spielstände, Balancing und Ritter-/Magiergrafiken unverändert.

## Noch nicht freigegeben

Der Nordschuss hat trotz mehrerer Zeichenversuche noch eine unplausible
Handstellung: die Hände wirken teilweise an den Bogenenden statt eindeutig
als Griffhand und Zughand. Die Tragehaltung wurde davon getrennt korrigiert.
Auch die seitlichen Beinphasen müssen im bewegten Spiel beurteilt werden;
acht belegte Bilder allein beweisen keinen anatomisch guten Laufzyklus.

Dieser Versuch ist ausdrücklich keine fertige Acht-Richtungs-Überarbeitung.
Er darf erst nach grafischer Freigabe und Umstellung der übrigen Ansichten
die normale Jägergrafik ersetzen. Kein Merge nach `main` und keine Pages-
Veröffentlichung dieses Entwicklungsstands.

## Dateien und Wiederaufbau

`assets/heroes/hunter/shortbow-preview-0732/source-W.png` und `source-N.png`
sind die nativen vollständigen Körperbilder, acht Spalten und sieben Clipreihen.
`node tools/pack-hunter-shortbow.cjs` baut daraus die sieben Laufzeitblätter;
die übrigen Richtungen kommen unverändert aus `original-073`.
Kein Zusammensetzen oder Verschieben einzelner Körperteile. Skalierung und
Fußkorrektur erfolgen ausschließlich an vollständigen Zellen.

`src/hunter-shortbow.js` enthält den ausdrücklichen URL-Schalter, Fußanker und
Pfeilsockets. `HunterProductionAtlas` lädt beim normalen Start weiterhin nur
die freigegebenen Originalblätter. Der Versuch wird nicht im Spielstand gespeichert.

## Technische und visuelle Prüfung

Neue Tests prüfen alle 448 Versuchszellen auf Transparenz, Randabstände und
Bodenkontakt, die fünf unveränderten Ansichten auf Pixelgleichheit sowie die
neuen Sockets auf tatsächliche Berührung der gezeichneten Grafik.

356 lokale Tests bestanden; Wiederaufbau der neun nativen/Laufzeit-PNGs
bytegleich. In der externen Branch-Vorschau leitet der Hoster Grafikdateien
auf einen anderen Ursprung um. Nur bei aktivem Versuch werden die Jäger-,
Magier- und allgemeinen Heldenbilder deshalb mit anonymem CORS geladen.
Das verhindert einen fälschlichen Magier-Fallback durch die Palettenprüfung;
ohne Versuch bleibt auch dieses Ladeverhalten unverändert.

`tests/hunter-shortbow-browser.cjs` prüft in Chromium und WebKit die echte
Produktionsdarstellung: 448 Bilder, 16 Pfeilursprünge und Schussabläufe,
21 Trainingszustände und Dungeonstart. Screenshots landen in `test-output`.
Der lokale Browserstart ist durch `socket() ... Operation not permitted` blockiert;
die automatisierte Browserprüfung muss deshalb über GitHub Actions laufen.

Die nativen W-/N-Blätter und vergrößerten tatsächlichen Spannbilder wurden
visuell angesehen. Dabei wurde der verbleibende Handfehler ausdrücklich erkannt.
Grüne technische Tests sind keine grafische Freigabe.

Die externe Branch-Spielprobe wurde anschließend mit Chrome 156 geöffnet.
Die browserinterne Prüfseite besteht mit 448/448 Bildern, 16/16 gezeichneten
Ursprüngen und 16/16 Schussabläufen. Im tatsächlichen Spiel wurden die Nord-
Tragehaltung und der Seitenlauf neben dem vollständig geladenen Magier sowie
der Nordschuss bei 37,5 % angesehen; auch der normale Dungeon wurde gestartet.
Die Aufnahmen `screenshots/shortbow-*.jpg` dokumentieren diese echte Ausgabe.
`shortbow-north-attack-open.jpg` dokumentiert ausdrücklich den noch offenen
Grifffehler und ist kein freigegebenes Schussbild.

Spielprobe (separater Branch, normale Live-Version unverändert):
https://rawcdn.githack.com/Christian045/realm-runners/ee8c64aff0bc1294dba31f9b008d188bb20da63a/index.html?hunterShortbow=1&debugAnimations=1

Entwurf: https://github.com/Christian045/realm-runners/pull/67

Vollständiger CI-Lauf für den getesteten Spielcode erfolgreich:
https://github.com/Christian045/realm-runners/actions/runs/43583703026
(356 technische Tests, Chromium und WebKit einschließlich der zusätzlichen
Kurzbogenprüfung). Der parallele Lauf 43583698827 bestand die Kurzbogen-,
Magier- und Ritterprüfungen, brach später beim vorhandenen mobilen
Trainingshallentest mit geschlossenem Browser ab. Der vollständige erfolgreiche
Lauf verwendet denselben Spielcode; die grafische Einschränkung bleibt bestehen.

## Grafikauftrag

Mit dem eingebauten Bildwerkzeug erzeugt und als ganze Körperzellen importiert.
Referenz: ausschließlich der eigene Jäger ab 0.73 für Identität; der Magier für
Kamera und Pixeldichte. Frühere umgefärbte Jäger wurden nicht verwendet.

Finaler Nord-Auftrag:

> Precise-object-edit of this 8column7row NORTH/back hunter sprite atlas.
> KEEP EXACT SAME square-backed body, hood centered upright, camera angle,
> costumes, boots, quiver, leg poses, framegrid and overall size. Change ONLY
> ARMS AND SHORTBOW holding anatomy. Idle(row0),walk(row1),dash(row4),hurt(row5),
> death(row6): carry compact slim brown shortbow ONE-HANDED at LEFT HIP, left
> hand grips CENTER of bow, right arm hangs EMPTY relaxed at RIGHTside. Lowbow
> forward oflefthip partlyhiddenbehindbody, tilteddiagonally/horizontally with
> curvedarc facing NORTH/up. No twohanded carrying, no arms holdingbothends,
> no stick. Attack(row2) and special(row3) frames1..6: archergrip is NOT
> handsatbowtips. Left hand holds the CENTER GRIP of bow forward towardTOP,
> offset just LEFT of hood so that griphand is visible at xabout35%ofcell.
> Bow limbs extend LEFT/RIGHT of this ONE centralgrip, curvebulgesUP. The
> right hand pulls STRING back toward FACE, mostly OCCLUDED inFRONT ofhood
> fromthisrearview, only rightelbow visible atbodyside. One visible hand
> atCENTER ofcurvedbow, never bothhandsatleft/rightends. Arrowverticalup
> throughcentergrip, arrowtip TOP atfulldrawframe3, arrowGONE atreleaseframe4.
> Bowstringvisiblypulled towardface at3, snapsstraight at4. Specialshows3parallel
> northarrowsframes1..3only. Bowabout30pxwide for72pixeltallfigure,
> slimbrownwood1-2pixels finaltile nofatgold. First/last actionframesuse
> ONE-HANDEDlowcarrypose sameasidle. Keepotherbodyposesexactlyunchanged,
> head staysperfectlycenterednottiltedNW, nofacevisible. Transparentcleanbackground
> no shadows no labels, crisp gamepixelart. EXACT8cols7rows all56cells.

Die Abweichung zwischen diesem Auftrag und dem tatsächlichen Nordschuss ist
der dokumentierte Grund, diesen Stand nicht regulär zu veröffentlichen.
