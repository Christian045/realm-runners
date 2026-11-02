// Regression coverage for the retained fallback atlases; new production rigs have their own suite.
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 fs.mkdirSync('test-output',{recursive:true});
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
  try{
   const page=await browser.newPage({viewport:{width:1200,height:760}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8000/?legacyHeroArt=1');
   const report=await page.evaluate(async()=>{
    const [{KnightSpriteAtlas},{beginKnightAction}]=await Promise.all([
     import('./src/knight-sprites.js?v=0.37.0'),
     import('./src/knight-animation.js?v=0.31.0')]);
    const a=new KnightSpriteAtlas();await a.loading;
    if(!a.ready)throw Error('Knight atlas not ready');
    const faces={down:{x:0,y:1},right:{x:1,y:0},up:{x:0,y:-1},left:{x:-1,y:0}};
    const clips=['idle','attack1','attack2','attack3'];
    let tested=0;
    const summary=[];
    for(const [clipIndex,clip] of clips.entries()){
     const image=a.images[clip]||a.images.idle;
     if(!image||image.naturalWidth!==768||image.naturalHeight!==384)
      throw Error('Missing 8x4 sprite art '+clip);
     const sheet=document.createElement('canvas');
     sheet.width=8*96;sheet.height=4*116;
     const sc=sheet.getContext('2d');sc.imageSmoothingEnabled=false;
     for(const [row,[face,direction]] of Object.entries(faces).entries()){
      const hashes=new Set(),anchors=new Set();
      for(let frame=0;frame<8;frame++){
       const p={kind:'warrior',x:48,y:80,hp:100,invulnerable:0,
        moving:false,direction,knightWalkDistance:0};
       if(clip!=='idle'){beginKnightAction(p,clip,.8,direction);p.knightAction.elapsed=(frame+.02)*.1;}
       const c=document.createElement('canvas');c.width=96;c.height=105;
       const cx=c.getContext('2d');cx.imageSmoothingEnabled=false;
       const drawn=a.draw(cx,p,clip==='idle'?(frame+.02)*1.6/8:0);
       if(!drawn)throw Error('Failed drawing '+clip+' '+face+' '+frame);
       // Source uses the actual production decoder. All image frames
       // must be distinct for attacks; idle is intentionally subtle.
       const raw=cx.getImageData(0,0,96,105).data;
       let hash=2166136261,pixels=0,minX=96,maxX=-1,minY=105,maxY=-1;
       for(let y=0;y<105;y++)for(let x=0;x<96;x++){
        const i=(y*96+x)*4;
        if(raw[i+3]>96){
         pixels++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);
         minY=Math.min(minY,y);maxY=Math.max(maxY,y);
         hash=Math.imul(hash^(x*13+y*17+raw[i]+raw[i+1]*11),16777619);
        }
       }
       if(pixels<1200)throw Error('Empty cropped knight action frame '+clip+' '+face+' '+frame);
       if(minX===0||maxX===95)throw Error('Sword is clipped at frame boundary '+clip+' '+face+' '+frame);
       hashes.add(hash);
       anchors.add(maxY);
       sc.drawImage(c,frame*96,row*116+10);
       tested++;
      }
      if(hashes.size<(clip==='idle'?2:6))throw Error('Insufficient real poses '+clip+' '+face+': '+hashes.size);
      if(Math.max(...anchors)-Math.min(...anchors)>2)
       throw Error('Boots bounce '+clip+' '+face+': '+[...anchors]);
      summary.push({clip,face,poses:hashes.size,bootDrift:Math.max(...anchors)-Math.min(...anchors)});
     }
     const imageData=sheet.toDataURL('image/png');summary[summary.length-1].preview=imageData;
    }
    return {tested,summary};
   });
   assert.equal(report.tested,128);
   assert.deepEqual(errors,[]);
   for(const [i,x] of report.summary.entries()){
    if(x.preview)fs.writeFileSync('test-output/knight-actions-'+name+'-'+x.clip+'.png',Buffer.from(x.preview.split(',')[1],'base64'));
    delete x.preview;
   }
   console.log(name,JSON.stringify({tested:report.tested,summary:report.summary}));
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
