// Authored, resolution-independent pixel sprites rendered to a tiny cached atlas.
import {TOWER_STAGES} from './tower.js?v=0.15.0';
// No CDN, raster downloads or third-party assets. Every frame is 32x36 source pixels.
export const SPRITE_SIZE=Object.freeze({width:32,height:36});
export const SPRITE_KINDS=Object.freeze(['warrior','hunter','mage','slime','mushroom','archer','goblin','slimeking','warden','wraith','sentinel','cultist','brute','assassin','scout','hexer','bulwark','sovereign',...Array.from({length:9},(_,i)=>'tower'+(i+1))]);
export const ANIMATION_STATES=Object.freeze(['idle','walk','attack','cast','dash','hurt','death']);
export function facing(direction={x:0,y:1}){
 const x=Number(direction.x)||0,y=Number(direction.y)||0;
 return Math.abs(x)>Math.abs(y)?x<0?'left':'right':y<0?'up':'down';
}
export function animationState(actor,player=false){
 if(!actor||actor.hp<=0)return 'death';
 if(actor.flash>0||actor.hurtTimer>0)return 'hurt';
 if(player&&actor.dashTimer>0)return 'dash';
 if(actor.castTimer>0||(!player&&actor.boss?.telegraph)||(!player&&actor.boss?.transition>0))return 'cast';
 if(actor.attackTimer>0||(!player&&actor.boss?.charge))return 'attack';
 if(!player&&actor.windup>0)return 'cast';
 return actor.moving?'walk':'idle';
}
export function spriteIdentity(entity,player=false){
 if(player)return SPRITE_KINDS.includes(entity?.kind)?entity.kind:'warrior';
 if(entity?.type==='boss')return entity.boss?.variant==='sovereign'?'sovereign':entity.boss?.variant==='tower'?'tower'+entity.boss.floor:entity.boss?.variant==='warden'?'warden':'slimeking';
 return SPRITE_KINDS.includes(entity?.type)?entity.type:'slime';
}
const PAL={
 warrior:{outline:'#1c2b3a',shadow:'#24435c',base:'#4787bb',light:'#93d1ff',trim:'#d9ecf6',skin:'#efd4ad',dark:'#283c52',metal:'#dce8e9',gold:'#f6d589',eye:'#152b39'},
 hunter:{outline:'#172d2c',shadow:'#2a523f',base:'#418a5c',light:'#8dd99c',trim:'#c7ddb1',skin:'#edcfa9',dark:'#263f32',metal:'#d5b879',gold:'#e7ce88',eye:'#182d26'},
 mage:{outline:'#2b2547',shadow:'#423467',base:'#805eae',light:'#c2a7fa',trim:'#e0d3fb',skin:'#f3d5bd',dark:'#403356',metal:'#f3d8aa',gold:'#bdcaff',eye:'#1c284c'},
 archer:{outline:'#292343',shadow:'#413958',base:'#68568d',light:'#b5a2df',trim:'#eee0e6',skin:'#efd3b8',dark:'#3b3250',metal:'#cfc4e2',gold:'#d9cbff',eye:'#1c2736'},
 goblin:{outline:'#2f3223',shadow:'#4f5532',base:'#8c9850',light:'#d3d68a',trim:'#b5a76e',skin:'#bec77a',dark:'#535c32',metal:'#adb2ac',gold:'#e9b765',eye:'#332e29'},
 slime:{outline:'#203f39',shadow:'#3e7664',base:'#66b685',light:'#a4ecc1',trim:'#ceffe1',skin:'#92c4ae',dark:'#3e7562',metal:'#d6f2d5',gold:'#cdf2bd',eye:'#163932'},
 mushroom:{outline:'#4f3244',shadow:'#754b5b',base:'#b87777',light:'#f4a7a1',trim:'#ffdbbb',skin:'#edcfac',dark:'#7a4e62',metal:'#e9ba98',gold:'#ffd7b2',eye:'#3b2b3c'},
 slimeking:{outline:'#4c2445',shadow:'#973e73',base:'#d45b88',light:'#ff9fb3',trim:'#ffe5d7',skin:'#ffb4c4',dark:'#812f5c',metal:'#efd7f2',gold:'#ffe28b',eye:'#351d3c'},
 warden:{outline:'#1d3044',shadow:'#314d6c',base:'#587ba2',light:'#a4bfda',trim:'#e1edf4',skin:'#9fb4c9',dark:'#29445f',metal:'#a8cbe0',gold:'#81ecf2',eye:'#092e46'},
 wraith:{outline:'#262d4b',shadow:'#495078',base:'#7585b7',light:'#bfcef7',trim:'#e9eeff',skin:'#d2d5ef',dark:'#343a61',metal:'#9fafcf',gold:'#dcf2ff',eye:'#9bf5ee'},
 sentinel:{outline:'#25333a',shadow:'#586971',base:'#8b9fa8',light:'#d0dfe1',trim:'#f4f2dc',skin:'#bbc6c8',dark:'#374651',metal:'#e1eced',gold:'#f4d18d',eye:'#4ef1de'},
 cultist:{outline:'#312443',shadow:'#533868',base:'#83659b',light:'#c4aadf',trim:'#e9def6',skin:'#d0aec6',dark:'#422e55',metal:'#a691b8',gold:'#d0a1ff',eye:'#ed9af4'},
 brute:{outline:'#4a302f',shadow:'#765044',base:'#a76d57',light:'#ecad84',trim:'#f5d7b4',skin:'#d39477',dark:'#684439',metal:'#ccab92',gold:'#f4d18d',eye:'#ffcf8b'},
 assassin:{outline:'#291f32',shadow:'#482d42',base:'#8e5068',light:'#eaa0ab',trim:'#f5b9bb',skin:'#dab1ac',dark:'#39243b',metal:'#d6b5b4',gold:'#f5dba1',eye:'#fff2d2'},
 scout:{outline:'#26302b',shadow:'#3b5544',base:'#74915f',light:'#b6d49a',trim:'#e2ecc4',skin:'#d8c3a3',dark:'#253f30',metal:'#c2c6aa',gold:'#e8d298',eye:'#f9f7ce'},
 hexer:{outline:'#27203c',shadow:'#4c316b',base:'#7c5ab2',light:'#c09be9',trim:'#e6d4fb',skin:'#c6a6c6',dark:'#3d285a',metal:'#b9b0d3',gold:'#f1beff',eye:'#ffdfef'},
 bulwark:{outline:'#253039',shadow:'#42566a',base:'#6e8ca5',light:'#b8d5e1',trim:'#ddecf2',skin:'#adbbc2',dark:'#304a60',metal:'#b5c5d5',gold:'#efca80',eye:'#a1f5ec'},
 sovereign:{outline:'#170f2b',shadow:'#412463',base:'#663c89',light:'#b88cde',trim:'#e7c8ff',skin:'#8b4bb0',dark:'#291b49',metal:'#c99ae4',gold:'#f6ce7b',eye:'#99f9fb'}
};
const towerPal=Object.fromEntries(TOWER_STAGES.slice(0,9).map((stage,i)=>[
 'tower'+(i+1),{...PAL.warden,base:stage.color,light:'#f3e5da',trim:stage.color,
  gold:i%2?'#c9f4ec':'#f9d68e',eye:'#142236'}]));
function block(ctx,color,x,y,w=1,h=1){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h))}
function stamp(ctx,pal,parts){
 for(const [shade,x,y,w,h] of parts)block(ctx,pal[shade]||shade,x,y,w,h);
}
function frameHero(ctx,p,kind,state,frame,face){
 const walking=state==='walk',leg=walking?(frame%2?2:-2):0;
 const attack=state==='attack',casting=state==='cast';
 const bob=walking?(frame%2?-1:0):state==='idle'&&frame%3===2?-1:0;
 ctx.save();ctx.translate(0,bob);
 // Boots are separated and alternate by one block while walking.
 stamp(ctx,p,[['outline',9,24+leg,6,7],['dark',10,25+leg,4,5],['outline',18,24-leg,6,7],['dark',19,25-leg,4,5]]);
 // Black outline, mantle and short cloak with depth.
 stamp(ctx,p,[['outline',8,13,17,15],['shadow',9,14,15,13],['base',10,15,13,11],['light',12,16,9,4]]);
 if(kind==='mage'){
  stamp(ctx,p,[['outline',8,20,17,10],['base',9,20,15,9],['shadow',12,20,4,9],['gold',15,18,2,10]]);
 }else if(kind==='hunter'){
  stamp(ctx,p,[['shadow',7,17,6,13],['trim',9,19,2,9],['gold',12,22,11,2]]);
 }else if(kind==='warrior'){
  stamp(ctx,p,[['metal',9,18,5,7],['dark',14,16,5,10],['gold',15,18,2,6],['metal',20,18,4,7]]);
 }
 // Neck, outlined face/helmet/hood and eye pixels.
 stamp(ctx,p,[['outline',11,4,13,13],['skin',12,6,11,9],['light',12,5,11,4],['shadow',11,5,3,9],['dark',22,5,2,10]]);
 if(kind==='mage'){
  stamp(ctx,p,[['outline',9,4,17,7],['shadow',11,2,13,10],['light',13,4,9,3],['gold',16,3,3,3]]);
 }else if(kind==='hunter'||kind==='archer'){
  stamp(ctx,p,[['outline',10,2,15,10],['base',11,3,13,6],['light',13,4,9,2]]);
 }else if(kind==='warrior'){
  stamp(ctx,p,[['metal',11,3,14,6],['light',12,4,11,2],['dark',15,3,2,10],['gold',20,5,3,2]]);
 }else{
  stamp(ctx,p,[['shadow',11,2,13,8],['light',13,4,9,3]]);
 }
 if(face!=='up'){
  const offset=face==='left'?-2:face==='right'?2:0;
  block(ctx,p.eye,14+offset,11,2,2);
  block(ctx,p.eye,20+offset,11,2,2);
  block(ctx,p.trim,15+offset,10,1,1);
 }else stamp(ctx,p,[['dark',12,8,11,5],['trim',14,7,7,2]]);
 // Hands and weapon are part of the animation frame, rather than rotating vector art.
 const armRaise=attack?-5:casting?-7:walking&&frame%2?-2:0;
 stamp(ctx,p,[['outline',6,16+armRaise,4,10],['skin',7,20+armRaise,2,4],
  ['outline',25,15+armRaise,4,10],['skin',26,19+armRaise,2,4]]);
 if(kind==='warrior'||kind==='goblin'){
  stamp(ctx,p,[['metal',27,7+armRaise,2,16],['trim',26,7+armRaise,4,4],['gold',25,20+armRaise,6,2]]);
  if(attack){stamp(ctx,p,[['trim',26,3,4,3],['light',23,4,3,2]])}
 }else if(kind==='hunter'||kind==='archer'){
  stamp(ctx,p,[['gold',27,11+armRaise,2,13],['trim',28,10+armRaise,2,3]]);
  // Bow string remains readable at a distance.
  block(ctx,p.trim,30,12+armRaise,1,10);
 }else{
  stamp(ctx,p,[['gold',27,11+armRaise,2,18],['trim',25,8+armRaise,6,4]]);
  if(casting)stamp(ctx,p,[['light',25,4,6,3],['trim',27,2,3,3]]);
 }
 // Separate silhouettes for the three playable classes during their actions.
 if(kind==='warrior'&&attack){
  const high=frame%3===0;
  stamp(ctx,p,[['metal',high?22:25,high?2:4,7,3],
   ['trim',high?18:26,high?5:9,5,2],
   ['light',high?14:24,high?7:2,4,2]]);
 }else if(kind==='hunter'&&(attack||casting)){
  // Curved bow limb, taut string and a clearly nocked arrow.
  stamp(ctx,p,[['gold',29,5,2,23],['trim',27,4,3,3],['trim',27,25,3,3],
   ['light',19,14,12,2],['metal',29,12,3,6]]);
 }else if(kind==='mage'&&(attack||casting)){
  // Two-frame spell buildup around the staff and free hand.
  const pulse=frame%2?1:0;
  stamp(ctx,p,[['trim',26-pulse,2,7+pulse,5],['light',27,2,3,2],
   ['gold',23,6+pulse,3,3],['light',3,16,5,3]]);
 }
 // Authored class silhouette accents, with different attack silhouettes.
 if(kind==='warrior'){
  stamp(ctx,p,[['outline',4,12,5,7],['metal',5,12,7,4],['light',6,12,5,2],
   ['outline',23,11,7,7],['metal',24,12,6,4],
   ['gold',17,1,4,3],['trim',15,4,8,2],['dark',14,25,6,4]]);
  if(attack)stamp(ctx,p,[['trim',24,1+(frame%2)*4,7,3],['light',26,0+(frame%2)*4,5,2]]);
 }else if(kind==='hunter'){
  stamp(ctx,p,[['outline',5,12,5,12],['shadow',6,13,4,16],
   ['light',11,3,13,3],['dark',11,5,13,2],['gold',10,16,3,4],
   ['trim',24,8,3,5]]);
  if(attack||casting)stamp(ctx,p,[['gold',28,4,2,25],
   ['trim',25,4,5,2],['trim',25,27,5,2],['light',22,15,8,2]]);
 }else if(kind==='mage'){
  stamp(ctx,p,[['outline',6,23,6,8],['shadow',8,23,5,7],
   ['outline',23,23,6,8],['base',24,24,4,6],['gold',15,3,5,3],
   ['trim',25,11,4,3],['light',27,4,4,3]]);
  if(attack||casting)stamp(ctx,p,[['gold',25,0,7,4],['light',27,1,3,2],
   ['trim',4,12,4,4],['light',5,13,2,2]]);
 }
 if(state==='hurt')stamp(ctx,p,[['trim',10,18,13,3],['light',12,20,9,2]]);
 ctx.restore();
}
function frameSlime(ctx,p,state,frame,king=false,phase=false){
 const squish=state==='walk'||state==='attack'?frame%2?2:-1:Math.sin(frame*3)*.3;
 const y=Math.round(squish);
 const bodyY=king?11:17;
 const top=bodyY+y;
 const body=[
  ['outline',6,top+9,21,14],['outline',9,top+5,16,18],['shadow',7,top+10,18,11],
  ['base',9,top+7,15,13],['light',12,top+8,11,4],['trim',13,top+8,5,2],
  ['shadow',7,top+18,5,4],['shadow',22,top+18,4,4]
 ];
 stamp(ctx,p,body);
 if(king){
  stamp(ctx,p,[['outline',8,top-1,17,7],['gold',9,top-3,3,9],['gold',15,top-6,3,12],['gold',22,top-3,3,9],
   ['trim',12,top+1,9,3]]);
  if(phase)stamp(ctx,p,[['trim',8,top+7,4,3],['trim',22,top+7,4,3]]);
 }
 stamp(ctx,p,[['eye',12,top+15,3,4],['eye',20,top+15,3,4],['trim',13,top+15,1,2],['trim',21,top+15,1,2]]);
 if(state==='hurt')stamp(ctx,p,[['trim',10,top+9,16,8]]);
}
function frameMushroom(ctx,p,state,frame){
 const bounce=state==='walk'&&frame%2?-2:0;
 stamp(ctx,p,[['outline',12,15+bounce,10,17],['skin',13,16+bounce,8,14],['shadow',12,28+bounce,10,4],
  ['outline',5,9+bounce,24,9],['shadow',6,8+bounce,22,8],['base',8,5+bounce,18,9],
  ['light',11,7+bounce,12,3],['trim',10,9+bounce,4,3],['trim',20,6+bounce,3,3],
  ['eye',14,22+bounce,2,3],['eye',20,22+bounce,2,3],
  ['trim',11,13+bounce,3,3]]);
 if(state==='attack'||state==='cast')stamp(ctx,p,[['trim',3,14,4,4],['light',26,12,5,4]]);
}
function frameWarden(ctx,p,state,frame,phase){
 const walk=state==='walk'&&frame%2?2:0,raised=state==='attack'||state==='cast'?-3:0;
 stamp(ctx,p,[['outline',5,25+walk,9,8],['dark',7,26+walk,6,6],['outline',19,25-walk,9,8],['dark',21,26-walk,6,6]]);
 stamp(ctx,p,[['outline',6,12,22,19],['shadow',7,14,20,15],['base',9,15,16,13],['light',11,16,12,4],
  ['dark',14,18,5,12],['gold',15,20,3,5]]);
 stamp(ctx,p,[['outline',3,13+raised,7,14],['metal',4,14+raised,5,9],
  ['outline',25,13+raised,6,14],['metal',26,14+raised,4,9]]);
 stamp(ctx,p,[['outline',10,1,15,15],['metal',12,3,12,10],['light',14,3,8,5],
  ['dark',11,10,14,5],['gold',13,12,3,2],['gold',20,12,3,2],
  ['gold',16,0,3,5],['trim',16,18,2,4]]);
 if(phase)stamp(ctx,p,[['gold',5,7,3,7],['gold',26,7,3,7],['trim',13,4,8,2]]);
}
function frameTowerMob(ctx,p,kind,state,frame){
 const bob=state==='walk'&&frame%2?-2:0;
 if(kind==='wraith'){
  stamp(ctx,p,[['outline',10,4+bob,14,9],['base',9,6+bob,16,12],
    ['light',12,8+bob,8,3],['shadow',6,17+bob,22,12],
    ['base',8,15+bob,17,13],['light',9,18+bob,5,9],
    ['base',10,28+bob,4,6],['shadow',16,27+bob,5,5],['base',23,27+bob,3,6],
    ['eye',12,13+bob,4,3],['eye',20,13+bob,4,3]]);
 }else if(kind==='sentinel'){
  stamp(ctx,p,[['outline',9,4+bob,17,25],['shadow',10,6+bob,15,21],
    ['metal',12,5+bob,12,9],['dark',12,12+bob,12,6],
    ['eye',14,13+bob,3,2],['eye',20,13+bob,3,2],
    ['base',12,19+bob,13,11],['gold',18,21+bob,2,8],
    ['outline',4,15+bob,9,15],['metal',5,16+bob,7,12],
    ['trim',7,18+bob,3,6],['outline',25,11+bob,4,18],
    ['metal',26,7+bob,2,19],['gold',25,8+bob,4,3]]);
 }else if(kind==='cultist'){
  stamp(ctx,p,[['outline',9,3+bob,17,28],['shadow',10,5+bob,15,23],
    ['base',11,6+bob,13,21],['light',13,7+bob,10,3],
    ['dark',11,10+bob,14,10],['eye',13,13+bob,3,3],['eye',21,13+bob,3,3],
    ['base',8,21+bob,19,11],['shadow',11,22+bob,5,9],
    ['gold',27,8+bob,2,23],['trim',25,5+bob,6,6]]);
 }else{
  stamp(ctx,p,[['outline',6,3+bob,23,26],['base',8,5+bob,19,22],
    ['light',10,7+bob,14,5],['shadow',8,15+bob,20,15],
    ['outline',2,13+bob,8,15],['base',3,14+bob,7,12],
    ['outline',26,13+bob,6,15],['base',27,14+bob,5,12],
    ['dark',12,14+bob,12,6],['eye',13,13+bob,3,3],['eye',21,13+bob,3,3],
    ['gold',15,20+bob,3,3],['outline',8,29+bob,7,4],['outline',20,29+bob,7,4]]);
 }
}
// Four dedicated enemy silhouettes; not palette-swapped humanoids.
function frameEncounterMob(ctx,p,kind,state,frame){
 const walking=state==='walk',active=state==='attack'||state==='cast';
 const bob=walking?(frame%2?-2:1):0,raise=active?-4:0;
 if(kind==='assassin'){
  // Narrow split cloak, forward daggers, sharp hood and light step.
  stamp(ctx,p,[['outline',10,26+bob,5,6],['outline',21,27-bob,5,6],
   ['shadow',9,14+bob,15,17],['base',12,14+bob,11,17],
   ['dark',7,24+bob,5,8],['dark',24,23+bob,5,9],
   ['outline',10,3+bob,15,16],['shadow',11,5+bob,13,11],
   ['light',12,6+bob,9,3],['dark',12,12+bob,12,5],
   ['eye',14,12+bob,3,2],['eye',21,12+bob,3,2],
   ['outline',4,15+raise,6,10],['metal',3,12+raise,4,14],
   ['light',4,12+raise,2,5],['outline',26,13+raise,4,12],
   ['metal',27,10+raise,3,17],['gold',29,10+raise,2,3]]);
  if(active)stamp(ctx,p,[['trim',2,5,4,9],['light',1,3,3,6],['metal',26,2,4,11]]);
 }else if(kind==='scout'){
  // Tall shoulder quiver, light leather hood and a distinct long bow.
  stamp(ctx,p,[['outline',10,26+bob,7,6],['dark',12,27+bob,5,5],
   ['outline',21,26-bob,7,6],['dark',23,27-bob,5,5],
   ['outline',8,12+bob,19,16],['shadow',9,14+bob,16,14],
   ['base',12,15+bob,12,10],['light',14,16+bob,8,4],
   ['outline',9,3+bob,16,13],['dark',10,4+bob,14,9],
   ['trim',11,5+bob,11,3],['eye',13,12+bob,4,2],
   ['outline',4,9+bob,6,16],['gold',5,9+bob,4,14],
   ['metal',6,10+bob,2,9],['outline',27,4+raise,4,25],
   ['gold',27,5+raise,3,24],['trim',25,5+raise,5,3],
   ['trim',25,26+raise,5,3],['light',21,16+raise,10,2]]);
  if(active)stamp(ctx,p,[['gold',20,16,12,2],['metal',26,14,6,4]]);
 }else if(kind==='hexer'){
  // Asymmetric ritual coat, crown, levitating book and branching staff.
  stamp(ctx,p,[['outline',8,25+bob,20,8],['dark',9,27+bob,18,5],
   ['outline',6,12+bob,23,18],['shadow',8,13+bob,19,16],
   ['base',12,16+bob,12,13],['light',13,17+bob,9,4],
   ['outline',10,4+bob,16,14],['dark',12,6+bob,12,10],
   ['trim',12,4+bob,3,5],['trim',20,3+bob,4,6],
   ['gold',16,2+bob,4,4],['eye',13,13+bob,3,2],
   ['eye',22,13+bob,3,2],['outline',25,8+raise,6,23],
   ['gold',28,7+raise,2,21],['light',25,4+raise,6,6],
   ['outline',2,15+raise,7,10],['trim',3,16+raise,7,7],
   ['light',4,17+raise,4,3]]);
  if(active)stamp(ctx,p,[['gold',0,11,5,4],['light',1,9,3,3],['trim',26,1,5,4]]);
 }else if(kind==='bulwark'){
  // Massive kite shield spans the entire left side; plated torso and helm.
  stamp(ctx,p,[['outline',8,26+bob,8,7],['metal',9,27+bob,6,5],
   ['outline',21,26-bob,9,7],['metal',22,27-bob,7,5],
   ['outline',7,11+bob,23,18],['shadow',9,13+bob,19,16],
   ['base',11,14+bob,16,13],['light',12,15+bob,13,5],
   ['gold',15,20+bob,4,8],['outline',11,2+bob,17,14],
   ['metal',12,3+bob,15,11],['light',14,4+bob,10,3],
   ['dark',11,12+bob,17,4],['eye',16,12+bob,3,2],
   ['outline',0,9+raise,12,22],['shadow',2,10+raise,10,20],
   ['metal',3,11+raise,8,17],['light',4,12+raise,6,3],
   ['gold',6,15+raise,2,9],['outline',27,11+raise,4,21],
   ['metal',28,8+raise,3,19],['gold',27,6+raise,4,3]]);
  if(active)stamp(ctx,p,[['trim',2,10,9,2],['light',4,10,5,2],['gold',28,3,4,4]]);
 }
 if(state==='hurt')stamp(ctx,p,[['trim',13,18,9,3]]);
}
function bossIdentity(ctx,p,stage,phase){
 // Each tower ruler receives its own recognizable headgear and backdrop.
 const motifs=[
  [['gold',4,0,5,12],['light',5,0,3,7],['gold',27,0,4,13]],
  [['metal',2,5,7,4],['light',1,2,5,4],['metal',25,5,6,4],['light',27,2,4,4]],
  [['metal',7,0,19,4],['gold',13,0,7,5],['outline',2,12,5,14]],
  [['trim',4,5,7,5],['light',2,7,5,5],['trim',23,5,7,5],['light',27,7,5,5]],
  [['light',1,10,7,3],['light',25,10,7,3],['gold',12,0,10,4]],
  [['gold',5,2,6,6],['gold',21,2,6,6],['metal',10,0,14,3]],
  [['trim',12,0,9,3],['light',3,2,6,7],['light',25,2,6,7]],
  [['metal',4,1,6,12],['trim',1,4,4,7],['metal',23,1,6,12]],
  [['gold',4,0,9,5],['gold',20,0,8,5],['light',14,0,6,7]]
 ];
 stamp(ctx,p,motifs[(stage-1)%motifs.length]);
 if(phase)stamp(ctx,p,[['trim',9,4,4,4],['gold',22,4,4,4]]);
}
export function drawSpritePixels(ctx,kind,state='idle',frame=0,dir='down',phase=false){
 const p=PAL[kind]||towerPal[kind]||PAL.warrior;
 ctx.imageSmoothingEnabled=false;
 if(dir==='left'){ctx.save();ctx.translate(SPRITE_SIZE.width,0);ctx.scale(-1,1)}
 const facingRight=dir==='left'?'right':dir;
 if(kind==='slime'||kind==='slimeking')frameSlime(ctx,p,state,frame,kind==='slimeking',phase);
 else if(kind==='mushroom')frameMushroom(ctx,p,state,frame);
 else if(kind==='warden'||kind==='sovereign'||kind.startsWith('tower')) {
  frameWarden(ctx,p,state,frame,phase);
  if(kind==='sovereign'){
   stamp(ctx,p,[['gold',5,4,5,10],['gold',22,4,5,10],['trim',10,0,15,4],
     ['eye',15,9,5,4],['eye',21,9,3,3],['dark',13,16,13,8]]);
  }else if(kind.startsWith('tower')){
   const stage=Number(kind.slice(5));
   bossIdentity(ctx,p,stage,phase);
   if(stage%3===0)stamp(ctx,p,[['gold',3,4,5,10],['gold',25,4,5,10]]);
   if(stage%3===1)stamp(ctx,p,[['metal',7,1,7,8],['metal',20,1,7,8]]);
   if(stage%3===2)stamp(ctx,p,[['trim',14,0,6,7],['dark',12,14,15,5]]);
  }
 }
 else if(['wraith','sentinel','cultist','brute'].includes(kind))frameTowerMob(ctx,p,kind,state,frame);
 else if(['assassin','scout','hexer','bulwark'].includes(kind))frameEncounterMob(ctx,p,kind,state,frame);
 else frameHero(ctx,p,kind,state,frame,facingRight);
 if(dir==='left')ctx.restore();
 if(state==='hurt'){
  ctx.save();ctx.globalCompositeOperation='source-atop';ctx.globalAlpha=.55;
  block(ctx,'#ffffff',0,0,SPRITE_SIZE.width,SPRITE_SIZE.height);ctx.restore();
 }
 if(state==='dash'){
  ctx.save();ctx.globalAlpha=.4;block(ctx,p.trim,4,22,4,3);block(ctx,p.light,0,17,3,2);ctx.restore();
 }else if(state==='death'){
  ctx.save();ctx.globalAlpha=.5;block(ctx,p.outline,6,24,21,7);ctx.restore();
 }
}
export class PixelSpriteAtlas{
 constructor(canvasFactory=()=>document.createElement('canvas')){this.canvasFactory=canvasFactory;this.cache=new Map()}
 frame(kind,state='idle',step=0,dir='down',phase=false){
  if(!SPRITE_KINDS.includes(kind))kind='slime';
  if(!ANIMATION_STATES.includes(state))state='idle';
  step=Math.abs(Math.floor(step))%4;
  const key=[kind,state,step,dir,phase?'2':'1'].join(':');
  if(this.cache.has(key))return this.cache.get(key);
  const canvas=this.canvasFactory();canvas.width=SPRITE_SIZE.width;canvas.height=SPRITE_SIZE.height;
  const ctx=canvas.getContext('2d');if(!ctx)return null;
  drawSpritePixels(ctx,kind,state,step,dir,phase);
  this.cache.set(key,canvas);return canvas;
 }
 draw(ctx,actor,kind,time,player=false){
  const state=animationState(actor,player);
  const dir=facing(player?actor.direction:
   {x:actor.moveX??0,y:actor.moveY??1});
  const step=state==='walk'?Math.floor(time*9):
   state==='idle'?Math.floor(time*2.6):
   state==='hurt'?0:Math.floor(time*13);
  const sprite=this.frame(kind,state,step,dir,actor.boss?.phase===2);
  if(!sprite)return false;
  const scale=kind==='sovereign'?3.85:kind==='slimeking'||kind==='warden'||kind.startsWith('tower')?3.1:actor.elite?1.85:1.62;
  const w=SPRITE_SIZE.width*scale,h=SPRITE_SIZE.height*scale;
  ctx.save();ctx.imageSmoothingEnabled=false;
  if(state==='hurt')ctx.globalAlpha=.78;
  if(state==='death')ctx.globalAlpha=.5;
  ctx.drawImage(sprite,Math.round(actor.x-w/2),Math.round(actor.y-h*.76),Math.round(w),Math.round(h));
  ctx.restore();return true;
 }
}
