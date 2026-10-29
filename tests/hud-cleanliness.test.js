import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {Renderer} from '../src/render.js';
import {generateDungeon} from '../src/dungeon.js';

function paintRecorder(){
 const labels=[];
 const ctx={
  fillRect(){},save(){},restore(){},beginPath(){},moveTo(){},lineTo(){},
  stroke(){},strokeRect(){},setTransform(){},
  fillText(text){labels.push(text);}
 };
 return {ctx,labels};
}

test('real dungeon floor and minimap never paint room or map text',()=>{
 const d=generateDungeon(2077);
 const game={
  dungeon:d,
  enemies:[],
  player:{x:d.start.x,y:d.start.y},
  camera:{x:Math.max(0,d.start.x-160),y:Math.max(0,d.start.y-160),w:320,h:320},
  time:0
 };
 const {ctx,labels}=paintRecorder();
 const renderer={ctx,tiles:{draw(){return true}},canvas:{width:780,height:1560}};
 Renderer.prototype.map.call(renderer,game);
 const previousWindow=globalThis.window;
 globalThis.window={devicePixelRatio:2};
 try{
  Renderer.prototype.minimap.call(renderer,game);
 }finally{
  if(previousWindow===undefined)delete globalThis.window;
  else globalThis.window=previousWindow;
 }
 assert.deepEqual(labels,[],'no HEILIGTUM, KAMMER or KARTE labels should be painted');
});

test('minimal HUD keeps vital information and removes redundant area and class overlays',()=>{
 const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
 const main=readFileSync(new URL('../src/main.js',import.meta.url),'utf8');
 assert.ok(!html.includes('id="biomeText"'));
 assert.ok(!html.includes('id="classTag"'));
 assert.ok(!main.includes("$('biomeText')"));
 assert.ok(!main.includes("$('classTag')"));
 for(const id of ['hpText','hpFill','roomText','coinText','dashLabel',
  'abilityLabel','bossHud','bossName','bossHint']){
  assert.ok(html.includes('id="'+id+'"'),'required HUD field '+id+' missing');
 }
 assert.ok(main.includes("hint.classList.toggle('hidden'"));
 assert.ok(main.includes("dash.classList.toggle('ready'"));
 assert.ok(main.includes("ability.classList.toggle('ready'"));
});
