// Import the authored 4x2 south walk grid. Register to the helmet rather than
// each boot: independent bottom alignment made the old torso jump with steps.
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const fs=require('node:fs');
(async()=>{
 const image=await loadImage(process.argv[2]);
 const cw=Math.ceil(image.width/4),ch=Math.ceil(image.height/2);
 const cells=[];
 for(let i=0;i<8;i++){
  const c=createCanvas(cw,ch),g=c.getContext('2d');
  g.drawImage(image,-Math.round((i%4)*image.width/4),-Math.round(Math.floor(i/4)*image.height/2));
  const p=g.getImageData(0,0,cw,ch),d=p.data;
  let left=cw,right=0,top=ch,bottom=0;
  for(let y=0;y<ch;y++)for(let x=0;x<cw;x++){
   const a=(y*cw+x)*4+3;
   if(d[a]<128){d[a]=0;continue;}d[a]=255;
   left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
  }
  g.putImageData(p,0,0);
  let sum=0,n=0;
  for(let y=top;y<top+40;y++)for(let x=0;x<cw;x++)if(d[(y*cw+x)*4+3]){sum+=x;n++;}
  cells.push({c,left,right,top,bottom,headX:sum/n});
 }
 const scale=46/Math.max(...cells.map(c=>c.bottom-c.top+1));
 const file='assets/knight/production-054/source-S.png';
 const old=await loadImage(file),out=createCanvas(old.width,old.height),g=out.getContext('2d');
 g.drawImage(old,0,0);g.clearRect(0,72,576,72);g.imageSmoothingEnabled=false;
 for(let i=0;i<8;i++){
  // The two returning steps were authored in reverse slots; keep each
  // planted foot through its half-cycle before passing at frames 0 and 4.
  const c=cells[[0,1,2,7,4,5,6,3][i]],w=c.right-c.left+1,h=c.bottom-c.top+1;
  g.drawImage(c.c,c.left,c.top,w,h,i*72+Math.round(36+(c.left-c.headX)*scale),72+15,Math.round(w*scale),Math.round(h*scale));
 }
 fs.writeFileSync(file,out.toBuffer('image/png'));
 console.log('Imported south walk with fixed helmet anchor:',scale);
})().catch(e=>{console.error(e);process.exitCode=1;});
