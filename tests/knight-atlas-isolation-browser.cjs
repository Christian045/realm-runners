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
   await page.goto('http://127.0.0.1:8000/?v=0.53.0&previewKnightFinal=1');
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
       let solid=0;
       for(let p=0;p<expected.length;p+=4){
        const ea=expected[p+3],aa=actual[p+3];
        if(ea>64)solid++;
        // The intermediate atlas canvas may quantize nearly invisible
        // anti-aliased source pixels (alpha 1..24) differently. Compare
        // perceptible coverage, while still requiring opaque RGB identity.
        if(((ea>24||aa>24)&&Math.abs(ea-aa)>2) ||
          (ea>64&&(Math.abs(expected[p]-actual[p])>3||
            Math.abs(expected[p+1]-actual[p+1])>3||
            Math.abs(expected[p+2]-actual[p+2])>3)))
         throw Error('Unexpected ghost/atlas bleed: '+clip+
          ' row='+row+' frame='+frame+' pixel='+p/4+
          ' expected alpha='+ea+' actual alpha='+aa);
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
