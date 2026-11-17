# Glaskanonier 0.76.1

Approved reference: the central cowboy in the user's comparison of mage, rifleman and hunter (17 November 2026).

`carbine-source.png` was produced with built-in image generation using that reference. Brief: five consistent views (front, front-right, right, back-right, back); soft painted chibi rendering; brown curved hat with crossed brass emblem; dark bandana; copper poncho; brown trousers and boots; subdued highlights; transparent background; no floor, shadow, hands or weapon. The latter are articulated in `src/glass-rifleman.js`.

Repack without changing the source artwork:

```sh
node tools/pack-glass-carbine.cjs assets/heroes/glasscannon/rifleman/carbine-source.png
```

The atlas retains 3 pixels per logical pixel. Each logical cell is 96×96, soles at y=88, leg split at y=69. Left-facing views mirror the corresponding right view. Both hands, stock and muzzle share the weapon transform; local x=0 is the muzzle. Back-facing shoulders are offset to keep the muzzle visible outside the poncho. The action event releases at 50%, before recoil.

Verification: eight target rays through attack/recoil/dash; one release during a long frame; 280 rendered samples over seven states, eight directions and five phases, including opposed movement and aiming. Browser inspection uses the existing animation lab and real Dungeon renderer.
