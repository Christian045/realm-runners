# Ritter 0.53.1 – gezielter Animationsfeinschliff (Vorschau)

Die bisherige Pixel-Art mit 608 Runtime-Zellen bleibt bestehen. Dies ist
eine **Wiedergabe- und Schrittübergangs-Korrektur**, keine neue zeichnerische
Endversion des Ritters.

- Attacke 1, Attacke 2, schwerer Finisher und Spezial: individuelle
  Zeitkurven für Vorbereitung, Kontakt und Ausschwingen.
- Schaden und gezeichneter Treffer bleiben exakt synchron:
  Attacke 1 = 3/8, Attacke 2 = 4/8, Finisher = 5/10 beim Event 4/8,
  Spezial = 3/8.
- Die Vorschau misst tatsächliche Laufdistanz (112 Weltpixel pro
  vollständigem Acht-Frame-Schrittzyklus).
- Bei Schrittbeginn wird die Standphase verwendet; ein abgebrochener
  Schritt endet in höchstens 120 ms auf der nächsten gepflanzten Fußpose.
- Einzig `previewKnightFinal=1` aktiviert die neue Wiedergabe. Die
  stabile Standardgrafik, Kampfwerte und Reichweiten sind unverändert.

**Nicht als endgültig freigeben**, bis Helm, Waffenhand, Knie,
Gehbewegung und Übergänge bei normaler Spielgeschwindigkeit auf
PC und iPhone optisch abgenommen wurden.

Test: https://christian045.github.io/realm-runners/?v=0.53.1&previewKnightFinal=1
