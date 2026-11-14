// Rebuild from the five checked-in native whole-body source sheets.
// Optional import: node tools/pack-hunter-original.cjs --import /path/to/raw-sources
// No mage or old hunter art is read; raw illustrations are not runtime assets.
// Stable per-facing scale; soles share y=88. No animated body-part compositing.
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../assets/heroes/hunter/original-073');
const importing=process.argv.includes('--import')||!fs.existsSync(path.join(root,'source-S.png'));
const rawRoot=process.argv[3]||path.join(root,'source');
const facings=['S','SW','W','NW','N'];
const clips=['idle','walk','attack','special','dash','hurt','death'];
const CELL=96,SOLE=88;
function isolate(image,col,row,rows=7,columns=8){
 const left=Math.round(col*image.width/columns),top=Math.round(row*image.height/rows);
 const w=Math.round((col+1)*image.width/columns)-left,h=Math.round((row+1)*image.height/rows)-top;
 const c=createCanvas(w,h),g=c.getContext('2d');g.drawImage(image,-left,-top);
 const data=g.getImageData(0,0,w,h),d=data.data,seen=new Uint8Array(w*h);let groups=[];
 // Ignore the nearly neutral translucent matte produced around some sources.
 // Warm feathers, skin, leather and opaque metal remain untouched.
 for(let k=0;k<d.length;k+=4)if(d[k+3]<250&&Math.min(d[k],d[k+1],d[k+2])>155&&Math.max(d[k],d[k+1],d[k+2])-Math.min(d[k],d[k+1],d[k+2])<12)d[k+3]=0;
 for(let start=0;start<seen.length;start++){
  if(seen[start]||d[start*4+3]<220)continue;
  const q=[start];seen[start]=1;
  for(let n=0;n<q.length;n++){
   const p=q[n],x=p%w,y=Math.floor(p/w);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const nx=x+dx,ny=y+dy,next=ny*w+nx;
    if(nx>=0&&nx<w&&ny>=0&&ny<h&&!seen[next]&&d[next*4+3]>=220){seen[next]=1;q.push(next);}
   }
  }
  groups.push(q);
 }
 groups.sort((a,b)=>b.length-a.length);
 if(!groups[0]||groups[0].length<w*h*.05)throw Error('Missing source cell '+row+'/'+col);
 const keep=new Uint8Array(w*h);
 // Exclude transparent-generation specks. Keep connected character and weapon.
 for(const group of groups)if(group.length>=groups[0].length*(rows===7&&row===6?1:.015))for(const p of group)keep[p]=1;
 let l=w,t=h,r=-1,b=-1;
 for(let p=0;p<keep.length;p++){
  d[p*4+3]=keep[p]?255:0;
  if(keep[p]){l=Math.min(l,p%w);r=Math.max(r,p%w);t=Math.min(t,Math.floor(p/w));b=Math.max(b,Math.floor(p/w));}
 }
 g.putImageData(data,0,0);
 // Hood centre determines upright root, independent of the bow and quiver.
 let sum=0,n=0;
 for(let y=t;y<t+(b-t)*.4;y++)for(let x=l;x<=r;x++){
  const k=(y*w+x)*4;
  if(d[k+3]&&d[k+1]>=d[k]*.93&&d[k+1]>d[k+2]*1.25){sum+=x;n++;}
 }
 let feetX=0,feetN=0;
 for(let y=Math.round(b-(b-t)*.13);y<=b;y++)for(let x=l;x<=r;x++){
  const k=(y*w+x)*4;if(d[k+3]){feetX+=x;feetN++;}
 }
 return {c,l,t,r,b,cx:n?sum/n:(l+r)/2,feetX:feetN?feetX/feetN:(l+r)/2};
}
if(require.main===module)(async()=>{
 const sheets=clips.map(()=>createCanvas(768,768));
 let manifest={cell:CELL,anchor:[48,SOLE],facings:['S','SW','W','NW','N','NE','E','SE'],clips:Object.fromEntries(clips.map(c=>[c,8])),sources:{},frames:{}};
 if(importing)for(let row=0;row<5;row++){
  const normalized=createCanvas(768,672),ng=normalized.getContext('2d');
  const facing=facings[row],image=await loadImage(path.join(rawRoot,facing+'.png'));
  const cells=clips.map((_,r)=>Array.from({length:8},(_,c)=>isolate(image,c,r)));
  const walk=await loadImage(path.join(rawRoot,facing+'-walk.png'));
  cells[1]=Array.from({length:8},(_,frame)=>isolate(walk,frame%4,Math.floor(frame/4),2,4));
  const walkScale=72/(cells[1][0].b-cells[1][0].t+1);
  let shotScale=null;
  if(['S','SW'].includes(facing)){
   const shots=await loadImage(path.join(rawRoot,facing+'-shots.png'));
   cells[2]=Array.from({length:8},(_,c)=>isolate(shots,c,0,2));
   cells[3]=Array.from({length:8},(_,c)=>isolate(shots,c,1,2));
   shotScale=72/(cells[2][0].b-cells[2][0].t+1);
  }
  const hs=cells[0].map(c=>c.b-c.t+1).sort((a,b)=>a-b),scale=72/((hs[3]+hs[4])/2);
  manifest.sources[facing]={file:'source/'+facing+'.png',scale};
  const records=[];
  for(let clip=0;clip<7;clip++)for(let frame=0;frame<8;frame++){
   let sourceFrame=facing==='W'&&(clip===2||clip===3)&&frame===3?4:frame;
   // The new side study holds its full draw for two source cells. Physics
   // releases at 1/2, so column 4 must use the first arrow-free source pose.
   if(facing==='W'&&(clip===2||clip===3)&&frame>=4&&frame<7)sourceFrame=Math.min(7,frame+1);
   let c=clip===0?cells[0][0]:cells[clip][sourceFrame];
   const isReady=(['attack','special','dash','hurt'].includes(clips[clip])&&(frame===0||frame===7))||clips[clip]==='death'&&frame===0;
   if(isReady)c=cells[0][0];
   if(clips[clip]==='death'&&frame===7)c=cells[clip][6];
   const cellScale=clip===1?walkScale:shotScale&&(clip===2||clip===3)&&frame!==0&&frame!==7?shotScale:scale;
   const w=Math.round((c.r-c.l+1)*cellScale),h=Math.round((c.b-c.t+1)*cellScale);
   const center=isReady?c.cx:clips[clip]==='death'&&frame>=3?(c.l+c.r)/2:['dash','hurt','death'].includes(clips[clip])?c.feetX:c.cx;
   records.push({clip,frame,c,w,h,x:Math.round(48+(c.l-center)*cellScale),y:SOLE-h});
  }
  // Translate the ENTIRE facing by one constant amount if its weapon needs
  // more padding; export that same root to rendering and projectile sockets.
  const standing=records.filter(p=>p.clip!==6);
  const min=Math.min(...standing.map(p=>p.x)),max=Math.max(...standing.map(p=>p.x+p.w));
  const shift=min<2?2-min:max>94?94-max:0;
  manifest.anchors??=[];manifest.anchors[row]=[48+shift,SOLE];
  for(const {clip,frame,c,w,h,x:rawX,y} of records){
   const x=clip===6?Math.max(2,Math.min(94-w,rawX+shift)):rawX+shift;
   if(x<1||x+w>95||y<1)throw Error('Art exceeds 96px cell '+facing+'/'+clips[clip]+'/'+frame+': '+[x,y,w,h]);
   const g=sheets[clip].getContext('2d');g.imageSmoothingEnabled=false;
   const tile=createCanvas(96,96),tg=tile.getContext('2d');tg.imageSmoothingEnabled=false;
   tg.drawImage(c.c,c.l,c.t,c.r-c.l+1,c.b-c.t+1,x,y,w,h);
   g.drawImage(tile,frame*96,row*96);
   ng.drawImage(tile,frame*96,clip*96);
   manifest.frames[clips[clip]]??=[];manifest.frames[clips[clip]][row]??=[];
   manifest.frames[clips[clip]][row][frame]={bounds:[x,y,w,h]};
  }
  fs.writeFileSync(path.join(root,'source-'+facing+'.png'),normalized.toBuffer('image/png'));
 }
 if(!importing){
  manifest=JSON.parse(fs.readFileSync(path.join(root,'source-layout.json'),'utf8'));
  for(let row=0;row<5;row++){
   const source=await loadImage(path.join(root,'source-'+facings[row]+'.png'));
   if(source.width!==768||source.height!==672)throw Error('Invalid native hunter source '+facings[row]);
   for(let clip=0;clip<7;clip++){
    const g=sheets[clip].getContext('2d');g.imageSmoothingEnabled=false;
    g.drawImage(source,0,clip*96,768,96,0,row*96,768,96);
   }
  }
 }
 // Mirrored views follow the production mage's convention. The complete
 // sprite is reflected, so hands, clothing, bow and later sockets stay together.
 for(let row=5;row<8;row++)manifest.anchors[row]=[95-manifest.anchors[8-row][0],SOLE];
 for(let clip=0;clip<7;clip++){
  const sheet=sheets[clip],g=sheet.getContext('2d');
  for(let row=5;row<8;row++){
   g.save();g.translate(768,row*96);g.scale(-1,1);
   for(let frame=0;frame<8;frame++)g.drawImage(sheet,frame*96,(8-row)*96,96,96,(7-frame)*96,0,96,96);
   g.restore();
  }
  fs.writeFileSync(path.join(root,clips[clip]+'.png'),sheet.toBuffer('image/png'));
 }
 fs.writeFileSync(path.resolve(__dirname,'../src/hunter-anchors.js'),'// Shared per-facing root pivots, emitted by pack-hunter-original.cjs.\nexport const HUNTER_ANCHORS='+JSON.stringify(manifest.anchors)+';\n');
 if(importing)fs.writeFileSync(path.join(root,'source-layout.json'),JSON.stringify(manifest,null,2)+'\n');
 fs.writeFileSync(path.join(root,'atlas.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log('Packed 448 whole-body Jäger cells: seven clips × eight directions × eight frames.');
})().catch(e=>{console.error(e);process.exitCode=1;});

module.exports={isolate};
