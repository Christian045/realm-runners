const {createCanvas,loadImage}=require('@napi-rs/canvas');
const {isolate}=require('./pack-hunter-original.cjs');
const fs=require('fs');const root='assets/heroes/hunter/original-073';
(async()=>{
 const image=await loadImage(process.argv[2]),layout=JSON.parse(fs.readFileSync(root+'/source-layout.json'));
 for(const [row,name] of ['S','SW','W','NW','N'].entries()){
  const src=await loadImage(root+'/source-'+name+'.png'),out=createCanvas(768,672),g=out.getContext('2d');g.drawImage(src,0,0);g.imageSmoothingEnabled=false;
  const cells=Array.from({length:9},(_,c)=>isolate(image,c,row,5,9)),scale=72/(cells[0].b-cells[0].t+1),anchor=layout.anchors[row][0];
  const tiles=cells.map(c=>{const tile=createCanvas(96,96),t=tile.getContext('2d');t.imageSmoothingEnabled=false;const w=Math.round((c.r-c.l+1)*scale),h=Math.round((c.b-c.t+1)*scale),x=Math.round(anchor+(c.l-c.cx)*scale),y=88-h;if(x<1||x+w>95||y<1)throw Error('clipped '+name+' '+[x,y,w,h]);t.drawImage(c.c,c.l,c.t,c.r-c.l+1,c.b-c.t+1,x,y,w,h);return tile;});
  for(let frame=0;frame<8;frame++){
   g.clearRect(frame*96,0,96,192);g.drawImage(tiles[0],frame*96,0);g.drawImage(tiles[frame+1],frame*96,96);
   for(const clip of [2,3,4,5])if(frame===0||frame===7){g.clearRect(frame*96,clip*96,96,96);g.drawImage(tiles[0],frame*96,clip*96);}
   if(frame===0){g.clearRect(0,576,96,96);g.drawImage(tiles[0],0,576);}
  }
  fs.writeFileSync(root+'/source-'+name+'.png',out.toBuffer('image/png'));
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
