# Animation overhaul status (0.39)

## Implemented

All six player classes now have a painted eight-view parts atlas (64 parts each), sharing the same directional torso, equipment and palette across idle, locomotion, attack, special, hit reaction, dash and death. Attacks articulate arms and weapons; they do not rotate the complete character. The knight has three swing paths. Moving during an attack keeps the distance-driven gait. The bow draws its string, the rifle recoils, the mage moves its staff, the summoner extends its palm and the alchemist releases its bottle. Cast and recovery are phases of these attacks.

Menus and the animation laboratory use the production models. The laboratory provides six simultaneous previews, eight directions, action selection, movement during attacks, slow motion, pause, seek and origin markers. Its actors do not access saves or statistics.

Projectile sockets share the pose calculation with rendering. Event callbacks sample the exact release time even when a long update crosses the entire action. Keyboard/touch mage and summoner attacks capture nearby enemies intersecting their forward ray, fixing staff-height shots passing over close targets. Damage, ability mechanics and save schema remain unchanged.

The previous full-body atlases remain available if the new assets fail to load. `?legacyHeroArt=1` selects that fallback for regression comparison. Four historical artwork browser suites explicitly exercise it; the new production renderer has separate raster and browser coverage.

## Validation

- 264 Node tests pass, including 6,912 rasterized poses, eight-view source bounds, visibility, crop margins, model reuse and projectile/socket agreement.
- The new browser suite checks 336 production class/view/state combinations and 40 visible release sockets in each engine.
- Laboratory browser coverage checks 528 selections per desktop/mobile configuration, save isolation and subsequent game start.
- Current Chromium/WebKit CI results must be checked before merging. Local browser startup is blocked by a system socket restriction; local raster tests use the native Canvas implementation.
- Physical iPhone testing is not available in this environment.

## Remaining scope and limitations

This change addresses the six playable classes and animation inspection. New companion, enemy and boss artwork from the broader master specification has not been implemented. Their existing behavior and graphics remain.

Art uses continuous articulation of painted parts, not a separate full-body PNG for every animation frame. Cloth movement is limited to the pelvis/garment piece. The existing production effects remain; this is not a complete VFX replacement. Technical coverage alone does not establish visual acceptance: inspect the running game on desktop and iPhone before describing the entire master specification as complete.
