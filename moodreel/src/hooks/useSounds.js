import { useCallback } from 'react';

const HAS_WINDOW = typeof window !== 'undefined';

// AudioContext singleton - browsers limit these (typically 6 per tab)
let audioContextInstance = null;

function getAudioContext() {
  if (!HAS_WINDOW) return null;
  if (!audioContextInstance) {
    try {
      audioContextInstance = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return null;
    }
  }
  // Resume if suspended (browsers suspend until user gesture)
  if (audioContextInstance.state === 'suspended') {
    audioContextInstance.resume();
  }
  return audioContextInstance;
}

/**
 * Hook for playing sound effects
 * Respects user's sound preference stored in localStorage
 */
export function useSounds() {
  const isSoundEnabled = useCallback(() => {
    return localStorage.getItem('moodreel-sounds') !== 'off';
  }, []);

  const toggleSounds = useCallback(() => {
    const current = localStorage.getItem('moodreel-sounds');
    const newValue = current === 'off' ? 'on' : 'off';
    localStorage.setItem('moodreel-sounds', newValue);
    return newValue === 'on';
  }, []);

  const playSound = useCallback(
    soundName => {
      if (!isSoundEnabled()) return;

      const audioContext = getAudioContext();
      if (!audioContext) return;

      try {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        // Different sounds for different actions
        switch (soundName) {
          case 'swipe':
            oscillator.frequency.value = 300;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.1);
            break;
          case 'save':
            oscillator.frequency.value = 600;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.2);
            break;
          case 'click':
            oscillator.frequency.value = 800;
            oscillator.type = 'square';
            gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
            oscillator.start();
            oscillator.stop(audioContext.currentTime + 0.05);
            break;
          case 'pop': {
            const popOsc = audioContext.createOscillator();
            const popGain = audioContext.createGain();
            popOsc.connect(popGain);
            popGain.connect(audioContext.destination);
            popOsc.type = 'sine';
            popOsc.frequency.setValueAtTime(520, audioContext.currentTime);
            popOsc.frequency.exponentialRampToValueAtTime(880, audioContext.currentTime + 0.08);
            popGain.gain.setValueAtTime(0.08, audioContext.currentTime);
            popGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.12);
            popOsc.start();
            popOsc.stop(audioContext.currentTime + 0.12);
            break;
          }
          case 'magic': {
            const magicOsc = audioContext.createOscillator();
            const magicGain = audioContext.createGain();
            magicOsc.connect(magicGain);
            magicGain.connect(audioContext.destination);
            magicOsc.type = 'triangle';
            magicOsc.frequency.setValueAtTime(440, audioContext.currentTime);
            magicOsc.frequency.exponentialRampToValueAtTime(660, audioContext.currentTime + 0.15);
            magicGain.gain.setValueAtTime(0.06, audioContext.currentTime);
            magicGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
            magicOsc.start();
            magicOsc.stop(audioContext.currentTime + 0.2);
            break;
          }
          default:
            break;
        }
      } catch (e) {
        // Silently fail if audio not supported
        console.debug('Audio not available:', e);
      }
    },
    [isSoundEnabled]
  );

  return {
    playSound,
    toggleSounds,
    isSoundEnabled,
  };
}

export default useSounds;
