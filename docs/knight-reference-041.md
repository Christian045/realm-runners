# Knight reference artwork — Alpha 0.41.0 (work in progress)

## Goal
Establish an original, compact, highly legible pixel-art character design for Realm Runners that takes broad inspiration from the atmospheric density and game-feel of Heroes of Hammerwatch **without copying its art assets**.

## Current implementation
- When opened with `?newKnight=1`, the warrior renders complete, cached 128×128 frame images rather than rotating/stretching body-part textures on every game frame.
- New original palette-indexed knight artwork resides in `assets/knight/painted-041.png`. The authoring reference contains six eight-cell strips: distinct eight-way directional body views, side-walk poses, three attack sequences and standing variants.
- The frontal arc of the warrior's three attack sequences uses the new illustrated frames. Rear-view attacks retain the same rear-looking character with a weapon effect baked into each complete frame, preventing a sudden 180-degree model flip.
- The animation uses the existing event clock: 3/8 for attack1, 4/8 for attack2/attack3, so hitboxes are not retimed to decorative frames.
- Standing, moving, dodging, taking damage and death keep the illustrated model when the new art is loaded.
- The preview is intentionally opt-in until the eight-direction art has been aesthetically accepted. Launch `/?newKnight=1` to enable new art; the default remains 0.40 artwork. The animation laboratory and menu portrait use the same production renderer, with `?oldKnightPixel=1` or `?legacyHeroArt=1` preserving comparison/rollback.
- No changes to enemies, other classes, balance, saves, menu layout or world geometry.

## Known art limitations
This first prototype uses independently illustrated frontal attack frames and direction-consistent original bodies for rear views, but **it does not yet have individually repainted attack and walk sequences for all eight view directions**. Diagonal side casts are adapted from the front frames and rear attacks reuse directional idle armour. Their silhouettes need direct iPhone review. Frame-to-frame visual acceptance remains separate from technical CI.

## Tests
- Native Canvas draws all 576 original fallback full-body frames in eight directions and checks boundaries and visible paint.
- Live Chromium and WebKit rendering captures 88 states from the new original art, and the rest of the game's browser suite exercises legacy fallback, mobile controls and gameplay startup.
- Do not describe the new knight as finished solely because automated checks pass.
