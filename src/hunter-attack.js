// Final drawn arrowhead in full-draw cell 3; release begins at cell 4 (1/2).
export const HUNTER_ATTACK_SOCKETS=Object.freeze([
 {grip:[45,49],tip:[45,56]}, {grip:[28,65],tip:[22,68]},
 {grip:[26,44],tip:[19,42]}, {grip:[23,37],tip:[15,33]},
 {grip:[48,28],tip:[47,11]}, {grip:[65,25],tip:[70,16]},
 {grip:[73,45],tip:[79,43]}, {grip:[69,50],tip:[75,48]}
]);
export async function loadHunterAttack(){
 const image=new Image();image.decoding='async';image.crossOrigin='anonymous';
 await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Hunter attack sheet unavailable'));image.src=new URL('../assets/heroes/hunter/identity-attack-0735/attack.png',import.meta.url).href;});
 await image.decode?.();if(image.width!==768||image.height!==768)throw Error('Invalid hunter attack sheet');return image;
}
