// Isolated art experiment. Opt in explicitly; no save flag or default art change.
export const hunterShortbowPreviewEnabled=(params=typeof location!=='undefined'?new URLSearchParams(location.search):null)=>params?.get('hunterShortbow')==='1';
export const SHORTBOW_ANCHORS=[[48,88],[59,88],[51,88],[57,88],[48,88],[38,88],[44,88],[36,88]];
export const SHORTBOW_SOCKETS={
 attack:{2:{tip:[4,47],grip:[19,50]},4:{tip:[46,3],grip:[46,14]},6:{tip:[91,47],grip:[76,50]}},
 special:{2:{tip:[2,50],grip:[18,51]},4:{tip:[45,4],grip:[45,16]},6:{tip:[93,50],grip:[77,51]}}
};
