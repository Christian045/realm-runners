export const CLASSES = Object.freeze({
  warrior: { name: 'Krieger', subtitle: 'Nahkampf · widerstandsfähig', hp: 100, speed: 210, damage: 24, cooldown: .32, range: 76, color: '#83c8ff', ability: 'Wirbelsturm' },
  hunter: { name: 'Jäger', subtitle: 'Fernkampf · schnell', hp: 100, speed: 245, damage: 15, cooldown: .24, range: 510, color: '#a8e18f', ability: 'Pfeilhagel' },
  mage: { name: 'Magier', subtitle: 'Magie · Flächenschaden', hp: 100, speed: 225, damage: 22, cooldown: .48, range: 490, color: '#c4a1ff', ability: 'Arkanschlag' },
  glasscannon:{name:'Glaskanonier',subtitle:'Kristallgewehr · hoher Schaden, zerbrechlich',hp:100,speed:218,damage:35,cooldown:.46,range:550,color:'#e4b4fc',ability:'Kristallnova'},
  summoner:{name:'Beschwörer',subtitle:'Diener · geringer Eigenschaden',hp:100,speed:213,damage:8,cooldown:.64,range:390,color:'#a7decd',ability:'Riesenruf'},
  alchemist:{name:'Alchemist',subtitle:'Tränke · Flächen- und Statuseffekte',hp:100,speed:222,damage:18,cooldown:.63,range:410,color:'#bce78e',ability:'Große Mixtur'}
});
export const UPGRADES = Object.freeze([
  { id:'power', name:'Geschärfte Klinge', description:'+12% Angriffsschaden (ab Stufe 4: +5%)', rarity:'common' },
  { id:'fury', name:'Rasender Angriff', description:'+8% Angriffsgeschwindigkeit (begrenzt)', rarity:'common' },
  { id:'stride', name:'Windschritt', description:'+12% Bewegungstempo', rarity:'common' },
  { id:'heart', name:'Lebenskraft', description:'+30 maximale LP, heilt 35 LP', rarity:'common' },
  { id:'guard', name:'Eisernes Herz', description:'10% weniger eingehender Schaden', rarity:'rare' },
  { id:'reach', name:'Langer Arm', description:'+20% Angriffsreichweite', rarity:'common' },
  { id:'leech', name:'Vampirzahn', description:'6% verursachten Schaden als Heilung', rarity:'rare' },
  { id:'crit', name:'Jägerglück', description:'+12% Krit-Chance', rarity:'rare' },
  { id:'bolt', name:'Blitzsplitter', description:'Jeder vierte Treffer verursacht zusätzlichen Schaden', rarity:'rare' }
]);
export const ENEMY_DATA = Object.freeze({
  slime: { hp:46, speed:86, damage:10, radius:17, color:'#8cd78d', reward:8 },
  mushroom: { hp:69, speed:58, damage:14, radius:19, color:'#ffac8c', reward:12 },
  archer: { hp:52, speed:94, damage:12, radius:16, color:'#e0b6ff', reward:14 },
  goblin: { hp:84, speed:112, damage:15, radius:18, color:'#e9d180', reward:17 },
  boss: { hp:730, speed:93, damage:23, radius:38, color:'#f97e99', reward:140 },
  wraith: { hp:62, speed:143, damage:12, radius:15, color:'#9caeed', reward:17 },
  sentinel: { hp:115, speed:75, damage:17, radius:20, color:'#aebdc4', reward:20 },
  cultist: { hp:66, speed:87, damage:15, radius:17, color:'#b69ae4', reward:19 },
  brute: { hp:151, speed:66, damage:22, radius:22, color:'#db9476', reward:23 },
  assassin: {hp:74,speed:158,damage:16,radius:15,color:'#ed98ad',reward:20},
  scout: {hp:70,speed:118,damage:14,radius:16,color:'#b4dc9c',reward:20},
  hexer: {hp:83,speed:79,damage:18,radius:18,color:'#cda5ed',reward:23},
  bulwark: {hp:145,speed:67,damage:20,radius:23,color:'#aabfce',reward:25},
  burrower:{hp:96,speed:90,damage:18,radius:18,color:'#c6a46e',reward:24},
  chanter:{hp:78,speed:74,damage:13,radius:17,color:'#8ecbb3',reward:26}
});
export const TILE = 48;
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
export function normalized(x,y){const length=Math.hypot(x,y)||1;return {x:x/length,y:y/length}}
export function chooseUpgrades(random, count=3){
  const pool=[...UPGRADES];
  for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()* (i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}
  return pool.slice(0,count);
}
