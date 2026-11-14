// The approved idle PNG is never rewritten. Each authored direction has an
// unchanged reference pose plus eight complete-body walk frames. One fixed
// source-to-game scale per direction, calibrated against that reference pose.
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {isolate}=require('./pack-hunter-original.cjs');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../assets/heroes/hunter/identity-locomotion-0734');
const facings=['S','SW','W','NW','N','NE','E','SE'];
function hoodCentre(c){
 const d=c.c.getContext('2d').getImageData(0,0,c.c.width,c.c.height).data;let sum=0,n=0;
 for(let y=c.t;y<c.t+(c.b-c.t)*.37;y++)for(let x=c.l;x<=c.r;x++){
  const k=(y*c.c.width+x)*4,r=d[k],g=d[k+1],b=d[k+2];
  if(d[k+3]&&g>r*.75&&g<r*1.15&&g>b*1.3){sum+=x;n++;}
 }
 return n?sum/n:(c.l+c.r)/2;
}
(async()=>{
 const idle=await loadImage(path.join(root,'../identity-idle-0733/idle.png'));
 const sheet=createCanvas(768,768),g=sheet.getContext('2d');g.imageSmoothingEnabled=false;
 const rows=[];
 for(let pair=0;pair<4;pair++){
  const source=await loadImage(path.join(root,'source-'+pair+'.png'));
  for(let local=0;local<2;local++){
   const row=pair*2+local,approved=isolate(idle,row,0,1,8);
   const reference=isolate(source,0,local,2,9),scale=72/(reference.b-reference.t+1);
   const targetX=hoodCentre(approved),frames=[];
   for(let frame=0;frame<8;frame++){
    const c=isolate(source,frame+1,local,2,9),w=Math.round((c.r-c.l+1)*scale),h=Math.round((c.b-c.t+1)*scale);
    const x=Math.round(targetX+(c.l-hoodCentre(c))*scale),y=88-h;
    if(x<1||x+w>95||y<1)throw Error('Clipped '+facings[row]+'/'+frame+' '+[x,y,w,h]);
    if(Math.abs(h-72)>3)throw Error('Body size changed '+facings[row]+'/'+frame+' '+h);
    const tile=createCanvas(96,96),t=tile.getContext('2d');t.imageSmoothingEnabled=false;
    t.drawImage(c.c,c.l,c.t,c.r-c.l+1,c.b-c.t+1,x,y,w,h);
    const d=t.getImageData(0,0,96,96).data;let bottom=0;
    for(let y=0;y<96;y++)for(let x=0;x<96;x++)if(d[(y*96+x)*4+3])bottom=y;
    const shift=87-bottom;g.drawImage(tile,frame*96,row*96+shift);
    frames.push({frame,sourceColumn:frame+1,bounds:[x,y+shift,w,h]});
   }
   rows.push({direction:facings[row],source:'source-'+pair+'.png',sourceRow:local,referenceHeight:reference.b-reference.t+1,scale,targetHoodX:targetX,frames});
  }
 }
 fs.writeFileSync(path.join(root,'walk.png'),sheet.toBuffer('image/png'));
 fs.writeFileSync(path.join(root,'atlas.json'),JSON.stringify({cell:96,anchor:[48,88],stride:96,approvedIdle:'../identity-idle-0733/idle.png',rows},null,2)+'\n');
 console.log('Packed 64 authored whole-body walk frames; approved idle remains untouched.');
})().catch(error=>{console.error(error);process.exitCode=1;});
