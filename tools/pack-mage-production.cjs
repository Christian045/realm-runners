const {createCanvas,loadImage}=require('@napi-rs/canvas');
const fs=require('node:fs');
const root='assets/heroes/mage/production-056';
(async()=>{
 const images=await Promise.all(['motion','actions'].map(n=>loadImage(`${root}/source-${n}.png`)));
 const out=createCanvas(16*96,8*96),g=out.getContext('2d');g.imageSmoothingEnabled=false;
 const sockets=[];
 for(let row=0;row<8;row++){
  sockets[row]=[];
  const scales=[];
  for(let source=0;source<2;source++){
   const im=images[source],c=createCanvas(160,160).getContext("2d");
   c.drawImage(im,(source?2:0)*im.width/8,row*im.height/8,im.width/8,im.height/8,0,0,160,160);
   const d=c.getImageData(0,0,160,160).data;let lo=160,hi=0;
   for(let y=0;y<160;y++)for(let x=0;x<160;x++)if(d[(y*160+x)*4+3]>=160){lo=Math.min(lo,y);hi=Math.max(hi,y);}
   scales[source]=72/(hi-lo+1)*160/Math.ceil(im.height/8);
  }
  for(let col=0;col<16;col++){
   // Eastward releases use the explicitly right-pointing action artwork.
   let sheet=col<8?0:1,index=col%8;
   if(col===6){sheet=1;index=1;}
   const im=images[sheet],w=Math.ceil(im.width/8),h=Math.ceil(im.height/8);
   const cell=createCanvas(w,h),c=cell.getContext('2d');c.drawImage(im,index*im.width/8,row*im.height/8,im.width/8,im.height/8,0,0,w,h);
   const pixels=c.getImageData(0,0,w,h),d=pixels.data;
   let x0=w,y0=h,x1=0,y1=0;
   for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=(y*w+x)*4;
    // Remove translucent fringe only; retain the supplied alpha silhouette.
    if(d[i+3]<160){d[i+3]=0;continue;}d[i+3]=255;
    x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);
   }
   c.putImageData(pixels,0,0);
   const scale=scales[sheet];
   let sum=0,n=0;
   for(let y=y1-12;y<=y1;y++)for(let x=x0;x<=x1;x++)if(d[(y*w+x)*4+3]){sum+=x;n++;}
   const anchor=col===15?(x0+x1)/2:sum/n;
   const fit=Math.min(scale,90/(x1-x0+1),86/(y1-y0+1));
   const dw=Math.round((x1-x0+1)*fit),dh=Math.round((y1-y0+1)*fit);
   const left=Math.max(2,Math.min(94-dw,Math.round(48+(x0-anchor)*fit))),top=88-dh;
   if(top<1||dw>92)throw Error('Mage cell overflow '+row+'/'+col);
   g.drawImage(cell,x0,y0,x1-x0+1,y1-y0+1,col*96+left,row*96+top,dw,dh);
   const tile=g.getImageData(col*96,row*96,96,96).data;let sx=0,sy=0,weight=0;
   for(let y=0;y<96;y++)for(let x=0;x<96;x++){
    const i=(y*96+x)*4,r=tile[i],b=tile[i+2],green=tile[i+1];
    if(tile[i+3]&&green>120&&b>130&&green-r>35&&b-r>35){sx+=x;sy+=y;weight++;}
   }
   if(!weight)throw Error('Missing crystal '+row+'/'+col);
   sockets[row][col]=[+(sx/weight-48).toFixed(3),+(sy/weight-88).toFixed(3)];
  }
 }
 fs.writeFileSync(`${root}/atlas.png`,out.toBuffer('image/png'));
 fs.writeFileSync('src/mage-sockets.js','// Generated from cyan crystal pixels by pack-mage-production.cjs.\nexport const MAGE_SOCKETS='+JSON.stringify(sockets)+';\n');
})();
