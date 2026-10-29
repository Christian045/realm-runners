import test from 'node:test';
import assert from 'node:assert/strict';
import {Input} from '../src/input.js';

test('pause, inventory and focus loss cannot leave queued actions or held movement',()=>{
 const input=Object.create(Input.prototype);
 input.keys=new Set(['KeyW','KeyF','Space']);
 input.mouse={down:true,active:true,x:130,y:90};
 input.mobileAttack=true;
 input.dashQueued=true;input.abilityQueued=true;
 input.stick={x:1,y:.5};
 input.aim={x:0,y:1};
 const moved=[];
 const original=globalThis.document;
 globalThis.document={querySelector(selector){
  assert.equal(selector,'#joystick');
  return {style:{setProperty:(name,value)=>moved.push([name,value])}};
 }};
 try{
  assert.equal(input.attacking(),true);
  input.resetTransient();
  assert.equal(input.attacking(),false);
  assert.deepEqual(input.movement(),{x:0,y:0});
  assert.equal(input.consumeDash(),false);
  assert.equal(input.consumeAbility(),false);
  assert.equal(input.keys.size,0);
  assert.equal(input.mouse.down,false);
  assert.equal(input.mouse.active,false);
  assert.deepEqual(input.stick,{x:0,y:0});
  assert.deepEqual(input.aim,{x:0,y:1},'aim direction should remain stable');
  assert.deepEqual(moved,[['--sx','0px'],['--sy','0px']]);
 }finally{
  if(original===undefined)delete globalThis.document;else globalThis.document=original;
 }
});

test('input reset also works when a joystick is missing',()=>{
 const input=Object.create(Input.prototype);
 input.keys=new Set(['KeyD']);input.mouse={down:true,active:false};
 input.stick={x:1,y:0};input.dashQueued=true;input.abilityQueued=true;input.mobileAttack=true;
 const original=globalThis.document;
 globalThis.document={querySelector:()=>null};
 try{
  assert.doesNotThrow(()=>input.resetTransient());
  assert.equal(input.keys.size,0);
  assert.equal(input.consumeDash(),false);
  assert.equal(input.consumeAbility(),false);
 }finally{
  if(original===undefined)delete globalThis.document;else globalThis.document=original;
 }
});
