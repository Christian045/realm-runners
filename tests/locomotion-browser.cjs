const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 fs.mkdirSync('test-output',{recursive:true});
 for(const [engine,type] of [['chromium',chromium],['webkit',webkit]].filter(([name])=>!process.env.BROWSER_ENGINE||process.env.BROWSER_ENGINE===name)){
  const browser=await type.launch({headless:true,args:engine==='chromium'?['--no-sandbox']:[]});
  try{
   const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8000/');
   const results=await page.evaluate(async()=>{
    const [{HeroSpriteAtlas},{KnightSpriteAtlas},{WALK_STRIDE,drawLocomotionLegs},{beginHeroAction,heroPose},{beginKnightAction,knightPose}]=await Promise.all([
     import('./src/hero-sprites.js?v=0.30.2'),import('./src/knight-sprites.js?v=0.30.2'),import('./src/locomotion.js?v=0.30.2'),import('./src/hero-animation.js'),import('./src/knight-animation.js')]);
    const hero=new HeroSpriteAtlas(),knight=new KnightSpriteAtlas();await knight.loading;
    const c=document.createElement('canvas');c.width=256;c.height=192;const ctx=c.getContext('2d'),results=[];
    const directions={down:{x:0,y:1},right:{x:1,y:0},up:{x:0,y:-1},left:{x:-1,y:0}};
    for(const kind of ['warrior','hunter','mage','glasscannon','summoner','alchemist']){
     const atlas=kind==='warrior'?knight:hero;if(kind!=='warrior'){atlas.select(kind);await atlas.loading;}
     if(!atlas.ready||!atlas.images.legs||!atlas.manifest.locomotion)throw Error('Missing locomotion '+kind);
     const report={kind,directions:{},alternating:{},movingAttacks:{}};
     const contact=document.createElement('canvas');contact.width=960;contact.height=480;const out=contact.getContext('2d');out.fillStyle='#252532';out.fillRect(0,0,960,480);
     let row=0;
     for(const [face,d] of Object.entries(directions)){
      const hashes=new Set(),attackHashes=new Set(),contacts=[],tops=[];
      for(let frame=0;frame<8;frame++){
       const p={kind,x:128,y:108,hp:100,direction:d,moving:true,heroMoveDirection:d,knightMoveDirection:d,walkDistance:frame*WALK_STRIDE/8,walkCycle:frame/8*.54*14};
       ctx.clearRect(0,0,256,192);atlas.draw(ctx,p,0);
       // Compare the complete authored silhouette with the composed walking
       // frame. A rectangular hip cut used to delete the centre of robes.
       const pose=kind==='warrior'?knightPose(p,0):heroPose(p,0);
       const rig=atlas.manifest.aimRig;
       const f=rig?rig.frames[face][pose.frame]:atlas.manifest.frames[face][pose.row*(kind==='warrior'?8:6)+pose.frame];
       const ref=document.createElement('canvas');ref.width=256;ref.height=192;
       const rc=ref.getContext('2d');rc.imageSmoothingEnabled=false;
       const scale=76/f.h,root=(f.walkRootX??f.anchorX)*scale;
       if(f.flipX){rc.translate(p.x,p.y);rc.scale(-1,1);rc.drawImage(rig?atlas.images.aim:atlas.images[face],f.x,f.y,f.w,f.h,-root,-68,f.w*scale,f.h*scale);}
       else rc.drawImage(rig?atlas.images.aim:atlas.images[face],f.x,f.y,f.w,f.h,Math.round(p.x-root),p.y-68,f.w*scale,f.h*scale);
       const expected=rc.getImageData(0,0,256,192).data,actual=ctx.getImageData(0,0,256,192).data;
       for(let i=3;i<expected.length;i+=4)if(expected[i]>200&&actual[i]<100)throw Error('Missing garment/body pixel '+kind+' '+face+' '+frame);
       const pixels=ctx.getImageData(0,0,256,192).data;
       
       let top=999;for(let y=25;y<68;y++)for(let x=118;x<138;x++)if(pixels[(y*256+x)*4+3]>60)top=Math.min(top,y);tops.push(top);
       const hashLower=()=>{const data=ctx.getImageData(104,90,48,35).data;let h=2166136261;for(let i=0;i<data.length;i++)h=Math.imul(h^data[i],16777619);return h;};
       hashes.add(hashLower());
       out.drawImage(c,80,24,96,104,frame*120+12,row*120+12,96,104);out.fillStyle='#fff';out.font='10px sans-serif';out.fillText(face+' '+frame,frame*120+2,row*120+11);
       // Probe the real limb raster before a down-pointing weapon can occlude it.
       if(face==='down'||face==='up'){
        ctx.clearRect(0,0,256,192);drawLocomotionLegs(ctx,p,{face,direction:d},atlas.manifest.locomotion,atlas.images.legs);
        const legs=ctx.getImageData(0,0,256,192).data;
        const foot=(from,to)=>{let bottom=-999;for(let y=100;y<128;y++)for(let x=128+from;x<=128+to;x++)if(legs[(y*256+x)*4+3]>60)bottom=Math.max(bottom,y-108);return bottom;};
        contacts.push([foot(-15,-5),foot(5,15)]);
       }
       if(kind==='warrior')beginKnightAction(p,'attack1',.6);else beginHeroAction(p,'attack',.6);
       (p.knightAction||p.heroAction).elapsed=.3;
       ctx.clearRect(0,0,256,192);atlas.draw(ctx,p,0);attackHashes.add(hashLower());
      }
      report.directions[face]={unique:hashes.size,headDrift:Math.max(...tops)-Math.min(...tops)};
      report.movingAttacks[face]=attackHashes.size;
      if(contacts.length)report.alternating[face]={first:contacts[0],opposite:contacts[4]};
      row++;
     }
     if(kind==='warrior'){
      let samples=0,missing=0;
      const inside=(x,y,poly)=>{let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++)if((poly[i][1]>y)!==(poly[j][1]>y)&&x<(poly[j][0]-poly[i][0])*(y-poly[i][1])/(poly[j][1]-poly[i][1])+poly[i][0])hit=!hit;return hit;};
      for(const [face,d] of Object.entries(directions))for(let combo=1;combo<=3;combo++)for(let frame=0;frame<8;frame++){
       const f=atlas.manifest.frames[face][(combo+1)*8+frame];if(!f.blade)continue;
       const p={kind,x:128,y:108,hp:100,direction:d,moving:false,heroMoveDirection:d,walkDistance:WALK_STRIDE/8};
       beginKnightAction(p,'attack'+combo,.6);p.knightAction.elapsed=(frame+.01)/8*.6;
       ctx.clearRect(0,0,256,192);atlas.draw(ctx,p,0);const before=ctx.getImageData(0,0,256,192).data;
       p.moving=true;ctx.clearRect(0,0,256,192);atlas.draw(ctx,p,0);const after=ctx.getImageData(0,0,256,192).data;
       for(let sy=0;sy<f.h;sy++)for(let sx=0;sx<f.w;sx++){
        const x=Math.round(p.x-f.anchorX)+sx,y=Math.round(p.y-f.anchorY)+sy;if(y<p.y-18||x<0||x>=256||y<0||y>=192||!inside(sx,sy,f.blade))continue;
        const i=(y*256+x)*4,[r,g,b,a]=before.slice(i,i+4);
        if(a<250||Math.min(r,g,b)<110||Math.max(r,g,b)-Math.min(r,g,b)>55)continue;
        samples++;if(Math.abs(r-after[i])+Math.abs(g-after[i+1])+Math.abs(b-after[i+2])>12)missing++;
       }
      }
      report.bladeChecks={samples,missing};
     }
     report.contact=contact.toDataURL();results.push(report);
    }return results;
   });
   for(const r of results){
    if(r.kind==='warrior'){assert.ok(r.bladeChecks.samples>20);assert.equal(r.bladeChecks.missing,0,'moving legs must not erase the sword');}
    for(const [face,values] of Object.entries(r.directions)){assert.ok(values.unique>=(r.kind==='warrior'?8:6),r.kind+' '+face+' needs distinct complete strides');assert.ok(values.headDrift<=5,r.kind+' '+face+' torso jumps '+values.headDrift);assert.equal(r.movingAttacks[face],1,r.kind+' fixed attack pose must remain intact '+face);}
    for(const [face,steps] of Object.entries(r.alternating)){
     assert.ok(steps.first[0]>=6&&steps.first[1]<=4,r.kind+' '+face+' left foot must support first: '+JSON.stringify(steps));
     assert.ok(steps.opposite[1]>=6&&steps.opposite[0]<=4,r.kind+' '+face+' right foot must support opposite: '+JSON.stringify(steps));
    }
    fs.writeFileSync('test-output/walk-'+r.kind+'-'+engine+'.png',Buffer.from(r.contact.split(',')[1],'base64'));delete r.contact;console.log(engine,JSON.stringify(r));
   }
   assert.deepEqual(errors,[]);
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exit(1)});
