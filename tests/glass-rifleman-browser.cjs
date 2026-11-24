const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');

(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.goto('http://127.0.0.1:8000/');
  await page.locator('[data-action="class:glasscannon"]').tap();
  await page.locator('[data-action="start"]').tap();
  await page.locator('#overlay').waitFor({state:'hidden'});
  for(const id of ['joystick','attackTouch','dashTouch','abilityTouch'])assert.ok(await page.locator('#'+id).isVisible());
  const result=await page.evaluate(async()=>{
   const {HeroSpriteAtlas}=await import('./src/hero-sprites.js?v=0.76.3');
   const {labSample,LAB_DIRECTIONS}=await import('./src/animation-lab.js?v=0.76.3');
   const atlas=new HeroSpriteAtlas();atlas.select('glasscannon');await atlas.loading;
   if(!atlas.ready||!atlas.rifleman.ready)throw Error('Rifleman failed to load');
   const gallery=document.createElement('canvas');gallery.width=8*104;gallery.height=7*94;
   const ctx=gallery.getContext('2d');let cells=0;
   for(const [row,clip] of ['idle','walk','attack','special','dash','hurt','death'].entries()){
    for(const [col,d] of LAB_DIRECTIONS.entries()){
     const {player,shot}=labSample('glasscannon',clip,d,clip==='death'?.95:.5,clip==='attack');
     if(clip==='attack'){player.heroMoveDirection={x:-d.x,y:-d.y};player.walkDistance=18;}
     player.x=0;player.y=0;
     ctx.save();ctx.translate(col*104+52,row*94+78);
     if(!atlas.draw(ctx,player,.5))throw Error('Missing pose');
     ctx.restore();
     if(!Number.isFinite(shot.x+shot.y))throw Error('Invalid muzzle');
     const pixels=ctx.getImageData(col*104,row*94,104,94).data;
     if(!pixels.some((v,i)=>i%4===3&&v>150))throw Error('Empty pose');
     cells++;
    }
   }
   return {cells,image:gallery.toDataURL()};
  });
  assert.equal(result.cells,56);assert.deepEqual(errors,[]);
  if(process.env.RIFLE_GALLERY)fs.writeFileSync(process.env.RIFLE_GALLERY,Buffer.from(result.image.split(',')[1],'base64'));
  console.log('Glaskanonier: Dungeon on mobile and all 56 state/direction combinations passed.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
