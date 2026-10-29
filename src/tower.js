// Self-contained ten-stage story gauntlet. Stage order is intentional:
// different encounter pools, boss names, signatures and environmental palettes.
export const TOWER_LENGTH=10;
export const TOWER_STAGES=Object.freeze([
 {floor:1,name:'Der überwucherte Eingang',biome:'fungal',boss:'MOOSWÄCHTER',roster:['slime','mushroom','goblin'],signature:['fan','mark','ring'],color:'#a4df99'},
 {floor:2,name:'Die gefluteten Katakomben',biome:'flooded',boss:'ABGRUND-SIRENE',roster:['archer','slime','wraith'],signature:['lances','fan','ring'],color:'#86cde8'},
 {floor:3,name:'Die eisernen Barrikaden',biome:'crypt',boss:'EISENKOLOSS',roster:['sentinel','goblin','brute'],signature:['dash','cross','mark'],color:'#f1c37b'},
 {floor:4,name:'Die Pilzsporen-Gruft',biome:'fungal',boss:'SPORENHEXER',roster:['mushroom','cultist','wraith'],signature:['summon','fan','meteor'],color:'#b89ae9'},
 {floor:5,name:'Der Thron der Tiefe',biome:'flooded',boss:'KÖNIG DER FLUT',roster:['archer','wraith','sentinel'],signature:['ring','lances','dash'],color:'#7ce3dd'},
 {floor:6,name:'Die blutrote Festung',biome:'crypt',boss:'SCHARLACH-RITTER',roster:['brute','sentinel','goblin'],signature:['cross','dash','meteor'],color:'#ff9b9f'},
 {floor:7,name:'Der zerbrochene Zirkel',biome:'fungal',boss:'ASTRALMAGIER',roster:['cultist','archer','wraith'],signature:['orbit','mark','summon'],color:'#c5a8ff'},
 {floor:8,name:'Die verfluchten Hallen',biome:'crypt',boss:'SEELENFRESSER',roster:['wraith','cultist','brute'],signature:['meteor','orbit','lances'],color:'#b2d0ff'},
 {floor:9,name:'Vor der letzten Pforte',biome:'flooded',boss:'DÄMMERUNGS-HÜTER',roster:['sentinel','brute','cultist'],signature:['cross','ring','summon','dash'],color:'#f6bc7a'},
 {floor:10,name:'Das Herz der Finsternis',biome:'crypt',boss:'DER EWIGE HERRSCHER',roster:['wraith','sentinel','cultist','brute'],signature:['eclipse','meteor','orbit','cross','summon'],color:'#e6a4ff'}
]);
export function towerStage(floor){return TOWER_STAGES[Math.max(0,Math.min(TOWER_LENGTH-1,Math.floor(floor)-1))]}
export function towerFloorSeed(seed,floor){return (seed^Math.imul(floor,0x9e3779b9))>>>0}
export function towerDifficulty(floor){return 1+Math.max(0,floor-1)*.13}
export function towerWinReward(floor){return 120+floor*38}
export function towerTransitionOptions(){return Object.freeze([
 {id:'recover',name:'AUSRUHEN',description:'45 % deiner maximalen LP wiederherstellen'},
 {id:'relic',name:'RELIKT',description:'Seltene Ausrüstung für die nächste Etage'},
 {id:'power',name:'KRAFT',description:'+9 % Schaden für den restlichen Turmlauf'}
])}
