import {getHunterProduction,HUNTER_COUNTS,hunterPose} from '../src/hunter-production.js?v=0.73.1';
import {getMageProduction} from '../src/mage-production.js?v=0.67.1';
import {getKnightFinal} from '../src/knight-final.js?v=0.67.1';
import {heroShot} from '../src/hero-aim.js?v=0.73.1';
import {Game} from '../src/game.js?v=0.73.1';
import {defaultProgress} from '../src/progression.js?v=0.21.0';
const status=document.querySelector('#status'),hunter=getHunterProduction(),mage=getMageProduction(),knight=getKnightFinal();
const assert=(condition,message)=>{if(!condition)throw Error(message);};
const direction=row=>({x:Math.cos(Math.PI/2+row*Math.PI/4),y:Math.sin(Math.PI/2+row*Math.PI/4)});
function actor(row,clip,frame,x=80,y=110){
 const d=direction(row),p={kind:'hunter',x,y,hp:100,direction:d,moving:clip==='walk',heroMoveDirection:d,walkDistance:frame*12,heroDeathDirection:d};
 if(clip==='death'){p.hp=0;p.heroDeathElapsed=(frame+.01)/8*1.04;}
 else if(!['walk','idle'].includes(clip))p.heroAction={clip,elapsed:(frame+.01)/8,duration:1,direction:d};
 return p;
}
const time=(clip,frame)=>clip==='idle'?(frame+.01)/8*2.4:0;
try{
 await Promise.all([hunter.loading,mage.loading,knight.loading]);
 assert(hunter.ready&&mage.ready&&knight.ready,'Produktionsgrafiken fehlen');
 const probe=document.createElement('canvas');probe.width=160;probe.height=128;
 const pc=probe.getContext('2d');let frames=0,sockets=0,releases=0;
 for(const [clip,count] of Object.entries(HUNTER_COUNTS))for(let row=0;row<8;row++)for(let frame=0;frame<count;frame++){
  const p=actor(row,clip,frame),t=time(clip,frame);pc.clearRect(0,0,160,128);
  assert(hunterPose(p,t).frame===frame,'Falscher Frame '+clip+'/'+row+'/'+frame);
  assert(hunter.draw(pc,p,t),'Renderer meldet Fehler');
  const pixels=pc.getImageData(0,0,160,128).data;
  let n=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>128)n++;
  assert(n>400,'Leerer Frame '+clip+'/'+row+'/'+frame);frames++;
  if(['attack','special'].includes(clip)&&frame===3){
   const shot=heroShot(p);assert(pc.getImageData(shot.x,shot.y,1,1).data[3]===255,'Pfeilursprung außerhalb der Grafik '+clip+'/'+row);sockets++;
  }
 }
 const input={movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
 for(const clip of ['attack','special'])for(let row=0;row<8;row++){
  const g=new Game(defaultProgress(),input);g.start('hunter',42);g.player.direction=direction(row);
  if(clip==='attack')g.attack();else g.ability();
  const a=g.player.heroAction,shot=heroShot(g.player,{...a,elapsed:a.duration/2});
  g.updateHeroAction(a.duration*.499);assert(g.projectiles.length===0,'Zu früh geschossen');
  g.updateHeroAction(a.duration*.001);assert(g.projectiles.length===(clip==='attack'?1:7),'Falsche Projektilzahl');
  for(const b of g.projectiles)assert(b.x===shot.x&&b.y-b.visualHeight===shot.y,'Falscher Pfeilursprung');
  g.updateHeroAction(a.duration);assert(g.projectiles.length===(clip==='attack'?1:7),'Doppelt geschossen');releases++;
 }
 const cg=document.querySelector('#comparison').getContext('2d');cg.imageSmoothingEnabled=false;
 for(const [i,rig] of [knight,mage,hunter].entries()){
  cg.save();cg.translate(i*300,0);cg.scale(3,3);rig.draw(cg,{kind:['warrior','mage','hunter'][i],x:50,y:95,hp:100,direction:{x:0,y:1}},0);cg.restore();
 }
 const c=document.querySelector('#gallery'),ctx=c.getContext('2d');
 function gallery(){
  const clip=document.querySelector('#clip').value;ctx.clearRect(0,0,c.width,c.height);ctx.imageSmoothingEnabled=false;
  for(let row=0;row<8;row++)for(let frame=0;frame<8;frame++){
   const p=actor(row,clip,frame,frame*160+80,row*128+116);hunter.draw(ctx,p,time(clip,frame));
   ctx.fillStyle='#c8d8c2';ctx.font='12px monospace';ctx.fillText(clip+' '+row+'/'+frame,frame*160+8,row*128+16);
   if(['attack','special'].includes(clip)&&frame===3){const shot=heroShot(p);ctx.fillStyle='#71e8ee';ctx.fillRect(shot.x-1,shot.y-1,3,3);}
  }
 }
 document.querySelector('#clip').addEventListener('change',gallery);gallery();
 status.textContent=`BESTANDEN: ${frames}/448 Frames · ${sockets}/16 gezeichnete Pfeilursprünge · ${releases}/16 Schussabläufe (Zeitpunkt, Anzahl, Ursprung, keine Doppelung).\nBrowser: ${navigator.userAgent}\nVisuelle Freigabe erfolgt separat.`;
 document.documentElement.dataset.hunterQaStatus='passed';
}catch(error){status.textContent='FEHLGESCHLAGEN: '+error.stack;document.documentElement.dataset.hunterQaStatus='failed';}
