// In-browser regression: verify that the original, complete walking
// sprite frames render correctly after retiring the broken body/leg montage.
// Start the static server on port 8000 before running this check.
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 fs.mkdirSync('test-output',{recursive:true});
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]]
  .filter(([name])=>!process.env.BROWSER_ENGINE||process.env.BROWSER_ENGINE===name)){
  const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
  try{
   const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto('http://127.0.0.1:8000/');
   const results=await page.evaluate(async()=>{
    const [{HeroSpriteAtlas},{KnightSpriteAtlas},{WALK_STRIDE}]=await Promise.all([
     import('./src/hero-sprites.js?v=0.31.1'),
     import('./src/knight-sprites.js?v=0.31.1'),
     import('./src/locomotion.js?v=0.31.0')
    ]);
    const dirs={down:{x:0,y:1},right:{x:1,y:0},up:{x:0,y:-1},left:{x:-1,y:0}};
    const knight=new KnightSpriteAtlas(),hero=new HeroSpriteAtlas();await knight.loading;
    const c=document.createElement('canvas');c.width=256;c.height=192;
    const ctx=c.getContext('2d'),results=[];
    for(const kind of ['warrior','hunter','mage','glasscannon','summoner','alchemist']){
     const atlas=kind==='warrior'?knight:hero;
     if(kind!=='warrior'){atlas.select(kind);await atlas.loading;}
     if(!atlas.ready)throw Error('Missing sprite atlas '+kind);
     const out=document.createElement('canvas');out.width=960;out.height=480;
     const oc=out.getContext('2d');oc.fillStyle='#182e2b';oc.fillRect(0,0,960,480);
     const report={kind,directions:{}};
     for(const [row,[face,direction]] of Object.entries(dirs).entries()){
      const hashes=new Set();let minTop=999,maxTop=-999,footFrames=0;
      for(let phase=0;phase<8;phase++){
       const p={kind,x:128,y:108,hp:100,invulnerable:0,moving:true,
        direction,heroMoveDirection:direction,knightMoveDirection:direction,
        walkDistance:phase*WALK_STRIDE/8};
       ctx.clearRect(0,0,256,192);atlas.draw(ctx,p,0);
       const pixels=ctx.getImageData(0,0,256,192).data;
       let hash=2166136261,top=999,feet=0;
       for(let y=38;y<133;y++)for(let x=65;x<194;x++){
        const i=(y*256+x)*4;
        if(pixels[i+3]<70)continue;
        top=Math.min(top,y);
        if(y>=101&&y<=123&&x>=113&&x<=143)feet++;
        hash=Math.imul(hash^pixels[i],16777619);
        hash=Math.imul(hash^pixels[i+1],16777619);
        hash=Math.imul(hash^pixels[i+2],16777619);
       }
       hashes.add(hash);minTop=Math.min(minTop,top);maxTop=Math.max(maxTop,top);
       if(feet>10)footFrames++;
       oc.imageSmoothingEnabled=false;
       oc.drawImage(c,80,18,96,112,phase*120+12,row*120+4,96,112);
       oc.fillStyle='#e8d9b1';oc.font='10px sans-serif';
       oc.fillText(face+' '+phase,phase*120+7,row*120+13);
      }
      report.directions[face]={unique:hashes.size,headDrift:maxTop-minTop,footFrames};
     }
     report.contact=out.toDataURL('image/png').split(',')[1];
     results.push(report);
    }
    return results;
   });
   for(const r of results){
    for(const [face,values] of Object.entries(r.directions)){
     assert.ok(values.unique>=6,r.kind+' '+face+' lacks distinct complete walk frames');
     assert.ok(values.headDrift<=17,r.kind+' '+face+' has excessive vertical sprite drift');
     assert.equal(values.footFrames,8,r.kind+' '+face+' loses contact with the ground');
    }
    fs.writeFileSync('test-output/walk-'+r.kind+'-'+engine+'.png',Buffer.from(r.contact,'base64'));
    delete r.contact;console.log(engine,JSON.stringify(r));
   }
   assert.deepEqual(errors,[]);
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exit(1);});
