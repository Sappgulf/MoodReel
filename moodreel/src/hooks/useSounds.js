import { useCallback } from 'react';
import { StorageKeys as SK } from '../storage/storageKeys';

const HAS_WINDOW = typeof window !== 'undefined';

// AudioContext singleton - browsers limit these (typically 6 per tab)
let audioContextInstance = null;

function getAudioContext() {
  if (!HAS_WINDOW) return null;
  if (!audioContextInstance) {
    try {
      audioContextInstance = new (window.AudioContext || window.webkitAudioContext)();
    } catch {
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
    return localStorage.getItem(SK.SOUNDS) !== 'off';
  }, []);

  const toggleSounds = useCallback(() => {
    const current = localStorage.getItem(SK.SOUNDS);
    const newValue = current === 'off' ? 'on' : 'off';
    localStorage.setItem(SK.SOUNDS, newValue);
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
