// Real-game north-facing sword graphics; opt-in only until every
// direction and action has artist-reviewed frames.
const {chromium,webkit}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 fs.mkdirSync('test-output',{recursive:true});
 for(const [name,driver] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await driver.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8000/?previewKnightUp=1&v=0.53.0');
   const art=await page.evaluate(async()=>{
    const [{getKnightFinal,KNIGHT_SHEET_ANCHOR},{KNIGHT_NORTH_051,knightNorth051Impact}]=await Promise.all([
     import('./src/knight-final.js?v=0.53.0'),import('./src/knight-north-051.js?v=0.53.0')]);
    const atlas=getKnightFinal();await atlas.loading;
    if(!atlas.ready||atlas.reviewScale!==.90)throw Error('New 90% north artwork not selected');
    const shots=document.createElement('canvas');
    shots.width=144*8;shots.height=144*5;
    const out=shots.getContext('2d');out.imageSmoothingEnabled=false;
    let count=0;
    for(const row of KNIGHT_NORTH_051.rows){
     for(const [clip,frames] of [['attack1',8],['attack2',8],['attack3',10],['special',8],['recovery',6]]){
      const hashes=new Set();
      for(let frame=0;frame<frames;frame++){
       const tile=atlas.frame(row,clip,frame);
       if(!tile||tile.width!==144)throw Error('Missing knight '+row+' '+clip+' '+frame);
       const raw=tile.getContext('2d').getImageData(0,0,144,144).data;
       let pixels=0,hash=2166136261;
       for(let i=0;i<raw.length;i+=4)if(raw[i+3]>55){pixels++;hash=Math.imul(hash^raw[i]^raw[i+1],16777619);}
       if(pixels<2200)throw Error('Transparent or incomplete '+clip+' '+row+' '+frame+' '+pixels);
       hashes.add(hash>>>0);count++;
      }
      if(hashes.size<frames-1)throw Error('No full swing in '+row+' '+clip);
     }
    }
    if(count!==120)throw Error('Missing 120 northern attack cells');
    const player={x:300,y:500};
    for(const direction of [{x:-1,y:-1},{x:0,y:-1},{x:1,y:-1}]){
     for(const clip of ['attack1','attack2','attack3']){
      const tip=knightNorth051Impact(player,direction,clip,true);
      if(!tip||tip.y>=player.y-60)throw Error('Sword effect not placed at forward blade tip');
     }
    }
    // Actual class sprite renderer, not a sprite-sheet-only illustration.
    for(const [i,row] of [3,4,5].entries())for(const [j,clip] of ['attack1','attack2','attack3','special','recovery'].entries()){
     const direction={x:Math.cos(Math.PI/2+row*Math.PI/4),y:Math.sin(Math.PI/2+row*Math.PI/4)};
     const p={kind:'warrior',x:i*360+190,y:j*160+135,hp:100,direction,invulnerable:0,knightAction:{
       clip,direction,elapsed:clip==='attack3'?.5:.5,duration:1}};
     if(clip==='recovery'){p.knightAction=null;p.knightRecoveryTimer=.06;p.knightRecoveryDirection=direction;}
     const x=atlas.draw(out,p,1);
     if(!x)throw Error('Live production renderer refused north sprite');
    }
    return {ready:atlas.ready,checked:count,anchor:KNIGHT_SHEET_ANCHOR,art:shots.toDataURL('image/png')};
   });
   assert.equal(art.checked,120);
   assert.deepEqual(errors,[]);
   fs.writeFileSync('test-output/knight-north-051-review-'+name+'.png',Buffer.from(art.art.split(',')[1],'base64'));
   await page.locator('[data-action="class:warrior"]').click();
   await page.locator('[data-action="start"]').click();
   await page.locator('#overlay').waitFor({state:'hidden'});
   await page.waitForTimeout(400);
   assert.deepEqual(errors,[]);
   await page.screenshot({path:'test-output/knight-north-051-game-'+name+'.png'});
   // Default game selects the completed production set, not this historical study.
   const defaultPage=await browser.newPage({viewport:{width:1120,height:700}});
   await defaultPage.goto('http://127.0.0.1:8000/?v=0.53.0');
   const defaultState=await defaultPage.evaluate(async()=>{
    const {getKnightFinal}=await import('./src/knight-final.js?v=0.53.0');
    const k=getKnightFinal();await k.loading;
    return {ready:k.ready,production:Boolean(k.production)};
   });
   assert.equal(defaultState.ready,true);
   assert.equal(defaultState.production,true);
   await defaultPage.close();
   console.log(name,'upper attack images and live game verified',art.checked);
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1});
