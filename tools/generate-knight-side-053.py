"""Realm Runners 0.53: lateral knight animation study for SW,W,E,SE.

Build 304 transparent, packed 72px pixel-art cells from four *illustrated*
turnaround views. Greaves, shoulder and torso are articulated separately.
No game-runtime character rotation or whole-body sprite tweening.

This is a reproducible pose-baked ART REVIEW, not 304 separately painted
images; visual acceptance is required before enabling production by default.
"""
from PIL import Image, ImageDraw, ImageChops
from pathlib import Path
import math

PROJECT_ROOT=Path(__file__).resolve().parents[1]
ROOT=PROJECT_ROOT/'assets'/'knight'/'side-053'
SOURCE=PROJECT_ROOT/'assets'/'knight'/'north-051'/'facings-v051.png'
FACES=Image.open(SOURCE).convert('RGBA')
ROWS=(1,2,6,7)
C=72
CLIPS={'idle':6,'walk':8,'attack1':8,'attack2':8,'attack3':10,'recovery':6,
       'special':8,'dash':8,'hurt':6,'death':8}
P={
 'ink':(21,27,34,255),'steel0':(44,54,62,255),'steel1':(72,87,97,255),
 'steel2':(116,136,148,255),'silver':(168,187,194,255),
 'light':(218,225,219,255),'gold0':(89,65,37,255),'gold':(195,147,76,255)
}
# Sword-hand positions, determined by the source illustration rather than
# mirroring all frames (mirroring flips the handedness).
ANATOMY={
 1:{'shoulder':(39,26),'home':(42,40),'front':(-1,1),'near_leg':(35,46),'far_leg':(28,47),
    'leg0':[(31,42),(37,42),(39,52),(39,60),(31,60),(29,52)],
    'leg1':[(27,42),(34,42),(35,52),(32,59),(25,59),(25,51)],
    'tabard':[(31,32),(39,31),(38,45),(31,50),(29,44)],'side':1},
 2:{'shoulder':(37,26),'home':(34,40),'front':(-1,0),'near_leg':(34,46),'far_leg':(32,47),
    'leg0':[(33,41),(41,43),(40,51),(40,60),(32,60),(32,51)],
    'leg1':[(28,41),(36,43),(36,51),(33,60),(26,60),(27,51)],
    'tabard':[(32,33),(39,34),(37,46),(31,49),(29,43)],'side':-1},
 6:{'shoulder':(31,26),'home':(35,40),'front':(1,0),'near_leg':(35,46),'far_leg':(34,47),
    'leg0':[(32,42),(40,42),(41,53),(42,59),(34,60),(32,52)],
    'leg1':[(27,42),(35,42),(35,52),(33,59),(26,60),(27,51)],
    'tabard':[(32,33),(40,33),(42,45),(37,49),(32,44)],'side':1},
 7:{'shoulder':(30,27),'home':(30,41),'front':(1,1),'near_leg':(34,45),'far_leg':(30,45),
    'leg0':[(33,42),(40,42),(44,55),(45,60),(35,60),(32,52)],
    'leg1':[(26,42),(34,42),(34,51),(32,59),(24,59),(25,50)],
    'tabard':[(31,33),(40,33),(42,46),(35,49),(30,43)],'side':-1},
}
# Contact positions are keyed to *gameplay* hit frames (0-based).
HITS={'attack1':3,'attack2':4,'attack3':5,'special':3}
# Recorded from a 72px sword path; by design no hit occurs behind the knight.
AIM={1:(-1,0.72),2:(-1,-.20),6:(1,-.20),7:(1,.72)}
LEG_PHASE=[(-2,2,0,0),(-2,3,-1,-2),(0,3,-1,-3),(2,1,0,-1),
           (3,-2,0,0),(2,-3,-2,-1),(0,-2,-3,-1),(-2,0,-1,0)]
DASH_PHASE=[(-1,1,0,0),(-2,2,0,-1),(-4,4,-2,0),(-5,4,-2,0),
            (-3,4,-1,-1),(-2,2,0,-2),(-1,1,0,-1),(0,0,0,0)]

def mask(poly):
 out=Image.new('L',(C,C),0);ImageDraw.Draw(out).polygon(poly,fill=255);return out

def isolate(img,m):
 layer=Image.new('RGBA',(C,C));layer.paste(img,(0,0),m);return layer

def shifted(img,x,y):
 out=Image.new('RGBA',(C,C));out.paste(img,(int(round(x)),int(round(y))));return out

def erase_mask(img,m):
 out=img.copy();pix=out.load();m=m.load()
 for y in range(C):
  for x in range(C):
   if m[x,y]>0:pix[x,y]=(0,0,0,0)
 return out

def base(row):return FACES.crop((row*C,0,(row+1)*C,C)).copy()

def layers(row):
 face=base(row);spec=ANATOMY[row]
 leg_masks=[mask(x) for x in (spec['leg0'],spec['leg1'])]
 legs=[isolate(face,m) for m in leg_masks]
 m=ImageChops.lighter(leg_masks[0],leg_masks[1]);core=erase_mask(face,m)
 # Preserve the dark-blue tabard as the actual original source pixels.
 tab=mask(spec['tabard']);tab=ImageChops.multiply(tab,face.getchannel('A'))
 front=isolate(face,tab)
 return face,core,legs,front

def upper_overlay(row,face,core,dx,dy):
 if not dx and not dy:return core
 # Only the helmet, pauldron tops and upper chest breathe; a separate
 # shoulder-arm motion follows attack-frame wrist positions.
 upper=mask([(23,10),(50,10),(51,29),(23,29)])
 top=isolate(face,upper)
 bottom=erase_mask(core,upper)
 bottom.alpha_composite(shifted(top,dx,dy))
 return bottom

def render_motion(row,clip,i):
 face,core,legs,front=layers(row)
 if clip=='idle':
  a,b,c,d=(0,0,0,0);dx=[0,0,1,0,-1,0][i];dy=[0,-1,-1,0,0,0][i]
 elif clip=='walk':
  a,b,c,d=LEG_PHASE[i];dx=[0,0,1,1,0,0,-1,-1][i];dy=[0,-1,-1,0,0,-1,-1,0][i]
 elif clip=='dash':
  a,b,c,d=DASH_PHASE[i];dx=[0,1,2,2,1,0,-1,0][i]*(-1 if row in (1,2) else 1)
  dy=[0,1,2,2,1,0,0,0][i]
 elif clip=='hurt':
  a,b,c,d=[(0,0,0,0),(-1,1,0,0),(-2,1,0,-1),(-2,1,0,0),(-1,0,0,0),(0,0,0,0)][i]
  dx=[0,-1,-2,-2,-1,0][i]*(-1 if row in (1,2) else 1)
  dy=[0,1,2,1,0,0][i]
 else:raise ValueError(clip)
 if row in (1,7):a=round(.8*a);b=round(.8*b)
 core=upper_overlay(row,face,core,dx,dy)
 out=Image.new('RGBA',(C,C));out.alpha_composite(core)
 out.alpha_composite(shifted(legs[1],b,d))
 out.alpha_composite(shifted(legs[0],a,c))
 out.alpha_composite(front)
 return out

def remove_weapon(row,img):
 # Remove the static reference blade, without deleting the torso and legs.
 # Underpaint is sampled once from the illustrated armour at the same height;
 # this avoids bright second swords and transparent holes in the silhouette.
 shapes={
  1:[(38,38),(45,38),(40,54),(32,54)],
  2:[(28,38),(36,38),(29,57),(22,57)],
  6:[(34,38),(40,38),(52,58),(46,58)],
  7:[(27,38),(34,38),(38,57),(31,57)]}
 m=mask(shapes[row]);src=img.copy().load();out=img.copy();dst=out.load();msk=m.load()
 refX={1:36,2:38,6:33,7:38}[row]
 for y in range(38,59):
  sampled=src[refX,y]
  for x in range(20,54):
   if not msk[x,y]:continue
   body=({1:x<=38,2:x>=35,6:x<=37,7:x>=36}[row])
   if body and sampled[3]>80:
    # Uniform silhouette tone sampled from real pixel-art undercoat.
    dst[x,y]=sampled
   else:dst[x,y]=(0,0,0,0)
 return out

def norm(x,y):
 d=math.hypot(x,y) or 1
 return x/d,y/d

def combat_pose(row,clip,f):
 sx,sy=ANATOMY[row]['shoulder'];homeX,homeY=ANATOMY[row]['home']
 ux,uy=norm(*AIM[row]);perpx,perpy=-uy,ux
 t=f/(CLIPS[clip]-1)
 # Distinct combo profiles; perpendicular offset gives first and second
 # swings opposite entry points, then a longer diagonally-driven finisher.
 if clip=='attack1':
  lane=[-1,-.8,-.5,0,.68,.86,.32,-1][f]
  advance=[-1,0,3,10,11,7,3,-1][f]
  lift=[1,0,-2,-2,-1,0,1,1][f]
 elif clip=='attack2':
  lane=[.7,1,.75,.34,0,-.60,-.90,.7][f]
  advance=[-1,0,3,7,11,9,4,-1][f]
  lift=[1,0,-3,-3,-2,0,1,1][f]
 elif clip=='attack3':
  lane=[0,-.5,-.8,-.75,-.43,0,.56,.8,.4,0][f]
  advance=[-1,0,1,2,5,12,11,8,3,-1][f]
  lift=[1,-3,-7,-8,-8,-5,-2,0,1,1][f]
 elif clip=='special':
  lane=[0,-1,-.7,0,.8,1,.42,0][f]
  advance=[-1,0,4,13,12,7,2,-1][f]
  lift=[1,-1,-5,-6,-4,-2,1,1][f]
 else:  # recovery must lead back to the EXACT same sword standby silhouette.
  lane=[.65,.4,.2,.1,0,0][f]
  advance=[6,4,2,0,-1,-1][f]
  lift=[0,0,1,1,1,1][f]
 hx=homeX+ux*advance+perpx*lane*6
 hy=homeY+uy*advance*.38+perpy*lane*5+lift
 # Avoid detached wrist on the far side of the torso. Elbow is a hinge,
 # not a straight laser line drawn between the shoulder and sword tip.
 hx=max(12,min(60,hx));hy=max(12,min(52,hy))
 if clip=='attack3' and f in (2,3,4):
  tipv=norm(perpx*.35-ux*.1,-1.0)
 elif clip=='attack2':
  tipv=norm(ux*(.7+advance*.03)+perpx*(lane*.85),uy*.4-perpy*.2+lift*.025)
 elif clip=='special':
  tipv=norm(ux*.8+perpx*(lane*.75),uy*.65+perpy*.28+lift*.02)
 else:
  tipv=norm(ux*.85+perpx*lane*.58,uy*.48+perpy*lane*.50+lift*.04)
 # Windups are visibly different; all hits extend in the player's facing.
 if clip=='attack1' and f in (0,1,2):tipv=norm(-ux*.55+perpx*-.6,-uy*.35+perpy*-.65)
 if clip=='attack2' and f in (0,1,2):tipv=norm(-ux*.2+perpx*.85,-uy*.2+perpy*.8)
 blade_len=19.5 if clip=='attack3' else 18.5
 tx=hx+tipv[0]*blade_len;ty=hy+tipv[1]*blade_len
 # Keep the tip inside transparent source margins, never crop at edges.
 tx=max(4,min(67,tx));ty=max(5,min(65,ty))
 return (sx,sy,hx,hy,tx,ty)

def sword_arm(row,clip,f):
 body=remove_weapon(row,base(row))
 # Stable chest and shoulders; only articulated pauldron/elbow/gauntlet/sword.
 sx,sy,hx,hy,tx,ty=combat_pose(row,clip,f)
 arm=Image.new('RGBA',(C,C));d=ImageDraw.Draw(arm)
 vx,vy=hx-sx,hy-sy
 elbow=(round(sx+vx*.52+(-1 if row in (1,2) else 1)*1.2),round(sy+vy*.55+1))
 d.line([(sx,sy),elbow],fill=P['ink'],width=5)
 d.line([(sx,sy),elbow],fill=P['steel1'],width=3)
 d.line([(sx-1,sy-1),(elbow[0]-1,elbow[1]-1)],fill=P['silver'],width=1)
 d.ellipse((elbow[0]-2,elbow[1]-2,elbow[0]+2,elbow[1]+2),fill=P['ink'])
 d.line([elbow,(round(hx),round(hy))],fill=P['ink'],width=4)
 d.line([elbow,(round(hx),round(hy))],fill=P['steel2'],width=2)
 d.ellipse((sx-2,sy-2,sx+2,sy+2),fill=P['steel0'])
 d.ellipse((sx-1,sy-1,sx+1,sy+1),fill=P['steel2'])
 d.line([(sx-2,sy-2),(sx+1,sy-2)],fill=P['gold'],width=1)
 d.ellipse((round(hx-2),round(hy-2),round(hx+2),round(hy+2)),fill=P['ink'])
 d.ellipse((round(hx-1),round(hy-1),round(hx+1),round(hy+1)),fill=P['silver'])
 vecx,vecy=norm(tx-hx,ty-hy);nx,ny=-vecy,vecx
 pos=lambda a,b:(round(hx+vecx*a+nx*b),round(hy+vecy*a+ny*b))
 d.line([pos(-2,0),pos(4,0)],fill=P['gold0'],width=3)
 d.line([pos(2,-4),pos(2,4)],fill=P['ink'],width=3)
 d.line([pos(2,-3),pos(2,3)],fill=P['gold'],width=1)
 length=math.hypot(tx-hx,ty-hy)
 d.polygon([pos(4,-2),pos(length-4,-2),pos(length,0),pos(length-4,2),pos(4,2)],fill=P['ink'])
 d.polygon([pos(5,-1),pos(length-4,-1),pos(length,0),pos(5,1)],fill=P['steel2'])
 d.line([pos(5,-1),pos(length-4,-1)],fill=P['light'],width=1)
 body.alpha_composite(arm)
 return body

def death_pose(row,i):
 face=base(row)
 if i==0:return face
 # Reuse the hip-hinge collapse sequence from 0.52, while preserving both
 # greaves at the grounded end of the scene. The torso is the only rotated
 # part of this pose; the game never rotates a whole-body canvas.
 if i<=3:
  amount=[0,.06,.15,.28][i]
  lean=[0,0,1,2][i]*(-1 if row in (1,2) else 1)
  out=Image.new('RGBA',(C,C));src=face.load();dst=out.load()
  for y in range(9,62):
   for x in range(9,65):
    pix=src[x,y]
    if pix[3]<16:continue
    weight=max(0,min(1,(59-y)/49))
    ny=round(59-(59-y)*(1-amount*.60));nx=round(x+lean*weight)
    if y>44:nx+=round(((-3 if x<36 else 3)*amount)*(y-44)/15)
    if 1<=nx<71 and 1<=ny<71 and dst[nx,ny][3]<pix[3]:dst[nx,ny]=pix
  return out
 angle=math.radians({4:18,5:37,6:60,7:78}[i]*(-1 if row in (1,2) else 1))
 co,si=math.cos(angle),math.sin(angle);cx,cy=36,43;settle={4:2,5:4,6:6,7:7}[i]
 out=Image.new('RGBA',(C,C));src=face.load();dst=out.load()
 for y in range(42,62):
  for x in range(14,65):
   pix=src[x,y]
   if pix[3]<16:continue
   d=(y-42)/19;ny=round(58-(58-y)*.73)
   nx=round(x+((-3 if x<36 else 3)*min(1,d))*(i-3)/4)
   if 1<=nx<71 and 1<=ny<71:dst[nx,ny]=pix
 for y in range(8,47):
  for x in range(9,65):
   pix=src[x,y]
   if pix[3]<16:continue
   dx,dy=x-cx,y-cy;nx=round(cx+dx*co-dy*si);ny=round(cy+dx*si+dy*co+settle)
   if 1<=nx<71 and 2<=ny<70:dst[nx,ny]=pix
 return out

def generate():
 ROOT.mkdir(parents=True,exist_ok=True)
 for clip,frames in CLIPS.items():
  sheet=Image.new('RGBA',(frames*C,8*C))
  for row in ROWS:
   for f in range(frames):
    if clip in ('idle','walk','dash','hurt'):im=render_motion(row,clip,f)
    elif clip=='death':im=death_pose(row,f)
    else:im=sword_arm(row,clip,f)
    sheet.alpha_composite(im,(f*C,row*C))
  sheet.save(ROOT/(clip+'-side.png'),optimize=True)
  print(clip,frames,ROOT/(clip+'-side.png'),(ROOT/(clip+'-side.png')).stat().st_size)
 # Contact sheet for visual review in runtime cell resolution, no cosmetics.
 samples=['idle','walk','attack1','attack2','attack3','recovery','special','dash','hurt','death']
 preview=Image.new('RGBA',(8*72,4*len(samples)*72),(22,32,41,255))
 for ci,clip in enumerate(samples):
  sheet=Image.open(ROOT/(clip+'-side.png')).convert('RGBA')
  for ri,row in enumerate(ROWS):
   for f in range(CLIPS[clip]):
    preview.alpha_composite(sheet.crop((f*72,row*72,f*72+72,row*72+72)),
       (f*72,(ci*4+ri)*72))
 preview.resize((1152,4*len(samples)*144),Image.Resampling.NEAREST).save(ROOT/'side-preview.png')

if __name__=='__main__':generate()