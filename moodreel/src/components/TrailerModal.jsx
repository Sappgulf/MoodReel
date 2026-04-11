import React from 'react';
import { useModalDialog } from '../hooks/useModalDialog';

/**
 * Modal for playing YouTube trailers
 */
function TrailerModal({ videoKey, onClose }) {
    if (!videoKey) return null;

    const { dialogRef } = useModalDialog({ isOpen: !!videoKey, onClose });

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
