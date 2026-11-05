"""Knight North action art build 0.52: reuse genuine painted base pixels; paint
pose variants by moving independent pieces. No whole-body rigid rotation.
Source retains the approved blue / steel / gold illustrated knight silhouette.
"""
from PIL import Image, ImageDraw, ImageChops
from pathlib import Path
import math
PROJECT=Path(__file__).resolve().parents[1]
ROOT=PROJECT/'assets'/'knight'/'north-052'
ROOT.mkdir(parents=True,exist_ok=True)
SOURCE=PROJECT/'assets'/'knight'/'north-051'/'facings-v051.png'
FACES=Image.open(SOURCE).convert('RGBA')
CELL=72
ROWS=(3,4,5)
CLIPS={'idle':6,'walk':8,'hurt':6,'dash':8,'death':8}
LEG_POLYS={
 3: [[(30,43),(36,42),(37,52),(38,58),(29,58),(28,54)],[(37,42),(42,43),(44,58),(34,58),(35,51)]],
 4: [[(27,43),(36,43),(36,51),(34,59),(24,59),(25,51)],[(36,43),(45,43),(47,57),(44,59),(36,59)]],
 5: [[(30,43),(39,43),(41,52),(44,59),(31,59),(29,54)],[(39,43),(45,43),(48,59),(36,59),(36,51)]],
}
# The moving legs are faithfully sampled from the existing hand-painted
# greaves and boots, rather than rasterized rectangles or a new art style.
# Because diagonal poses show a more occluded far leg, gait amplitudes differ.
GAITS=[(-3, 2,0,0),(-2, 3,0,-2),(0,2,0,-3),(2,-1,-1,-1),
       (3,-2,0,0),(2,-3,-2,0),(0,-2,-3,0),(-1,2,-1,-1)]
DASH=[(-1,1,0,0),(-3,3,0,-1),(-5,4,-2,-1),(-5,5,-2,0),
      (-4,4,-1,0),(-2,3,0,-2),(-1,1,-1,0),(0,0,0,0)]

def crop_mask(polygon):
 m=Image.new('L',(72,72),0);d=ImageDraw.Draw(m);d.polygon(polygon,fill=255);return m

def shift_opaque(im,dx=0,dy=0):
 out=Image.new('RGBA',(72,72))
 out.paste(im,(int(dx),int(dy)))
 return out

def split_layers(face,row):
 masks=[crop_mask(p) for p in LEG_POLYS[row]]
 leg=[]
 for mask in masks:
  frame=Image.new('RGBA',(72,72));frame.paste(face,(0,0),mask);leg.append(frame)
 # Mask only pixels of articulated greaves / boots out of torso, keeping
 # the steel chest, helmet, weapon and cape exactly as painted.
 erase=Image.new('L',(72,72),0)
 for m in masks:erase=ImageChops.lighter(erase,m)
 core=face.copy()
 cpx=core.load();epx=erase.load()
 for y in range(42,62):
  for x in range(20,53):
   if epx[x,y]>0:cpx[x,y]=(0,0,0,0)
 # Keep the short cloth tabard layered on top of the greaves.
 front=Image.new('RGBA',(72,72));mask=Image.new('L',(72,72),0)
 poly={3:[(30,33),(39,34),(40,44),(30,48),(28,43)],
       4:[(30,33),(42,33),(44,44),(39,48),(33,49),(29,43)],
       5:[(32,33),(42,32),(42,44),(36,48),(30,44)]}[row]
 ImageDraw.Draw(mask).polygon(poly,fill=255)
 # Avoid covering armor with off-white pixels from the sword near the tabard.
 orig_a=face.getchannel('A');mask=ImageChops.multiply(mask,orig_a)
 front.paste(face,(0,0),mask)
 return core,leg,front

def composite_motion(face,row,clip,i):
 total=CLIPS[clip];phase=i/max(total-1,1)
 if clip=='idle':
  # One-pixel chest breathing, never a drifting foot anchor.
  dxL=dxR=dyL=dyR=0
  head_y=[0,-1,-1,0,0,0][i]
  torso_x=[0,0,-1,0,1,0][i]
 elif clip=='walk':
  dxL,dxR,dyL,dyR=GAITS[i]
  head_y=[0,-1,-1,0,0,-1,-1,0][i]
  torso_x=[0,0,1,1,0,0,-1,-1][i]
 elif clip=='dash':
  dxL,dxR,dyL,dyR=DASH[i]
  head_y=[0,1,2,2,1,1,0,0][i]
  torso_x=[0,-1,-2,-2,-1,0,0,0][i] * (1 if row!=3 else -1)
 else: # hurt
  dxL,dxR,dyL,dyR=[(0,0,0,0),(-1,1,0,0),(-2,1,0,-1),(-2,1,0,0),(-1,0,0,0),(0,0,0,0)][i]
  head_y=[0,1,2,1,0,0][i]
  torso_x=[0,1,2,2,1,0][i]*(1 if row!=3 else -1)
 # The far greave in side/back quarter view moves less in depth.
 if row!=4:
  dxL=round(dxL*.8);dxR=round(dxR*.8)
  dyL=round(dyL*.7);dyR=round(dyR*.7)
 core,legs,front=split_layers(face,row)
 # Background cloak stays painted; articulated feet move independently.
 frame=Image.new('RGBA',(72,72))
 frame.alpha_composite(core)
 frame.alpha_composite(shift_opaque(legs[0],dxL,dyL))
 frame.alpha_composite(shift_opaque(legs[1],dxR,dyR))
 frame.alpha_composite(front)
 # Local helmet/shoulders breathing and recoil; no whole-body rotation.
 # Preserve the original art and don't shear the sword away from the gauntlet.
 if torso_x or head_y:
  upper=Image.new('RGBA',(72,72));mask=Image.new('L',(72,72),0)
  d=ImageDraw.Draw(mask)
  # Head and upper steel torso down to pauldron, excluding cape and sword.
  d.polygon([(20,8),(53,8),(53,29),(19,29)],fill=255)
  upper.paste(face,(0,0),mask)
  # Clear old upper-pose pixels only in the upper contour; no leg changes.
  alpha=ImageChops.subtract(frame.getchannel('A'),mask)
  frame.putalpha(alpha)
  frame.alpha_composite(shift_opaque(upper,torso_x,head_y))
 return frame

def death_pose(face,row,i):
 if i==0:return face.copy()
 # Joint-articulated defeat: knees give way first, then the torso/helmet
 # folds sideways at the hip. The boot silhouettes are NOT rotated with it.
 # This is a separate torso hinge, never a spinning whole-character sprite.
 if i<=3:
  amount=[0,.06,.15,.28][i]
  lean=[0,0,1,2][i]*(1 if row!=3 else -1)
  out=Image.new('RGBA',(72,72))
  src=face.load();dst=out.load()
  for y in range(8,62):
   for x in range(9,65):
    px=src[x,y]
    if px[3]<16:continue
    weight=max(0,min(1,(59-y)/49))
    ny=round(59-(59-y)*(1-amount*.60))
    nx=round(x+lean*weight)
    if y>44:nx+=round(((-3 if x<36 else 3)*amount)*(y-44)/15)
    if 0<=nx<72 and 0<=ny<72:
     if dst[nx,ny][3]<px[3]:dst[nx,ny]=px
  return out
 # Source body parts are separated at the belt (hip hinge). The upper
 # armored body falls over while the kneeling greaves stay at ground level.
 angle={4:18,5:37,6:60,7:78}[i]*(-1 if row==3 else 1)
 a=math.radians(angle);co=math.cos(a);si=math.sin(a)
 center=(36,43);settle={4:2,5:4,6:6,7:7}[i]
 out=Image.new('RGBA',(72,72));src=face.load();dst=out.load()
 # Boots and shins compress onto the floor, retain the original greave paint.
 lower_top=42
 for y in range(lower_top,62):
  for x in range(16,66):
   px=src[x,y]
   if px[3]<16:continue
   d=(y-lower_top)/19
   yy=round(58-(58-y)*.73)
   xx=round(x+((-3 if x<36 else 3)*min(1,d))*(i-3)/4)
   if 0<=xx<72 and 0<=yy<72:dst[xx,yy]=px
 # The helm, shoulders, chestplate and attached sword rotate at the hip;
 # the lower legs never rotate with the upper segment.
 for y in range(7,47):
  for x in range(9,66):
   px=src[x,y]
   if px[3]<16:continue
   dx=x-center[0];dy=y-center[1]
   nx=round(center[0]+dx*co-dy*si)
   ny=round(center[1]+dx*si+dy*co+settle)
   if 1<=nx<71 and 2<=ny<70:dst[nx,ny]=px
 # Keep an armored belt over the hip to bridge the rotated torso and legs.
 # This is existing source artwork sampled at the belt, not a new block.
 for y in range(40,44):
  for x in range(30,43):
   px=src[x,y]
   if px[3]>30:
    nx=round(center[0]+(x-center[0])*co-(y-center[1])*si)
    ny=round(center[1]+(x-center[0])*si+(y-center[1])*co+settle)
    if 1<=nx<71 and 1<=ny<70:dst[nx,ny]=px
 return out

def build():
 base={r:FACES.crop((r*72,0,r*72+72,72)) for r in ROWS}
 for clip,frames in CLIPS.items():
  sheet=Image.new('RGBA',(72*frames,576))
  for row in ROWS:
   for i in range(frames):
    pic=death_pose(base[row],row,i) if clip=='death' else composite_motion(base[row],row,clip,i)
    sheet.alpha_composite(pic,(i*72,row*72))
  sheet.save(ROOT/(clip+'-up.png'),optimize=True)
  print('made',clip,sheet.size,(ROOT/(clip+'-up.png')).stat().st_size)
 # Sprite contact visual includes frame columns for all 3 directions.
 cs=Image.new('RGBA',(8*72, len(CLIPS)*3*72),(26,36,47,255))
 for j,(clip,frames) in enumerate(CLIPS.items()):
  sheet=Image.open(ROOT/(clip+'-up.png')).convert('RGBA')
  for i,r in enumerate(ROWS):
   for f in range(frames):
    cs.alpha_composite(sheet.crop((f*72,r*72,f*72+72,r*72+72)),(f*72,(j*3+i)*72))
 cs.resize((1152, len(CLIPS)*3*144),Image.Resampling.NEAREST).save(ROOT/'north-motion-review.png')

if __name__=='__main__':build()