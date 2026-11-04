// Alpha 0.50 South-first illustrated knight preview: a real in-game renderer
// test, without pretending the seven other directions are fully animated.
const {chromium,webkit}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 fs.mkdirSync('test-output',{recursive:true});
 for(const [browserName,driver] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await driver.launch({headless:true,args:browserName==='chromium'?['--no-sandbox']:[]});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto('http://127.0.0.1:8000/?previewPaintedKnight=1&v=0.50.0');
   const result=await page.evaluate(async()=>{
    const {getKnightFinal,KNIGHT_PAINTED_050}=await import('./src/knight-final.js?v=0.50.0');
    const atlas=getKnightFinal();await atlas.loading;
    if(!atlas.ready||!atlas.imageReady)throw Error('Painted sprite atlas was not loaded');
    const sample=(clip,row,frame)=>{
     const sprite=atlas.frame(row,clip,frame);
     if(!sprite||sprite.width!==144||sprite.height!==144)throw Error('Missing sprite '+clip);
     const data=sprite.getContext('2d').getImageData(0,0,144,144).data;
     let shown=0,h=2166136261;
     for(let i=0;i<data.length;i+=4)if(data[i+3]>50){shown++;h=Math.imul(h^data[i]^data[i+1],16777619);}
     return {shown,hash:h>>>0};
    };
    const directions=new Set();
    for(let row=0;row<8;row++){
     const v=sample('idle',row,0);
     if(v.shown<300)throw Error('Painting missing view '+row);
     directions.add(v.hash);
    }
    if(directions.size!==8)throw Error('Facing art duplicates');
    const clips=['idle','walk','attack1','attack2','attack3','recovery','special','dash','hurt','death'];
    const distinct={};
    for(const clip of clips){
     const count=clip==='attack3'?10:clip==='hurt'?6:clip==='walk'||clip.startsWith('attack')||clip==='special'||clip==='dash'||clip==='death'?8:6;
     const hashes=new Set();
     for(let i=0;i<count;i++){
      const v=sample(clip,0,i);if(v.shown<300)throw Error('Unpainted '+clip+' '+i);
      hashes.add(v.hash);
     }
     distinct[clip]=hashes.size;
    }
    if(distinct.walk<6||distinct.attack1<6||distinct.attack2<6||distinct.attack3<7)
     throw Error('South animation is not actually moving: '+JSON.stringify(distinct));
    const sheet=document.createElement('canvas');
    sheet.width=144*8;sheet.height=144*6;
    const c=sheet.getContext('2d');
    c.fillStyle='#18242f';c.fillRect(0,0,sheet.width,sheet.height);
    for(let row=0;row<8;row++)for(let j=0;j<6;j++){
     const clip=['idle','walk','attack1','attack2','attack3','death'][j];
     c.drawImage(atlas.frame(row,clip,j===0?0:clip==='attack3'?5:clip==='death'?6:j===1?3:4),row*144,j*144);
    }
    return {directions:directions.size,distinct,done:KNIGHT_PAINTED_050.southFrames,
     screenshot:sheet.toDataURL('image/png')};
   });
   assert.equal(result.directions,8);
   assert.equal(result.done,73);
   assert.deepEqual(errors,[]);
   fs.writeFileSync('test-output/knight-050-views-'+browserName+'.png',
    Buffer.from(result.screenshot.split(',')[1],'base64'));
   await page.locator('[data-action="class:warrior"]').click();
   await page.locator('[data-action="start"]').click();
   await page.locator('#overlay').waitFor({state:'hidden'});
   await page.waitForTimeout(250);
   assert.deepEqual(errors,[]);
   await page.screenshot({path:'test-output/knight-050-live-'+browserName+'.png'});
   console.log(browserName,'new painted South art tested in live dungeon',result.distinct);
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1});
