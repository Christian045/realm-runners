"""Index connected painted parts without modifying or resampling source artwork."""
import json
from pathlib import Path
import numpy as np
from PIL import Image
from scipy.ndimage import label, find_objects

for root in sorted(Path('assets/rigs').iterdir()):
    source = root / 'parts.png'
    if not source.exists():
        continue
    image = Image.open(source).convert('RGBA')
    width, height = image.size
    labels, _ = label(np.asarray(image)[:, :, 3] > 100, np.ones((3, 3)))
    counts = np.bincount(labels.ravel())
    frames = [[None] * 8 for _ in range(8)]
    areas = [[0] * 8 for _ in range(8)]
    for index, slices in enumerate(find_objects(labels), 1):
        if counts[index] < 150:
            continue
        y, x = slices
        col = min(7, int((x.start + x.stop) / 2 / width * 8))
        row = min(7, int((y.start + y.stop) / 2 / height * 8))
        if counts[index] <= areas[row][col]:
            continue
        areas[row][col] = int(counts[index])
        frames[row][col] = dict(x=x.start, y=y.start, w=x.stop-x.start, h=y.stop-y.start)
    assert all(frame for row in frames for frame in row), f'Missing part in {root}'
    manifest = dict(width=width, height=height, rows=['S','SW','W','NW','N','NE','E','SE'],
                    parts=['torso','pelvis','upperArm','forearm','offArm','leftLeg','rightLeg','weapon'],
                    forearmReverse=root.name == 'summoner', frames=frames)
    (root/'parts.json').write_text(json.dumps(manifest, indent=2)+'\n')
    print(root.name, '64 indexed parts', width, height)
