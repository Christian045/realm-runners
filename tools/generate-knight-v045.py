#!/usr/bin/env python3
"""Bake coherent 8-way full-body pixel sprites for Realm Runners.

Source: the original, project-owned, high-detail v044 idle/walk artwork. Unlike
v044 this never switches to a different facing while an attack plays, nor does
it carry the generated giant white swipe image. Hands, sword and boots are
baked into a complete RGBA cell; the game renderer only blits that cell.
"""
import argparse
import math
from pathlib import Path
from PIL import Image, ImageDraw

CELL=144
FOOT_Y=123
FRAMES={'idle':6,'walk':8,'attack1':8,'attack2':8,'attack3':10}
DIR_NAMES=('S','SW','W','NW','N','NE','E','SE')
# Y coordinate of shoulder/moving arm as observed in the original body art.
SHOULDER=((87,86),(82,91),(83,92),(83,93),(85,85),(87,91),(86,91),(88,90))
# Hands rest inside the illustrated cuff silhouette, not independently in air.
HAND=((90,103),(78,104),(80,104),(86,103),(87,101),(90,103),(90,105),(92,103))
COLORS={'outline':(25,27,32,255),'steel':(91,107,123,255),
        'silver':(172,184,195,255),'glint':(227,235,227,255),
        'sleeve':(50,68,92,255),'sleeveLight':(108,131,152,255),
        'gold':(191,134,63,255),'goldLight':(233,194,115,255),
        'brown':(59,43,38,255),'brownLight':(120,89,57,255)}
# Each phase is a full hand-and-body pose, not only a free-rotating blade.
# Wind-up -> contact -> follow-through. The first two combos have opposite
# arcs; third lifts overhead and comes down, without a gigantic white crescent.
ARC={
 'attack1':(-1.30,-1.48,-1.18,-.20,.65,.96,.48,-1.30),
 'attack2':(1.15,1.40,.95,.50,-.25,-.85,-1.05,1.15),
 'attack3':(-1.80,-2.03,-2.16,-2.25,-.13,.45,.84,.54,.22,-1.80)
}
# Frame-local body lunge and hand travel (world-facing vector and lateral).
BODY={
 'attack1':((0,0),(-1,-1),(-2,-1),(2,0),(3,0),(1,0),(0,0),(0,0)),
 'attack2':((0,0),(1,-1),(2,-1),(-1,0),(-3,0),(-1,0),(0,0),(0,0)),
 'attack3':((0,0),(-1,-1),(-2,-2),(-3,-2),(3,0),(2,0),(1,0),(0,0),(0,0),(0,0))
}
HAND_MOTION={
 'attack1':((-2,-1),(-5,-4),(-6,-6),(5,-1),(9,1),(5,2),(1,1),(-2,-1)),
 'attack2':((2,-1),(5,-4),(7,-5),(2,-3),(-6,-1),(-9,1),(-3,1),(2,-1)),
 'attack3':((0,-4),(-2,-8),(-3,-12),(-3,-13),(5,-1),(7,2),(4,1),(2,0),(0,0),(0,-4))
}
# At the moment the hitbox fires the sword is on a strong readable silhouette.
HIT={'attack1':3,'attack2':4,'attack3':4}


def draw_pixel_line(d,points,fill,width):
    if len(points)>1: d.line(points,fill=fill,width=width,joint='curve')


def resample_base(img,clip,row,frame):
    n=FRAMES[clip]
    if clip in ('idle','walk'):
        index=frame if clip=='walk' else frame
        src=img[clip]
    else:
        # Keep every attack direction intact by taking its own front/side/rear
        # source. Do not take the white-arc v044 attack sprites: those rotate
        # the hero into a different view midway through a northward swing.
        use_walk=frame in (2,3,4,5,6,7) and not (frame==7 and clip!='attack3')
        src=img['walk'] if use_walk else img['idle']
        index=([0,1,2,3,4,5,6,7,7,0][frame] if use_walk else frame%6)
    return src.crop((index*CELL,row*CELL,(index+1)*CELL,(row+1)*CELL))



def animate_walk_upper(sheet):
    """Bake subtle torso/helmet bob into existing genuine alternating leg art.

    The old walk rows 0/3/4/5 held the entire helmet and chest *pixel perfect*
    still while the legs churned. Upper 111px now counter-moves 1px in the
    passing poses. The shins/soles keep their original world floor anchor.
    """
    out=Image.new('RGBA',sheet.size)
    offsets=((0,0),(0,-1),(0,-1),(1,0),(0,0),(0,-1),(0,-1),(-1,0))
    for row in range(8):
        for frame,(shift_x,shift_y) in enumerate(offsets):
            tile=sheet.crop((frame*CELL,row*CELL,(frame+1)*CELL,(row+1)*CELL))
            if shift_x==0 and shift_y==0:
                new_tile=tile
            else:
                new_tile=Image.new('RGBA',(CELL,CELL))
                # The legs and boots remain fixed to the ground.
                new_tile.alpha_composite(tile.crop((0,110,CELL,CELL)),(0,110))
                new_tile.alpha_composite(tile.crop((0,0,CELL,111)),(shift_x,shift_y))
            out.alpha_composite(new_tile,(frame*CELL,row*CELL))
    return out

def pixel_bounds(img):
    return img.getchannel('A').getbbox()


def normalize_foot(base):
    # Foot positions are standardized based on the original author's common
    # sole at y=123. Avoid canvas center/bounce shifting shadows per state.
    b=pixel_bounds(base)
    if not b:return base
    current=b[3]-1
    dy=FOOT_Y-current
    dy=max(-3,min(3,dy))
    if not dy:return base
    norm=Image.new('RGBA',(CELL,CELL))
    norm.alpha_composite(base,(0,dy))
    return norm


def shade_boots(img,clip,frame,row):
    # The source walk already contains genuine eight-frame leg poses. During
    # a strike, use those existing coherent gait silhouettes and emphasize
    # a small planted foot/greave shift. NO separate boot overlay at runtime.
    if clip not in ('attack1','attack2','attack3'):
        return
    d=ImageDraw.Draw(img,'RGBA')
    # Small lunge-time weight transfer, not disconnected new legs. Sole y=123.
    lean=BODY[clip][frame][0]
    if abs(lean)>=2:
        col=COLORS
        offset=1 if lean>0 else -1
        for x in (64+offset,82-offset):
            d.rectangle((x-3,120,x+4,123),fill=col['brown'])
            d.line((x-2,120,x+3,120),fill=col['brownLight'],width=1)


def make_weapon(canvas,clip,row,frame):
    d=ImageDraw.Draw(canvas,'RGBA')
    heading=math.pi/2+row*math.pi/4
    fx,fy=math.cos(heading),math.sin(heading)
    lateral=(-fy,fx)
    phase=frame
    move=HAND_MOTION[clip][phase]
    lean=BODY[clip][phase]
    sx,sy=SHOULDER[row]
    hx0,hy0=HAND[row]
    # Hand follows the shoulder with subtle recoil and natural reach into
    # the target direction; sword hilt has EXACTLY the same origin.
    shoulder=(sx+round(lean[0]*.6),sy+lean[1])
    hand=(hx0+round(fx*move[0]+lateral[0]*move[1]+lean[0]*.6),
          hy0+round(fy*move[0]+lateral[1]*move[1]+lean[1]))
    # Keep forearm anatomically attached even for the overhead finisher.
    dx,dy=hand[0]-shoulder[0],hand[1]-shoulder[1]
    dist=math.hypot(dx,dy)
    if dist>18:
        hand=(round(shoulder[0]+dx*18/dist),round(shoulder[1]+dy*18/dist))
    elbow=(round(shoulder[0]*.54+hand[0]*.46+lateral[0]*2),
           round(shoulder[1]*.54+hand[1]*.46+lateral[1]*2-2))
    # The arm is painted behind the glove into the final sprite. A dark sleeve
    # seam and silver cuff ensure that there is no visible hand/sword gap.
    draw_pixel_line(d,[shoulder,elbow,hand],COLORS['outline'],7)
    draw_pixel_line(d,[shoulder,elbow,hand],COLORS['sleeve'],5)
    draw_pixel_line(d,[elbow,hand],COLORS['steel'],3)
    d.rectangle((shoulder[0]-3,shoulder[1]-3,shoulder[0]+3,shoulder[1]+3),fill=COLORS['outline'])
    d.rectangle((shoulder[0]-2,shoulder[1]-2,shoulder[0]+2,shoulder[1]+2),fill=COLORS['steel'])
    d.line((shoulder[0]-2,shoulder[1]-2,shoulder[0]+1,shoulder[1]-2),fill=COLORS['silver'],width=1)
    # Exact same pixel coordinate for hilt and gauntlet, asserted in tests.
    d.rectangle((hand[0]-3,hand[1]-3,hand[0]+3,hand[1]+3),fill=COLORS['outline'])
    d.rectangle((hand[0]-2,hand[1]-2,hand[0]+2,hand[1]+2),fill=COLORS['gold'])
    d.rectangle((hand[0]-1,hand[1]-1,hand[0]+1,hand[1]),fill=COLORS['steel'])
    # Sword lengths are deliberately compact (28px) to match the character's
    # 40px torso, not a 60px fake second sword/swoosh around the head.
    aim=heading+ARC[clip][frame]
    if clip=='attack3' and frame in (1,2,3):
        # Raise above the helmet in all eight directions. Keep the grip at the
        # actual hand, not at a fixed screen point beside the hero.
        aim=-math.pi/2+(row-3.5)*.10
    ux,uy=math.cos(aim),math.sin(aim)
    nx,ny=-uy,ux
    def p(distance,offset=0):
        return (round(hand[0]+ux*distance+nx*offset),
                round(hand[1]+uy*distance+ny*offset))
    # Grip + small crossguard. A crisp 2px blade, not a painted white arc.
    draw_pixel_line(d,[p(0),p(6)],COLORS['outline'],3)
    draw_pixel_line(d,[p(0),p(6)],COLORS['gold'],2)
    draw_pixel_line(d,[p(1),p(6)],COLORS['goldLight'],1)
    draw_pixel_line(d,[p(6,-3),p(6,3)],COLORS['outline'],3)
    draw_pixel_line(d,[p(6,-2),p(6,2)],COLORS['goldLight'],1)
    outline=[p(8,-2),p(23,-2),p(30,0),p(23,2),p(8,2)]
    d.polygon(outline,fill=COLORS['outline'])
    d.polygon([p(8,-1),p(23,-1),p(29,0),p(23,1),p(8,1)],fill=COLORS['steel'])
    draw_pixel_line(d,[p(9,-1),p(25,-1)],COLORS['glint'],1)
    if frame==HIT[clip]:
        tip=p(30)
        # Restrained impact glint (not an enormous detached crescent).
        d.point((tip[0]+round(nx*2),tip[1]+round(ny*2)),fill=COLORS['glint'])
    return dict(hand=list(hand),shoulder=list(shoulder),grip=list(hand),tip=list(p(30)),angle=round(aim,5))


def compose(img,clip,row,frame):
    base=normalize_foot(resample_base(img,clip,row,frame))
    meta={}
    if clip in ARC:
        shade_boots(base,clip,frame,row)
        meta=make_weapon(base,clip,row,frame)
    return base,meta


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--source',default='assets/knight/v044')
    parser.add_argument('--output',default='assets/knight/v045')
    args=parser.parse_args()
    source=Path(args.source);destination=Path(args.output);destination.mkdir(parents=True,exist_ok=True)
    img={name:Image.open(source/f'{name}.png').convert('RGBA') for name in ['idle','walk']}
    img['walk']=animate_walk_upper(img['walk'])
    frames_meta={}
    for clip,count in FRAMES.items():
        sheet=Image.new('RGBA',(count*CELL,8*CELL))
        frames_meta[clip]=[]
        for row in range(8):
            state=[]
            for frame in range(count):
                tile,metadata=compose(img,clip,row,frame)
                bbox=pixel_bounds(tile)
                if not bbox or bbox[0]==0 or bbox[1]==0 or bbox[2]>=CELL or bbox[3]>=CELL:
                    raise RuntimeError(f'Clipped/empty {clip} dir {row} frame {frame}: {bbox}')
                sheet.alpha_composite(tile,(frame*CELL,row*CELL))
                state.append(metadata)
            frames_meta[clip].append(state)
        sheet.save(destination/f'{clip}.png',optimize=True,compress_level=9)
    import json
    (destination/'poses.json').write_text(json.dumps({'version':45,'cell':CELL,'ground':FOOT_Y,'directions':DIR_NAMES,'frames':frames_meta},indent=2)+'\n')
    print('Generated:',[(p.name,p.stat().st_size) for p in destination.iterdir()])

if __name__=='__main__':main()