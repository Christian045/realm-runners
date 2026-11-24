import test from 'node:test';
import assert from 'node:assert/strict';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {GlassRifleman,rifleShot} from '../src/glass-rifleman.js';
import {beginHeroAction,advanceHeroAction} from '../src/hero-animation.js';

async function paintedRifleman() {
 const model = new GlassRifleman();
 const base = new URL('../assets/heroes/glasscannon/rifleman/', import.meta.url);
 [model.image, model.focus] = await Promise.all(['body-carbine.png', 'amethyst-focus.png']
  .map(file => loadImage(new URL(file, base).pathname)));
 model.ready = true;
 return model;
}

const directions=Array.from({length:8},(_,i)=>({x:Math.sin(i*Math.PI/4),y:Math.cos(i*Math.PI/4)}));
test('carbine release lies on target ray in eight directions, including recoil and dash',()=>{
 for(const d of directions)for(const clip of ['attack','dash','special'])for(const elapsed of [0,.25,.5,.7,1]){
  const p={x:100,y:200,direction:d};
  const target={x:p.x+d.x*300,y:p.y+d.y*300};
  const s=rifleShot(p,{clip,direction:d,duration:1,elapsed,target});
  assert.ok(Number.isFinite(s.x+s.y));
  assert.ok(Math.abs((target.x-s.x)*s.aim.y-(target.y-s.y)*s.aim.x)<1e-8);
  assert.ok(Math.abs(Math.hypot(s.x-s.mount.x,s.y-s.mount.y)-s.reach)<1e-8);
 }
});
test('low frame rate fires once at the pre-recoil muzzle',()=>{
 const p={x:0,y:0,direction:{x:1,y:0}};let calls=0;
 beginHeroAction(p,'attack',.4);
 advanceHeroAction(p,.4,a=>{calls++;assert.ok(Math.abs(a.elapsed-.2)<1e-12);assert.ok(Math.abs(rifleShot(p,a).reach-37)<1e-12);});
 assert.equal(calls,1);assert.equal(p.heroAction,null);
});
test('painted carbine renders 280 action samples with opposite movement and aiming',async()=>{
 const model = await paintedRifleman();
 assert.equal(model.image.width,1440);assert.equal(model.image.height,288);
 const sheet=createCanvas(8*150,7*150),g=sheet.getContext('2d');g.fillStyle='#273a37';g.fillRect(0,0,sheet.width,sheet.height);
 for(const [row,clip] of ['idle','walk','attack','special','dash','hurt','death'].entries())for(const [col,d] of directions.entries())for(const elapsed of [0,.25,.5,.75,1]){
  const c=createCanvas(150,150),ctx=c.getContext('2d');
  const p={x:75,y:112,hp:clip==='death'?0:1,direction:d,moving:clip==='walk'||clip==='attack',heroMoveDirection:{x:-d.x,y:-d.y},walkDistance:elapsed*32,heroDeathElapsed:elapsed*1.04,heroDeathDirection:d};
  if(!['idle','walk','death'].includes(clip))p.heroAction={clip,direction:d,duration:1,elapsed};
  assert.equal(model.draw(ctx,p,elapsed),true);
  const pixels=ctx.getImageData(0,0,150,150).data;assert.ok(pixels.some((x,i)=>i%4===3&&x>150));
  if(elapsed===.5){g.drawImage(c,col*150,row*150);g.fillStyle='#eee';g.font='12px sans-serif';g.fillText(clip+' '+col,col*150+8,row*150+143);}
 }
 if(process.env.CARBINE_GALLERY){const {writeFileSync}=await import('node:fs');writeFileSync(process.env.CARBINE_GALLERY,sheet.toBuffer('image/png'));}
});

test('cursor movement within each hunter-facing sector keeps the carbine and hands in one pose', async () => {
 const model = await paintedRifleman();
 const canvas = createCanvas(128, 128);
 const ctx = canvas.getContext('2d');
 for (let sector = 0; sector < 8; sector++) {
  for (const clip of ['idle', 'walk', 'attack', 'special']) {
   let baseline;
   for (const offset of [-.31, -.01, .01, .31]) {
    const angle = sector * Math.PI / 4 + offset;
    const direction = {x: Math.sin(angle), y: Math.cos(angle)};
    const player = {x: 64, y: 96, hp: 1, direction, moving: clip === 'walk' || clip === 'attack',
     touchAiming: true, heroMoveDirection: {x: -1, y: 0}, walkDistance: 16};
    if (clip === 'attack' || clip === 'special') {
     player.heroAction = {clip, elapsed: .5, duration: 1, direction,
      target: {x: player.x + direction.x * 160, y: player.y + direction.y * 160}};
    }
    ctx.clearRect(0, 0, 128, 128);
    model.draw(ctx, player, .25);
    const pixels = Buffer.from(ctx.getImageData(0, 0, 128, 128).data);
    const shot = rifleShot(player);
    if (baseline) {
     assert.ok(baseline.pixels.equals(pixels), clip + ' pixels changed in sector ' + sector);
     assert.deepEqual([shot.x, shot.y, shot.angle], baseline.muzzle);
    } else baseline = {pixels, muzzle: [shot.x, shot.y, shot.angle]};
   }
  }
 }
});
