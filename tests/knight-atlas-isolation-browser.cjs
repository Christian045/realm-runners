// Regression: fully transparent source pixels must DELETE the earlier
// placeholder knight, and normalization must never bleed into another cell.
// Evaluate the exact rendered atlas in Chromium and mobile WebKit.
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const CLIPS={idle:6,walk:8,attack1:8,attack2:8,attack3:10,
 recovery:6,special:8,dash:8,hurt:6,death:8};
(async()=>{
 for(const [name,browserType] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await browserType.launch({
   headless:true,args:name==='chromium'?['--no-sandbox']:[]
  });
  try{
   const page=await browser.newPage({
    viewport:{width:390,height:844},hasTouch:true,isMobile:true
   });
   await page.goto('http://127.0.0.1:8000/?v=0.53.0&previewKnight053=1');
   const result=await page.evaluate(async counts=>{
    const [{getKnightFinal},{KNIGHT_SIDE_053}]=await Promise.all([
     import('./src/knight-final.js?v=0.53.0'),
     import('./src/knight-side-053.js?v=0.53.0')
    ]);
    const atlas=getKnightFinal();await atlas.loading;
    if(!atlas.ready||!atlas.completePreview)
     throw Error('Expected eight-way isolated knight preview');
    const load=url=>new Promise((resolve,reject)=>{
     const img=new Image();img.onload=()=>resolve(img);
     img.onerror=()=>reject(Error('Missing original sprite '+url));img.src=url;
    });
    const cell=document.createElement('canvas');
    cell.width=cell.height=72;
    const ctx=cell.getContext('2d',{willReadFrequently:true});
    ctx.imageSmoothingEnabled=false;
    const scales=KNIGHT_SIDE_053.normalization;
    let verified=0,visible=0;
    for(const [clip,frames] of Object.entries(counts)){
     const folder=['idle','walk','dash','hurt','death'].includes(clip)?
      'north-052':'north-051';
     const [side,north]=await Promise.all([
      load('/assets/knight/side-053/'+clip+'-side.png?v=0.53.0'),
      load('/assets/knight/'+folder+'/'+clip+'-up.png?v=0.53.0')
     ]);
     const composited=atlas.images[clip].getContext('2d',{
      willReadFrequently:true
     });
     for(let row=1;row<8;row++){
      const raw=[1,2,6,7].includes(row)?side:north;
      const xs=scales.xByRow[row],ys=scales.otherY;
      const w=Math.round(72*xs),h=Math.round(72*ys);
      const dx=Math.round(36*(1-xs)),dy=Math.round(59*(1-ys));
      for(let frame=0;frame<frames;frame++){
       // Render ONE isolated PNG cell, without any previous figure, into
       // a 72px viewport; this is the ground truth for the final atlas.
       ctx.clearRect(0,0,72,72);
       ctx.drawImage(raw,frame*72,row*72,72,72,dx,dy,w,h);
       const expected=ctx.getImageData(0,0,72,72).data;
       const actual=composited.getImageData(frame*72,row*72,72,72).data;
       // Nearest-neighbour sampling of a large PNG and a canvas-backed
       // atlas can differ by one or two pixels. Compare visible SILHOUETTES
       // instead of demanding byte-identical colours and alpha values.
       // A leftover static sword/boot/cape produces visible pixels farther
       // from the real painted source and must still fail this gate.
       const hasNearby=(pixels,x,y,threshold)=>{
        for(let yy=Math.max(0,y-2);yy<=Math.min(71,y+2);yy++)
         for(let xx=Math.max(0,x-2);xx<=Math.min(71,x+2);xx++)
          if(pixels[(yy*72+xx)*4+3]>threshold)return true;
        return false;
       };
       let solid=0;
       for(let y=0;y<72;y++)for(let x=0;x<72;x++){
        const p=(y*72+x)*4,ea=expected[p+3],aa=actual[p+3];
        if(ea>64)solid++;
        if(aa>128&&!hasNearby(expected,x,y,64))
         throw Error('Ghost/atlas bleed: '+clip+' row='+row+
          ' frame='+frame+' x='+x+' y='+y+' actual alpha='+aa);
        if(ea>128&&!hasNearby(actual,x,y,64))
         throw Error('Missing source silhouette: '+clip+' row='+row+
          ' frame='+frame+' x='+x+' y='+y+' expected alpha='+ea);
       }
       if(solid<150)throw Error('Missing knight source body '+clip+'/'+row+'/'+frame);
       visible+=solid;verified++;
      }
     }
    }
    return {verified,visible};
   },CLIPS);
   assert.equal(result.verified,532);
   assert.ok(result.visible>532*150);
   console.log(name,'verified',result.verified,'isolated knight animation cells');
   await page.close();
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1});
