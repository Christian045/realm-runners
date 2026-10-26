'use strict';
// Original procedural artwork. Cached woodland planes + pixel-character animation.
// All coordinates use the original 960 × 540 gameplay space; art never changes hitboxes.
let visualTime=0,quality='full';
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
try{quality=localStorage.getItem('realm-runners-quality')==='low'?'low':'full';}catch{}
function qualityLabel(){$('#quality').textContent='Grafik: '+(quality==='full'?'Voll':'Sparsam');}
qualityLabel();$('#quality').onclick=()=>{quality=quality==='full'?'low':'full';qualityLabel();try{localStorage.setItem('realm-runners-quality',quality);}catch{}};
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let n=Math.imul(seed^seed>>>15,1|seed);n=n+Math.imul(n^n>>>7,61|n)^n;return((n^n>>>14)>>>0)/4294967296;};}
function ellipse(c,x,y,rx,ry,color){c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();}
function poly(c,points,color){c.fillStyle=color;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fill();}
function line(c,x,y,xx,yy,color,width=1){c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();}
function glow(x,y,r,color){let g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color);g.addColorStop(1,'#b9e9b000');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
const planes=[];
function makePlane(index){const c=document.createElement('canvas');c.width=1600;c.height=540;let p=c.getContext('2d'),r=rng(900+index*120),near=index===2;
 const colors=[['#244f57','#35656a','#427778'],['#183f43','#285b53','#3a7360'],['#0e2c30','#1a453c','#37644a']][index];
 for(let j=0;j<(near?11:24);j++){const x=j*c.width/(near?10:23)+r()*45-30,y=475+r()*45,w=(near?24:10)+r()*(near?46:25),top=-80+r()*150;
 poly(p,[[x-w*.6,y],[x-w*.36,top],[x+w*.3,top-10],[x+w*.55,y]],colors[0]);
 poly(p,[[x+2,y],[x+3,top],[x+w*.3,top-10],[x+w*.43,y]],colors[1]);
 for(let k=0;k<4;k++){const by=top+80+k*75,dir=k%2?1:-1;poly(p,[[x,by+35],[x+dir*(65+r()*60),by-55],[x+dir*(42+r()*20),by-40],[x+4,by+65]],colors[0]);}
 for(let k=0;k<8;k++)line(p,x-w*.25+r()*w*.6,top+50+r()*90,x-w*.2+r()*w*.4,y-r()*40,colors[2],near?2:1);
 for(let k=0;k<14;k++){const lx=x+(r()-.5)*200,ly=top+30+r()*120;ellipse(p,lx,ly,35+r()*75,17+r()*35,colors[k%3]);}
 // Broken foliage silhouettes and sunlit leaf clusters replace flat crown edges.
 for(let k=0;k<95;k++){const lx=x+(r()-.5)*240,ly=top+20+r()*125;const col=k%4===0?(near?'#557a54':'#537f6a'):colors[k%3];poly(p,[[lx,ly-3],[lx+7+r()*8,ly],[lx+10,ly+5],[lx-4,ly+3]],col);}
 if(near){for(let k=0;k<7;k++)poly(p,[[x,y-7],[x-70+r()*140,y+18],[x+(r()-.5)*20,y-36]],colors[0]);}
 }
 return c;
}
for(let i=0;i<3;i++)planes.push(makePlane(i));
// Ground textures are cached once per level rather than regenerated every frame.
const terrainCache=new Map();
function terrain(p,index){const key=[stage,p.x,p.y,p.w].join(':');if(terrainCache.has(key))return terrainCache.get(key);
 const c=document.createElement('canvas');c.width=p.w+32;c.height=(p.y===G?H-p.y:42)+35;const q=c.getContext('2d'),r=rng(p.x+stage*200+21),h=c.height-25;
 let g=q.createLinearGradient(0,20,0,h+20);g.addColorStop(0,'#456150');g.addColorStop(.19,'#263d38');g.addColorStop(1,'#101f25');q.fillStyle=g;q.fillRect(16,20,p.w,h);
 for(let k=0;k<p.w/7;k++){let x=16+r()*p.w,y=30+r()*h;poly(q,[[x,y],[x+9,y-3],[x+16,y+5],[x+5,y+10]],r()>.5?'#3a5143':'#1b302f');}
 for(let x=16;x<16+p.w;x+=8){let deep=7+r()*15;poly(q,[[x,20],[x+9,20],[x+6,20+deep],[x+2,25+deep]],'#426c4b');}
 q.fillStyle='#70945a';q.fillRect(16,18,p.w,5);q.fillStyle='#b0c780';q.fillRect(16,18,p.w,2);
 for(let x=18;x<p.w+12;x+=4){const ht=3+r()*10;line(q,x,20,x-2+r()*5,20-ht,r()>.5?'#99b875':'#4f8158',1.5);}
 for(let x=28;x<p.w;x+=63){if(r()>.35){let y=16;line(q,x,y,x+1,y-10,'#7b9c69');ellipse(q,x+1,y-11,2,2,r()>.5?'#e1cd8c':'#a1c8ba');}}
 if(p.y!==G){for(let x=27;x<p.w;x+=48){q.strokeStyle='#517b58';q.lineWidth=2;q.beginPath();q.moveTo(x,30);q.quadraticCurveTo(x-9,48,x+2,58);q.stroke();ellipse(q,x-2,45,4,2,'#608b5f');}}
 terrainCache.set(key,c);return c;
}
function background(){let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#102f3b');g.addColorStop(.52,'#65928b');g.addColorStop(1,'#203e42');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 glow(660,104,300,'#ecf1be60');
 for(let i=0;i<3;i++){const par=[.12,.32,.58][i],offset=((cam*par)%1600+1600)%1600;ctx.globalAlpha=[.65,.8,1][i];ctx.drawImage(planes[i],-offset,0);ctx.drawImage(planes[i],1600-offset,0);ctx.globalAlpha=1;
 if(i<2){let fog=ctx.createLinearGradient(0,240,0,490);fog.addColorStop(0,'#a6d1b900');fog.addColorStop(.65,'#a6d1b922');fog.addColorStop(1,'#a6d1b900');ctx.fillStyle=fog;ctx.fillRect(0,240,W,250);}}
 if(quality==='full'){ctx.save();ctx.globalCompositeOperation='screen';for(let i=0;i<5;i++){const x=350+i*140-cam*.05+Math.sin(visualTime*.1+i)*12;let beam=ctx.createLinearGradient(x,0,x-150,H);beam.addColorStop(0,'#f7efba17');beam.addColorStop(1,'#e7efc000');poly(ctx,[[x,0],[x+28,0],[x-80,H],[x-280,H]],beam);}ctx.restore();}
 // Stone arch ruins give the third level its own silhouette.
 if(stage===2){ctx.save();ctx.translate(730-cam*.65,0);for(let n=0;n<4;n++){ctx.fillStyle='#385856';ctx.fillRect(n*330,220,28,250);ctx.fillRect(n*330+115,220,28,250);ctx.strokeStyle='#385856';ctx.lineWidth=28;ctx.beginPath();ctx.arc(n*330+71,220,57,Math.PI,0);ctx.stroke();line(ctx,n*330+6,230,n*330+7,430,'#78927b',3);}ctx.restore();}
}
function burst(x,y,color,count=12,speed=2){if(reducedMotion)count=Math.ceil(count/3);if(quality==='low')count=Math.ceil(count/2);for(let i=0;i<count&&particles.length<180;i++){let a=Math.random()*Math.PI*2,v=(.3+Math.random())*speed;particles.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-1,color,life:26+Math.random()*20,max:46,size:1+Math.random()*3});}}
function updateParticles(dt){for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.045*dt;p.life-=dt;}particles=particles.filter(p=>p.life>0);}
function motes(front=false){if(reducedMotion)return;let n=quality==='full'?32:10;for(let i=0;i<n;i++){let x=((i*137.8+Math.sin(visualTime*.38+i)*32-cam*(front?.9:.23))%1000+1000)%1000-20,y=80+(i*61%380)+Math.sin(visualTime*.6+i*3)*18;let a=.3+.3*Math.sin(visualTime*1.5+i);ctx.globalAlpha=a;if(front&&i%3===0){ctx.save();ctx.translate(x,y);ctx.rotate(visualTime*.5+i);ellipse(ctx,0,0,4,1.5,'#c5d88c');ctx.restore();}else {if(quality==='full')glow(x,y,10,'#d5f9a333');ellipse(ctx,x,y,1.4,1.4,'#ecffd0');}}ctx.globalAlpha=1;}
// Hand-authored pixel sprite: 16 × 24, rendered at 2×. Palette varies per class.
const sprite=[
'.....hhhhhh.....','....hhhhhhhh....','...hhhhhhhhhh...','...hhHHHHHHhh...',
'....HssssssH....','....sssEssss....','.....ssssss.....','......sss.......',
'....cccccccc....','...cCCcCCcCCc...','...cCCcCCcCCc...','...sCCcCCcCCs...',
'...sCCcCCcCCs...','....CCcCCcCC....','....bbbbbbbb....','....CCCCCCCC....',
'.....pppppp.....','.....pppppp.....','.....pp..pp.....','.....pp..pp.....',
'.....pp..pp.....','.....bb..bb.....','....bbb..bbb....','................'];
const characterFrames=new Map();
function spriteFrame(kind,frame,air){const key=kind+frame+air;if(characterFrames.has(key))return characterFrames.get(key);let c=document.createElement('canvas');c.width=24;c.height=28;const q=c.getContext('2d'),pal={h:'#20353a',H:'#74947c',s:'#e6bf97',E:'#14262b',c:'#213f44',C:classes[kind].color,b:'#b9ac7b',p:'#273841'};if(kind==='mage'){pal.h='#6d638e';pal.H='#a69bbd';}if(kind==='hunter'){pal.h='#3a6851';pal.H='#95b775';}
 const swing=air?2:[0,1,2,1,0,-1,-2,-1][frame];
 for(let y=0;y<sprite.length;y++)for(let x=0;x<16;x++){let v=sprite[y][x];if(v==='.'){continue;}let yy=y,xx=x+4;if(y>17){yy+=(x<8?swing:-swing);}if(y>9&&y<14&&(x<4||x>11))yy+=(x<8?-swing:swing);q.fillStyle=pal[v];q.fillRect(xx,yy+2,1,1);}
 if(kind==='warrior'){q.fillStyle='#d8e0c5';q.fillRect(20,12,2,9);q.fillStyle='#ac9060';q.fillRect(18,21,5,1);q.fillRect(20,22,1,3);}
 if(kind==='mage'){q.fillStyle='#95836a';q.fillRect(21,10,1,15);q.fillStyle='#bbebec';q.fillRect(20,8,3,3);poly(q,[[6,5],[12,0],[17,5]],'#8475a0');}
 if(kind==='hunter'){q.strokeStyle='#d3b87b';q.lineWidth=1;q.beginPath();q.moveTo(20,11);q.quadraticCurveTo(27,17,20,24);q.stroke();q.fillStyle='#d2d7b1';q.fillRect(20,11,1,14);}
 characterFrames.set(key,c);return c;
}
function drawHero(){const h=hero;if(!h)return;ellipse(ctx,h.x+15,h.y+h.h+2,18,4,'#081b2260');if(invincible&&Math.floor(invincible/6)%2)return;
 const running=h.on&&Math.abs(h.vx)>.1,frame=running?Math.floor(t/5)%8:0,bob=h.on?(running?Math.sin(t*.6)*.8:Math.sin(visualTime*3)*.7):0;
 ctx.save();ctx.translate(Math.round(h.x+15),Math.round(h.y+20+bob));ctx.scale(h.face,1);
 // Cloth trails behind the facing direction, animated separately from the legs.
 let flap=reducedMotion?0:Math.sin(t*.23)*3;poly(ctx,[[-9,-8],[-20-(running?5:0),12+flap],[-9,20],[-3,2]],save.class==='mage'?'#6a6089':save.class==='hunter'?'#477757':'#4c7186');
 ctx.imageSmoothingEnabled=false;ctx.drawImage(spriteFrame(save.class,frame,!h.on),-24,-27,48,56);ctx.restore();ctx.imageSmoothingEnabled=true;
 if(h.dash>0){ctx.strokeStyle='#d5f6e5aa';ctx.lineWidth=2;for(let i=0;i<3;i++)line(ctx,h.x+15-h.face*40,h.y+12+i*10,h.x+15,h.y+12+i*10,'#cceff0aa',2);}
}
function drawEnemy(e,i){if(!e.alive)return;const squash=Math.sin(t*.13+i)*1.6;ellipse(ctx,e.x+14,G+1,17,4,'#061e2670');ctx.save();ctx.translate(e.x+14,e.y+16);ctx.scale(e.dir,1);
 let g=ctx.createLinearGradient(0,-20,0,13);g.addColorStop(0,'#bbdba0');g.addColorStop(.35,'#689d78');g.addColorStop(1,'#2d5b56');ellipse(ctx,0,0,15+squash,13-squash,g);ellipse(ctx,-4,-7,7,3,'#d3ebbc55');
 poly(ctx,[[-9,-10],[-10,-23],[-1,-13]],'#739b6a');poly(ctx,[[0,-12],[8,-23],[9,-9]],'#95b275');ellipse(ctx,3,-1,2,3,'#102f35');ellipse(ctx,11,-1,2,3,'#102f35');ellipse(ctx,4,-2,.7,.8,'#eef7d2');line(ctx,5,5,9,5,'#335b4e');ctx.restore();}
function finishFlag(cp){const x=cp.x,y=G;ellipse(ctx,x+8,y,25,5,'#071b2666');poly(ctx,[[x-10,y],[x-6,y-12],[x+22,y-12],[x+27,y]],'#75887b');ctx.fillStyle='#a9baa0';ctx.fillRect(x+5,y-83,4,72);let flap=Math.sin(visualTime*3+x)*4;
 poly(ctx,[[x+9,y-82],[x+52,y-77+flap],[x+45,y-54+flap],[x+9,y-58]],'#e1c686');line(ctx,x+14,y-76,x+14,y-63,'#edf0c8',2);glow(x+8,y-84,25,'#c7edaa44');ellipse(ctx,x+7,y-87,4,4,'#d6e7b5');}
function draw(){ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#071b22';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.restore();ctx.save();ctx.beginPath();ctx.rect(0,0,W,H);ctx.clip();background();motes(false);
 ctx.save();ctx.translate(-cam,0);
 for(const [i,p] of solids().entries()){if(p.x+p.w<cam-20||p.x>cam+W+20)continue;ctx.drawImage(terrain(p,i),p.x-16,p.y-20);}
 // Ferns, luminous mushrooms and stones are fixed to safe ground, not gaps.
 for(const p of land()){for(let x=p.x+70;x<p.x+p.w-20;x+=133){if(x<cam-30||x>cam+W+30)continue;for(let j=0;j<5;j++){const angle=-Math.PI*.85+j*.28;line(ctx,x,G-2,x+Math.cos(angle)*19,G-2+Math.sin(angle)*20,'#6a9a65',2);for(let k=1;k<4;k++)ellipse(ctx,x+Math.cos(angle)*k*4,G-2+Math.sin(angle)*k*4,4,1.6,'#75a16b');}if(x%3<2){ctx.fillStyle='#adcbb0';ctx.fillRect(x+29,G-11,3,10);ellipse(ctx,x+30,G-12,8,4,'#82bcb0');ellipse(ctx,x+28,G-13,2,1,'#e0e9bf');}}}
 for(const s of spikes){for(let k=0;k<3;k++)poly(ctx,[[s.x+k*15,s.y+18],[s.x+8+k*15,s.y],[s.x+15+k*15,s.y+18]],'#bdc6b4');for(let k=0;k<3;k++)line(ctx,s.x+8+k*15,s.y+2,s.x+12+k*15,s.y+17,'#637c78',2);}
 for(const a of things){if(a.taken||a.x<cam-25||a.x>cam+W+25)continue;const y=a.y+(reducedMotion?0:Math.sin(visualTime*3+a.x)*3);if(a.type==='star'){glow(a.x,y,26,'#f3df8b35');let pts=[];for(let j=0;j<10;j++){const an=j*Math.PI/5-Math.PI/2,r=j%2?7:16;pts.push([a.x+Math.cos(an)*r,y+Math.sin(an)*r]);}poly(ctx,pts,'#f4dd93');line(ctx,a.x,y-10,a.x-3,y-1,'#fff4d0',2);}else{const rx=reducedMotion?6:3+Math.abs(Math.cos(visualTime*2+a.x))*4;ellipse(ctx,a.x,y,rx,9,'#99774b');ellipse(ctx,a.x,y-1,rx-1,7,'#e5be6c');line(ctx,a.x,y-5,a.x,y+3,'#fff0b0',1);}}
 bad.forEach(drawEnemy);finishFlag({x:WIDTH-77});drawHero();drawCombatEffects();
 for(const p of particles){ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.size,p.size);}ctx.globalAlpha=1;ctx.restore();
 if(quality==='full'){motes(true);let vignette=ctx.createRadialGradient(W/2,H/2,180,W/2,H/2,600);vignette.addColorStop(0,'#02191d00');vignette.addColorStop(1,'#0211198a');ctx.fillStyle=vignette;ctx.fillRect(0,0,W,H);}
 // Minimal in-world labels leave the playfield visible on a phone.
 if(scene==='game'&&t<240){ctx.globalAlpha=Math.min(1,(240-t)/60);ctx.textAlign='center';ctx.font='11px system-ui';ctx.fillStyle='#e0ebce';ctx.fillText('SMARAGDWALD  /  '+stages[stage].name.toUpperCase(),W/2,84);ctx.globalAlpha=1;}
 if(scene==='game'&&hero){const x=W-150,y=H-21;ctx.fillStyle='#152e32bb';ctx.fillRect(x,y,120,3);ctx.fillStyle='#b8d9ae';ctx.fillRect(x,y,120*(1-dashCooldown/70),3);ctx.font='9px system-ui';ctx.textAlign='right';ctx.fillStyle='#c1d9bd';ctx.fillText(dashCooldown>0?'FÄHIGKEIT LÄDT':'FÄHIGKEIT BEREIT',W-30,y-6);}
 ctx.restore();}
// Fixed 60 Hz simulation: refresh rate does not alter jumps or movement on 120 Hz phones.
let accumulator=0;
function frame(now){const elapsed=last?Math.min(100,Math.max(0,now-last)):16.667;last=now;if(scene!=='pause'&&!document.hidden){visualTime+=elapsed/1000;accumulator+=elapsed;let steps=0;while(accumulator>=1000/60&&steps<6){step(1);if(scene==='game')updateParticles(1);accumulator-=1000/60;steps++;}}else accumulator=0;draw();requestAnimationFrame(frame);}
menu();requestAnimationFrame(frame);
