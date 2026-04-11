import React, { useEffect, useRef } from 'react';
import { focusFirstInDialog, handleTabTrapping } from '../utils/modalFocus';

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
            focusFirstInDialog(dialogRef.current);
        }, 0);

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }

            handleTabTrapping(e, dialogRef.current);
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
