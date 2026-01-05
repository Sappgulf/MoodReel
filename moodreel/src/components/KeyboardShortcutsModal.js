import React, { useState, useEffect, useCallback } from 'react';

const shortcuts = [
    { keys: ['←', '→'], description: 'Swipe left/right (mobile mode)' },
    { keys: ['Enter'], description: 'Search with current mood' },
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

    if (!visible) return null;

    return (
        <div className="shortcuts-backdrop" onClick={onClose}>
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
