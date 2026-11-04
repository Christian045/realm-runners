const {chromium,webkit}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 fs.mkdirSync('test-output',{recursive:true});
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),errors=[];
   page.on('pageerror',error=>errors.push(error.message));
   await page.goto('http://127.0.0.1:8000/?newKnight=1');
   const report=await page.evaluate(async()=>{
    const [{KnightPaintedAtlas,KNIGHT_SWINGS},{KnightSpriteAtlas}]=await Promise.all([
     import('./src/knight-painted.js?v=0.42.0'),import('./src/knight-sprites.js?v=0.42.0')
    ]);
    const pure=new KnightPaintedAtlas(),production=new KnightSpriteAtlas();
    await production.loading;
    if(!production.painted)throw new Error('Knight is still using the puppet rig');
    if(!production.painted.imageReady)throw new Error('New original art atlas missing');
    const cellW=112,cellH=120,canvas=document.createElement('canvas');
    canvas.width=cellW*8;canvas.height=cellH*11;
    const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
    let frames=0,changed=0;
    for(let row=0;row<8;row++){
     const angle=Math.PI/2+row*Math.PI/4,direction={x:Math.cos(angle),y:Math.sin(angle)};
     const states=[['idle',0],['walk',.25]];
     for(const clip of ['attack1','attack2','attack3'])states.push(
      [clip,.125],[clip,KNIGHT_SWINGS[clip].impact/8],[clip,.75]);
     for(let i=0;i<states.length;i++){
      const [clip,t]=states[i],x=row*cellW,y=i*cellH;
      c.fillStyle='#111b24';c.fillRect(x,y,cellW,cellH);
      c.fillStyle='#a58a69';c.font='10px monospace';c.fillText(clip+' '+row,x+5,y+12);
      const p={kind:'warrior',hp:100,x:x+cellW/2,y:y+105,direction,knightMoveDirection:direction,
       knightWalkDistance:t*72,moving:clip==='walk',walkDistance:t*72,invulnerable:0};
      if(clip.startsWith('attack'))p.knightAction={clip,elapsed:t,duration:1,direction};
      if(!production.draw(c,p,t))throw new Error('Production failed '+clip+' '+row);
      const img=pure.frame(row,clip,Math.floor(t*8)%8);
      if(!img)throw new Error('Missing authored full-body '+clip+' '+row);
      frames++;
     }
    }
    const hit={kind:'warrior',hp:100,x:64,y:100,direction:{x:1,y:0},knightAction:{
      clip:'attack1',duration:1,elapsed:.375,direction:{x:1,y:0}},invulnerable:0};
    const a=document.createElement('canvas');a.width=200;a.height=170;
    const ac=a.getContext('2d');pure.draw(ac,hit,0);const b=ac.getImageData(0,0,200,170).data;
    changed=b.some((value,i)=>i%4===3&&value>40)?1:0;
    return {frames,changed,preview:canvas.toDataURL('image/png')};
   });
   assert.equal(report.frames,88);assert.equal(report.changed,1);assert.deepEqual(errors,[]);
   if(name==='chromium')fs.writeFileSync('test-output/knight-pixel-041-contact-sheet.png',
    Buffer.from(report.preview.split(',')[1],'base64'));
   console.log(name,'painted knight browser poses',report.frames);
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
