// This guards against the visual bug where idle and walk were different
// characters despite all source frames decoding and the generic tests passing.
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 fs.mkdirSync('test-output',{recursive:true});
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
  try{
   const page=await browser.newPage({viewport:{width:1024,height:720}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8000/');
   const result=await page.evaluate(async()=>{
    const {HeroSpriteAtlas}=await import('./src/hero-sprites.js?v=0.35.1');
    const directions={down:{x:0,y:1},right:{x:1,y:0},up:{x:0,y:-1},left:{x:-1,y:0}};
    const out=[];
    for(const kind of ['mage','summoner']){
     const atlas=new HeroSpriteAtlas();atlas.select(kind);
     await Promise.all([atlas.loading,atlas.previewLoading]);
     if(!atlas.ready||!atlas.images.walk)throw Error(kind+': full-body robe sheet not loaded');
     if(atlas.previews[kind]!==atlas.images.walk &&
        (atlas.previews[kind]?.naturalWidth!==768||atlas.previews[kind]?.naturalHeight!==384))
      throw Error(kind+': old class-selection portrait still in use');
     for(const [face,d] of Object.entries(directions)){
      const p={kind,x:98,y:115,hp:100,invulnerable:0,direction:d,
       heroMoveDirection:d,robedWalkDistance:0,walkDistance:0,moving:false};
      const trace={save(){},restore(){},translate(){},scale(){},
       drawImage(...args){this.calls.push(args);},calls:[],imageSmoothingEnabled:false};
      atlas.draw(trace,p,3.4);
      const idle=trace.calls[0];
      trace.calls=[];p.moving=true;atlas.draw(trace,p,3.4);
      const walk=trace.calls[0];
      if(!idle||!walk||idle.length!==walk.length||idle[0]!==atlas.images.walk||
         walk[0]!==atlas.images.walk)throw Error(kind+' '+face+': model changes on stop');
      for(let i=1;i<idle.length;i++)if(idle[i]!==walk[i])
       throw Error(kind+' '+face+': idle and first walk pose differ at '+i);
      const canvas=document.createElement('canvas');canvas.width=196;canvas.height=155;
      const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
      p.moving=false;atlas.draw(ctx,p,3.4);
      const a=ctx.getImageData(0,0,196,155).data;
      ctx.clearRect(0,0,196,155);p.moving=true;atlas.draw(ctx,p,3.4);
      const b=ctx.getImageData(0,0,196,155).data;
      let pixels=0;
      for(let i=0;i<a.length;i++){if(a[i]!==b[i])throw Error(kind+' '+face+': idle/walk pixels mismatch');if(i%4===3&&a[i]>100)pixels++;}
      if(pixels<300)throw Error(kind+' '+face+': sprite nearly empty');
      const menu=document.createElement('canvas');menu.width=96;menu.height=108;
      const mc=menu.getContext('2d');
      if(!atlas.preview(mc,kind,96,108,0))throw Error(kind+': no matching menu preview');
      out.push({kind,face,pixels,menuVisible:mc.getImageData(0,0,96,108).data.some((v,i)=>i%4===3&&v>100)});
     }
     atlas.release();
    }
    return out;
   });
   assert.equal(result.length,8);
   assert.ok(result.every(x=>x.menuVisible));
   assert.deepEqual(errors,[]);
   console.log(name,JSON.stringify(result));
  }finally{await browser.close();}
 }
})().catch(err=>{console.error(err);process.exitCode=1;});
