// Pack the approved generated turnaround without repainting or changing its alpha.
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const fs=require('node:fs');
(async()=>{
 const im=await loadImage(process.argv[2]);
 const out=createCanvas(1440,288),g=out.getContext('2d');
 for(let n=0;n<5;n++){
  const width=Math.floor(im.width/5),c=createCanvas(width,im.height),ctx=c.getContext('2d');
  ctx.drawImage(im,n*im.width/5,0,im.width/5,im.height,0,0,width,im.height);
  const data=ctx.getImageData(0,0,width,im.height).data;
  let x0=width,y0=im.height,x1=0,y1=0;
  for(let y=0;y<im.height;y++)for(let x=0;x<width;x++)if(data[(y*width+x)*4+3]>32){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  const h=228,w=(x1-x0+1)*h/(y1-y0+1);
  g.drawImage(c,x0,y0,x1-x0+1,y1-y0+1,n*288+(288-w)/2,264-h,w,h);
 }
 fs.writeFileSync('assets/heroes/glasscannon/rifleman/body-carbine.png',out.toBuffer('image/png'));
})();
