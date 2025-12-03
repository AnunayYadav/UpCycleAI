
// Simple synthesizer for UI sounds and PCM decoder for Gemini TTS

const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

export const playSound = (type: 'click' | 'success' | 'shutter' | 'error' | 'pop') => {
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  const now = audioCtx.currentTime;

  switch (type) {
    case 'click':
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, now);
      oscillator.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      oscillator.start(now);
      oscillator.stop(now + 0.1);
      break;

    case 'pop':
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(600, now);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      oscillator.start(now);
      oscillator.stop(now + 0.1);
      break;

    case 'success':
      // Arpeggio
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C Major
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gn = audioCtx.createGain();
        osc.connect(gn);
        gn.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const startTime = now + i * 0.05;
        gn.gain.setValueAtTime(0, startTime);
        gn.gain.linearRampToValueAtTime(0.1, startTime + 0.05);
        gn.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
      break;

    case 'error':
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(200, now);
      oscillator.frequency.linearRampToValueAtTime(100, now + 0.3);
      gainNode.gain.setValueAtTime(0.1, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      oscillator.start(now);
      oscillator.stop(now + 0.3);
      break;

    case 'shutter':
      // Noise burst simulation
      const bufferSize = audioCtx.sampleRate * 0.1; // 100ms
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const noiseGain = audioCtx.createGain();
      noise.connect(noiseGain);
      noiseGain.connect(audioCtx.destination);
      noiseGain.gain.setValueAtTime(0.2, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
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
  // Gemini returns 24kHz Mono 16-bit PCM
  const sampleRate = 24000;
  const numChannels = 1;
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
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
    source.connect(audioCtx.destination);
    
    if (onEnded) {
        source.onended = onEnded;
    }

    source.start();
    
    return {
        stop: () => {
            try {
                source.stop();
            } catch (e) {
                // Ignore errors if already stopped
            }
        }
    };
  } catch (e) {
    console.error("Error playing PCM audio:", e);
    if (onEnded) onEnded();
    return { stop: () => {} };
  }
};
