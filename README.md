# Realm Runners 🎮 — Version 0.2

Ein kostenloser **2D-Jump-'n'-Run-Prototyp mit RPG-Fortschritt** für Windows und iPhone Safari.

## Spielen
Nach einmaliger Aktivierung von GitHub Pages: **https://christian045.github.io/realm-runners/**

### Inhalt
- Weltkarte mit **drei spielbaren Wald-Leveln**, weitere Welten als Vorschau.
- Drei auswählbare Klassen: **Krieger, Jäger, Magier** mit unterschiedlichen Bewegungswerten.
- Sprünge, Dash, Abgründe, Stacheln, Gegner, Münzen und **drei Sterne pro Level**.
- Checkpoints, drei Herzen und Levelabschluss an der Zielflagge.
- **XP und Charakterlevel**, Freischaltung des nächsten Levels und gespeicherte Bestleistung pro Level.
- Automatisches Speichern via `localStorage` auf dem jeweiligen Gerät und Browser.

### Steuerung
- **Windows:** A/D oder Links/Rechts bewegen · Leertaste springen · Shift oder J Dash.
- **iPhone:** Bildschirmtasten · Querformat empfohlen.
- Gegner durch Sprung von oben oder Dash besiegen.

## Veröffentlichung über GitHub Pages
1. Im Repository **Settings → Pages** öffnen.
2. **Build and deployment → Source → Deploy from a branch**.
3. Branch `main`, Ordner `/(root)` wählen und speichern.
4. Nach Veröffentlichung die GitHub-Pages-URL in iPhone Safari öffnen.
5. Optional: Safari → Teilen → Zum Home-Bildschirm.

Neue Commits auf `main` werden automatisch bereitgestellt. Falls die vorige Version angezeigt wird, Seite neu laden.

## Entwicklung
Für lokale Tests genügt `index.html` im Windows-Browser; kein Build-System, keine Installation. Dies ist noch ein **Prototyp mit geometrischer Platzhaltergrafik**, kein fertiges HD-2D-Spiel. Die späteren Welten, Klassen-Skilltrees und das endgültige Grafiksystem sind noch nicht umgesetzt.

## Roadmap
1. Präzises Sprunggefühl und iPhone-Touch-Tests.
2. Animierte HD-2D-Sprites, Parallax-Hintergründe und Sounds.
3. Mehr Bewegungstechniken, Geheimnisse und Klassen-Skilltrees.
4. Zusätzliche Welten, Bosse, Level-Editor und Balancing.
5. Umfangreichere Weltkarte und plattformübergreifende Speicherung.
