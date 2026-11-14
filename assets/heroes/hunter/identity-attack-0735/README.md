# Jäger – Bogenschuss 0.73.5

`attack.png`: acht Richtungen S/SW/W/NW/N/NO/O/SO mit je acht 96×96-Zellen.
Quelle: vier mit dem eingebauten Bildwerkzeug aus den freigegebenen Standansichten
erstellte Schussstudien, je neun Figuren in zwei Richtungen. Die separaten
vollständigen Figuren werden vor dem Packen per Zusammenhang getrennt.

Ablauf: Stand, Anheben, Nocken/halber Auszug, voller Auszug, Lösen ohne Pfeil,
Nachhalten, Absenken, ursprünglicher Stand. Frame 0 und 7 werden direkt aus
`identity-idle-0733/idle.png` übernommen. Stand- und Laufdateien werden nicht
verändert. Ein fester Maßstab je Quellrichtung und gemeinsamer Sohlenanker [48,88].
Pfeilabgabe bei Aktionsfortschritt 1/2 (Frame 4). `src/hunter-attack.js` enthält
die gemessene Pfeilspitze aus dem letzten vollen Auszug (Frame 3).
Normaler Schuss und Pfeilhagel verwenden dieselbe achtteilige Bewegung.

Wiederaufbau: `node tools/pack-hunter-attack.cjs`.

Grafikauftrag: Identität, Kapuze, Gesicht, Kleidung, Körperproportionen, Köcher,
kleinen Kurzbogen und gepflanzte Stiefel exakt aus den freigegebenen Ansichten
beibehalten. Neun Spalten mit Stand, Anheben, Nocken, vollem Auszug, Lösen,
Nachhalten, Absenken, fast Stand, Stand. Durchgehende Holzform und Sehne;
linke Hand hält den Bogen, rechte Hand zieht zur Wange. Keine doppelte Waffe.
Schussrichtung folgt der jeweiligen Ansicht. Vorderansicht zielt abwärts,
Rückansicht aufwärts; Diagonalen in ihre Bildschirmrichtung. Transparenter
Hintergrund, ganze getrennte Figuren, keine Schatten, Texte oder Effekte.
Die ersten Vorder-/Rückstudien zielten seitlich; nur die korrigierten Quellen
mit dem richtigen Pfeilwinkel sind Teil dieses Satzes.
