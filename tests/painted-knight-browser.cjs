const {chromium,webkit}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 fs.mkdirSync('test-output',{recursive:true});
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8000/');
   const result=await page.evaluate(async({capture})=>{
    const [{KnightSpriteAtlas},{KNIGHT_SHEET_CELL,KNIGHT_SHEET_FRAMES,knightFinalFrame}]=await Promise.all([
     import('./src/knight-sprites.js?v=0.59.0'),
     import('./src/knight-final.js?v=0.59.0')
    ]);
    const atlas=new KnightSpriteAtlas();await atlas.loading;
    if(!atlas.painted?.imageReady)throw Error('Missing transparent real full-body sheets');
    if(atlas.painted.frames.size>16)throw Error('Unexpected large WebKit frame cache');
    let checked=0;
    const frameCount=Object.values(KNIGHT_SHEET_FRAMES).reduce((a,b)=>a+b,0);
    for(let row=0;row<8;row++)for(const [clip,count] of Object.entries(KNIGHT_SHEET_FRAMES)){
     let changed=new Set(),shins=new Set();
     for(let frame=0;frame<count;frame++){
      const tile=atlas.painted.frame(row,clip,frame);
      if(tile.width!==KNIGHT_SHEET_CELL||tile.height!==KNIGHT_SHEET_CELL)
       throw Error('Invalid original frame bounds '+clip);
      const g=tile.getContext('2d'),full=g.getImageData(0,0,144,144).data;
      let colored=0,sole=0,hash=2166136261;
      for(let y=0;y<144;y++)for(let x=0;x<144;x++){
       const i=(y*144+x)*4;
       if(full[i+3]>55){colored++;if(y>=104&&y<=133&&x>27&&x<116)sole++;}
      }
      if(colored<400||sole<12)throw Error('Missing full-body or boots '+clip+' '+row+' '+frame);
      const shin=g.getImageData(42,108,63,27).data;
      for(let n=0;n<shin.length;n+=4)hash=Math.imul(hash^shin[n+3],16777619)^shin[n];
      shins.add(hash>>>0);
      changed.add(full.filter((_,i)=>i%40===0).reduce((a,v)=>Math.imul(a^v,16777619),2166136261)>>>0);
      checked++;
     }
     if(clip==='walk'&&shins.size<5)throw Error('Legs do not alternate in view '+row);
     if(clip.startsWith('attack')&&changed.size<4)throw Error('Attack is frozen in view '+row+' '+clip);
    }
    if(checked!==frameCount*8)throw Error('Missing authored frames');
    const canvas=document.createElement('canvas');canvas.width=8*158;canvas.height=5*170;
    const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;
    const clipNames=Object.keys(KNIGHT_SHEET_FRAMES);
    for(let y=0;y<clipNames.length;y++)for(let row=0;row<8;row++){
     const clip=clipNames[y],angle=Math.PI/2+row*Math.PI/4;
     const direction={x:Math.cos(angle),y:Math.sin(angle)};
     const p={kind:'warrior',x:row*158+79,y:y*170+140,hp:100,
      moving:clip==='walk',direction,knightMoveDirection:direction,
      knightWalkDistance:30,walkDistance:30,invulnerable:0};
     if(clip.startsWith('attack'))p.knightAction={clip,duration:1,elapsed:clip==='attack1'?.375:.5,direction};
     g.fillStyle='#121c24';g.fillRect(row*158,y*170,158,170);
     if(!atlas.draw(g,p,.5))throw Error('Production render missing '+row+' '+clip);
    }
    return {checked,screenshot:capture?canvas.toDataURL('image/png'):null};
   },{capture:name==='chromium'});
   assert.equal(result.checked,320);
   assert.deepEqual(errors,[]);
   if(result.screenshot)fs.writeFileSync('test-output/knight-v044-original-sprites.png',
    Buffer.from(result.screenshot.split(',')[1],'base64'));
   // Test the actual main-menu -> dungeon path with the same opt-in
   // renderer. A standalone atlas screenshot is insufficient acceptance:
   // the previous versions passed sprite tests but displayed old art ingame.
   await page.locator('[data-action="class:warrior"]').click();
   await page.locator('[data-action="start"]').click();
   await page.locator('#overlay').waitFor({state:'hidden'});
   const live=await page.evaluate(async()=>{
    const [{KnightSpriteAtlas},{KnightFinalAtlas}]=await Promise.all([
     import('./src/knight-sprites.js?v=0.59.0'),
     import('./src/knight-final.js?v=0.59.0')
    ]);
    const knight=new KnightSpriteAtlas();await knight.loading;
    if(!(knight.painted instanceof KnightFinalAtlas)||!knight.painted.ready)
     throw Error('Gameplay still selecting obsolete procedural knight');
    const game=document.querySelector('#gameCanvas');
    if(!game||!game.width||!game.height)throw Error('No live game canvas');
    return {newArt:knight.painted.ready,canvas:game.width+'x'+game.height};
   });
   assert.equal(live.newArt,true);assert.deepEqual(errors,[]);
   if(name==='chromium')await page.screenshot({path:'test-output/knight-v044-live-game.png'});
   console.log(name,'whole-frame knight state tests',result.checked,'live game',live.canvas);
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
