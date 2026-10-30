// Derive a narrow oriented blade polygon for compositing existing sword frames.
// This records UV metadata only; source artwork is never edited.
function bladePolygon(data,width,f){
 const mask=new Uint8Array(f.w*f.h),seen=new Uint8Array(mask.length),parts=[];
 for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++){
  const i=((f.y+y)*width+f.x+x)*4,[r,g,b,a]=data.subarray(i,i+4);
  mask[y*f.w+x]=a>80&&r>90&&g>95&&b>90&&Math.max(r,g,b)-Math.min(r,g,b)<65?1:0;
 }
 for(let pos=0;pos<mask.length;pos++)if(mask[pos]&&!seen[pos]){
  const pixels=[pos];seen[pos]=1;
  for(let j=0;j<pixels.length;j++){const p=pixels[j],x=p%f.w,y=Math.floor(p/f.w);for(const n of [x?p-1:-1,x<f.w-1?p+1:-1,y?p-f.w:-1,y<f.h-1?p+f.w:-1,x&&y?p-f.w-1:-1,x<f.w-1&&y?p-f.w+1:-1,x&&y<f.h-1?p+f.w-1:-1,x<f.w-1&&y<f.h-1?p+f.w+1:-1])if(n>=0&&mask[n]&&!seen[n]){seen[n]=1;pixels.push(n);}}
  if(pixels.length>=8)parts.push(pixels.map(p=>({x:p%f.w,y:Math.floor(p/f.w)})));
 }
 let best=null,score=0;
 for(const points of parts){
  const mx=points.reduce((s,p)=>s+p.x,0)/points.length,my=points.reduce((s,p)=>s+p.y,0)/points.length;
  let xx=0,yy=0,xy=0;for(const p of points){xx+=(p.x-mx)**2;yy+=(p.y-my)**2;xy+=(p.x-mx)*(p.y-my);}
  const angle=Math.atan2(2*xy,xx-yy)/2,ux=Math.cos(angle),uy=Math.sin(angle),vx=-uy,vy=ux;
  const along=points.map(p=>p.x*ux+p.y*uy),across=points.map(p=>p.x*vx+p.y*vy),a0=Math.min(...along),a1=Math.max(...along),b0=Math.min(...across),b1=Math.max(...across),length=a1-a0,thickness=b1-b0;
  // A bright shin is not a sword; never restore an old central boot.
  if(my>f.anchorY-22&&Math.abs(mx-f.anchorX)<22)continue;
  const value=length*length/(thickness+2);if(length<15||length/(thickness+1)<2.5||value<=score)continue;
  score=value;best=[[a0-2,b0-2],[a1+2,b0-2],[a1+2,b1+2],[a0-2,b1+2]].map(([a,b])=>[+(a*ux+b*vx).toFixed(2),+(a*uy+b*vy).toFixed(2)]);
 }
 return best;
}
module.exports={bladePolygon};
