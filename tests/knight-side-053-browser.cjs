// In-game quality gate for the 0.53 all-directions knight art review.
// The unfinished art is opt-in only and must not overwrite normal gameplay.
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const FRAMES={idle:6,walk:8,attack1:8,attack2:8,attack3:10,
 recovery:6,special:8,dash:8,hurt:6,death:8};
(async()=>{
 fs.mkdirSync('test-output',{recursive:true});
 for(const [browserName,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true,args:browserName==='chromium'?['--no-sandbox']:[]});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
   const errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto('http://127.0.0.1:8000/?v=0.53.0&previewKnightFinal=1');
   const report=await page.evaluate(async FRAMES=>{
    const [{getKnightFinal,knightFinalFrame},{KnightSpriteAtlas},{KNIGHT_SIDE_053}]=await Promise.all([
     import('./src/knight-final.js?v=0.53.0'),
     import('./src/knight-sprites.js?v=0.53.0'),
     import('./src/knight-side-053.js?v=0.53.0')
    ]);
    const atlas=getKnightFinal();await atlas.loading;
    if(!atlas.ready||!atlas.imageReady||!atlas.completePreview||
       atlas.reviewScale!==.9)throw Error('Not running illustrated all-eight final-review renderer');
    const actual=new KnightSpriteAtlas();await actual.loading;
    if(!actual.painted?.completePreview||!actual.ready)
     throw Error('Production dungeon renderer bypassed the preview graphic');
    const display=document.createElement('canvas');
    display.width=144*8;display.height=144*10;
    const out=display.getContext('2d');out.imageSmoothingEnabled=false;
    out.fillStyle='#1a2835';out.fillRect(0,0,display.width,display.height);
    let checked=0;
    for(const [ci,[clip,count]] of Object.entries(FRAMES).entries()){
     for(let row=0;row<8;row++){
      const hashes=new Set();
      const samples=KNIGHT_SIDE_053.rows.includes(row)?
       Array.from({length:count},(_,f)=>f):[0,Math.floor(count/2),count-1];
      for(const f of samples){
       const cell=atlas.frame(row,clip,f);
       if(!cell||cell.width!==144||cell.height!==144)
        throw Error('Sprite missing '+row+' '+clip+' '+f);
       const g=cell.getContext('2d'),data=g.getImageData(0,0,144,144).data;
       let pixels=0,hash=2166136261;
       for(let i=0;i<data.length;i+=4){
        if(data[i+3]>55)pixels++;
        if(i%16===0)hash=Math.imul(hash^data[i]^data[i+3],16777619);
       }
       if(pixels<1000)throw Error('Missing full body '+row+' '+clip+' '+f+' pixels '+pixels);
       hashes.add(hash>>>0);checked++;
      }
      const minPoses=clip==='idle'?4:clip==='recovery'||clip==='hurt'?5:
       Math.min(count-1,7);
      if(KNIGHT_SIDE_053.rows.includes(row)&&hashes.size<minPoses)
       throw Error('Frozen sprite '+row+' '+clip+' unique '+hashes.size);
      const index=clip==='attack3'?5:clip==='attack1'||clip==='special'?3:
       clip==='attack2'?4:Math.min(2,count-1);
      out.drawImage(atlas.frame(row,clip,index),row*144,ci*144);
     }
    }
    if(checked!==304+3*10*4)
     throw Error('Unexpected sprite sample count '+checked);
    // Test real knight draw in game coordinates, not only the sheet decoder.
    const scene=document.createElement('canvas');scene.width=960;scene.height=450;
    const c=scene.getContext('2d');c.fillStyle='#1b3032';c.fillRect(0,0,960,450);
    for(let row=0;row<8;row++){
     const a=Math.PI/2+Math.PI/4*row,dir={x:Math.cos(a),y:Math.sin(a)};
     const p={kind:'warrior',x:100+(row%4)*235,y:160+Math.floor(row/4)*210,
      hp:100,invulnerable:0,direction:dir,knightMoveDirection:dir,
      moving:false,knightAction:{clip:'attack3',elapsed:.5,duration:1,direction:dir}};
     const pose=knightFinalFrame(p,1);
     if(pose.row!==row||pose.clip!=='attack3'||pose.index!==5)
      throw Error('Direction/action combo mismatch '+row);
     if(!actual.draw(c,p,1))throw Error('Production renderer failed facing '+row);
    }
    return {checked,sheet:display.toDataURL('image/png'),
     scene:scene.toDataURL('image/png')};
   },FRAMES);
   assert.equal(report.checked,424);
   assert.deepEqual(errors,[]);
   for(const [tag,data] of [['contact',report.sheet],['combat',report.scene]])
    fs.writeFileSync('test-output/knight-053-'+tag+'-'+browserName+'.png',
      Buffer.from(data.split(',')[1],'base64'));
   await page.locator('[data-action="class:warrior"]').click();
   await page.locator('[data-action="start"]').click();
   await page.locator('#overlay').waitFor({state:'hidden'});
   await page.waitForTimeout(250);
   assert.deepEqual(errors,[]);
   await page.screenshot({path:'test-output/knight-053-live-'+browserName+'.png'});
   const plain=await browser.newPage({viewport:{width:1200,height:760}});
   await plain.goto('http://127.0.0.1:8000/?v=0.53.0');
   const baseline=await plain.evaluate(async()=>{
    const {getKnightFinal}=await import('./src/knight-final.js?v=0.53.0');
    const atlas=getKnightFinal();await atlas.loading;
    return {ready:atlas.ready,review:Boolean(atlas.completePreview),
     sideRequested:performance.getEntriesByType('resource')
      .some(e=>e.name.includes('/assets/knight/side-053/'))};
   });
   assert.deepEqual(baseline,{ready:true,review:false,sideRequested:false});
   await plain.close();
   console.log(browserName,'424 opt-in eight-direction sprite samples, 8 real combo draws and normal release guard passed');
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
