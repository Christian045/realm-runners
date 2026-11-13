import test from 'node:test';
import assert from 'node:assert/strict';
import {hunterBowPose,HUNTER_RELEASE_PROGRESS} from '../src/hunter-bow.js';
import {articulatedPose,articulatedSockets,articulatedShot} from '../src/articulated-hero.js';
import {combatChoreography,combatContact} from '../src/combat-choreography.js';

test('Jäger pulls string to the nock, fires at frame three, and recovers in idle',()=>{
 assert.equal(HUNTER_RELEASE_PROGRESS,.5);
 assert.equal(hunterBowPose('idle',.4).hasArrow,false);
 assert.equal(hunterBowPose('walk',.7).draw,0);
 const start=hunterBowPose('attack',0),wind=hunterBowPose('attack',.36),hold=hunterBowPose('attack',.499);
 assert.equal(start.stringX,20);
 assert.equal(wind.draw,1);
 assert.equal(hold.stringX,8);
 assert.equal(hold.drawHandX,hold.stringX);
 for(const clip of ['attack','special']){
  const release=hunterBowPose(clip,.5),recovery=hunterBowPose(clip,.85);
  assert.equal(release.hasArrow,false,clip+' should release its arrow on the same frame as gameplay');
  assert.equal(release.draw,0);
  assert.equal(release.stringX,release.bowHandX);
  assert.equal(release.released,true);
  assert.equal(recovery.released,false);
  assert.equal(recovery.drawHandX,10);
 }
 for(const t of [0,.1,.2,.3,.36,.42,.499,.5,.7,1]){
  const b=hunterBowPose('attack',t);
  assert.ok(b.stringX>=8&&b.stringX<=20);
  assert.ok(Math.abs(b.bowHandX-b.drawHandX)<=12);
 }
 assert.equal(hunterBowPose('special',.25).hasArrow,true);
});

test('Jäger has a real body wind-up and release, with hands and arrow on one aim line in all eight views',()=>{
 for(let n=0;n<8;n++)for(const clip of ['attack','special']){
  const a=Math.PI/2+n*Math.PI/4,direction={x:Math.cos(a),y:Math.sin(a)};
  const p={kind:'hunter',x:128,y:128,hp:100,direction,
   heroAction:{clip,elapsed:.5,duration:1,direction}};
  const pose=articulatedPose(p),s=articulatedSockets(p,pose),shot=articulatedShot(p);
  assert.equal(combatContact('hunter',clip),.5);
  assert.ok(s.motion.active,'hunter motion was never applied');
  assert.ok(Math.abs(s.motion.roll)>.03,'no bow release body weight transfer');
  assert.equal(shot.mount.x,p.x+s.hand.x);
  assert.equal(shot.mount.y,p.y+s.hand.y);
  assert.equal(shot.x,p.x+s.tip.x);
  assert.equal(shot.y,p.y+s.tip.y);
  assert.ok(Math.abs(Math.hypot(s.tip.x-s.hand.x,s.tip.y-s.hand.y)-24)<1e-9);
  assert.ok(Math.abs(Math.hypot(shot.aim.x,shot.aim.y)-1)<1e-9);
  const pre=combatChoreography('hunter',clip,.24,direction);
  const post=combatChoreography('hunter',clip,1,direction);
  assert.ok(pre.dx*direction.x+pre.dy*direction.y<-.1);
  assert.ok(Math.abs(post.roll)<1e-10);assert.ok(Math.abs(post.dx)<1e-10);assert.ok(Math.abs(post.dy)<1e-10);
 }
});
