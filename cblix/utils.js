// utils.js
// General utilities with no functional changes from original code

export function vibrate(ms){ 
  if(navigator.vibrate) navigator.vibrate(ms); 
}

export function interpolateColor(c1,c2,t){
  function parseRGBA(c){
    let m=c.match(/rgba\((\d+),(\d+),(\d+),([\d\.]+)\)/);
    return [parseInt(m[1]),parseInt(m[2]),parseInt(m[3]),parseFloat(m[4])];
  }
  let A=parseRGBA(c1);
  let B=parseRGBA(c2);
  let R=A[0]+(B[0]-A[0])*t;
  let G=A[1]+(B[1]-A[1])*t;
  let Bb=A[2]+(B[2]-A[2])*t;
  let Aalpha=A[3]+(B[3]-A[3])*t;
  return `rgba(${R},${G},${Bb},${Aalpha})`;
}
