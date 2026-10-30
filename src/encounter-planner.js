// Deterministic, reusable encounter recipes for the normal dungeon.
// Higher difficulty comes from enemy teamwork and a small second wave,
// not from multiplying every enemy's HP.
export const ENCOUNTER_RECIPES=Object.freeze({
 ambush:Object.freeze({lead:'assassin',vanguard:'burrower',support:'scout',
  pool:['assassin','burrower','goblin','scout','wraith']}),
 ranged:Object.freeze({lead:'scout',vanguard:'bulwark',support:'archer',
  pool:['scout','archer','bulwark','hexer','goblin']}),
 arcane:Object.freeze({lead:'hexer',vanguard:'sentinel',support:'chanter',
  pool:['hexer','chanter','wraith','sentinel','cultist']}),
 fortified:Object.freeze({lead:'bulwark',vanguard:'sentinel',support:'scout',
  pool:['bulwark','sentinel','brute','scout','chanter']}),
 mixed:Object.freeze({lead:'goblin',vanguard:'brute',support:'scout',
  pool:['goblin','mushroom','brute','scout','assassin','burrower']})
});
const BIOME_GUEST=Object.freeze({
 crypt:['goblin','sentinel','scout','burrower'],
 fungal:['mushroom','chanter','brute','hexer'],
 flooded:['wraith','scout','archer','burrower']
});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

export function normalEncounterPlan(room,cleared=0,variation=0){
 const style=ENCOUNTER_RECIPES[room?.encounterStyle]?room.encounterStyle:'mixed';
 const recipe=ENCOUNTER_RECIPES[style];
 const tier=clamp(Math.floor(Number(room?.encounterTier)||0),0,4);
 const elite=room?.type==='elite';
 const initial=elite?4:clamp(
  4+Math.floor(tier/2)+(cleared>=3?1:0)+(variation>.79?1:0),4,7);
 const reinforcements=elite?0:tier>=3?2:tier>=2?1:0;
 const biome=BIOME_GUEST[room?.biome]||BIOME_GUEST.crypt;
 return {style,tier,initial,reinforcements,
  delay:reinforcements?2.6+.35*(tier<3?1:0):0,
  lead:recipe.lead,vanguard:recipe.vanguard,support:recipe.support,
  pool:recipe.pool,biome};
}
export function pickNormalEnemy(plan,index,random=Math.random){
 const n=Math.max(0,Math.floor(index));
 if(n===0)return plan.lead;
 if(n===1)return plan.vanguard;
 if(n===2)return plan.support;
 if(n===3)return plan.biome[Math.floor(random()*plan.biome.length)];
 const list=n%3===0?plan.biome:plan.pool;
 return list[Math.floor(random()*list.length)];
}
