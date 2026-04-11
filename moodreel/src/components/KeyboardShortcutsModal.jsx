import React, { useState, useEffect, useCallback, useRef } from 'react';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

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
    const dialogRef = useRef(null);
    const prevFocusRef = useRef(null);

    useEffect(() => {
        setVisible(isOpen);
    }, [isOpen]);

    const moveFocus = useCallback(() => {
        const dialogNode = dialogRef.current;
        const focusables = dialogNode ? Array.from(dialogNode.querySelectorAll(FOCUSABLE_SELECTOR)) : [];
        const target = focusables.find((el) => el.offsetParent !== null && !el.disabled) || dialogNode;
        target?.focus?.();
    }, []);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') {
            onClose();
            return;
        }
        if (e.key !== 'Tab' || !dialogRef.current) return;
        const nodes = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
        if (!nodes.length) return;

        const focusables = nodes.filter(node => node.offsetParent !== null && !node.disabled);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    }, [onClose]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        prevFocusRef.current = document.activeElement;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        moveFocus();
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = prevOverflow;
            prevFocusRef.current?.focus?.();
        };
    }, [isOpen, handleKeyDown, moveFocus]);

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
            <div
                ref={dialogRef}
                className="shortcuts-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="keyboard-shortcuts-title"
                aria-describedby="keyboard-shortcuts-hint"
                tabIndex={-1}
                onClick={e => e.stopPropagation()}
            >
                <button type="button" className="shortcuts-close" onClick={onClose} aria-label="Close keyboard shortcuts">✕</button>

                <h2 id="keyboard-shortcuts-title">⌨️ Keyboard Shortcuts</h2>

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

                <p id="keyboard-shortcuts-hint" className="shortcuts-hint">
                    Press <kbd>?</kbd> anytime to show this modal
                </p>
            </div>
        </div>
    );
}

export default React.memo(KeyboardShortcutsModal);
