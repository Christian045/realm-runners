'use strict';
// Original layered HD-pixel castle artwork, influenced by classic tile-based
// adventure games. All tiles, lighting and architecture are Canvas primitives.
function drawCastleInterior(){
 // The throne room is an enclosed hall, never the outside forest backdrop.
 ctx.fillStyle='#17192b';ctx.fillRect(0,0,W,H);
 ctx.fillStyle='#232538';ctx.fillRect(0,0,W,440);
 ctx.fillStyle='#302a3f';ctx.fillRect(0,110,W,310);
 ctx.fillStyle='#181929';ctx.fillRect(0,0,W,57);
 ctx.fillStyle='#514055';ctx.fillRect(0,50,W,12);
 ctx.fillStyle='#a78a73';ctx.fillRect(0,61,W,4);
 // Muted individual 26x16 pixel bricks with small chips instead of gradients.
 const phase=((Math.floor(cam*.11/26)*26)%52+52)%52;
 for(let y=88;y<448;y+=18){
  for(let x=-55;x<W+55;x+=52){
   const xx=x+((Math.floor(y/18)%2)*26)-phase;
   ctx.fillStyle=(Math.floor((xx+y)/25)%3===0)?'#514052':'#493b4d';
   ctx.fillRect(xx+2,y+2,48,14);
   ctx.fillStyle='#625165';ctx.fillRect(xx+5,y+3,36,2);
   ctx.fillStyle='#2a293a';ctx.fillRect(xx+2,y+14,49,3);
   if((Math.floor(xx/52)+y)%5===0){
    ctx.fillStyle='#9a8293';ctx.fillRect(xx+33,y+9,4,2);
   }
  }
 }
 // Gothic windows: simple high-contrast stepped arches and stained glass.
 const offset=Math.round(cam*.2/8)*8;
 for(let i=-1;i<9;i++){
  const x=i*196+70-offset%196;
  ctx.fillStyle='#141a2b';ctx.fillRect(x-14,123,120,246);
  ctx.fillRect(x+1,106,90,28);ctx.fillRect(x+19,90,52,20);
  ctx.fillStyle='#92717d';ctx.fillRect(x-9,132,110,231);
  ctx.fillStyle='#253450';ctx.fillRect(x+5,133,81,206);
  for(let y=150;y<330;y+=38){
   ctx.fillStyle=y%3?'#495877':'#6c5676';ctx.fillRect(x+8,y,74,26);
   ctx.fillStyle='#597c83';ctx.fillRect(x+14,y+5,20,17);
   ctx.fillStyle='#9c6b85';ctx.fillRect(x+39,y+5,29,17);
   ctx.fillStyle='#d7af87';ctx.fillRect(x+49,y+11,9,8);
  }
  ctx.fillStyle='#cfb19b';ctx.fillRect(x+42,130,8,215);
  ctx.fillRect(x+3,224,85,6);
  ctx.fillStyle='#1b2031';ctx.fillRect(x-15,353,122,12);
 }
 // Solid dark columns are recessed; they cannot be mistaken for platforms.
 const colOffset=Math.round(cam*.32/8)*8;
 for(let i=-1;i<9;i++){
  const x=i*174+30-colOffset%174;
  ctx.fillStyle='#28273b';ctx.fillRect(x,80,36,375);
  ctx.fillStyle='#736072';ctx.fillRect(x+5,90,9,351);
  ctx.fillStyle='#4d4056';ctx.fillRect(x+26,90,6,350);
  ctx.fillStyle='#a18a82';ctx.fillRect(x-10,93,56,15);
  ctx.fillStyle='#a89080';ctx.fillRect(x-7,407,50,16);
  ctx.fillStyle='#202032';ctx.fillRect(x-14,424,65,16);
 }
 // Pairs of royal banners and hanging chandelier candles.
 for(let i=0;i<5;i++){
  const x=i*252+85-Math.round(cam*.12/4)*4;
  ctx.fillStyle='#161d2a';ctx.fillRect(x,27,5,108);
  ctx.fillStyle='#b39b80';ctx.fillRect(x-15,124,35,9);
  ctx.fillStyle='#7f3e59';ctx.fillRect(x-11,133,28,86);
  ctx.fillStyle='#d7a76d';ctx.fillRect(x-5,146,12,31);
  ctx.fillStyle='#e9c390';ctx.fillRect(x-2,151,6,17);
  ctx.fillStyle='#603449';ctx.fillRect(x-11,219,10,12);
  ctx.fillRect(x+7,219,10,12);
 }
}
function drawCastleApproach(){
 if(stage!==3||cam+W<3070)return;
 ctx.save();ctx.translate(1250,0);
 // First distant towers, then the massive wall with an actual entrance.
 ctx.fillStyle='#222638';
 for(const [x,width,top] of [[1920,135,220],[2150,145,120],[2520,130,68],[2720,135,140]]){
  ctx.fillRect(x,top,width,465-top);
  ctx.fillRect(x-10,top-15,width+20,15);
  for(let i=0;i<width;i+=30){
   ctx.fillStyle='#3c3949';ctx.fillRect(x+i,top-31,20,17);
   ctx.fillStyle='#8a7482';ctx.fillRect(x+i+3,top-32,8,4);
  }
  ctx.fillStyle='#322f42';
  for(let y=top+25;y<465;y+=25)for(let i=10;i<width-16;i+=30){
   ctx.fillRect(x+i+(Math.floor(y/25)%2)*10,y,24,17);
  }
 }
 ctx.fillStyle='#2f3444';ctx.fillRect(2160,235,640,230);
 ctx.fillStyle='#4c4656';ctx.fillRect(2160,230,640,12);
 for(let y=246;y<462;y+=24)for(let x=2170+(y%3)*8;x<2800;x+=56){
  ctx.fillStyle='#504657';ctx.fillRect(x,y,48,17);
  ctx.fillStyle='#685a66';ctx.fillRect(x+4,y+2,24,3);
 }
 // Steps and bridge advance directly toward the castle door.
 for(let i=0;i<5;i++){
  ctx.fillStyle='#7a706b';ctx.fillRect(2468+i*34,G-9-i*2,34,9+i*2);
  ctx.fillStyle='#c6a88c';ctx.fillRect(2468+i*34,G-10-i*2,34,3);
 }
 // Huge arched entry, dark opening and gilded double doors.
 const gateX=2600;
 ctx.fillStyle='#171725';ctx.fillRect(gateX-26,267,192,198);
 ctx.fillRect(gateX-6,232,148,36);
 ctx.fillRect(gateX+19,206,98,30);
 ctx.fillStyle='#8b7580';ctx.fillRect(gateX-32,272,18,193);
 ctx.fillRect(gateX+166,272,18,193);
 ctx.fillRect(gateX-23,253,198,20);
 ctx.fillStyle='#3c303c';ctx.fillRect(gateX+1,269,132,195);
 ctx.fillStyle='#7c4e46';ctx.fillRect(gateX+11,285,58,180);
 ctx.fillRect(gateX+76,285,48,180);
 for(let y=299;y<462;y+=36){
  ctx.fillStyle='#a57b59';ctx.fillRect(gateX+15,y,50,5);
  ctx.fillRect(gateX+80,y,40,5);
 }
 ctx.fillStyle='#d6ad66';ctx.fillRect(gateX+67,285,8,180);
 ctx.fillRect(gateX+60,361,24,13);
 ctx.fillStyle='#ffe19a';ctx.fillRect(gateX+68,364,5,8);
 // Entrance is visually black beyond the door, showing progression inside.
 ctx.fillStyle='#121622';ctx.fillRect(gateX+127,327,31,136);
 ctx.fillStyle='#d9b580';ctx.fillRect(gateX-27,248,190,5);
 // Torches read as warm points without overpowering the hero silhouette.
 for(const fx of [gateX-71,gateX+193]){
  ctx.fillStyle='#262431';ctx.fillRect(fx-7,331,20,55);
  ctx.fillStyle='#c98b57';ctx.fillRect(fx-3,310,12,27);
  ctx.fillStyle='#ffcb80';ctx.fillRect(fx-1,299,8,32);
  ctx.fillStyle='#ffeab0';ctx.fillRect(fx+1,305,4,16);
 }
 // Golden flag hanging over the castle gate.
 ctx.fillStyle='#3c3347';ctx.fillRect(gateX+55,159,10,60);
 ctx.fillStyle='#b88755';ctx.fillRect(gateX+36,185,54,61);
 ctx.fillStyle='#eec884';ctx.fillRect(gateX+41,190,44,16);
 ctx.fillStyle='#774752';ctx.fillRect(gateX+51,211,24,22);
 ctx.fillStyle='#ecb36e';ctx.fillRect(gateX+59,216,8,11);
 ctx.restore();
}
function drawCastleThrone(){
 if(stage!==4)return;
 // The throne is behind the boss; its position matches the attack arena.
 const x=2490,y=302;
 ctx.fillStyle='#141929';ctx.fillRect(x-88,y-88,178,252);
 ctx.fillStyle='#584454';ctx.fillRect(x-78,y-68,160,221);
 ctx.fillStyle='#a17d70';ctx.fillRect(x-64,y-59,133,17);
 ctx.fillStyle='#863b51';ctx.fillRect(x-47,y-31,100,137);
 ctx.fillStyle='#d4a16b';ctx.fillRect(x-51,y-37,108,14);
 ctx.fillStyle='#eac186';ctx.fillRect(x-32,y-87,20,47);
 ctx.fillRect(x+3,y-104,20,64);ctx.fillRect(x+37,y-87,20,47);
 ctx.fillStyle='#d7ba88';ctx.fillRect(x-62,y+103,128,16);
 ctx.fillStyle='#372d3c';ctx.fillRect(x-77,y+122,155,15);
 for(const sx of [x-116,x+112]){
  ctx.fillStyle='#141a29';ctx.fillRect(sx-12,y-60,26,230);
  ctx.fillStyle='#a47c63';ctx.fillRect(sx-8,y-52,17,60);
  ctx.fillStyle='#f3bd72';ctx.fillRect(sx-3,y-77,8,31);
  ctx.fillStyle='#ffe5a6';ctx.fillRect(sx-1,y-72,4,15);
 }
}
