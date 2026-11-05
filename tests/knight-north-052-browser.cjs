// Pixel-art integration check for the complete N/NW/NE idle/walk/hurt/dash/death set.
// The normal game MUST remain on the old stable renderer unless previewKnightUp is set.
const {chromium,webkit}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const clips={idle:6,walk:8,hurt:6,dash:8,death:8};
(async()=>{
 fs.mkdirSync('test-output',{recursive:true});
 for(const [name,driver] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await driver.launch({headless:true,args:name==='chromium'?['--no-sandbox']:[]});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8000/?previewKnightUp=1&v=0.53.0');
   const result=await page.evaluate(async clipCounts=>{
    const {getKnightFinal}=await import('./src/knight-final.js?v=0.53.0');
    const {KNIGHT_NORTH_052}=await import('./src/knight-north-051.js?v=0.53.0');
    const atlas=getKnightFinal();await atlas.loading;
    if(!atlas.ready||!atlas.imageReady||atlas.reviewScale!==.90)
     throw Error('Alpha 0.52 PNGs were not loaded in the actual renderer');
    const gallery=document.createElement('canvas');
    gallery.width=8*144;gallery.height=15*144;
    const g=gallery.getContext('2d');g.imageSmoothingEnabled=false;
    g.fillStyle='#1a2732';g.fillRect(0,0,gallery.width,gallery.height);
    let count=0;const unique={};
    for(const [ci,[clip,frames]] of Object.entries(clipCounts).entries())
     for(const [di,row] of [3,4,5].entries()){
      const appearances=new Set(),boots=new Set();
      for(let frame=0;frame<frames;frame++){
       const c=atlas.frame(row,clip,frame);
       if(!c||c.width!==144||c.height!==144)throw Error('Missing knight frame');
       const data=c.getContext('2d').getImageData(0,0,144,144).data;
       let shown=0,h=2166136261,hb=2166136261;
       for(let y=0;y<144;y++)for(let x=0;x<144;x++){
        const i=(y*144+x)*4;
        if(data[i+3]>60)shown++;
        const val=(data[i]<<16)|(data[i+1]<<8)|data[i+2]|(data[i+3]<<24);
        h=Math.imul(h^val,16777619);
        if(y>=90&&y<=130&&x>=40&&x<=110)hb=Math.imul(hb^val,16777619);
       }
       if(shown<1800)throw Error('Nearly empty knight frame '+row+' '+clip+' '+frame);
       appearances.add(h>>>0);boots.add(hb>>>0);count++;
       g.drawImage(c,frame*144,(ci*3+di)*144);
      }
      unique[clip+'-'+row]={poses:appearances.size,boots:boots.size};
      if(appearances.size<({idle:4,walk:8,hurt:5,dash:7,death:8}[clip]))
       throw Error('Frozen animation '+clip+' '+row);
      if(clip==='walk'&&boots.size!==8)throw Error('Feet are not alternating '+row);
      if(clip==='idle'&&boots.size!==1)throw Error('Feet drift while idle '+row);
     }
    if(count!==108||!KNIGHT_NORTH_052.completeUpperDirections||
       KNIGHT_NORTH_052.completeAllDirections)throw Error('Unfinished directions falsely enabled');
    // Test a real production draw in each upper direction, not only raw tiles.
    const out=document.createElement('canvas');out.width=600;out.height=400;
    const ctx=out.getContext('2d');
    for(const [i,row] of [3,4,5].entries()){
     const direction={x:Math.cos(Math.PI/2+row*Math.PI/4),y:Math.sin(Math.PI/2+row*Math.PI/4)};
     const p={kind:'warrior',x:100+i*190,y:320,hp:100,invulnerable:0,
       direction,knightMoveDirection:direction,moving:true,knightWalkDistance:55};
     if(!atlas.draw(ctx,p,1))throw Error('New art is not used by production renderer');
    }
    return {count,unique,screenshot:gallery.toDataURL('image/png'),
      render:out.toDataURL('image/png')};
   },clips);
   assert.equal(result.count,108);
   assert.deepEqual(errors,[]);
   fs.writeFileSync('test-output/knight-north-052-gallery-'+name+'.png',
     Buffer.from(result.screenshot.split(',')[1],'base64'));
   fs.writeFileSync('test-output/knight-north-052-in-game-render-'+name+'.png',
     Buffer.from(result.render.split(',')[1],'base64'));
   await page.locator('[data-action="class:warrior"]').click();
   await page.locator('[data-action="start"]').click();
   await page.locator('#overlay').waitFor({state:'hidden'});
   await page.waitForTimeout(220);
   assert.deepEqual(errors,[]);
   await page.screenshot({path:'test-output/knight-north-052-live-'+name+'.png'});
   // The standard game must not load the unfinished north sprite assets.
   const defaultPage=await browser.newPage({viewport:{width:1200,height:760}});
   await defaultPage.goto('http://127.0.0.1:8000/?v=0.53.0');
   const guard=await defaultPage.evaluate(async()=>{
    const {getKnightFinal}=await import('./src/knight-final.js?v=0.53.0');
    const knight=getKnightFinal();await knight.loading;
    return {ready:knight.ready,
      preview:knight.reviewScale??1,
      requestedNewAssets:performance.getEntriesByType('resource')
       .some(x=>x.name.includes('/knight/north-052/'))};
   });
   assert.deepEqual(guard,{ready:true,preview:1,requestedNewAssets:false});
   await defaultPage.close();
   console.log(name,'108 authentic animated upper-direction PNGs + live dungeon + default guard',result.count);
  }finally{await browser.close()}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
