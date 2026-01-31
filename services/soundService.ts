
// Professional UI Sound Synthesis Service for UpcycleAI
// Uses Web Audio API for zero-latency, high-performance sounds without external assets.

const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

// Master gain for overall low volume control as requested
const masterGain = audioCtx.createGain();
masterGain.gain.setValueAtTime(0.15, audioCtx.currentTime); // Keep volume low globally
masterGain.connect(audioCtx.destination);

export const playSound = (type: 'click' | 'success' | 'shutter' | 'error' | 'pop') => {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const now = audioCtx.currentTime;
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(masterGain);

  switch (type) {
    case 'click':
      // Short, clean "tick" sound
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, now);
      oscillator.frequency.exponentialRampToValueAtTime(800, now + 0.03);
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
      oscillator.start(now);
      oscillator.stop(now + 0.03);
      break;

    case 'pop':
      // Soft, rounded "bubble" sound
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(400, now);
      oscillator.frequency.exponentialRampToValueAtTime(600, now + 0.05);
      gainNode.gain.setValueAtTime(0.15, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      oscillator.start(now);
      oscillator.stop(now + 0.08);
      break;

    case 'success':
      // Elegant three-note ascending chime
      const frequencies = [660, 880, 1320];
      frequencies.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        g.gain.setValueAtTime(0, now + i * 0.08);
        g.gain.linearRampToValueAtTime(0.1, now + i * 0.08 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.3);
      });
      break;

    case 'error':
      // Subtle double-thud for failure
      [0, 0.1].forEach(delay => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now + delay);
        osc.frequency.exponentialRampToValueAtTime(80, now + delay + 0.1);
        g.gain.setValueAtTime(0.15, now + delay);
        g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.15);
        osc.connect(g);
        g.connect(masterGain);
        osc.start(now + delay);
        osc.stop(now + delay + 0.15);
      });
      break;

    case 'shutter':
      // Mechanical but clean camera snap using noise
      const bufferSize = audioCtx.sampleRate * 0.05;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = audioCtx.createGain();
      noiseGain.gain.setValueAtTime(0.1, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      noise.connect(noiseGain);
      noiseGain.connect(masterGain);
      noise.start(now);
      break;
  }
};

// --- GEMINI PCM DECODING HELPERS ---

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function pcmToAudioBuffer(data: Uint8Array, ctx: AudioContext): AudioBuffer {
  const sampleRate = 24000;
  const numChannels = 1;
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const playPCM = (base64Audio: string, onEnded?: () => void): { stop: () => void } => {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  try {
    const uint8Array = base64ToUint8Array(base64Audio);
    const audioBuffer = pcmToAudioBuffer(uint8Array, audioCtx);

    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(masterGain); // Use masterGain for TTS too
    
    if (onEnded) {
        source.onended = onEnded;
    }

    source.start();
    
    return {
        stop: () => {
            try {
                source.stop();
                if (onEnded) source.onended = null;
            } catch (e) {}
        }
    };
  } catch (e) {
    console.error("Error playing PCM audio:", e);
    if (onEnded) onEnded();
    return { stop: () => {} };
  }
};
