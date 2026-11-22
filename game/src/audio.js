// audio.js — procedural WebAudio sounds. One job: tiny beeps and chimes with
// no audio files. Everything is guarded so a browser without audio (or a
// headless screenshot run) never throws.

let ctx = null;

function audioCtx() {
  if (ctx) return ctx;
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  } catch {
    return null;
  }
  return ctx;
}

export function unlockAudio() {
  const ac = audioCtx();
  if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
}

function tone(freq, seconds, type, gainValue, when = 0) {
  const ac = audioCtx();
  if (!ac) return;
  try {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    const t = ac.currentTime + when;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(gainValue, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + seconds);
    osc.connect(gain).connect(ac.destination);
    osc.start(t);
    osc.stop(t + seconds + 0.05);
  } catch {
    // Silence is fine; never break the game for sound.
  }
}

export function playLootDing() {
  tone(880, 0.12, 'sine', 0.12);
  tone(1318, 0.16, 'sine', 0.1, 0.07);
}

export function playAlarmBip() {
  tone(620, 0.09, 'square', 0.05);
}

export function playCaughtSting() {
  tone(220, 0.35, 'sawtooth', 0.12);
  tone(165, 0.4, 'sawtooth', 0.1, 0.12);
}

export function playDraftPick() {
  tone(523, 0.1, 'triangle', 0.12);
  tone(784, 0.14, 'triangle', 0.12, 0.08);
}

export function playEscapeFanfare() {
  tone(523, 0.14, 'triangle', 0.12);
  tone(659, 0.14, 'triangle', 0.12, 0.12);
  tone(784, 0.22, 'triangle', 0.12, 0.24);
}
