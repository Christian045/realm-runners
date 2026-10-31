// Pixel-level QA of the production full-body run cycles in Chromium and WebKit.
// Full authored strides, not synthetic procedural legs or aiming-only attack poses.
const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 fs.mkdirSync('test-output',{recursive:true});
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]].filter(([name])=>!process.env.BROWSER_ENGINE||process.env.BROWSER_ENGINE===name)){
  const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
  try{
   const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
   page.on('pageerror',err=>errors.push(err.message));
   await page.goto('http://127.0.0.1:8000/');
   const results=await page.evaluate(async()=>{
    const [{HeroSpriteAtlas},{KnightSpriteAtlas},{WALK_STRIDE},{findGroundContact}]=await Promise.all([
     import('./src/hero-sprites.js?v=0.32.0'),
     import('./src/knight-sprites.js?v=0.34.0'),
     import('./src/locomotion.js?v=0.31.0'),
     import('./src/grounded-walk.js?v=0.32.0')]);
    const dirs={down:{x:0,y:1},right:{x:1,y:0},up:{x:0,y:-1},left:{x:-1,y:0}};
    const all=[];
    for(const kind of ['warrior','hunter','mage','glasscannon','summoner','alchemist']){
     const atlas=kind==='warrior'?new KnightSpriteAtlas():new HeroSpriteAtlas();
     if(kind!=='warrior')atlas.select(kind);
     await atlas.loading;
     if(!atlas.ready)throw Error('Atlas unavailable: '+kind);
     if(kind==='warrior'&&!atlas.images.walk)throw Error('New knight walk sheet was not decoded');
     const frames=kind==='warrior'?8:6;
     const report={kind,faces:{}};
     const sheet=document.createElement('canvas');sheet.width=frames*112;sheet.height=4*140;
     const sc=sheet.getContext('2d');sc.imageSmoothingEnabled=false;
     for(const [face,d] of Object.entries(dirs)){
      const contacts=[],hashes=new Set(),uniqueSources=new Set();
      for(let i=0;i<frames;i++){
       const p={kind,x:80,y:103,hp:100,invulnerable:0,moving:true,
        direction:d,heroMoveDirection:d,knightMoveDirection:d,
        walkDistance:WALK_STRIDE*i/frames};
       const frame=atlas.manifest.frames[face][frames+i];
       const calls=[];
       const trace={save(){},restore(){},translate(){},scale(){},drawImage(...args){calls.push(args);},imageSmoothingEnabled:false};
       atlas.draw(trace,p,0);
       const image=kind==='warrior'?atlas.images.walk:atlas.images[face];
       const sourceX=kind==='warrior'?i*96:frame.x;
       const sourceY=kind==='warrior'?({down:0,right:1,up:2,left:3}[face])*96:frame.y;
       if(calls.length!==1||calls[0][0]!==image||
        calls[0][1]!==sourceX||calls[0][2]!==sourceY)
        throw Error(kind+' '+face+' '+i+': incorrect walk sprite source');
       uniqueSources.add(sourceX+':'+sourceY);
       const c=document.createElement('canvas');c.width=160;c.height=140;
       const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
       atlas.draw(ctx,p,0);
       const raw=ctx.getImageData(0,0,160,140).data;
       const contact=findGroundContact(raw,160,140,p.x);
       if(contact===null)throw Error('No grounded foot '+kind+' '+face+' '+i);
       contacts.push(contact);
       let hash=2166136261;
       for(let j=0;j<raw.length;j+=4)if(raw[j+3]>110){
        hash=Math.imul(hash^(j+raw[j]*11+raw[j+1]*7),16777619);
       }
       hashes.add(hash);
       sc.drawImage(c,20,8,120,125,
        8+i*112,10+Object.keys(dirs).indexOf(face)*140,96,120);
      }
      report.faces[face]={contacts,unique:hashes.size,sourceFrames:uniqueSources.size,
       drift:Math.max(...contacts)-Math.min(...contacts)};
     }
     report.preview=sheet.toDataURL('image/png');
     all.push(report);
     if(kind!=='warrior')atlas.release();
    }
    return all;
   });
   for(const report of results){
    for(const [face,v] of Object.entries(report.faces)){
     assert.equal(v.sourceFrames,report.kind==='warrior'?8:6,report.kind+' '+face+' walk source frames missing');
     assert.ok(v.unique>=(report.kind==='warrior'?7:5),report.kind+' '+face+' feet/cloth not animating');
     assert.ok(v.drift<=4,report.kind+' '+face+' bounces at ground by '+v.drift+' px');
     assert.ok(v.contacts.every(y=>y>=107&&y<=117),report.kind+' '+face+' feet float away from shadow '+v.contacts);
    }
    fs.writeFileSync('test-output/walk-v034-'+report.kind+'-'+engine+'.png',Buffer.from(report.preview.split(',')[1],'base64'));
    delete report.preview;
    console.log(engine,JSON.stringify(report));
   }
   assert.deepEqual(errors,[]);
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
