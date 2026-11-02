# Animation overhaul — work in progress

Status: **not a completed art overhaul; not approved for production as the requested overhaul**.
Baseline: `9f40c4fe43440996f8e737bd787027a9f5b5cd96` (0.38.0).

## Implemented and verified

- Menu animation inspection dialog: six classes, eight aim directions, production renderers, existing animation states, combo selection, attack preparation/recovery inspection, pause, 1/24-cycle stepping, slow playback, seeking and optional emission markers.
- The dialog uses isolated actors and never constructs a Game or accesses progression. All comparison cycles are normalized to 1.2 seconds; they do not measure live attack cooldowns.
- Animation callbacks sample their exact authored hit/release pose before advancing to the end of the current update. This fixes the summoner hand origin changing when a single update crosses the entire action.
- Keyboard/touch mage and summoner casts aim at the nearest living enemy intersecting their forward floor ray within 260 world pixels and line of sight. This fixes staff-height projectiles passing above point-blank enemies. Captured mouse targets, damage, abilities and save schema are unchanged.
- Existing tests were corrected where they still expected the removed 0.37 attack PNGs or lacked Canvas path methods introduced by 0.38. Assertions still check identity, weapon articulation and hit-event boundaries.

## Validation

- Original baseline: 248/255 Node tests passed, seven failures.
- Current Node suite: **261/261 passed**.
- Chromium desktop (1280×900) and mobile/touch (390×844): **528 class/state/direction combinations each**, no page exceptions; close/reopen, unchanged localStorage and subsequent game start verified.
- Chromium screenshots inspected for desktop and mobile dialog layout.
- Local WebKit unavailable: required system libraries are absent; package installation could not complete against the available Ubuntu package mirror. This is not physical iPhone/Safari validation.

## Findings and unfinished requirements

- Hero and knight pose selection still maps eight aim vectors to four sprite facings. Eight genuinely authored views are not delivered.
- Knight idle/action and walk derive from different artwork. Current attacks overlay the sword onto idle; existing side clipping and front-facing baked-in sword still need a proper replacement atlas.
- Mage/summoner use a newer walk model for multiple states and a gesture overlay. The mage staff does not perform a complete authored lift/cast/recover cycle.
- Robe hurt/death and some knight fallback actions still use whole-body transforms or walk poses. These are not compliant final animation sets.
- Hunter, rifle and alchemist keep the existing production atlases. These have not been replaced with a unified new set.
- Simultaneous movement and attack is exposed for inspection but not reauthored. The production action priority can still freeze the visible gait.
- Companion animation code already has motion, attack, summon and vanish states; no new companion artwork has been delivered here.
- Enemy/boss visuals use the existing 32×36 procedural atlas, while heroes use the larger raster atlases. A complete style reconciliation and new enemy/boss attack/death/phase art remains outstanding.

## Art acceptance result

A code-authored replacement prototype was rejected because it lost the existing detailed art quality. It is not included or referenced.

A generated eight-direction knight attack atlas was also rejected: output was 1254×1254 instead of the requested 1024×1024 grid, pixels touch the top/side canvas boundaries and sword tips are clipped. It is not a production asset and is not included. Changing crop offsets would not recover missing sword pixels or establish reliable animation anchors.

Do not describe or publish this branch as all six characters having complete new animation sets. Before production release of the full overhaul, finish the artwork checklist below and run the complete browser suite in Chromium and WebKit.
