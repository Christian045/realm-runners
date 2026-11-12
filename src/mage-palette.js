// Match the cloth to the authored neutral pose once, while loading the atlases.
// Per-channel gains retain the painted folds, outlines and pixel positions.
const cloth=(data,i)=>{
 const r=data[i],g=data[i+1],b=data[i+2];
 return data[i+3]>128&&b>g*1.12&&r>g*1.1&&b>r*.7&&Math.max(r,b)-g>12;
};
function clothMean(data){
 const sum=[0,0,0];let count=0;
 for(let i=0;i<data.length;i+=4)if(cloth(data,i)){
  for(let channel=0;channel<3;channel++)sum[channel]+=data[i+channel];count++;
 }
 return count?sum.map(value=>value/count):null;
}
export function alignMageRobePalette(image,neutralImage,makeCanvas=()=>document.createElement('canvas')){
 const canvas=makeCanvas(image.width,image.height);canvas.width=image.width;canvas.height=image.height;
 const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);
 const reference=makeCanvas(neutralImage.width,neutralImage.height);
 reference.width=neutralImage.width;reference.height=neutralImage.height;
 const ref=reference.getContext('2d',{willReadFrequently:true});ref.drawImage(neutralImage,0,0);
 for(let row=0;row<8;row++){
  // Column zero is the selected standing pose, shared by all action recoveries.
  const target=clothMean(ref.getImageData(0,row*96,96,96).data);
  if(!target)throw Error('Missing neutral mage cloth: '+row);
  for(let x=0;x<image.width;x+=96){
   const tile=ctx.getImageData(x,row*96,96,96),source=clothMean(tile.data);
   if(!source)continue;
   const gains=target.map((value,channel)=>value/source[channel]);
   for(let i=0;i<tile.data.length;i+=4)if(cloth(tile.data,i))
    for(let channel=0;channel<3;channel++)tile.data[i+channel]=Math.round(tile.data[i+channel]*gains[channel]);
   ctx.putImageData(tile,x,row*96);
  }
 }
 // The temporary reference surface is no longer needed after palette matching.
 reference.width=reference.height=1;
 return canvas;
}
