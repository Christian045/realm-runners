# Realm Runners – Dungeon Reborn (Alpha 0.19.4)

## Alpha 0.19.4 – Cleanes Dungeon-HUD ohne Raumtitel

- **Raumnamen entfernt:** Auf dem Dungeonboden erscheinen keine dekorativen Schriftzüge mehr, auch nicht „HEILIGTUM“ oder „KAMMER“. Die Raumgeometrie und interaktive Objekte bleiben unverändert.
- **Minikarte:** Entferntes „KARTE“-Label; die Karte selbst bleibt mit allen Markierungen erhalten.
- **Statusanzeigen reduziert:** Die separate Biom-Anzeige und das redundante Klassenlabel wurden entfernt. Erhalten bleiben Lebenspunkte, Dungeon-/Turmfortschritt, Beute, Inventar, Dash- und Fähigkeit-Abklingzeiten.
- **Cooldowns:** Zwei kompakte Labels mit klar erkennbarem Bereitschaftsstatus und Restzeit. Auf schmalen iPhone-Bildschirmen passen sie sich an den verfügbaren Platz neben der Minikarte an.
- **Boss:** Name, Lebensleiste und Phase bleiben sichtbar. Der zusätzliche Hinweistext erscheint nur bei tatsächlichen Angriffswarnungen oder Phasenwechseln, nicht dauerhaft im Leerlauf.
- **Kompatibilität:** Keine Veränderungen an Schadenswerten, Gegnerverhalten, Inventar oder Spielständen. Neue Tests verhindern ein Zurückkehren der dekorativen Raumlabels.



## Alpha 0.19.3 – UI & Gameplay Quality Update

- **Menü bedienbar statt zurückgesetzt:** Geöffnete Einstellungsbereiche, Fenster-Scrollposition und Tastaturfokus bleiben beim Wechsel von Klassen, Spezialisierung, Spielmodus oder beim Kauf von Talenten erhalten. Auch die Scrollposition innerhalb des Inventars bleibt bei Ausrüstungsänderungen bestehen.
- **Eingaben zuverlässig zurücksetzen:** Tastendrücke, gedrückte Angriffsbuttons, Joystick-Auslenkung und wartende Dash-/Fähigkeitsbefehle werden beim Wechsel in Pause, Inventar und Menü beziehungsweise beim Wiederaufnehmen verworfen. So lösen Pausenaktionen keine verspäteten Attacken aus.
- **Tastaturbedienung:** Escape öffnet/schließt Pause und schließt jetzt auch das Inventar; I schaltet das Inventar um; Enter auf einem fokussierten Menü-Button oder ausklappbaren Bereich startet nicht versehentlich das Spiel.
- **Charaktervorschau:** Krieger, Magier und Jäger erhalten dezent animierte Idle-Sprites im Hauptmenü, maximal ein neues Sprite alle 380 ms. Bei reduzierter Bewegung bleibt die Vorschau statisch.
- **Darstellung:** Besserer Textumbruch in Menü- und Dialogkarten, einheitliche Fokusmarkierungen für Tastaturbedienung sowie zusätzliche Absicherung gegen seitlichen Overflow auf kleinen Bildschirmen.
- **Tests:** Erweiterte Browser-Regressionen für Menü-Auswahl, Scroll-/Fokusverhalten, Pause, Inventar und Eventdialoge auf Desktop und Smartphone, plus neue Input-Unit-Tests. Die bestehende GitHub-Actions-Pipeline führt weiterhin npm test und Browser-Smokes mit Chromium/WebKit aus.
- **Unverändert:** Spielstände, KI, Kampfwerte, Klassenfähigkeiten, Gegnerwellen und iPhone-Touchsteuerung.



## Alpha 0.19.2 – Inventar-Layout ohne doppeltes Scrollen

- Das Inventar nutzt bei normaler Desktop- und iPhone-Höhe einen festen, auf den Bildschirm begrenzten Dialog mit flexibler Gegenstandsliste. Nur die Liste scrollt, während Ausrüstungsplätze, Sets und Zurück-Button sichtbar bleiben.
- Lange Itemnamen dürfen umbrechen, erzeugen aber keinen horizontalen Scrollbalken.
- Auf besonders niedrigen Displays wechselt das Inventar auf **einen** vertikalen Scrollbereich für das ganze Fenster, statt zwei Scrollbereiche zu verschachteln.
- Der Dialog-Fix von v0.19.1 bleibt aktiv: kurze Titel, kein Burghallen-Intro innerhalb des Inventars.
- Zusätzliche Chromium- und Mobile-Regressionen mit 18 simulierten Inventargegenständen.



## Alpha 0.19.1 – Dialog- und Desktop-Layout korrigiert

- **Spiel-Dialoge vom Menü getrennt:** Ereignisse, Schreine, Reliktwahl, Etagenwechsel, Pause, Ergebnisfenster und Inventar verwenden ein eigenes kompaktes Overlay, während die cineastische Burghalle dem Hauptmenü vorbehalten bleibt.
- **Titel überlaufen nicht mehr:** Reduzierte Schriftgröße für Dialoge und besonders lange deutsche Überschriften, ausgewogener Zeilenumbruch und weniger Zeichenabstand.
- **Keine horizontalen Scrollbalken:** Die Panels sind auf Viewportbreite begrenzt; Texte, Buttons und Ausrüstungskarten müssen innerhalb bleiben.
- **Weniger unnötiges Scrollen:** Die zusätzliche Hauptmenü-Einleitung und Burghallen-Überschrift werden bei In-Game-Dialogen ausgeblendet. Kurze Entscheidungen wie „Versiegeltes Gewölbe“ sind auf normalen Desktopgrößen kompakt.
- **Mobile + Inventar:** Kleine Fenster bleiben bedienbar; umfangreiche Inhalte können bei Platzmangel vertikal gescrollt werden, ohne seitlich zu verrutschen.
- **Browser-Regressionen:** Neue Layout-Prüfungen für 742×706, 1280×800, 390×844 und 320×568 mit langen Eventtiteln, Schrein, Etagenabschluss und Inventar.



## Alpha 0.19 – Hauptmenü: Düstere Burghalle

- Neues responsives Hauptmenü als Burghalle mit gotischem Fenster, Steinpfeilern, Bannern, Bodenplatten und dezent animierten Fackeln (ohne zusätzliche Downloads).
- Große zentrale Heldenvorschau, darunter die direkte Charakterauswahl mit vorhandenen Pixel-Sprites.
- Die drei Spielmodi stehen direkt zur Auswahl; aktive Auswahl bleibt sichtbar. Der Startknopf trägt den passenden Modusnamen.
- Spezialisierungen, Herausforderungen, permanente Verbesserungen, Talente und Erfolge sind in ausklappbaren Menüs untergebracht.
- Smartphone-Layout: eine Spalte für die Spielmodi, kurze vertikale Wege, große Schaltflächen und sichere Bildschirmabstände.
- Desktop: breitere und dreispaltige Spielmodus-Ansicht; Animationen respektieren die reduzierte Bewegungseinstellung.
- Die Spielmechaniken, vorhandenen Spielstände, Mobil-Steuerung und Aktualisierungslogik bleiben erhalten.



## Alpha 0.18.1 – Grafische Überarbeitung nach iPhone-Screenshots

- **Krieger:** Schwert deutlich verkleinert, passend an die rechte oder linke Handschuhposition angebunden; die Haltung richtet sich nach der sichtbaren Sprite-Blickrichtung, und der zweite Komboschlag läuft entgegengesetzt. Beim Blick nach oben liegt die Klinge hinter dem Charakter.
- **Magier:** Neues, deutlich sichtbares Pixel-Artefakt mit Kristallkopf und Holzstab; Kapuze, Robe, Gürtel und Saum wurden detaillierter gestaltet. Doppelte statische Stab-Pixel im Sprite wurden entfernt, Zauberbewegungen bleiben sichtbar.
- **Saubere Darstellung:** Beide Waffen erscheinen exakt einmal pro Frame; überflüssige Klingen-Pixel beim Krieger entfernt.
- **Startzimmer:** Das riesige ornamentale Bodensiegel ist jetzt kleiner und transparent, damit der Charakter im Mittelpunkt bleibt.
- **Raumnamen:** Der Biomtext wurde nicht mehr auf dieselbe Position wie der Raumtitel gezeichnet. Der aussagekräftige Raumtitel bleibt bestehen.
- **Böden:** Vier neue, verteilte Steinplatten-Layouts statt identischer Ziegelmuster. Biomspezifische Abnutzung und Moos bleiben erhalten. Die Kollisionsgeometrie ändert sich nicht.
- **Kompatibilität:** iPhone-Touchsteuerung, Spielstände, Gegnertypen und Kampfbalance unverändert; aktualisierte Modulversionen verhindern veraltete Browsergrafiken. Zusätzliche grafische Regressionstests.



## Alpha 0.18 – Turm-Schwierigkeitskurve für alle 10 Etagen

Nach dem Gameplay-Review von v0.17 wird die bisher auf Etage 6 konzentrierte Schwierigkeit durch eine **handbalancierte, stufenweise Kurve für den gesamten Turm** ersetzt.

| Etage | Herausforderung | Gegner zu Beginn (Kampfraum) | Zweite Welle | Bossmuster vor Phasenwechsel / Sieg |
| --- | --- | ---: | ---: | --- |
| 1 | Einstieg · Bewegung & Angriff | 2–3 | keine | Einsteigerkampf, keine Mindestanzahl |
| 2 | Aufwärmen · Fernkampf | 3–4 | keine | 1 / 2 |
| 3 | Bewährungsprobe · Schildträger | 3–4 | 1 | 2 / 3 |
| 4 | Bedrohlich · Runenmagie | 4–5 | 1 | 2 / 4 |
| 5 | Gefährlich · Schützen | 4–5 | 2 | 3 / 5 |
| 6 | Festungsangriff · koordinierte Gegner | 5–6 | 2 | 3 / 6 |
| 7 | Eskalation · Kultisten | 5–6 | 3 | 4 / 7 |
| 8 | Höllisch · Assassinen | 6–7 | 3 | 4 / 8 |
| 9 | Letzte Prüfung · schwere Wächter | 6–7 | 4 | 5 / 9 |
| 10 | Finale · Ewiger Herrscher | 7 | 4 | Eigener Drei-Phasen-Boss |

- **Gegnerzusammenstellung**: Jede Etage führt einen wiedererkennbaren, zu ihrer Geschichte passenden Leittype an. Ab Etage 2 unterstützt in passenden Rostern mindestens ein Fernkämpfer die Front; ab Etage 3 treten Verstärkungswellen hinzu. Einzelne Räume variieren bewusst zwischen den angegebenen Gruppengrößen.
- **Handabgestimmte Werte**: Schaden, Gegnergeschwindigkeit, Angriffs-Windups und Erholungszeit, erste Raumgefahr und Folgeintervalle steigen stufenweise an. Mindestreaktionszeit der normalen Angriffe bleibt 0,44 Sekunden, damit Ausweichen auf iPhone weiterhin möglich ist.
- **Bosse**: Temporärer, optisch sichtbarer Runenschild schützt ab Etage 2 davor, dass ein Spieler die Hälfte des Bosskampfs überspringt, bevor die Telegraph-Attacken überhaupt zu sehen waren. Nach den zugehörigen Angriffen öffnet sich der Schutz wieder. Der Ewige Herrscher auf Etage 10 behält sein eigenständiges, dreiphasiges System.
- **Vorschau**: Zwischen den Etagen zeigt der Abschlussbildschirm die kommende Gefahrenstufe, Startgegnerzahl und Verstärkungen.
- **Elite**: Besonders späte Elitekämpfe (ab Etage 7) können eine zusätzliche Verstärkung erhalten.
- **Keine künstliche HP-Explosion**: Die Verschärfung entsteht hauptsächlich über Komposition, Raumdruck und Bossmechaniken. Bestehende Spielstände und Touch-Steuerung, vier Charakterdesigns, das sichtbare Schwert, Loot/Skilltrees und exakt sieben Räume pro Turmetage bleiben unverändert.
- **Regressionen**: Neu hinzugefügte Tests prüfen die Profile aller zehn Etagen, tatsächliche gegnerische Zusammensetzungen, sich steigernden Raumdruck, die Bossmuster-/Phasengrenzen und ausbleibende Änderungen an der Dungeon-Geometrie. Chromium- und WebKit-Smokes bleiben im CI.



## Alpha 0.17 – Gameplay-Feedback: Etage 6 anspruchsvoller & Kriegerschwert sichtbar

Auf Basis einer 62 Sekunden langen iPhone-Aufnahme vom 29.10.2026: Turm-Etage 6 war mit 337 LP, 2–3 gegnerischen Zielen je Raum und wenigen Sekunden Bosskampf zu leicht. Das Schwert war hinter der Ritterfigur kaum erkennbar, während ein weißer Bogen dominierte.

- **Krieger-Schwert sichtbar**: Ein tatsächlich gezeichnetes, breites Pixelschwert mit Griff, Parierstange, Stahlschneide und heller Spitze folgt exakt der Zielrichtung. Im Idle ist es gut zu erkennen; die drei Kombos schwingen es in verschiedenen Richtungen, der dritte Hieb ist größer. Der helle Schlagbogen wurde abgeschwächt, um das Schwert nicht zu überdecken.
- **Anspruchsvollere Kampfräume ab Etage 4**: Neue, deterministische Schwierigkeitsskala mit größeren Gegnergruppen; ab Etage 6 starten Kampfräume mit mindestens fünf Gegnern. Gezielt eingestreute Fernkämpfer kontern reines Stehenbleiben und Schwertspammen.
- **Verstärkungswellen**: Ab Etage 4 haben normale Kampfräume eine zweite, angekündigte Welle. Türen öffnen erst, wenn alle Wellen besiegt wurden. Die zweite Welle erscheint spätestens kurz nach dem Sieg über die erste; keine künstlich leere Wartezeit. Turm bleibt bei sieben Räumen je Etage.
- **Aktivere Gegner, nicht nur mehr HP**: Spätere Etagen haben kürzere, aber weiterhin deutlich sichtbare Angriffsankündigungen und Erholungszeiten, moderat höhere Bewegungsgeschwindigkeit und Schaden. Etage 6 erhält auch Fernkämpfer im bisher rein nahkampforientierten Festungs-Roster.
- **Frühere Raumgefahren**: Die erste markierte Gefahrenzone erscheint ab den höheren Etagen früher im Raum und die Folgeintervalle sind etwas kürzer; weiterhin mit sichtbarem Vorwarnkreis und Ausweichweg.
- **Boss darf seine Angriffe ausführen**: Ab Etage 4 bekommt der normale Turmboss einen sichtbaren Runenschild, wenn sonst eine Phase oder der Tod vorzeitig durch extrem hohen Spielerschaden ausgelöst würde. Auf Etage 6 müssen vor Phase II mindestens drei und vor dem Sieg insgesamt sechs telegraphierte Bossaktionen ausgeführt worden sein. Der Schutz verschwindet nach den Aktionen; der Finale Herrscher mit seinem dreiphasigen System bleibt unverändert.
- **Regressions-Tests** für Anzahl und Mischung der Raumgegner, Wellenfortschritt, begehbare Nachspawnpunkte, Etagenlänge, Bossschild-Freigabe und gerichtet schwingende Pixelschwerter, zusätzlich zur bestehenden Desktop- und WebKit-/iPhone-Browser-Suite.
- **iPhone-Boss-HUD**: Im Hochformat wird die Minikarte während eines aktiven Bosskampfs ausgeblendet, damit sie weder die Boss-Lebensleiste noch die Angriffswarnung überdeckt. Anschließend erscheint sie wieder.
- **Kompatibilität**: Keine Löschung von Spielständen, keine Änderung an der Touch-Steuerung und keine pauschale Erhöhung aller normalen Boss-LP.



## Alpha 0.16 – Loot, Builds und verzweigte Klassentalente

- **Mehr Gegenstände:** Zwölf neue Waffen-, Rüstungs- und Talisman-Basen mit unterschiedlichen Offensiv- und Defensiveigenschaften; alle drei Klassen haben je vier eigene Waffen.
- **Drei Ausrüstungssets**: Glutbund (zwei ausgerüstete Teile entzünden Gegner), Sturmpfad (jeder vierte Treffer verursacht zusätzlichen Schaden und Dash lädt schneller auf) und Eisenwacht (Dash erzeugt Schild). Seltene, epische und legendäre Items können Set-Teile sein. Ein Setbonus gilt nur für gleichzeitig ausgerüstete Teile in verschiedenen Slots, nicht für den Rucksack; beim Wechsel ist er sofort weg.
- **Sechs echte permanente Meisterschaften:** Pro Klasse zwei verzweigte Talente mit einer Voraussetzung von Stufe 2 in einem bisherigen Talent. Krieger: Vergeltung und Beben; Jäger: Adlerblick und Schattentritt; Magier: Glutmeister und Arkaner Schutz. Jede Meisterschaft ist einmalig und kostet 240 Gold, sämtliche bisherigen Talentstufen bleiben erhalten.
- **Sechs klassenbezogene Run-Fähigkeiten:** Krieger Zerschmetterer/Standhaft, Jäger Meisterschuss/Schnellköcher, Magier Flammenzeichen/Arkane Welle. Bei jedem Upgrade-Dialog ist eine noch fehlende Klassenoption unter den drei Entscheidungen, solange solche Fähigkeiten verfügbar sind. Bereits gewählte Klassenfähigkeiten werden nicht erneut angeboten.
- **Klare Rückmeldung im Menü:** Freischaltvoraussetzungen der Meisterschaften, farblich markierte Build-Upgrades sowie Setfortschritt (0/2, 1/2, 2/2) und aktuell aktive Meisterschaften/Runfähigkeiten im Inventar. Mobile Zweispalten-Ansicht für Talente.
- **Spielstände & Balance:** Save-Key und alte Fortschritte bleiben unverändert. Alte Items ohne Set-ID funktionieren weiterhin. Bossphasen, Bossschaden-Cap, 13 Räume im Normaldungeon, 10 Turmetagen zu 7 Räumen, mobile Touch-Buttons und die Pixelgrafik bleiben wie bisher.
- **Tests:** Neue Regressionstests für die drei Sets und Wechsel der Ausrüstung, alle sechs Meisterschaften und ihre Freischaltbedingungen, Save/Load-Migration, aktive Bonuswirkungen im Kampf sowie Klassenwahl-Upgrades. Chromiums und WebKits Browser-Smokes prüfen Desktop und iPhone.



## Alpha 0.15 – Gegnervielfalt, Charakterdesigns, Bossmechaniken und taktische Räume

- **Vier eigene Gegnerrollen:** Schattenläufer (angekündigter Dash), Knochenjäger (gerichtete Doppelsalve), Runenwirker (verzögerte Flächenrunen), Schildwache (Frontalblock und angekündigter Schildstoß). Alle Angriffe können ausgewichen werden, die Sonderfähigkeiten prüfen die Sichtlinie und verwenden vorhandene Kollisionsregeln.
- **Normaler Dungeon und Turm:** Die neuen Gegner erscheinen in unterschiedlichen Biom- und Turmaufstellungen. Jeder Kampfraum bekommt eine Taktikausrichtung (Hinterhalt, Fernkampf, Runen, Bastion oder gemischt), die die Gegnerzusammenstellung und den Raumnamen beeinflusst.
- **Neue echte Pixel-Sprites:** Die vier Gegner haben jeweils selbst gestaltete Silhouetten, Waffen, Haltungen und Attack-/Castframes. Auch alle drei Helden haben deutlichere Ausrüstungsdetails (Krieger mit schwerer Rüstung/Helm, Jäger mit Bogen und Kapuze, Magier mit Stab/Runen). Zusätzlich besitzen die neun Turmbosse jetzt individuellere Kopfbedeckungen und Schmuckformen.
- **Bossmechaniken:** Schleimkönig bekommt „Bodenspalten“ in Phase II, Runenwächter „Kristallbarriere“ in Phase II, Turmbosse ab Phase II „Zangenangriff“. Die markierten Schadenszonen sind verzögert und bieten sichere Ausweichwege. Nach bestimmten Bossattacken wird ein kurzes, grün sichtbares Verwundbarkeitsfenster aktiv, in dem der verursachte Schaden etwas ansteigt (weiterhin durch die Boss-Schadensobergrenze begrenzt).
- **Taktisch unterschiedliche Raumformen:** Vier zusätzliche Layouts (Bastion, Switchback, Trident, Sanctum) und zwei weitere Bodenformen (Sanduhr, Terrasse). Die Raumetiketten und dezenten Bodenornamente geben einen Hinweis auf die Begegnung. Türen, Navigation und zentrale Kampfkorridore bleiben erhalten.
- **Kompatibilität:** Turmmodus bleibt bei exakt zehn Etagen und sieben Räumen pro Etage. Normale Dungeons behalten 13 Räume. iPhone-Touch, gespeicherte Charakterfortschritte und v0.14-Licht-/Impact-Look bleiben erhalten. Versionierte Browsermodule verhindern veraltete Engine-Dateien.
- **Tests:** Neue Tests für gegnerspezifische Ankündigungen, verzögerte Treffer, Schildblock, Sprite-Frames, deterministische Raumlayouts und Erreichbarkeit sowie die neuen Bossmuster plus vorhandene Chromium-/WebKit-Smokes.



## Alpha 0.14 – Dungeon Lighting & Combat Impact

- **Raumtiefe**: Ein viewport-gebundener Zeichenpass fügt geometrische Wandkontaktschatten, erhabene Säulenschatten und kleine helle Steinkanten hinzu. Die Collision-Map bleibt unverändert, die Schattierung hängt von echten Wand-Nachbarn ab.
- **Pixel-Art-Kacheln**: Verfeinerte Schichtungen, Meißelkanten, tiefe Fugen und differenzierte Kanten für Steinwände, Säulen und Boden in allen sechs vorhandenen Biomen.
- **Beleuchtung**: Wandlaternen sitzen tatsächlich an blockierten Wandkacheln mit erreichbarem Boden daneben. Kleine, animierte Lichtpools und persönliches Orientierungsglühen; max. sieben Raumlichter bei mobiler Kamera, max. dreizehn auf Desktop. Der frühere zweite Satz unabhängiger Wandfackeln ist entfernt.
- **Architektur und Details**: Deterministisch platzierte Wandbanner, Ketten, Ranken, Steinurnen, Knochen, Trümmer und Runen. Keine Kollision, keine bewegungsschädlichen Objekte in der zentralen Spielfläche, keine wechselnde Position pro Frame.
- **Wuchtige Treffer**: Unterschiedliche, gerichtete Trefferbögen und Partikelfunken je Klasse, größere kritische Effekte, besonders markantes Finish der Krieger-3er-Kombo mit stärkerem Rückstoß. Trefferschlag, Flashes, Schatten und Schadenszahlen sind klarer sichtbar; Warnzonen von Gegnern und Bossen werden weiterhin über der Szene gezeichnet.
- **Magie und Figuren**: Warme Glutfragmente hinter Magiegeschossen, neuer Einschlagring plus magische Funken bei Treffern, feinere Angriffsframes für die drei Heldenklassen; Pfeile bleiben gut erkennbar.
- **Performance und Kompatibilität**: Alle neuen Kacheln und Charakterframes bleiben gecacht, dynamische Lichter und Deko werden auf den Kamerabereich begrenzt. Spielstände, vorhandene Boss-/Tower-Mechaniken, Etagenlängen und iPhone-Touch-Bedienung sind unverändert.
- **Regressionstests**: Tests für Wandverankerung, Dekopositionen, nicht-mutierte Kollision, Mobillimit für Lichter, Effekttypen und echte Kampfereignisse sowie Chromium-/WebKit-Browserkontrollen.



## Alpha 0.13 – Combat & Boss Balancing

- **Bosskämpfe dauern mehrere Angriffsrunden:** Ein einzelner kritischer, sehr starker Treffer kann maximal 10 % der HP eines normalen Bosses, 8,5 % eines Turmbosses bzw. 5,5 % des Endbosses verursachen. Mehrere Treffer sind weiterhin möglich und Phasengrenzen bleiben wirksam, aber kein Boss lässt sich mehr durch vier übermächtige Schwerthiebe besiegen. Normaler Feindschaden bleibt unverändert.
- **Schnellere und gefährlichere Bosse:** Die erste Warnung beginnt bereits etwa 0,12–0,16 Sekunden nach dem Betreten des Bossraums. Bisherige Warnungen und Erholungszeiten wurden verkürzt, ohne unvorhersehbare Soforttreffer einzubauen. Boss-Schaden steigt moderat; bei Turmbossen mit der Etage. Phasenwechsel sind kürzer, bieten jedoch weiterhin eine Verschnaufpause.
- **Neue finale Mechanik:** Der Ewige Herrscher kann ab Phase III „Finsternisklingen“ einsetzen: zwei früh sichtbar markierte Angriffsbahnen mit einem sicheren Weg dazwischen. Das anschließende Auftreffen ist noch einmal verzögert, damit du reagieren kannst.
- **Klassenkampf:** Der Krieger hat eine Dreier-Kombo, deren finaler Hieb mehr Schaden und stärkere Effekte verursacht. Jäger können bei länger gedrücktem Angriff (auch per Touch) in regelmäßigen Abständen einen durchdringenden Präzisionsschuss abgeben; normales Dauerfeuer bleibt erhalten. Magische Projektile hinterlassen sichtbare Partikelspuren und Pfeile sind als gerichtete Geschosse erkennbar.
- **Weniger übermächtige Builds:** Wiederholbare Schadens-Upgrades geben zunächst +12 %, ab dem vierten Stapel +5 %; Fury-Upgrades sind bei 58 % der Klassen-Grundangriffszeit begrenzt. Turm-Stufenbelohnung Kraft gibt +6 % statt +9 %. Die ersten drei Turmetagen behalten ihre garantierte Schatzkammer, Etagen 4–10 tauschen sie gegen zusätzliche Kampfkammern.
- **Etagenlänge unverändert:** Alle zehn Turmetagen haben weiter sieben Räume. Der normale Dungeon hat weiter 13 Räume. Die iPhone-Touch-Steuerung und vorhandenen Spielstände bleiben erhalten.
- **Tests:** Hochgerüsteter Krieger kann keinen Boss mit vier Treffern besiegen, erste Bosswarnung in unter 0,3 s, alle Bossphasen schaffbar, realer Combo-Schaden, durchdringende Pfeile, begrenztes Stapeln und Platzierung von Schatzräumen. Chromium/WebKit laden die ausdrücklich versionierte Kampfdatei, um Cache-Probleme zu vermeiden.



## Alpha 0.12.2 – Live-Kampf & Browser-Cache

- Gegenereignisse nun gegen echte, generierte Kampfräume mit stillstehendem Spieler getestet: sieben normale, sieben Turm- und ein Elite-Kampf.
- Verhindert ein veraltetes, trotz neuer HTML-/Hauptscript-Version gecachtes Kampfmodul: `main.js?v=0.12.2` importiert nun explizit `game.js?v=0.12.2`.
- Browser-Regression prüft die wirklich geladene Kampfmodul-URL sowie tatsächliche Treffer an einem stehenden Spieler. Bestehende Spielstände und Steuerung bleiben unverändert.



## Alpha 0.12.1 – Fehlerbehebung: Gegner greifen wieder an

- Nahkampfgegner stoppen wie bisher kurz vor dem Helden, lösen jetzt aber in dieser Reichweite einen echten, kurzen, angekündigten Nahkampfangriff aus. Zuvor stoppten sie bei +8 Pixeln Abstand und trafen nur bei +3 Pixeln: Wer stillstand, wurde nie angegriffen.
- Gegnerschläge haben eine 0,3-Sekunden-Vorwarnung und eigene Abklingzeit. Verlässt der Held währenddessen die Reichweite oder deckt eine Wand die Sicht, geht der Angriff fehl; keine unsichtbaren Treffer durch Wände.
- Funktioniert in normalem Dungeon, Endlosmodus und Zehn-Etagen-Turm. Bossmechaniken, fernkämpfende Gegner, Etagenlänge, Spielstände und die iPhone-Steuerung bleiben erhalten.
- Regressionstests: stationärer Held, wiederholte Treffer, Turmgegner, Ausweichen, Wände und Bogenschützen.



## Alpha 0.12 – Tower & Boss Overhaul

- **Etagenlänge unverändert:** Im Turm bleiben genau sieben Räume pro Etage und weiterhin zehn Etagen. Normale Dungeons mit 13 Räumen und Endlosmodus sind unverändert.
- **Der Ewige Herrscher:** Drei voneinander getrennte Angriffspools (I: Markierungen, Kreuzfeuer, Dash; II: Meteore, Orbit, Beschwörung, Runenlanzen, Seelenstrahlen; III: Finsternis-Nova, Spiralwand, Strahlen, Dash und zusätzliche verzögerte Arenafallen). Phasengrenzen bei 55 % und 30 %, Warnungen vor jedem Schlag und Schutzfenster beim Phasenwechsel.
- **Gegner-Spezialfähigkeiten:** Geister teleportieren nach sichtbarer Warnung, schwere Nahkämpfer stürmen nach einer Anlaufphase, Kultisten erzeugen verzögerte Sigill-Fallen und eiserne Wächter parieren frontale Treffer mit begrenzter Schutzdauer. Spezialfähigkeiten nutzen das vorhandene Kollision- und Gefahrenzonensystem.
- **Zehn visuell eigene Etagen:** Unterschiedliche Inschriften, Wandbanner, Wellenzeichen, Sporen-, Ketten-, Seelen- und Runendekorationen; farbig beleuchtete Bossarenen und ein eigener mehrstufiger Thronraum auf Etage 10. Dekorationen sind nicht Teil der Kollision.
- **Turm-Relikte:** Sechs neue, sammelbare Runen (Gewitterkrone, Aschenherz, Wächterschild, Widerhall, Phönixfeder, Seelenzahn) als vierte Option nach einem Etagenboss. Verschiedene Schaden-/Heil-/Rettungs-Synergien, ohne rekursive Trefferprocs.
- **Zeitwertung und Belohnungen:** Bestzeit für jede Etage, persönliche Bestzeit eines gesamten Turmlaufs und erneute Siegesfeier mit besonderen Effekten. Rekorde werden abwärtskompatibel im vorhandenen `realm-runners-roguelite-v1`-Schlüssel gespeichert.
- **Tests:** automatisierte Boss-/KI-/Relikt-/Rekordtests plus Chromium und WebKit mit Touch-Steuerung.



## Alpha 0.11 – Turm der zehn Prüfungen

- **Neuer eigenständiger Spielmodus** direkt im Hauptmenü: 10 Etagen mit eigenen Gegnergruppen und je einem Etagenboss, zuletzt der **Ewige Herrscher** als Superboss mit **drei Phasen**. Der normale Dungeon und der Endlos-Modus bleiben erhalten und sind gegenseitig exklusiv zur Turm-Herausforderung.
- **Schnelle Etagen:** Statt jedes Mal 13 große Kammern zu durchlaufen, bestehen Turm-Etagen aus 7 abwechslungsreichen Räumen, darunter Kampfräume, Elite, Schatzkammer, Schrein und ein Bossraum. Karten bleiben garantiert zusammenhängend.
- **Zehn verschiedene Bosskonzepte:** Festgelegte Namen, Farben, Gegner- und Angriffskombinationen. Die Telegraphen warnen vor Schussfächern, Zielmarkierungen, Spiralen, Ansturm, Meteoriten und Kreuzangriffen; Etage 10 hat zusätzlich die Finsternis-Nova.
- **Vier neue Gegnertypen:** Geister, eiserne Wächter, Kultisten und Berserker/Brutes mit eigener Pixel-Art und Grundwerten. Kultisten und Bogenschützen benötigen freie Sicht zum Schießen.
- **Belohnungswahl:** Nach Boss 1–9 darfst du vor der nächsten Etage zwischen Heilung, einem seltenen Relikt oder dauerhaftem Schaden für diesen Run wählen. Ausrüstung, Talente, Gold und HP werden von Etage zu Etage übernommen.
- **Progression:** Bestleistung und abgeschlossene Turmläufe werden in bestehendem, rückwärtskompatiblem Save-Key gespeichert; neue Erfolge bei Etage 5 und beim vollständigen Sieg. Der Endboss endet mit Sieg, kein unendlicher Loop.
- **Checks:** Tower-Modus, Boss-Phasen (55 / 30 %), zehn Etagen, Belohnungen, Speicherdaten, Minimap, Safari-/Chrome-Kontrollen getestet.



## Alpha 0.10 – Dungeon Overhaul

- **Unregelmäßige Dungeons:** 13 logisch verknüpfte Räume auf einem 5×5-Adressraster statt einer gefüllten 3×3-Matrix. Neun geometrische Raumformen (groß, kompakt, lang, hoch, Kreuz, L-Form, versetzt, Zickzack, Bogen), 14 Cover-Layouts und garantierte drei Kacheln breite Verbindungen mit Torbögen.
- **Erkundung und Abzweigungen:** Dynamische Minimap zeigt nur bereits bekannte Räume und deren Verbindung, inklusive Verzweigungen. Geheimkammern bleiben bis zum Betreten versteckt. Jeder Seed liefert einen zusammenhängenden begehbaren Pfad bis zum Boss.
- **Neue Raummechaniken:** Bibliothek mit Runenrätsel und einem Schlüssel für das Gewölbe, Fallenräume mit angekündigten verzögerten Explosionen, Lager mit Heilung/Erkundung/Handel, versiegeltes Gewölbe mit Schlüssel-/Gold-/Lebenspunkte-Optionen. Schmiede, Prüfung, Schrein und bestehende Lootkammern bleiben erhalten.
- **Taktische Gegner-KI:** Spawnpositionen beachten wirkliche Kollisionen und Abstand zum Helden. Gegner navigieren bei Hindernissen mit begrenzter BFS-Wegsuche. Bogenschützen prüfen Sichtlinien, weichen in Nahdistanz zurück und nutzen seitliches Positionieren – ohne durch Mauern zu schießen.
- **Visuelles Design:** Thematische Torbögen, Räume mit eigener Möblierung (Regale, Lagerfeuer, Truhen, Gewölbe, Fallenwarnung); Wandfackeln nur auf Hindernisflächen. iPhone-Touch-Bedienung, Klassensystem, Boss-Phasen, Loot und Speicherstände bleiben erhalten.
- **Tests:** Seed-basierte Flood-Fill-Erreichbarkeit, Szenarioprüfungen für besondere Räume, Pfad- und Sichtlinien sowie Chromium-/WebKit-Smoke-Tests.



**Top-down-Roguelite / Hack-and-Slash** auf Basis der bisherigen JavaScript-/HTML5-Canvas-Technik.
Das bisherige Jump-and-Run wurde technisch und spielerisch neu aufgebaut. Der alte Stand bleibt im `main`-Branch bis zum Merge der Umstellung erhalten.

## Spielen

Lokal im Projektordner:

```sh
python3 -m http.server 8000
```

Danach **http://localhost:8000** im Browser öffnen. Kein Build erforderlich.

## Alpha 0.9.0 – Pixel-Art & Animationssystem

- **Eigenes Sprite-Atlas-System:** In `src/sprites.js` liegen handgezeichnete Pixelmuster für Krieger, Jäger, Magier, Schleim, Pilz, Bogenschütze, Goblin und beide Bosse. Alle Frames werden browserintern in transparenten, winzigen Canvas-Atlanten gerendert und wiederverwendet. Keine externen oder lizenzpflichtigen Assets.
- **Animationen:** Idle, Laufen, Angriff, Zauber, Dash, Treffer und Tod. Animationszustände hängen an der Spielmechanik statt an rein zufälligen Effekten. Bildschirmrichtung und Pixelmaßstab werden berücksichtigt; Besiegte zeigen ein kurzes Verblassen statt sofort zu verschwinden.
- **Kachel-Atlas:** `src/tileset.js` erzeugt 24×24-Pixel-Bausteine, scharf auf die 48×48-Weltkacheln hochskaliert. Sechs Farbthemen mit acht deterministischen Variationen, echten Mauerfugen, Bodenkacheln, Pilz-/Moosdetails, Wasserpfützen und Säulen.
- **Performance / Touch:** Bereits gebaute Sprites und Tiles werden gecacht. Kollision, Kamera, iPhone-Touch-Gesten, Hitboxen, Speicherdaten und die Kampfmechanik bleiben unverändert. Falls ein Browser keine Atlas-Textur erstellen kann, bleibt ein einfacher Grafik-Fallback.
- **Tests:** Eigene Node-Tests für Pixel-Atlas, State-Priorität, Blickrichtungen, alle Biome, Cache-Nutzung und Trefferanimationen plus bestehende Browser-/WebKit-Tests.

## Update Alpha 0.6–0.8 – Combat-Polish, Raumvielfalt und Endgame

- **Kampfgefühl (0.6):** 35–75 ms Hitstop beim Treffen, echte kritische Trefferanzeigen, Rückstoß, kurze Kamerawackler, zusätzliche Animationen und originale synthetisierte Soundeffekte. Kein externer Audio-Download, kein Autoplay.
- **Elite-Modifikatoren:** flink, gepanzert, arkan, explosiv (sichtbare Verzögerung vor der Explosion) und vampirisch.
- **Dungeon-Variety (0.7):** 14 statt 6 Raumlayouts, weitere stimmige Boden- und Ruinendetails, optionale Ereigniskammern mit Schmiede oder gefährlicher Kampfprüfung.
- **Gegenstandseffekte (0.7):** 15 mögliche Spezialeffekte auf seltenen oder besseren Gegenständen; darunter Kettenblitz, Feuer, Gift, Frost, Krit-Heilung, Dash-Nova, Dornen, Lebensraub, Flächentreffer und Dreifachschuss. Nur ausgerüstete Effekte zählen, pro Treffer maximal eine nicht rekursive Auslösung.
- **Spezialisierungen (0.8):** je drei Varianten pro Klasse (Standard plus zwei neue Spielweisen); freischaltbar über zwei Runs oder einen Boss-Sieg. Modifikatoren verändern LP, Schaden, Tempo, Krit-Chance, Angriffs- und Fähigkeitstempo.
- **Langzeitmotivation (0.8):** vier Herausforderungen mit klaren Freischaltbedingungen und Goldmultiplikatoren; sieben dauerhaft gespeicherte Erfolge mit einmaligen Goldprämien.
- **Endlos-Abstieg:** nach dem ersten Boss-Sieg freischaltbar. Jeder Boss führt in eine neue, schwerere Etage, ohne Ausrüstung oder Run-Gold zurückzusetzen. Endet erst mit dem Tod.
- **Speicherstände:** Der vorhandene Roguelite-Schlüssel bleibt erhalten und wird um Erfolge/Statistiken erweitert; ältere Jump-and-Run-Saves bleiben unberührt.
- **Tests:** neuer Suite-Block für Item-Procs, Kartenlayout, Challenges, Meta-Fortschritt, Ereignisse und Endlosmodus plus Touch-Browserchecks.

## Erweiterung Alpha 0.3–0.5

- **Räume statt identischer Arenen:** Sechs Grundriss-Vorlagen (Säulen, Arkaden, Ruinen, offene Hallen, Kreuzungen, Alkoven) mit garantierten, drei Tiles breiten Wegen. Jeder Dungeon enthält Schreine, Schatzkammern, Elitekammern und geheime Räume.
- **Erkundung:** Nebel des Krieges für nicht entdeckte Räume; die Minimap deckt Nachbarräume erst beim Erkunden auf.
- **Entscheidungen:** Schreine bieten Heilung, einen Schadenssegen oder einen riskanten Tausch von Lebenspunkten gegen hochwertige Beute.
- **Loot:** Zwölf Gegenstandstypen für drei Slots (Waffe, Rüstung, Relikt), vier Seltenheiten, Werte und ein Inventar (I bzw. Rucksack-Schaltfläche). Fundstücke werden beim Aufheben eingesammelt und der erste Gegenstand je Slot automatisch angelegt.
- **Klassentalente:** Drei permanente Talentpfade pro Klasse mit je drei Stufen, im Hauptmenü für Gold aufrüstbar. Die bisherigen Spielstände werden ohne Löschung erweitert.
- **Biome:** Gruft, Pilzgrotte und versunkene Hallen erhalten eigene Gegnergewichtungen und Bodenfarben. Elitegegner sind stärker und schießen zusätzliche Geschosse.
- **Zweiter Boss:** Alternierend zum Schleimkönig kann der Runenwächter erscheinen. Eigene Warnmuster, Runenlanzen, Dreifachschläge, Ansturm, Arkanspirale, Beschwörungen sowie eine zweite Phase ab 55 % LP.
- **Qualität:** Neue Pfadfindungs-, Loot-, Talent-, Boss- und Touch-Browser-Regressionstests.

## Fix in Alpha 0.2.1 – Safari Doppeltipp-Zoom

- Verhindert, dass iOS Safari durch Doppeltippen in Canvas-Ecken die Webseite vergrößert.
- Unterdrückt native Pinch-/Zoom-Gesten auf dem Spielfeld; die Touch-Aktionsknöpfe bleiben unabhängig bedienbar.
- Verhindert Doppeltipp-Zoom auf nicht-interaktiven Menü-Hintergründen, während Menübuttons weiterhin funktionieren und Menübereiche vertikal scrollen.
- Testet Doppeltipp-Ecken und Touch-Interaktionen zusätzlich mit WebKit. Ein echter iPhone-Test ist trotzdem erforderlich.

## Neu in Alpha 0.2 – Schleimkönig und Dungeon-Atmosphäre

- **Schleimkönig mit zwei Phasen:** Phase II beginnt bei 55 % Lebenspunkten und besitzt eine sichtbare, kurze Übergangsphase.
- **Phase I:** Gift-Salve, gezielter Flächenschlag (markierter Bereich), geradliniger Ansturm (markierter Korridor).
- **Phase II:** schnellere Salven und Anstürme, radialer Sporensturm sowie beschworene Schleime/Pilze.
- Alle großen Angriffe zeigen **vor ihrer Ausführung Warnflächen**; der Ansturm verfolgt nicht nachträglich die Bewegung des Spielers.
- Großer Boss-Lebensbalken inklusive Phasenanzeige und Angriffshinweisen.
- Räume bekommen seedbasierte visuelle Identitäten: Gruft, Pilzgrotte, versunkene Halle, Reliquienkammer, Heiligtum und Thronsaal.
- Pixel-Fackeln mit Lichtschein, Ruinen, Bodensiegel, Pilze, Staubpartikel, Spinnweben und Vignette. Die Dekoration verändert keine begehbaren Flächen.
- Neue Tests für den Phasenwechsel, Treffer-Telegraphen, Ansturm, Spawn und den Boss-Tod.

## Spielloop

1. Eine der drei Klassen **Krieger, Jäger oder Magier** auswählen.
2. Einen Seed-basierten Dungeon aus **neun verbundenen Räumen** erkunden.
3. Gegnerkammern betreten, Türen versiegeln und die Gegner besiegen.
4. Gold, Heilung und pro Run wechselnde Relikt-Upgrades sammeln.
5. Im Bossraum den **Schleimkönig** besiegen oder bei Tod neu starten.
6. Gold wird auch bei Niederlagen teilweise mitgenommen; dauerhafte Stärkungs-Upgrades können im Menü gekauft werden.

Die Räume verwenden zufällige Verbindungen, garantieren aber einen begehbaren Weg zum Boss. Ein Run wird deterministisch aus einem Seed aufgebaut. Noch nicht implementiert: Online-Multiplayer, aufwendige Inventar-Ausrüstung, persistente laufende Runs, mehrere Biome und vollständige Content-Balance.

## Steuerung

| Plattform | Aktion |
| --- | --- |
| Windows / Mac | WASD oder Pfeiltasten laufen |
| PC | Maus zielen; Linksklick, F oder J angreifen |
| PC | Leertaste / Shift Dash, Q / E Spezialfähigkeit |
| PC | Escape pausieren, Enter im Menü starten, I Inventar öffnen |
| Touch | Virtueller Stick links; Angriff, Dash und Spezialfähigkeit rechts |

### Klassen

- **Krieger**: gerichteter Schwerthieb, Wirbelsturm, hohe LP.
- **Jäger**: schneller Pfeilbeschuss, Pfeilhagel, hohes Bewegungstempo.
- **Magier**: magische Geschosse mit kleiner Explosion, Arkanschlag.

## Architektur

| Modul | Aufgabe |
| --- | --- |
| `src/main.js` | Bootstrap, Menüs, HUD, feste Update-Schritte |
| `src/game.js` | Run-State, Spieler, Kampf, Gegner, Loot, Raumfortschritt |
| `src/dungeon.js` | Seed-RNG, zusammenhängende Raumgraphen, Tile-Kollision |
| `src/render.js` | Canvas-Welt, Kreaturen, Effekte, Kamera, Minimap |
| `src/boss.js` | Zwei-Phasen-Boss-KI, Angriffswarnungen, Bossfähigkeiten |
| `src/warden.js` | Zweiter Boss: Runenwächter, Angriffstaktiken und Warnflächen |
| `src/loot.js` | Ausrüstung, Seltenheitsgrade, Klassenbeschränkungen und Talente |
| `src/atmosphere.js` | Visuelle Raumthemen, Fackeln, Lichteffekte und Boss-Warnzonen |
| `src/input.js` | Keyboard, Maus und Touch |
| `src/touch-guard.js` | iOS-Safari-Gestenschutz ohne Eingriff in die Spielsteuerung |
| `src/data.js` | Klassen, Gegnertypen, Upgrade-Definitionen |
| `src/progression.js` | Save-Schema, Legacy-Import, persistente Käufe |
| `styles.css` | Menü, HUD, responsive Touch-UI |
| `tests/` | Deterministische Unit-Tests und Browser-Smoke-Test |

`src/game.js` enthält derzeit die Gameplay-Orchestrierung. Bei einem Ausbau sollten Kampf, Gegner-KI und Loot in weitere Systeme extrahiert werden, ohne den öffentlichen Zustand zu verändern.

## Speicherkompatibilität

- Neue Daten liegen separat in `localStorage['realm-runners-roguelite-v1']`.
- Die **alten Spielstände** unter `realm-runners-save-v2` werden **nicht gelöscht oder überschrieben**.
- Beim ersten Start wird die zuvor gewählte Klasse übernommen und höchstens 250 Gold als Startguthaben gutgeschrieben.
- Der Fortschritt bleibt an Browser und Website-Ursprung gebunden.

## Tests

```sh
npm install
npm test
npx playwright install chromium
# In einem separaten Terminal: python3 -m http.server 8000
npm run test:browser
```

Die Unit-Tests prüfen Raum-Erreichbarkeit, Seeds, Speicherstände, Käufe, Klassen, Angriffe und Dungeon-Fortschritt sowie die Bossphasen und Angriffsmechaniken. Browser-Smoke-Tests prüfen Desktop- und Touch-Grundabläufe. GitHub Actions führt beides bei Push und PR aus.

## Migration

Der Feature-Branch enthält **bewusst keine alten Platformer-Module** (`forest.js`, `level_design.js`, `platforms.js` usw.). Es handelt sich um eine neue Projektstruktur, nicht um einen zusätzlichen Spielmodus. Ein Merge in `main` sollte erst erfolgen, wenn die Browser-Tests grün und Desktop-/Mobil-Steuerung manuell überprüft sind.
