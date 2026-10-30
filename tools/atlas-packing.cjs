const sharp=require('sharp');
function components(data,w,h){
 const seen=new Uint8Array(w*h),result=[];
 for(let pos=0;pos<w*h;pos++){
  if(seen[pos]||data[pos*4+3]<30)continue;
  seen[pos]=1;const pixels=[pos];let sx=0,sy=0,x0=w,y0=h,x1=0,y1=0;
  for(let j=0;j<pixels.length;j++){
   const p=pixels[j],x=p%w,y=Math.floor(p/w);sx+=x;sy+=y;
   x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);
   for(const n of [x?p-1:-1,x<w-1?p+1:-1,y?p-w:-1,y<h-1?p+w:-1])
    if(n>=0&&!seen[n]&&data[n*4+3]>=30){seen[n]=1;pixels.push(n);}
  }
  if(pixels.length>100)result.push({pixels,cx:sx/pixels.length,cy:sy/pixels.length,x0,y0,x1,y1,n:pixels.length});
 }
 return result.sort((a,b)=>b.n-a.n);
}
async function read(file){const {data,info}=await sharp(file).ensureAlpha().raw().toBuffer({resolveWithObject:true});return {data,w:info.width,h:info.height};}
function isolate(src,part){
 const w=part.x1-part.x0+1,h=part.y1-part.y0+1,raw=Buffer.alloc(w*h*4);
 for(const p of part.pixels){const x=p%src.w-part.x0,y=Math.floor(p/src.w)-part.y0;src.data.copy(raw,(y*w+x)*4,p*4,p*4+4);}
 return {raw,w,h};
}
function extract(src,count,bounds,columns=8){
 let parts=components(src.data,src.w,src.h).filter(p=>p.n>1000);
 if(parts.length===count){
  parts.sort((a,b)=>a.cy-b.cy);
  let ordered=[];
  for(let row=0;row<count/columns;row++)ordered.push(...parts.slice(row*columns,row*columns+columns).sort((a,b)=>a.cx-b.cx));
  return ordered.map(p=>isolate(src,p));
 }
 // A few source poses touch at a sword tip; split at reviewed cell boundaries,
 // keeping only the connected character so adjacent fragments cannot leak.
 if(!bounds)throw new Error(`Expected ${count} isolated poses, found ${parts.length}`);
 let frames=[];
 for(let r=0;r<count/columns;r++)for(let c=0;c<columns;c++){
  const x0=Math.round(c*src.w/columns),x1=Math.round((c+1)*src.w/columns),y0=bounds[r],y1=bounds[r+1];
  const w=x1-x0,h=y1-y0,raw=Buffer.alloc(w*h*4);
  for(let y=0;y<h;y++)src.data.copy(raw,y*w*4,((y+y0)*src.w+x0)*4,((y+y0)*src.w+x1)*4);
  const part=components(raw,w,h)[0];if(!part||part.n<1000)throw new Error('Missing frame '+r+':'+c);
  frames.push(isolate({data:raw,w,h},part));
 }
 return frames;
}
function bodyBounds(f){
 const rows=Array.from({length:f.h},()=>0);
 for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++){
  const i=(y*f.w+x)*4;
  if(f.raw[i+3]>50&&Math.max(f.raw[i],f.raw[i+1],f.raw[i+2])<210)rows[y]++;
 }
 const threshold=Math.max(...rows)*.18,ys=rows.map((n,y)=>n>=threshold?y:-1).filter(y=>y>=0);
 return {top:ys[0],bottom:ys.at(-1),height:ys.at(-1)-ys[0]+1};
}
const bodyHeight=f=>bodyBounds(f).height;
function bodyCenter(frame){
 // Exclude pale blade pixels: torso/cape mass provides a stable hand-authored
 // character pivot instead of centering on the changing sword bounding box.
 const mass=[];let n=0;
 for(let y=0;y<frame.h;y++)for(let x=0;x<frame.w;x++){
  const i=(y*frame.w+x)*4,[r,g,b,a]=frame.raw.subarray(i,i+4);
  if(a<50||Math.max(r,g,b)>210)continue;
  if(y>frame.h*.82)continue;
  mass[x]=(mass[x]||0)+1;n++;
 }
 let sum=0;for(let x=0;x<frame.w;x++){sum+=mass[x]||0;if(sum>=n/2)return x;}
 return frame.w/2;
}

module.exports={components,read,extract,bodyBounds,bodyHeight,bodyCenter};
