// audio.js
let audioCtx = null;
let soundOn = (localStorage.getItem('colorBridgeSound')!=='off');

export function isSoundOn(){
  return soundOn;
}

export function toggleSound(){
  soundOn = !soundOn;
  localStorage.setItem('colorBridgeSound', soundOn?'on':'off');
}

function initAudio(){
  try {
    if(!audioCtx) {
      audioCtx = new (window.AudioContext||window.webkitAudioContext)();
      audioCtx.resume();
    }
  } catch(e) {
    soundOn = false;
  }
}

export function playSound(freq=440,duration=0.2,type='sine',vol=0.2){
  if(!soundOn)return;
  initAudio();
  const osc=audioCtx.createOscillator();
  const gain=audioCtx.createGain();
  osc.type=type;
  osc.frequency.value=freq;
  gain.gain.value=vol;
  osc.connect(gain).connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime+duration);
}

export function moveSound() {
  if (!soundOn) return;
  initAudio();
  const notes = [261.63, 329.63, 392.00];
  notes.forEach((freq, i) => {
    setTimeout(() => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);

      const harmonic = audioCtx.createOscillator();
      const harmonicGain = audioCtx.createGain();
      harmonic.type = 'sine';
      harmonic.frequency.value = freq * 2;
      harmonicGain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      harmonicGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

      osc.connect(gain).connect(audioCtx.destination);
      harmonic.connect(harmonicGain).connect(audioCtx.destination);
      
      osc.start();
      harmonic.start();
      osc.stop(audioCtx.currentTime + 0.2);
      harmonic.stop(audioCtx.currentTime + 0.2);
    }, i * 50);
  });
}

export function successSound() {
  const notes = [
    {freq: 329.63, dur: 0.2},
    {freq: 329.63, dur: 0.2},
    {freq: 349.23, dur: 0.2},
    {freq: 392.00, dur: 0.2},
    {freq: 392.00, dur: 0.2},
    {freq: 349.23, dur: 0.2},
    {freq: 329.63, dur: 0.2},
    {freq: 293.66, dur: 0.3}
  ];
  
  let delay = 0;
  notes.forEach(note => {
    setTimeout(() => {
      playSound(note.freq, note.dur, 'sine', 0.3);
      playSound(note.freq * 1.25, note.dur, 'sine', 0.15);
      playSound(note.freq/2, note.dur*1.2, 'sine', 0.1);
    }, delay);
    delay += note.dur * 1000;
  });
}

export function failSound() {
  playSound(329.63, 0.2, 'sine', 0.3);
  setTimeout(() => playSound(277.18, 0.3, 'sine', 0.2), 200);
  setTimeout(() => playSound(220.00, 0.4, 'sine', 0.1), 400);
}
