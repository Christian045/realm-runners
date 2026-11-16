// Pack the approved fine knight's eight generated 8x6 motion studies.
// Whole connected figures are isolated before cropping, so long blades can
// cross nominal grid boundaries without collecting a neighbour's equipment.
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const fs=require('node:fs'),path=require('node:path');
const variant=process.argv[2]??'fine-074';
if(!['fine-074','crusader-075'].includes(variant))throw Error('Unknown knight variant '+variant);
const preserveCross=variant==='crusader-075';
const root=path.resolve(__dirname,'../assets/knight',variant);
const dirs=['S','SW','W','NW','N','NE','E','SE'],cell=128;
const sequences={idle:[0,0,0,0,0,0],walk:[8,9,10,11,12,13,14,15],
 attack1:[0,17,18,19,20,21,22,0],attack2:[0,25,26,27,28,29,30,0],
 attack3:[0,33,34,35,36,36,37,38,39,0],recovery:[0,0,0,0,0,0],
 special:[17,18,19,19,20,21,22,0],dash:[40,41,42,42,42,41,43,0],
 hurt:[0,4,5,5,6,0],death:[0,44,44,45,45,46,47,47]};
function figures(image,{preserveCross=false}={}){
 const c=createCanvas(image.width,image.height),g=c.getContext('2d');g.drawImage(image,0,0);
 const p=g.getImageData(0,0,c.width,c.height).data,w=c.width,h=c.height,seen=new Uint8Array(w*h),rows=Array.from({length:6},()=>[]);
 const visible=k=>{const i=k*4,r=p[i],gg=p[i+1],b=p[i+2];
  const redMatte=preserveCross?r>237&&gg<55&&b<55:r>150&&gg<85&&b<85&&r>gg*2.1&&r>b*2.1;
  return p[i+3]>=245&&!redMatte&&!(gg>220&&r>220&&b<70);};
 for(let start=0;start<seen.length;start++){
  if(seen[start]||!visible(start))continue;
  const q=[start];seen[start]=1;let l=w,t=h,r=-1,b=-1;
  for(let n=0;n<q.length;n++){
   const k=q[n],x=k%w,y=Math.floor(k/w);l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);
   for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const xx=x+dx,yy=y+dy,j=yy*w+xx;
    if(xx>=0&&xx<w&&yy>=0&&yy<h&&!seen[j]&&visible(j)){seen[j]=1;q.push(j);}
   }
  }
  if(q.length<w*h*.0015)continue;
  const out=createCanvas(r-l+1,b-t+1),ctx=out.getContext('2d'),data=ctx.createImageData(out.width,out.height);
  for(const k of q){const dest=((Math.floor(k/w)-t)*out.width+k%w-l)*4;data.data.set(p.subarray(k*4,k*4+3),dest);data.data[dest+3]=255;}
  ctx.putImageData(data,0,0);
  rows[Math.min(5,Math.floor((t+b)/2/h*6))].push({image:out,bounds:[l,t,r-l+1,b-t+1]});
 }
 for(const row of rows){row.sort((a,b)=>a.bounds[0]-b.bounds[0]);if(row.length!==8)throw Error('Expected 8 complete figures, got '+row.length);}
 return rows.flat();
}
function helmetCentre(image){
 const p=image.getContext('2d').getImageData(0,0,image.width,image.height).data;let sx=0,n=0;
 // Ignore blade highlights: the warm gold ridge identifies the helmet centre.
 for(let y=0;y<image.height*.32;y++)for(let x=0;x<image.width;x++){
  const i=(y*image.width+x)*4,r=p[i],g=p[i+1],b=p[i+2];
  if(p[i+3]&&r>g*1.13&&g>b*1.22&&r>95){sx+=x;n++;}
 }
 return n?sx/n:image.width/2;
}
async function main(){
 fs.mkdirSync(root,{recursive:true});
 const sources=[],metadata=[];
 for(const d of dirs){
  const raw=await loadImage(path.join(root,'source-'+d+'.png')),parts=figures(raw,{preserveCross});
  const scale=72/parts[0].image.height,referenceX=helmetCentre(parts[0].image);
  const out=createCanvas(8*cell,6*cell),g=out.getContext('2d');g.imageSmoothingEnabled=false;
  const entries=[];
  for(let i=0;i<48;i++){
   const p=parts[i],img=p.image,width=Math.round(img.width*scale),height=Math.round(img.height*scale);
   // Match helmet position, rather than recentering around a swinging blade.
   const centre=i>=44?img.width/2:helmetCentre(img);
   let x=Math.round(64-centre*scale),y=112-height;
   if(width>124||height>110)throw Error('Sprite too large '+d+'/'+i+' '+[width,height]);
   x=Math.max(2,Math.min(126-width,x));
   if(y<1)throw Error('Clipped helmet/blade '+d+'/'+i);
   const tile=createCanvas(cell,cell),tg=tile.getContext('2d');tg.imageSmoothingEnabled=false;
   tg.drawImage(img,x,y,width,height);
   const alpha=tg.getImageData(0,0,cell,cell).data;let bottom=-1;
   for(let yy=0;yy<cell;yy++)for(let xx=0;xx<cell;xx++)if(alpha[(yy*cell+xx)*4+3])bottom=yy;
   const shift=111-bottom;
   g.drawImage(tile,i%8*cell,Math.floor(i/8)*cell+shift);
   entries.push({index:i,sourceBounds:p.bounds,bounds:[x,y+shift,width,height]});
  }
  fs.writeFileSync(path.join(root,'poses-'+d+'.png'),out.toBuffer('image/png'));sources.push(out);
  metadata.push({direction:d,scale,referenceX,frames:entries});
 }
 const contacts={};
 for(const [clip,sequence]of Object.entries(sequences)){
  const c=createCanvas(sequence.length*cell,8*cell),g=c.getContext('2d');g.imageSmoothingEnabled=false;
  for(let row=0;row<8;row++)for(let f=0;f<sequence.length;f++){
   const from=clip==='special'?(row+f)%8:row,i=sequence[f];
   g.drawImage(sources[from],i%8*cell,Math.floor(i/8)*cell,cell,cell,f*cell,row*cell,cell,cell);
  }
  fs.writeFileSync(path.join(root,clip+'.png'),c.toBuffer('image/png'));
  if(clip.startsWith('attack')){
   const frame={attack1:3,attack2:4,attack3:5}[clip];contacts[clip]=[];
   for(let row=0;row<8;row++){
    const p=g.getImageData(frame*cell,row*cell,cell,cell).data;
    const a=Math.PI/2+row*Math.PI/4,dx=Math.cos(a),dy=Math.sin(a);let score=-Infinity,point;
    for(let y=0;y<cell;y++)for(let x=0;x<cell;x++){
     const k=(y*cell+x)*4,r=p[k],gg=p[k+1],b=p[k+2];
     if(p[k+3]===255&&Math.min(r,gg,b)>145&&Math.max(r,gg,b)-Math.min(r,gg,b)<42){
      const s=(x-64)*dx+(y-76)*dy;if(s>score){score=s;point=[x,y];}
     }
    }
    // In crossing slashes the blade passes below the helmet or opposite the
    // facing vector. Use the visually measured blade end, not a bright boot.
    const measured=(preserveCross?
     {attack2:{3:[25,111],5:[100,102],7:[112,76]},attack3:{5:[107,98]}}:
     {attack2:{3:[22,109],5:[104,99],7:[115,64]},attack3:{5:[104,102]}})[clip]?.[row];
    if(measured){let best=Infinity;for(let y=measured[1]-7;y<=measured[1]+7;y++)for(let x=measured[0]-7;x<=measured[0]+7;x++){
     if(x<0||y<0||x>=cell||y>=cell||p[(y*cell+x)*4+3]!==255)continue;
     const distance=(x-measured[0])**2+(y-measured[1])**2;if(distance<best){best=distance;point=[x,y];}
    }}
    if(!point)throw Error('Missing steel contact '+clip+'/'+row);contacts[clip].push(point);
   }
  }
 }
 fs.writeFileSync(path.join(root,'atlas.json'),JSON.stringify({cell,anchor:[64,112],directions:dirs,sequences,contacts,rows:metadata},null,2)+'\n');
 const contactsFile=preserveCross?'knight-crusader-contacts.js':'knight-fine-contacts.js';
 const contactsExport=preserveCross?'KNIGHT_CRUSADER_CONTACTS':'KNIGHT_FINE_CONTACTS';
 fs.writeFileSync(path.join(root,'../../../src',contactsFile),'// Generated from the visible steel at contact frames; see pack-knight-fine.cjs.\nexport const '+contactsExport+'='+JSON.stringify(contacts)+';\n');
 console.log('Packed '+variant+': 608 cells, 128px padded cells, 72px native body, 8 directions.');
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={figures};
