const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 fs.mkdirSync('test-output',{recursive:true});
 for(const [name,engine]of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],missing=[];
   page.on('pageerror',error=>errors.push(error.message));
   page.on('response',r=>{if(r.status()>=400&&/\/(assets|src)\//.test(r.url()))missing.push(r.url());});
   await page.goto('http://127.0.0.1:8000/?debugAnimations=1');
   const result=await page.evaluate(async()=>{
    const {getHunterProduction}=await import('./src/hunter-production.js?v=0.73.4');
    const {heroShot}=await import('./src/hero-aim.js?v=0.73.4');
    const {Game}=await import('./src/game.js?v=0.73.4');
    const {defaultProgress}=await import('./src/progression.js?v=0.21.0');
    const hunter=getHunterProduction();await hunter.loading;
    if(!hunter.ready||!hunter.identity)throw Error('Approved hunter is not the default');
    const c=document.createElement('canvas');c.width=c.height=200;const g=c.getContext('2d');let cells=0,releases=0;
    const direction=row=>({x:Math.cos(Math.PI/2+row*Math.PI/4),y:Math.sin(Math.PI/2+row*Math.PI/4)});
    for(let row=0;row<8;row++){
     const d=direction(row),input={movement:()=>({x:0,y:0}),aiming:()=>d,attacking:()=>false,consumeDash:()=>false,consumeAbility:()=>false};
     for(let frame=-1;frame<8;frame++){
      const p={kind:'hunter',x:100,y:100,hp:100,direction:d,heroMoveDirection:d,moving:frame>=0,hunterWalkDistance:Math.max(0,frame)*12+.001};
      g.clearRect(0,0,200,200);if(!hunter.draw(g,p))throw Error('Missing identity cell');
      if(!g.getImageData(0,0,200,200).data.some((v,i)=>i%4===3&&v===255))throw Error('Empty identity cell');cells++;
     }
     for(const clip of ['attack','special']){
      const game=new Game(defaultProgress(),input);game.start('hunter',42);game.player.direction=d;
      if(clip==='attack')game.attack();else game.ability();
      const a=game.player.heroAction,shot=heroShot(game.player);
      g.clearRect(0,0,200,200);hunter.draw(g,{...game.player,x:100,y:100});
      const screen=heroShot({...game.player,x:100,y:100});if(g.getImageData(screen.x,screen.y,1,1).data[3]!==255)throw Error('Shot detached from approved bow');
      game.updateHeroAction(a.duration*.95);
      if(game.projectiles.length!==(clip==='attack'?1:7))throw Error('Wrong release count');
      for(const b of game.projectiles)if(b.x!==shot.x||b.y-b.visualHeight!==shot.y)throw Error('Wrong release socket');releases++;
     }
    }
    return {cells,releases};
   });
   assert.deepEqual(result,{cells:72,releases:16});
   await page.locator('[data-action="class:hunter"]').click();
   await page.screenshot({path:'test-output/identity-'+name+'-menu.png'});
   await page.locator('[data-action="animationLab"]').click();
   for(const clip of ['idle','walk','attack','special','dash','hurt','death']){
    await page.locator('[data-lab="state"]').selectOption(clip);
    await page.locator('[data-info="hunter"]').filter({hasText:clip+' · '}).waitFor();
   }
   await page.locator('[data-lab="close"]').click();await page.locator('[data-action="start"]').click();
   await page.locator('#overlay').waitFor({state:'hidden'});
   for(const key of ['w','s','a','d'])await page.keyboard.press(key,{delay:180});
   await page.keyboard.press('f',{delay:200});await page.waitForTimeout(400);
   await page.keyboard.press('q',{delay:180});
   await page.locator('#abilityHud').filter({hasText:/Q · [0-9]/}).waitFor();
   await page.keyboard.press('Space',{delay:100});
   await page.screenshot({path:'test-output/identity-'+name+'-dungeon.png'});
   assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
   console.log(name+': approved hunter default, 72 exact stand/walk cells, 16 bow releases, menu/lab/dungeon and combat smoke passed');
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1});
