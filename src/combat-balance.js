// v0.13: boss encounters are paced around readable mechanics, not damage sponges.
// A single heavily buffed sword swing/ability may not bypass the boss fight.
export const BOSS_BALANCE=Object.freeze({
 normalHitFraction:.10,
 towerHitFraction:.085,
 sovereignHitFraction:.055,
 normalOpening:.16,
 towerOpening:.12,
 normalRecovery:.64,
 towerRecovery:.60
});
export function cappedBossDamage(enemy,raw){
 if(enemy?.type!=='boss')return raw;
 const variant=enemy.boss?.variant;
 const fraction=variant==='sovereign'?BOSS_BALANCE.sovereignHitFraction:
  variant==='tower'?BOSS_BALANCE.towerHitFraction:BOSS_BALANCE.normalHitFraction;
 return Math.min(raw,Math.max(1,Math.round(enemy.maxHp*fraction)));
}
export function towerWindup(floor,phase,type){
 // A minimum 0.49–0.70s reaction window remains even for the final floor.
 const base=phase===3?.60:phase===2?.65:.71;
 const progression=Math.min(.10,Math.max(0,floor-1)*.011);
 return Math.max(.49,base-progression)+(type==='meteor'||type==='eclipse'?.14:0);
}
export function towerBossRecovery(floor,phase){
 return Math.max(.40,BOSS_BALANCE.towerRecovery-.05*(phase-1)-.009*(floor-1));
}
export function normalBossWindup(phase,type){
 const slow=type==='slam'||type==='nova'?.14:0;
 return Math.max(.60,(phase===2?.62:.68)+slow);
}
export function normalBossRecovery(phase){
 return phase===2?.48:BOSS_BALANCE.normalRecovery;
}
