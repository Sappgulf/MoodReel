import React, { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

/**
 * Modal for playing YouTube trailers
 */
function TrailerModal({ videoKey, onClose }) {
    if (!videoKey) return null;
    const dialogRef = useRef(null);
    const prevFocusRef = useRef(null);

    useEffect(() => {
        prevFocusRef.current = document.activeElement;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const timer = window.setTimeout(() => {
            dialogRef.current?.focus?.();
        }, 0);

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }

            if (e.key === 'Tab' && dialogRef.current) {
                const nodes = Array.from(dialogRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
                const focusables = nodes.filter((node) => node.offsetParent !== null && !node.disabled);
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
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.clearTimeout(timer);
            document.body.style.overflow = prevOverflow;
            prevFocusRef.current?.focus?.();
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="trailer-modal-backdrop"
            onClick={handleBackdropClick}
            role="presentation"
        >
            <div
                ref={dialogRef}
                className="trailer-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Movie trailer"
                tabIndex={-1}
            >
                <button type="button" className="trailer-close" onClick={onClose} aria-label="Close trailer">
                    ✕
                </button>
                <div className="trailer-container">
                    <iframe
                        src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&mute=1&rel=0`}
                        title="Movie Trailer"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
            </div>
        </div>
    );
}

export default React.memo(TrailerModal);
