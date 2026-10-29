// v0.17: encounter pressure tuned from an observed sixth-floor iPhone run.
// More threats and recoverable attacks, rather than inflating every HP bar.
const safeFloor=n=>Math.max(1,Math.min(10,Math.floor(Number(n)||1)));
export function towerEncounterPlan(floor,roomType='combat',variation=0){
 const f=safeFloor(floor);
 if(roomType==='boss')return {initial:1,reinforcements:0,delay:0};
 const elite=roomType==='elite';
 const initial=Math.min(6,2+Math.floor(f/2)+(variation>.54?1:0)+(elite?1:0));
 const reinforcements=f>=4&&!elite?Math.min(3,1+Math.floor((f-2)/4)):0;
 return {initial,reinforcements,delay:Math.max(2.3,4.5-f*.18)};
}
export const towerRoomDamage=floor=>1+Math.min(.60,Math.max(0,safeFloor(floor)-1)*.07);
export const towerRoomSpeed=floor=>1+Math.min(.18,Math.max(0,safeFloor(floor)-1)*.021);
export const towerEnemyWindup=floor=>Math.max(.43,.58-(safeFloor(floor)-1)*.016);
export const towerEnemyRecovery=(floor,ranged=false)=>ranged?
 Math.max(1.14,1.75-(safeFloor(floor)-1)*.065):
 Math.max(.83,1.15-(safeFloor(floor)-1)*.035);
export const towerFirstHazard=floor=>Math.max(2.25,6.4-(safeFloor(floor)-1)*.59);
export function towerBossRequiredAttacks(floor,phase,variant='tower'){
 if(variant==='sovereign'||floor<4)return 0;
 const f=safeFloor(floor);
 if(f<=4)return phase===1?1:3;
 if(f===5)return phase===1?2:4;
 return phase===1?3:f>=8?7:6;
}
export function canProgressTowerBoss(boss){
 const s=boss?.boss;
 if(!s||s.variant==='sovereign')return true;
 return (s.executedAttacks||0)>=towerBossRequiredAttacks(s.floor,s.phase,s.variant);
}
