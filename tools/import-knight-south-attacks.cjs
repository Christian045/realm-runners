// Import 8x3 authored south attacks with a shared body/foot registration.
// Never normalize by the sword bounds: a raised blade must not shrink the body.
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const fs=require('node:fs');
(async()=>{
 const image=await loadImage(process.argv[2]),cw=Math.round(image.width/8),ch=Math.round(image.height/3);
 const file='assets/knight/production-054/source-S.png',old=await loadImage(file);
 const out=createCanvas(576,432),g=out.getContext('2d');g.drawImage(old,0,0);g.imageSmoothingEnabled=false;
 const scale=46/150;
 for(let row=0;row<3;row++)for(let col=0;col<8;col++){
  const c=createCanvas(cw,ch),ctx=c.getContext('2d');
  ctx.drawImage(image,-col*cw,-row*ch);
  const p=ctx.getImageData(0,0,cw,ch);
  for(let a=3;a<p.data.length;a+=4)p.data[a]=p.data[a]>=128?255:0;
  ctx.putImageData(p,0,0);
  const x=col*72,y=(row+2)*72;
  g.clearRect(x,y,72,72);g.save();g.beginPath();g.rect(x+2,y+2,68,68);g.clip();
  if(col===0||col===7)g.drawImage(old,0,0,72,72,x,y,72,72);
  else g.drawImage(c,x+Math.round(36-130*scale),y+Math.round(60-211*scale),Math.round(cw*scale),Math.round(ch*scale));
  g.restore();
 }
 fs.writeFileSync(file,out.toBuffer('image/png'));
})().catch(e=>{console.error(e);process.exitCode=1;});
