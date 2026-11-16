// Visual QA: see all 24 melee contact events on their actual production pose.
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
async function main(){
 const {KNIGHT_CRUSADER_CONTACTS}=await import('../src/knight-crusader-contacts.js');
 const clips=[['attack1',3],['attack2',4],['attack3',5]];
 const dirs=['S','SW','W','NW','N','NE','E','SE'];
 const c=createCanvas(8*256,3*282),g=c.getContext('2d');
 g.fillStyle='#202936';g.fillRect(0,0,c.width,c.height);g.imageSmoothingEnabled=false;
 for(let ci=0;ci<clips.length;ci++){
  const [clip,frame]=clips[ci],image=await loadImage(path.join(root,'assets/knight/crusader-075',clip+'.png'));
  for(let row=0;row<8;row++){
   const x=row*256,y=ci*282,point=KNIGHT_CRUSADER_CONTACTS[clip][row];
   g.drawImage(image,frame*128,row*128,128,128,x,y+20,256,256);
   g.strokeStyle='#f200df';g.lineWidth=3;
   g.beginPath();g.arc(x+point[0]*2,y+20+point[1]*2,8,0,2*Math.PI);g.stroke();
   g.fillStyle='#fff';g.font='bold 14px monospace';
   g.fillText(clip+' '+dirs[row]+' '+point, x+6,y+16);
  }
 }
 const target=path.join(root,'test-output/crusader-contacts.png');
 fs.mkdirSync(path.dirname(target),{recursive:true});
 fs.writeFileSync(target,c.toBuffer('image/png'));
 console.log(target);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
