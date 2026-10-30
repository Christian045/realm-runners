# Ranged-class artwork · Alpha 0.28.0

Each class has four transparent production PNG atlases, one small menu strip,
and an `atlas.json` with crop rectangles, body pivots and optional `flipX`.
The full atlases are decoded only for the selected class. A generation token
prevents a late image request from replacing a newer class selection. The tiny
menu strips also work with reduced-motion preferences.

| Class ID | Identity | Attack / special |
| --- | --- | --- |
| hunter | Green hood, leather armor, quiver and longbow | Bow release / arrow volley |
| mage | Blue-violet embroidered robe and crystal staff | Hand cast / arcane release |
| glasscannon | Dark hat, crimson scarf and crystal rifle | Rifle recoil / crystal nova |
| summoner | Purple hood, bone trim and open tome | Book cast / siege-giant summoning |
| alchemist | Brass goggles, leather coat and flask belt | Flask throw / large mixture |

Clip order: idle, walk, attack, special, dash, hurt, death. Six entries per clip,
four facings, 168 entries per class (840 total). Rest and recovery poses may be
held/repeated. These are separately articulated body poses, not a single image
translated or rotated to simulate animation. Mage and rifle left profiles use
mirrored right-profile poses to keep the release direction coherent; `flipX`
is explicit in their metadata. Other facings have their own source artwork.
The existing eight-frame knight clips are preserved.

Weapons are part of the sprites. The renderer must return after drawing the
new character, without adding its old floating staff, rifle or tome. Drawing
uses the body/ground pivot rather than the weapon bounding-box bottom, so
staffs and bows cannot lift the feet away from the shadow.

`src/hero-animation.js` owns the local clock. Release is frame 3 of 6 for both
attack and special. `Game` snapshots aim and alchemy target/recipe, and performs
the original projectile, mastery, affix or ability behavior once at release.
Dash and normal hurt reactions can cancel pending normal attacks. Pauses and
hitstop freeze action clocks. Death plays before the result overlay.

Artwork was generated with OpenAI Imagegen from the approved Realm Runners
class concepts and knight reference, then reviewed, extracted, normalized and
packed offline. The browser does not use an image API, third-party asset CDN,
Sharp or credentials. `tools/pack-heroes.cjs` plus `tools/atlas-packing.cjs` can
repack source sheets with an offline Sharp installation and a JSON source map.

Validation: `npm test`, `npm run test:browser`, `npm run test:knight-browser`,
and `npm run test:heroes-browser` (static server on port 8000). The hero suite
checks all 840 entries in Chromium and WebKit, renders all states, exercises
class switching and touch actions, and verifies projectiles at release. A
physical iPhone hardware test is still recommended.


## Layered aiming correction (0.28.1)

`glasscannon/aim.png` and `hunter/aim.png` contain four rows of six weaponless attack bodies and a fifth row of six independent weapon poses. `atlas.json.aimRig` stores their cropped UVs and anchors. `tools/pack-aim-rigs.cjs` packs the transparent sources offline using Sharp. The browser loads only the selected class’s extra atlas.

The body stays upright and uses real bracing/recoil/recovery poses. The weapon rotates independently around the hands; its emitting tip uses the same geometry as `src/hero-aim.js`. The release flash starts at that tip. Left-facing weapons flip vertically in local weapon coordinates so they remain upright. Hunter’s special uses the same bow origin for its intentional spread. Mage/summoner emit from their casting hands; alchemist’s existing lob starts from the throw hand and retains the selected floor destination.

New raster layers were created with the built-in Imagegen tool, using each class’s existing right-facing sheet as the identity reference. Prompt set: preserve identity, clothing, palette and detailed fantasy pixel art; transparent 6-column/5-row sheet; rows 1–4 show down/right/up/left weaponless bodies in six distinct ready/brace/aim/release/settle/recover poses; row 5 shows detached right-pointing crystal rifles or longbows with gloved hands in corresponding loaded/release/recoil states; no labels, background, particles, or weapons on the body layers. Reviewed, cropped and packed into the project assets above.
