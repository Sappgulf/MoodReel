import React, { useState, useEffect, useCallback, useRef } from 'react';

const shortcuts = [
    { keys: ['J', '↓'], description: 'Select next movie' },
    { keys: ['K', '↑'], description: 'Select previous movie' },
    { keys: ['Enter'], description: 'Open selected movie details' },
    { keys: ['←', '→'], description: 'Swipe left/right (mobile)' },
    { keys: ['?'], description: 'Show this shortcuts modal' },
    { keys: ['Esc'], description: 'Close modals' },
    { keys: ['D'], description: 'Toggle dark/light theme' },
    { keys: ['M'], description: 'Toggle sound effects' },
];

/**
 * Keyboard shortcuts help modal
 */
function KeyboardShortcutsModal({ isOpen, onClose }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(isOpen);
    }, [isOpen]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    useEffect(() => {
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }
    }, [isOpen, handleKeyDown]);

    const touchStart = useRef(null);
    const handleTouchStart = (e) => {
        touchStart.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = (e) => {
        if (!touchStart.current) return;
        const touchEnd = e.changedTouches[0].clientX;
        const diff = Math.abs(touchStart.current - touchEnd);

        if (diff > 100) {
            onClose();
        }
        touchStart.current = null;
    };

    if (!visible) return null;

    return (
        <div className="shortcuts-backdrop" onClick={onClose} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div className="shortcuts-modal" onClick={e => e.stopPropagation()}>
                <button className="shortcuts-close" onClick={onClose}>✕</button>

                <h2>⌨️ Keyboard Shortcuts</h2>

                <div className="shortcuts-list">
                    {shortcuts.map((shortcut, i) => (
                        <div key={i} className="shortcut-row">
                            <div className="shortcut-keys">
                                {shortcut.keys.map((key, j) => (
                                    <kbd key={j}>{key}</kbd>
                                ))}
                            </div>
                            <span className="shortcut-desc">{shortcut.description}</span>
                        </div>
                    ))}
                </div>

                <p className="shortcuts-hint">
                    Press <kbd>?</kbd> anytime to show this modal
                </p>
            </div>
        </div>
    );
}

export default React.memo(KeyboardShortcutsModal);
