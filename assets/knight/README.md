# Knight atlas · Alpha 0.27.0

Four locally hosted transparent PNG sheets, 8 columns × 9 clips per facing.
`atlas.json` contains tightly cropped source rectangles and the body/ground pivot
for every entry. Runtime code must use these rectangles rather than assume that
all entries occupy an entire cell. The sword is included in the artwork.

Clip order: idle, walk, attack1, attack2, attack3, special, dash, hurt, death.
Eight frame entries per clip; relaxed guard poses may repeat at clip endpoints.
All four views were separately generated and reviewed; the left view is not a
mirrored right view. No external asset CDN, fonts, model API or credentials are
needed by the game. Artwork was generated with OpenAI Imagegen using the
approved knight design from this project's design review, then extracted,
normalized, reordered and packed for this game. It is not third-party game art.

The runtime uses action-local clocks from `src/knight-animation.js`; contact is
frame 3 of attack1, frame 4 of attack2/attack3, and frame 3 of special. The
contact event is one-shot even when the clock skips across several frames.
Sprites never rotate at runtime. Ground pivots exclude the sword tip, so longer
blades do not make the character float above its shadow. The world body height
is approximately 68 pixels; actor collision radius and progression stay intact.

`tools/pack-knight.cjs` is an offline extraction/packing helper (requires Sharp,
not used by the game). It accepts a JSON source specification with filenames,
row counts, optional reviewed row boundaries, extra clip strips and frame
orders. Supply `NODE_PATH` or install Sharp separately when rebuilding from
source artwork. Keep source sheets outside the production download path.

Validation:

```
npm test
# Start the repository's static server on port 8000, then:
npm run test:browser
npm run test:knight-browser
```

The knight browser suite decodes all four production sheets, checks each clip
has at least six distinct poses, checks every frame is nonempty and unclipped,
checks damage at contact, renders all nine states and exercises touch input in
Chromium and WebKit. An actual iPhone hardware test is still recommended.
\n## Alpha 0.33.0 – 32-frame knight walk overhaul\n\nNew `walk-32.png` contains 8 new authored whole-body walking poses for each of four facing directions in a single transparent 640×320 indexed PNG (80×80 cells). Row order: down (front), up (back), left, right. This separate sheet replaces only the animation rendered during walk. The original four 8×9 atlases still provide idle and every combat/reaction pose. The full sprite is never split into procedural legs or garments; the visible boot contact is measured once at decode time with `src/knight-walk.js`. Fallback on image decode error uses the previous complete walk art.\n\nThe new artwork was created using OpenAI ImageGen based on the reviewed red-cape/metal-armor concept and extracted/cleaned into a transparent game atlas. The original image-generation output included presentation framing and background; these were removed locally before packing. Source extraction montage and animation review were inspected, and the runtime is covered in `tests/v033-knight-art.test.js` and `tests/locomotion-browser.cjs`. No third-party game asset licenses are used.\n