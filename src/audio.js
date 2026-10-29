// Tiny original synthesized feedback sounds. No external assets, downloads or autoplay.
// Safari AudioContext starts only after a real click/touch; it silently degrades if blocked.
const SOUNDS={
 start:[280,520,.16,'sine'],slash:[440,190,.07,'sawtooth'],shoot:[580,360,.07,'triangle'],
 hit:[190,110,.065,'triangle'],crit:[680,150,.12,'sawtooth'],hurt:[190,95,.16,'sawtooth'],
 block:[590,450,.1,'sine'],dash:[350,690,.08,'triangle'],ability:[380,800,.21,'sine'],
 loot:[650,1030,.15,'sine'],event:[440,700,.23,'sine'],enemyDown:[240,90,.12,'triangle'],
 bossDown:[480,70,.38,'sawtooth'],
 portal:[290,690,.55,'sine'],shop:[540,820,.24,'triangle'],
 drip:[690,280,.18,'sine'],wind:[110,65,.65,'triangle'],
 cavern:[180,95,.48,'sine'],danger:[620,170,.30,'sawtooth']
};
export class AudioFeedback {
 constructor(){this.enabled=true;this.context=null;this.last=new Map()}
 toggle(){this.enabled=!this.enabled;return this.enabled}
 play(id){
  if(!this.enabled||typeof window==='undefined')return;
  const Ctor=window.AudioContext||window.webkitAudioContext;
  if(!Ctor)return;
  try{
   if(!this.context)this.context=new Ctor();
   if(this.context.state==='suspended')this.context.resume().catch(()=>{});
   const spec=SOUNDS[id];if(!spec)return;
   const now=this.context.currentTime;
   if(now-(this.last.get(id)??-1)<.045)return;
   this.last.set(id,now);
   const [from,to,duration,type]=spec;
   const osc=this.context.createOscillator(),gain=this.context.createGain();
   osc.type=type;osc.frequency.setValueAtTime(from,now);
   osc.frequency.exponentialRampToValueAtTime(Math.max(20,to),now+duration);
   gain.gain.setValueAtTime(.0001,now);
   gain.gain.exponentialRampToValueAtTime(['drip','wind','cavern'].includes(id)?.015:.045,now+.008);
   gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
   osc.connect(gain).connect(this.context.destination);
   osc.start(now);osc.stop(now+duration+.01);
  }catch{}
 }
}
