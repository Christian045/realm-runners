// v0.18 – authored escalation for every floor (not only the sixth).
// Each row is a deliberate combat identity, tuned around readable telegraphs.
// Early floors teach mechanics; deeper floors mix roles and sustain pressure.
export const TOWER_FLOOR_CURVE=Object.freeze([
 {floor:1,lead:'mushroom',tier:'Einstieg',initial:2,bonusChance:.35,waves:0,delay:0,damage:1.00,speed:1.00,windup:.61,meleeRecovery:1.24,rangedRecovery:1.86,firstHazard:9.0,hazardInterval:10.0,bossFirst:0,bossTotal:0},
 {floor:2,lead:'scout',tier:'Aufwärmen',initial:3,bonusChance:.22,waves:0,delay:0,damage:1.07,speed:1.02,windup:.59,meleeRecovery:1.18,rangedRecovery:1.77,firstHazard:7.8,hazardInterval:9.0,bossFirst:1,bossTotal:2},
 {floor:3,lead:'sentinel',tier:'Bewährungsprobe',initial:3,bonusChance:.60,waves:1,delay:3.6,damage:1.14,speed:1.05,windup:.57,meleeRecovery:1.12,rangedRecovery:1.68,firstHazard:6.6,hazardInterval:8.2,bossFirst:2,bossTotal:3},
 {floor:4,lead:'hexer',tier:'Bedrohlich',initial:4,bonusChance:.45,waves:1,delay:3.4,damage:1.22,speed:1.08,windup:.55,meleeRecovery:1.07,rangedRecovery:1.60,firstHazard:5.6,hazardInterval:7.5,bossFirst:2,bossTotal:4},
 {floor:5,lead:'archer',tier:'Gefährlich',initial:4,bonusChance:.60,waves:2,delay:3.3,damage:1.30,speed:1.10,windup:.52,meleeRecovery:1.02,rangedRecovery:1.51,firstHazard:4.5,hazardInterval:6.9,bossFirst:3,bossTotal:5},
 {floor:6,lead:'bulwark',tier:'Festungsangriff',initial:5,bonusChance:.55,waves:2,delay:3.2,damage:1.38,speed:1.13,windup:.50,meleeRecovery:.98,rangedRecovery:1.43,firstHazard:3.4,hazardInterval:6.3,bossFirst:3,bossTotal:6},
 {floor:7,lead:'cultist',tier:'Eskalation',initial:5,bonusChance:.72,waves:3,delay:3.0,damage:1.46,speed:1.15,windup:.49,meleeRecovery:.94,rangedRecovery:1.36,firstHazard:3.0,hazardInterval:5.8,bossFirst:4,bossTotal:7},
 {floor:8,lead:'assassin',tier:'Höllisch',initial:6,bonusChance:.55,waves:3,delay:2.8,damage:1.53,speed:1.17,windup:.47,meleeRecovery:.90,rangedRecovery:1.29,firstHazard:2.7,hazardInterval:5.3,bossFirst:4,bossTotal:8},
 {floor:9,lead:'sentinel',tier:'Letzte Prüfung',initial:6,bonusChance:.70,waves:4,delay:2.6,damage:1.60,speed:1.19,windup:.45,meleeRecovery:.87,rangedRecovery:1.23,firstHazard:2.45,hazardInterval:4.9,bossFirst:5,bossTotal:9},
 {floor:10,lead:'assassin',tier:'Finale',initial:7,bonusChance:0,waves:4,delay:2.5,damage:1.67,speed:1.21,windup:.44,meleeRecovery:.84,rangedRecovery:1.17,firstHazard:2.3,hazardInterval:4.6,bossFirst:0,bossTotal:0}
].map(x=>Object.freeze(x)));
const safeFloor=n=>Math.max(1,Math.min(10,Math.floor(Number(n)||1)));
export const towerFloorProfile=floor=>TOWER_FLOOR_CURVE[safeFloor(floor)-1];
export function towerEncounterPlan(floor,roomType='combat',variation=0){
 const f=towerFloorProfile(floor);
 if(roomType==='boss')return {initial:1,reinforcements:0,delay:0};
 const elite=roomType==='elite';
 const extra=variation<f.bonusChance?1:0;
 return {
  initial:Math.min(7,f.initial+extra+(elite?1:0)),
  reinforcements:elite?(f.floor>=7?1:0):f.waves,
  delay:f.delay
 };
}
export const towerRoomDamage=floor=>towerFloorProfile(floor).damage;
export const towerRoomSpeed=floor=>towerFloorProfile(floor).speed;
export const towerEnemyWindup=floor=>towerFloorProfile(floor).windup;
export const towerEnemyRecovery=(floor,ranged=false)=>{
 const p=towerFloorProfile(floor);
 return ranged?p.rangedRecovery:p.meleeRecovery;
};
export const towerFirstHazard=floor=>towerFloorProfile(floor).firstHazard;
export const towerHazardInterval=floor=>towerFloorProfile(floor).hazardInterval;
export function towerBossRequiredAttacks(floor,phase,variant='tower'){
 if(variant==='sovereign')return 0; // already has a mandatory third phase
 const profile=towerFloorProfile(floor);
 return phase===1?profile.bossFirst:profile.bossTotal;
}
export function canProgressTowerBoss(boss){
 const state=boss?.boss;
 if(!state||state.variant==='sovereign')return true;
 return (state.executedAttacks||0)>=towerBossRequiredAttacks(state.floor,state.phase,state.variant);
}
export function towerDifficultySummary(floor){
 const p=towerFloorProfile(floor);
 const max=Math.min(7,p.initial+(p.bonusChance>0?1:0));
 return p.tier.toUpperCase()+' · '+p.initial+(max>p.initial?'–'+max:'')+
  ' FEINDE'+(p.waves?' + '+p.waves+' VERSTÄRKUNG'+(p.waves>1?'EN':''):'');
}
