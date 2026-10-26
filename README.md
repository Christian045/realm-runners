# Realm Runners 🎮

Ein kostenlos spielbarer 2D-Action-Platformer-Prototyp für Windows-Browser und iPhone Safari.

## Spielen

Nach Aktivierung von GitHub Pages: https://christian045.github.io/realm-runners/

- **Windows:** A/D oder Pfeiltasten bewegen, Leertaste springen, J/K angreifen.
- **iPhone:** Smartphone quer halten und die eingeblendeten Bildschirmtasten verwenden.
- Wähle vor dem Start Krieger, Jäger oder Magier.
- Sammle Münzen für XP, besiege Gegner und erreiche am Ende jedes Levels die Flagge.
- Es gibt zwei Level und temporäre Power-ups (Schild und Tempo).

## GitHub Pages einmalig aktivieren

1. Im Repository **Settings** → **Pages** öffnen.
2. Unter **Build and deployment** bei **Source**: **Deploy from a branch** auswählen.
3. **Branch:** `main`, **Folder:** `/(root)` wählen und **Save** anklicken.
4. Nach erfolgreicher Veröffentlichung die Adresse oben im Browser des iPhones öffnen.
5. Optional in Safari unter **Teilen → Zum Home-Bildschirm** eine Verknüpfung anlegen.

Das Spiel ist derzeit eine **Web-App**, keine native iOS-App. Es benötigt keinen Apple-Developer-Account.

## Entwicklung

Die gesamte Demo befindet sich in `index.html`, ohne Build-Tools oder zusätzliche Abhängigkeiten. Auf Windows genügt es, diese Datei im Browser zu öffnen. Änderungen auf `main` werden nach Aktivierung automatisch über GitHub Pages veröffentlicht.

**Status:** Früher Prototyp mit einfachen Platzhaltergrafiken, noch kein fertiges HD-2D-Spiel. Als Nächstes: bessere Touch-Steuerung, Animationen, Checkpoints und eine echte Weltkarte.
