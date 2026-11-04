const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 for(const [name,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   await page.goto('http://127.0.0.1:8000/?newKnight=1');
   const result=await page.evaluate(async({capture})=>{
    const [{HeroSpriteAtlas},{KnightSpriteAtlas},{articulatedPose,RIG_KINDS},{heroShot}]=await Promise.all([
     import('./src/hero-sprites.js?v=0.40.0'),import('./src/knight-sprites.js?v=0.43.0'),import('./src/articulated-hero.js?v=0.40.0'),import('./src/hero-aim.js?v=0.40.0')]);
    const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;const ctx=canvas.getContext('2d');let checked=0,sockets=0;
    const gallery=capture?document.createElement('canvas'):null;
    if(gallery){gallery.width=1280;gallery.height=1350;}
    const gc=gallery?.getContext('2d');if(gc)gc.imageSmoothingEnabled=false;
    const combos=capture?document.createElement('canvas'):null;
    if(combos){combos.width=1280;combos.height=900;}
    const cc=combos?.getContext('2d');if(cc)cc.imageSmoothingEnabled=false;
    const featured=['warrior','mage','summoner'];
    for(const kind of RIG_KINDS){
     const atlas=kind==='warrior'?new KnightSpriteAtlas():new HeroSpriteAtlas();if(kind!=='warrior')atlas.select(kind);await atlas.loading;
     const rig=kind==='warrior'?atlas.painted:(atlas.rig||atlas.rigs[kind]);if(!rig?.ready)throw Error('New art missing: '+kind);
     for(let row=0;row<8;row++)for(const clip of ['idle','walk','attack','special','dash','hurt','death']){
      const a=Math.PI/2+row*Math.PI/4,direction={x:Math.cos(a),y:Math.sin(a)},p={kind,x:128,y:128,hp:100,direction,moving:clip==='walk',walkDistance:23,heroMoveDirection:direction,knightMoveDirection:direction};
      if(clip==='death'){p.hp=0;p.heroDeathElapsed=.8;p.knightDeathElapsed=.8;}
      else if(!['idle','walk'].includes(clip))p[kind==='warrior'?'knightAction':'heroAction']={clip:kind==='warrior'&&clip==='attack'?'attack1':clip,elapsed:.5,duration:1,direction};
      ctx.clearRect(0,0,256,256);if(!atlas.draw(ctx,p,.4))throw Error('Empty render');
      if(articulatedPose(p).row!==row)throw Error('Wrong view');
      const pixels=ctx.getImageData(0,0,256,256).data;let count=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i]>30)count++;
      if(count<(kind==='warrior'?125:400))throw Error('Missing character '+kind+' '+clip);checked++;
      if(capture&&featured.includes(kind)&&clip==='attack'){
       const which=featured.indexOf(kind),contact=kind==='warrior'?3/8:3/6;
       const phases=[kind==='warrior'?.19:.24,contact,.68];
       for(let i=0;i<3;i++){
        const x=row*160,y=(which*3+i)*150;
        gc.fillStyle='#122027';gc.fillRect(x,y,160,150);
        gc.fillStyle='#566872';gc.font='12px monospace';
        gc.fillText(kind+' '+['wind','hit','recover'][i]+' '+row,x+8,y+18);
        const hero={...p,x:x+80,y:y+120},actionKey=kind==='warrior'?'knightAction':'heroAction';
        if(hero[actionKey])hero[actionKey]={...hero[actionKey],elapsed:phases[i]};
        if(!atlas.draw(gc,hero,phases[i]))throw Error('Gallery draw missing '+kind);
       }
       if(kind==='warrior')for(const [comboIndex,combo] of ['attack2','attack3'].entries()){
        const cHit=.5,wind=combo==='attack2'?.25:.28;
        for(let phase=0;phase<3;phase++){
         const x=row*160,y=(comboIndex*3+phase)*150;
         cc.fillStyle='#122027';cc.fillRect(x,y,160,150);
         cc.fillStyle='#566872';cc.font='12px monospace';cc.fillText(combo+' '+['wind','hit','recover'][phase]+' '+row,x+6,y+18);
         const actor={...p,x:x+80,y:y+120,knightAction:{...p.knightAction,clip:combo,elapsed:[wind,cHit,.68][phase]}};
         if(!atlas.draw(cc,actor,[wind,cHit,.68][phase]))throw Error('Combo preview missing '+combo);
        }
       }
      }
      if(kind!=='warrior'&&clip==='attack'){
       const shot=heroShot(p),near=ctx.getImageData(Math.round(shot.x)-5,Math.round(shot.y)-5,11,11).data;
       if(!near.some((value,i)=>i%4===3&&value>30))throw Error('Detached projectile '+kind+' '+row);sockets++;
      }
     }
    }
    return {checked,sockets,preview:capture?gallery.toDataURL('image/png'):null,combos:capture?combos.toDataURL('image/png'):null};
   },{capture:name==='chromium'});assert.equal(result.checked,336);assert.equal(result.sockets,40);
   if(result.preview){
    fs.mkdirSync('test-output',{recursive:true});
    fs.writeFileSync('test-output/combat-choreography-chromium.png',Buffer.from(result.preview.split(',')[1],'base64'));
    fs.writeFileSync('test-output/knight-combos-chromium.png',Buffer.from(result.combos.split(',')[1],'base64'));
   }
   console.log(name,'production rigs:',{checked:result.checked,sockets:result.sockets});
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1});
