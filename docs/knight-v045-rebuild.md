# Knight full-body animation rebuild (Alpha 0.45.0)

The existing opt-in `?newKnight=1` renderer still uses transparent **complete 144×144 pixel frames**. Five complete PNG atlases are now stored in `assets/knight/v045/`, with consistent art direction and direction identity, plus `poses.json` and a reproducible generator in `tools/generate-knight-v045.py`.

**Why 0.44 was rejected:** The artwork in some north-facing attacks suddenly rotated the entire knight into a side-facing pose and used a large white swoosh as the apparent blade. The walk/attack frames also appeared to show different characters. Ordinary browser visibility tests did not catch this visual continuity failure.

**What changed:** Every combat frame is baked from the **same original, detailed, project-owned idle/walk character source for that facing**. Every movement remains in that facing (south through southeast); the blue cape, helmet and breastplate no longer turn through different views in one action. The sword hilt is authored at the gauntlet position in the *same fully rendered frame*, with a short narrow blade and a restrained glint at the contact frame. There are no additional live sword, leg or arm overlays in the 0.45 renderer. The already illustrated walk source has eight foot-and-torso frames per direction and a fixed floor position.

**Game mechanics:** The original attack contact timings 3/8, 4/8 and 4/8 and all saves, enemy balance and other class art are unchanged. The main game renderer draws one cell. New art remains opt-in via `?newKnight=1`; the preexisting artwork is the safe default.

**Validation:** New tests assert helmet/facing consistency for all 208 combat cells, sword grip attachment and length, absence of oversized white crescents, and eight-way alternating gait. Existing 0.44 full-image and mobile/WebKit tests remain in place. Real iPhone aesthetic acceptance remains essential and is not implied by passing automated tests.

The generator reuses the already owned `assets/knight/v044/idle.png` and `walk.png` as its detailed art masters. This is an intermediate art-quality iteration, not a claim that every action frame was individually hand-drawn from scratch.
