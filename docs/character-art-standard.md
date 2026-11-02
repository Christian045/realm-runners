# Realm Runners character art standard

## Visual target

Retain the existing detailed steel-and-gold knight with red cape as the material/detail reference. Use one 96×96 logical cell, approximately 64–76 pixels of standing body height, an upper-left light source and a consistent elevated three-quarter camera. Individual weapons may occupy the remaining cell area; increase the common canvas for all clips if necessary instead of changing character scale.

Use dark colored outlines and small opaque pixel clusters, with three to five material values. Avoid blurred edges, resampling different classes to incompatible pixel densities, or bright outlines that hide the equipment. Skin, leather, steel and gold must share material ramps across classes. Preserve characteristic equipment rather than recoloring the same silhouette six times.

| Class | Identity and palette | Attack origin |
| --- | --- | --- |
| Knight | Closed steel helmet, restrained gold trim, red cape, one silver sword | Right-hand blade contact |
| Mage | Blue/violet robe with gold trim, fixed staff and crystal | Staff crystal |
| Summoner | Dark violet robe, pale face, green-violet magic | Extended palm |
| Hunter | Green hood/cloak, brown leather, bow and close-range daggers | Arrow nock and string release |
| Glass cannon | Broad hat, dark leather, red cape, two-handed rifle | Barrel muzzle |
| Alchemist | Brown/green clothing, belt bottles and throwing hand | Bottle release from fingers |

## Atlas contract

All actors need N, NE, E, SE, S, SW, W and NW views. Do not mirror the right hand into the left hand, shields or asymmetrical straps. Idle, walk, attack, special, hurt, dash and death must share the same complete character identity. Cast and recovery can be named phases of an attack rather than duplicated clips. The knight needs three authored attacks.

Every frame has explicit foot, pelvis, shoulder, hand and weapon-tip anchors. Source coordinates and anchor coordinates are integers. Every cell needs transparent padding beyond the largest weapon/cape extent. No visible pixel may touch the atlas boundary; no cell may contain a neighboring character. Asset validation must reject empty, cut-off or differently scaled frames.

The event contract remains knight hit frame 3/8 for attack 1, 4/8 for attacks 2/3, and ranged release frame 3/6. Artwork may have additional presentation frames, but gameplay must continue to trigger exactly once at the same normalized time unless a separately tested balance change is intended.

## Acceptance gate

Inspect every view and state both frame-by-frame and in motion. Reject changes that alter helmet, face, body/limb lengths, staff length, weapon grip or pixel density. Compare attack start/end against idle, and action transitions against walk. Ground contact should follow real distance traveled; robes must not swallow alternating boots. Whole-body rotation, shuffled walking frames, clipped legacy weapons, or pasted extra arms are not acceptable substitutes for new authored attacks.

Verify weapon tip/palm and visible projectile start together; test close targets, diagonals, captured mouse aim, touch aim and movement during windup. Check one callback under 120/60/30 FPS and a long update. Confirm event cancellation on death and save compatibility. Finish with desktop Chromium, WebKit touch layouts and a real iPhone check where available.
