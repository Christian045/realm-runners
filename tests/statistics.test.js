import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultProgress,normalizeProgress,loadProgress,saveProgress,SAVE_KEY} from '../src/progression.js';
import {Game} from '../src/game.js?v=0.20.0';
import {defaultStatistics,normalizeStatistics,newRunStatistics,recordEnemyKill,
 recordDamage,finishRunStatistics,formatPlayTime,totalKills,STATS_HISTORY_LIMIT} from '../src/statistics.js';

const mockStorage=()=>{
 const map=new Map();
 return {getItem:key=>map.get(key)||null,setItem:(key,v)=>map.set(key,v)};
};
const fakeInput={
 movement:()=>({x:0,y:0}),aiming:()=>({x:1,y:0}),attacking:()=>false,
 consumeDash:()=>false,consumeAbility:()=>false
};

test('existing progress gains empty lifetime statistics without resetting old achievements',()=>{
 const legacy={runs:24,bossKills:9,gold:712,selectedClass:'mage',
  towerWins:2,itemsFound:31,achievements:{firstRun:true}};
 const save=normalizeProgress(legacy);
 assert.equal(save.runs,24);
 assert.equal(save.bossKills,9);
 assert.equal(save.selectedClass,'mage');
 assert.equal(save.statistics.playTime,0);
 assert.equal(save.statistics.victories,0);
 assert.equal(save.statistics.deaths,0);
 assert.equal(totalKills(save.statistics),0);
 const storage=mockStorage();
 assert.equal(saveProgress(save,storage),true);
 assert.deepEqual(loadProgress(storage).statistics,save.statistics);
 assert.deepEqual(JSON.parse(storage.getItem(SAVE_KEY)).statistics,save.statistics);
});

test('enemy types, boss names, run results and damage survive a round-trip',()=>{
 const stats=defaultStatistics(),run=newRunStatistics('mage','Turm');
 recordEnemyKill(stats,run,'slime');
 recordEnemyKill(stats,run,'slime');
 recordEnemyKill(stats,run,'boss','ASTRALMAGIER');
 recordDamage(stats,run,112.8,'dealt');
 recordDamage(stats,run,14,'taken');
 stats.playTime+=125.5;
 finishRunStatistics(stats,run,true,125.5,7,5,1793268000000);
 const copy=normalizeStatistics(stats);
 assert.equal(copy.kills.slime,2);
 assert.equal(copy.kills.boss,1);
 assert.equal(copy.bosses.ASTRALMAGIER,1);
 assert.equal(copy.damageDealt,112.8);
 assert.equal(copy.damageTaken,14);
 assert.equal(copy.victories,1);
 assert.equal(copy.deaths,0);
 assert.equal(copy.recentRuns[0].classKind,'mage');
 assert.equal(copy.recentRuns[0].bosses,1);
 assert.equal(totalKills(copy),3);
 assert.equal(formatPlayTime(copy.playTime),'2 Min. 05 Sek.');
});

test('statistics sanitizes invalid saves and keeps only the last twelve runs',()=>{
 const stats=defaultStatistics();
 for(let i=0;i<20;i++){
  const run=newRunStatistics('warrior','Dungeon');
  finishRunStatistics(stats,run,false,18,i+1,2,1793268000000+i);
 }
 assert.equal(stats.deaths,20);
 assert.equal(stats.recentRuns.length,STATS_HISTORY_LIMIT);
 assert.equal(stats.recentRuns[0].floor,20);
 assert.equal(stats.recentRuns.at(-1).floor,9);
 const cleaned=normalizeStatistics({playTime:-4,deaths:-1,
  kills:{slime:3,unknown:999},bosses:{MOOSWÄCHTER:2},recentRuns:[{won:'true',mode:'unknown'}]});
 assert.equal(cleaned.playTime,0);
 assert.equal(cleaned.deaths,0);
 assert.equal(cleaned.kills.slime,3);
 assert.equal(cleaned.kills.unknown,undefined);
 assert.equal(cleaned.bosses.MOOSWÄCHTER,2);
 assert.equal(cleaned.recentRuns[0].won,false);
 assert.equal(cleaned.recentRuns[0].mode,'Dungeon');
});

test('real game records playtime, a mob kill and a death exactly once',()=>{
 const g=new Game(defaultProgress(),fakeInput);
 g.start('warrior',17);
 g.update(1/60);
 assert.ok(g.progress.statistics.playTime>0);
 const e={type:'slime',hp:0,maxHp:46,elite:false,x:g.player.x+30,y:g.player.y+30,
  radius:17,homeRoom:0};
 g.killEnemy(e);g.killEnemy(e);
 assert.equal(g.progress.statistics.kills.slime,1);
 assert.equal(g.runStatistics.kills,1);
 const initial=g.progress.statistics.damageTaken;
 g.hurt(8,{x:0,y:0});
 assert.ok(g.progress.statistics.damageTaken>initial);
 g.finish(false);g.finish(false);
 assert.equal(g.progress.runs,1);
 assert.equal(g.progress.statistics.deaths,1);
 assert.equal(g.progress.statistics.victories,0);
 assert.equal(g.progress.statistics.recentRuns.length,1);
 assert.equal(g.progress.statistics.recentRuns[0].kills,1);
});
test('ten-stage tower intermediate victories do not count as finished runs',()=>{
 const g=new Game(defaultProgress(),fakeInput);
 g.setTower(true);g.start('mage',99);
 g.finish(true);
 assert.equal(g.mode,'stageclear');
 assert.equal(g.progress.runs,0);
 assert.equal(g.progress.statistics.victories,0);
 assert.equal(g.progress.statistics.recentRuns.length,0);
 assert.equal(g.progress.bossKills,1);
});
