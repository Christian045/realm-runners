# Combat animation revision (0.40.0)

## Why 0.39 was rejected

The recorded iPhone gameplay on 2026-11-03 shows that the mechanically animated sword arm, staff and summoner sleeve do not communicate anticipation, effort or release well enough. Passing raster and browser tests established only technical stability, not acceptable motion or appearance.

## 0.40 implementation

The production articulated rig now drives a *waist-pivoted upper-body pose* that shares shoulder, hand, weapon and emission transforms. This prevents floating muzzle locations when the torso recoils or turns. The three priority classes use separate per-action curves:

- **Knight:** three distinct contact-time-aligned combos (horizontal, reverse and overhead) with torso counter-rotation, weight transfer, hand trajectories and narrow gold blade trails. Specials retain their 3/8 contact time, while attack 2/3 land at 4/8.
- **Mage:** active staff anticipation and forward cast, upper-body twist, supporting hand brace and crystal-centered magic focus. The projectile continues to spawn from the actual tip of the visible staff, at 3/6 of the clip.
- **Summoner:** sleeve and palm extend into the target direction, the off-arm braces, the torso follows through and magic collects on the firing hand. Projectile origin is exactly the palm, at 3/6 of the clip.
- **All six:** groundwork from the v0.40 gait branch retains one planted foot through each walking phase and separates upright boots from tilted shins; foot/leg animations are driven by travelled distance.

The new shapes are articulated using the painted eight-view atlas; this is **not** yet a full per-frame painted sprite-sheet replacement. Legacy image fallback remains intact. Gameplay damage and timing are unchanged.

## Validation and acceptance

- Run the existing Node raster tests (6,912 combinations), plus the new class-specific wind-up / contact / recovery / eight-direction assertions.
- Run Chromium and WebKit tests for shared projectile origins, 336 production rig snapshots, and animation laboratory previews on desktop and mobile.
- Inspect the generated Chromium contact sheets and review a real-device gameplay recording; technical tests alone do not prove artwork quality.
- The companion design, enemy and boss animation overhauls remain outside this three-class combat revision.

## Branch policy

Work is staged in a PR until all required checks pass. The previous gait-only PR #41 is superseded if the combined v0.40 update merges. Do not represent this as a complete redesign of all character or boss sprites.
