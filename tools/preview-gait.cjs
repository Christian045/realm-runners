// Deterministic in-engine QA capture. Start the local server on port 8000 first.
// ffmpeg -framerate 60 -i test-output/gait-video/%04d.png -c:v libx264 -pix_fmt yuv420p test-output/gait-preview.mp4
const {chromium}=require('playwright'),fs=require('node:fs');
(async()=>{
 const folder='test-output/gait-video';fs.mkdirSync(folder,{recursive:true});
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
  const page=await browser.newPage();await page.goto('http://127.0.0.1:8000/');
  await page.evaluate(async()=>{
   const {HeroSpriteAtlas}=await import('./src/hero-sprites.js?v=0.31.0'),{KnightSpriteAtlas}=await import('./src/knight-sprites.js?v=0.31.0'),{advanceLocomotion}=await import('./src/locomotion.js?v=0.31.0'),{CLASSES}=await import('./src/data.js');
   const actors=[];for(const kind of ['warrior','hunter','mage','glasscannon','summoner','alchemist']){const atlas=kind==='warrior'?new KnightSpriteAtlas():new HeroSpriteAtlas();if(kind!=='warrior')atlas.select(kind);await atlas.loading;if(!atlas.ready)throw Error('Missing '+kind);actors.push({atlas,kind,speed:CLASSES[kind].speed,name:CLASSES[kind].name,p:{kind,x:0,y:0,hp:100,walkDistance:0,direction:{x:1,y:0}}});}
   const c=document.createElement('canvas');c.width=720;c.height=480;const ctx=c.getContext('2d');
   window.renderGait=frame=>{
    const dt=1/60,walking=frame>=30&&frame<510,dirs=[{x:1,y:0},{x:0,y:1},{x:-1,y:0},{x:0,y:-1}],d=dirs[Math.max(0,Math.floor((frame-30)/120))%4];
    ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,720,480);
    actors.forEach((s,i)=>{
     const p=s.p,fromX=p.x,fromY=p.y;if(walking){p.direction=d;p.x+=d.x*s.speed*dt;p.y+=d.y*s.speed*dt;}advanceLocomotion(p,fromX,fromY,false,dt);
     ctx.save();ctx.translate(i%3*240,Math.floor(i/3)*240);ctx.beginPath();ctx.rect(0,0,240,240);ctx.clip();ctx.scale(2,2);
     ctx.fillStyle='#182e2b';ctx.fillRect(0,0,120,120);ctx.strokeStyle='#2e4540';ctx.lineWidth=.5;
     for(let x=-32;x<152;x+=32)for(let y=-32;y<152;y+=32)ctx.strokeRect(x-(p.x%32),y-(p.y%32),32,32);
     ctx.fillStyle='#07141390';ctx.beginPath();ctx.ellipse(60,92,20,8,0,0,Math.PI*2);ctx.fill();
     s.atlas.draw(ctx,{...p,x:60,y:83},frame/60);ctx.fillStyle='#eedfbc';ctx.font='7px sans-serif';ctx.fillText(s.name,5,10);ctx.restore();
    });return c.toDataURL().split(',')[1];
   };
  });
  for(let frame=0;frame<540;frame++){const data=await page.evaluate(frame=>window.renderGait(frame),frame);fs.writeFileSync(folder+'/'+String(frame).padStart(4,'0')+'.png',Buffer.from(data,'base64'));}
 }finally{await browser.close();}
})();
