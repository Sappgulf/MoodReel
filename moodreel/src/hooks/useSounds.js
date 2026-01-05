import { useCallback } from 'react';

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

    const playSound = useCallback((soundName) => {
        if (!isSoundEnabled()) return;

        try {
            // Create a simple oscillator-based sound for better compatibility
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
    }, [isSoundEnabled]);

    return {
        playSound,
        toggleSounds,
        isSoundEnabled,
    };
}

export default useSounds;
