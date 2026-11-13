const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{fs.mkdirSync('test-output',{recursive:true});const engines=process.env.MAGE_CHROMIUM_ONLY?[['chromium',chromium]]:[['chromium',chromium],['webkit',webkit]];for(const [name,engine] of engines){
 const browser=await engine.launch({headless:true,...(name==='chromium'&&process.env.CHROMIUM_EXECUTABLE?{executablePath:process.env.CHROMIUM_EXECUTABLE}: {})});try{
 const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:8000/?v=0.67.1');
 const result=await page.evaluate(async()=>{
  const {HeroSpriteAtlas}=await import('./src/hero-sprites.js?v=0.72.0');
  const {magePose}=await import('./src/mage-production.js?v=0.67.1');
  const {heroShot}=await import('./src/hero-aim.js?v=0.72.0');
  const atlas=new HeroSpriteAtlas();atlas.select('mage');await atlas.loading;if(!atlas.mage.ready||!atlas.ready)throw Error('Mage not loaded');
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const g=canvas.getContext('2d');let checked=0;
  const neutralColours=[];
  function clothColour(){
   const data=g.getImageData(0,0,256,256).data,sum=[0,0,0];let count=0;
   for(let i=0;i<data.length;i+=4){const r=data[i],green=data[i+1],b=data[i+2];
    if(data[i+3]>128&&b>green*1.12&&r>green*1.1&&b>r*.7&&Math.max(r,b)-green>12){sum[0]+=r;sum[1]+=green;sum[2]+=b;count++;}
   }if(count<100)throw Error('Mage cloth missing');return sum.map(value=>value/count);
  }
  for(let row=0;row<8;row++)for(const clip of ['idle','walk','attack','special','dash','hurt','death']){
   const a=Math.PI/2+row*Math.PI/4,direction={x:Math.cos(a),y:Math.sin(a)};
   const p={kind:'mage',x:128,y:128,hp:clip==='death'?0:100,heroDeathElapsed:1,direction,moving:clip==='walk',walkDistance:36};
   if(!['idle','walk','death'].includes(clip))p.heroAction={clip,elapsed:.5,duration:1,direction};
   if(magePose(p).row!==row)throw Error('Wrong facing');g.clearRect(0,0,256,256);atlas.draw(g,p,0);
   if(clip==='idle')neutralColours[row]=clothColour();
   if(clip==='walk'||clip==='attack'){
    const colour=clothColour();
    if(colour.some((value,c)=>Math.abs(value-neutralColours[row][c])>6))throw Error('Robe colour jump: '+row+'/'+clip);
   }
   if(['idle','walk','attack','special'].includes(clip)){const s=heroShot(p),pixel=g.getImageData(Math.round(s.x),Math.round(s.y),1,1).data;if(pixel[3]<128)throw Error('Detached staff socket');}
   checked++;
  }for(const row of [0,1,2,3,4,5,6,7])for(let frame=0;frame<8;frame++){
   const a=Math.PI/2+row*Math.PI/4,direction={x:Math.cos(a),y:Math.sin(a)};
   const p={kind:'mage',x:128,y:128,hp:100,direction,moving:true,mageWalkDistance:frame*12};
   if(magePose(p).walkFrame!==frame||!atlas.mage.locomotionImage)throw Error('Missing diagonal phase');
   g.clearRect(0,0,256,256);atlas.draw(g,p,0);const shot=heroShot(p);
   if(g.getImageData(shot.x,shot.y,1,1).data[3]<128)throw Error('Detached diagonal crystal');
  }return checked;
 });assert.equal(result,56);
 await page.locator('[data-action="class:mage"]').click();await page.screenshot({path:`test-output/mage-${name}-menu.png`});
 await page.locator('[data-action="start"]').click();await page.locator('#overlay').waitFor({state:'hidden'});
 await page.locator('#attackTouch').tap();await page.locator('#abilityTouch').tap();await page.locator('#dashTouch').tap();
 await page.screenshot({path:`test-output/mage-${name}-dungeon.png`});assert.deepEqual(errors,[]);console.log(name,'mage: 56 directional states, robe colour continuity, crystal sockets, menu, dungeon and touch controls passed');
 }finally{await browser.close();}
}})().catch(e=>{console.error(e);process.exitCode=1});
