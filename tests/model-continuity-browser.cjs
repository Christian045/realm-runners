const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
 for(const [engineName,engine] of [['chromium',chromium],['webkit',webkit]]){
  const browser=await engine.launch({headless:true,args:engineName==='chromium'?['--no-sandbox']:[]});
  try{
   const page=await browser.newPage({viewport:{width:1000,height:700}});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto('http://127.0.0.1:8000/');
   const result=await page.evaluate(async()=>{
    const [{HeroSpriteAtlas},{KnightSpriteAtlas},{heroPose,beginHeroAction},{knightPose,beginKnightAction}]=await Promise.all([
     import('./src/hero-sprites.js?v=0.36.0'),
     import('./src/knight-sprites.js?v=0.36.0'),
     import('./src/hero-animation.js?v=0.31.0'),
     import('./src/knight-animation.js?v=0.31.0')
    ]);
    const directions={down:{x:0,y:1},right:{x:1,y:0},up:{x:0,y:-1},left:{x:-1,y:0}};
    const classes=['warrior','mage','summoner','hunter','glasscannon','alchemist'];
    const modern=['warrior','mage','summoner'];
    let checked=0;
    const reports=[];
    for(const kind of classes){
     const atlas=kind==='warrior'?new KnightSpriteAtlas():new HeroSpriteAtlas();
     if(kind!=='warrior')atlas.select(kind);
     await atlas.loading;
     if(!atlas.ready)throw Error('sprite atlas unavailable '+kind);
     if(modern.includes(kind)&&!atlas.images.walk)throw Error('model missing '+kind);
     for(const [face,d] of Object.entries(directions)){
      const clips=kind==='warrior'?
       ['idle','walk','attack1','attack2','attack3','special','dash','hurt','death']:
       ['idle','walk','attack','special','dash','hurt','death'];
      const previous={};
      for(const clip of clips){
       const p={kind,x:90,y:104,hp:100,invulnerable:0,moving:clip==='walk',
        direction:d,knightMoveDirection:d,heroMoveDirection:d,
        walkDistance:0,knightWalkDistance:0,robedWalkDistance:0};
       if(clip==='death'){p.hp=0;p.heroDeathElapsed=.6;p.knightDeathElapsed=.6;}
       else if(clip==='hurt')p.hurtTimer=.2;
       else if(!['idle','walk'].includes(clip)){
        if(kind==='warrior'){beginKnightAction(p,clip,.6,d);p.knightAction.elapsed=.3;}
        else{beginHeroAction(p,clip,.6,d);p.heroAction.elapsed=.3;}
       }
       const trace={ops:[],save(){},restore(){},translate(){},scale(){},rotate(){},
        drawImage(...args){this.ops.push(args);},imageSmoothingEnabled:false,globalAlpha:1};
       if(!atlas.draw(trace,p,.5)||!trace.ops.length)throw Error(kind+' '+face+' '+clip+': empty frame');
       const source=trace.ops[0][0];
       if(modern.includes(kind)&&(trace.ops.length!==1||source!==atlas.images.walk))
        throw Error(kind+' '+face+' '+clip+': incorrect character model');
       if(!modern.includes(kind)){
        if(!Object.values(atlas.images).includes(source))throw Error(kind+' '+clip+': unrelated source texture');
       }
       if(modern.includes(kind)&&['idle','walk'].includes(clip)){
        if(previous.idle&&!trace.ops.every((args,i)=>JSON.stringify(args.slice(1))===JSON.stringify(previous.idle[i].slice(1))))
         throw Error(kind+' '+face+': idle/walk transition jumps at stride start');
        previous[clip]=trace.ops;
       }
       checked++;
      }
      reports.push(kind+':'+face);
     }
     if(kind!=='warrior')atlas.release();
    }
    return {checked,reports};
   });
   assert.equal(result.checked,4*(9+5*7));
   assert.equal(result.reports.length,24);
   assert.deepEqual(errors,[]);
   console.log(engineName,'character-model states validated',result.checked);
  }finally{await browser.close();}
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
