// Material grade from the approved knight / hunter / mage style comparison.
// Applied once to complete sheets: no pose, alpha, anchor or combat changes.
const STEEL_STOPS=[
 [0,8,8,11],[32,25,24,28],[64,48,44,46],[96,72,65,64],
 [128,98,89,85],[160,124,113,104],[192,152,140,127],
 [224,184,174,156],[255,220,213,196]
];
const clamp=x=>Math.max(0,Math.min(1,x));
export function knightMaterialColor(r,g,b){
 const hi=Math.max(r,g,b),lo=Math.min(r,g,b),chroma=hi-lo;
 // Gold trim and the blue cloth retain their material identities. Neutral
 // steel receives the warm grey ramp, including blade, helmet and greaves.
 const steel=clamp((48-chroma)/30);
 if(!steel)return [r,g,b];
 const luma=.2126*r+.7152*g+.0722*b;
 let i=0;while(i<STEEL_STOPS.length-2&&luma>STEEL_STOPS[i+1][0])i++;
 const a=STEEL_STOPS[i],z=STEEL_STOPS[i+1],t=clamp((luma-a[0])/(z[0]-a[0]));
 return [r,g,b].map((v,c)=>Math.round(v*(1-steel)+
  (a[c+1]+(z[c+1]-a[c+1])*t+(v-luma)*.3)*steel));
}
export function prepareKnightMaterialSheet(image,factory){
 const canvas=factory();canvas.width=image.width;canvas.height=image.height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 ctx.imageSmoothingEnabled=false;ctx.drawImage(image,0,0);
 const pixels=ctx.getImageData(0,0,canvas.width,canvas.height),data=pixels.data;
 const palette=new Map();
 for(let i=0;i<data.length;i+=4){
  if(!data[i+3])continue;
  const key=(data[i]<<16)|(data[i+1]<<8)|data[i+2];
  let color=palette.get(key);
  if(!color){color=knightMaterialColor(data[i],data[i+1],data[i+2]);palette.set(key,color);}
  data[i]=color[0];data[i+1]=color[1];data[i+2]=color[2];
 }
 ctx.putImageData(pixels,0,0);return canvas;
}
