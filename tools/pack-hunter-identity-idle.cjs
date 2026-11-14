// Eight complete standing bodies from ONE coherent 4x2 rotation source.
// A single shared scale, native 96px cells, no body-part compositing.
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {isolate}=require('./pack-hunter-original.cjs');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../assets/heroes/hunter/identity-idle-0733');
(async()=>{
 const image=await loadImage(path.join(root,'source.png'));
 const cells=Array.from({length:8},(_,i)=>isolate(image,i%4,Math.floor(i/4),2,4));
 const heights=cells.map(c=>c.b-c.t+1).sort((a,b)=>a-b),scale=72/((heights[3]+heights[4])/2);
 const sheet=createCanvas(768,96),g=sheet.getContext('2d');g.imageSmoothingEnabled=false;
 const facings=['S','SW','W','NW','N','NE','E','SE'],frames=[];
 for(const [i,c] of cells.entries()){
  const tile=createCanvas(96,96),t=tile.getContext('2d');t.imageSmoothingEnabled=false;
  const w=Math.round((c.r-c.l+1)*scale),h=Math.round((c.b-c.t+1)*scale);
  const x=Math.round(48+(c.l-c.feetX)*scale),y=88-h;
  if(x<1||x+w>95||y<1)throw Error('clipped '+facings[i]);
  t.drawImage(c.c,c.l,c.t,c.r-c.l+1,c.b-c.t+1,x,y,w,h);
  const pixels=t.getImageData(0,0,96,96).data;let bottom=0;
  for(let y=0;y<96;y++)for(let x=0;x<96;x++)if(pixels[(y*96+x)*4+3])bottom=y;
  g.drawImage(tile,i*96,87-bottom);
  frames.push({direction:facings[i],column:i,sourceBounds:[c.l,c.t,c.r-c.l+1,c.b-c.t+1],nativeBounds:[x,y+87-bottom,w,h]});
 }
 fs.writeFileSync(path.join(root,'idle.png'),sheet.toBuffer('image/png'));
 fs.writeFileSync(path.join(root,'atlas.json'),JSON.stringify({status:'idle-only identity trial; not a released animation set',cell:96,anchor:[48,88],scale,frames},null,2)+'\n');
 console.log('Packed eight 96px whole-body standing views with one shared scale: '+scale);
})().catch(error=>{console.error(error);process.exitCode=1;});
