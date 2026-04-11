import React, { useState, useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

const ONBOARDING_KEY = 'moodreel-onboarded';

const slides = [
    {
        icon: '🎬',
        title: 'Welcome to MoodReel!',
        description: 'Discover movies and TV shows that match exactly how you feel.'
    },
    {
        icon: '✨',
        title: 'Search by Mood',
        description: 'Type feelings like "cozy rainy day" or tap mood emojis for instant recommendations.'
    },
    {
        icon: '👆',
        title: 'Swipe to Save',
        description: 'On mobile, swipe right to save movies to your watchlist, left to pass.'
    },
    {
        icon: '🏆',
        title: 'Earn Achievements',
        description: 'Unlock badges as you explore! Check your progress in the Achievements page.'
    },
    {
        icon: '📱',
        title: 'Install the App',
        description: 'Add MoodReel to your home screen for the best experience!'
    }
];

/**
 * First-time onboarding modal with feature highlights
 */
function OnboardingModal() {
    const [show, setShow] = useState(false);
    const [currentSlide, setCurrentSlide] = useState(0);

    const touchStart = useRef(null);
    const dialogRef = useRef(null);
    const prevFocusRef = useRef(null);

    useEffect(() => {
        const hasOnboarded = localStorage.getItem(ONBOARDING_KEY);
        if (!hasOnboarded) {
            setShow(true);
        }
    }, []);

    const handleClose = () => {
        localStorage.setItem(ONBOARDING_KEY, 'true');
        setShow(false);
    };

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide((prev) => prev + 1);
        } else {
            handleClose();
        }
    };

    useEffect(() => {
        if (!show) return;

        prevFocusRef.current = document.activeElement;
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const timer = window.setTimeout(() => {
            dialogRef.current?.focus?.();
        }, 0);

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                handleClose();
                return;
            }

            if (e.key === 'ArrowLeft' && currentSlide > 0) {
                e.preventDefault();
                setCurrentSlide((prev) => prev - 1);
                return;
            }

            if (e.key === 'ArrowRight') {
                e.preventDefault();
                handleNext();
                return;
            }

            if (e.key !== 'Tab' || !dialogRef.current) return;
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
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.clearTimeout(timer);
            document.body.style.overflow = prevOverflow;
            prevFocusRef.current?.focus?.();
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [show, currentSlide, handleClose, handleNext]);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            handleClose();
        }
    };

    if (!show) return null;

    const slide = slides[currentSlide];

    // Swipe support for mobile
    const handleTouchStart = (e) => {
        touchStart.current = e.targetTouches[0].clientX;
    };

    const handleTouchEnd = (e) => {
        if (!touchStart.current) return;
        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchStart.current - touchEnd;

        if (diff > 50) {
            // Swipe Left -> Next
            handleNext();
        } else if (diff < -50) {
            // Swipe Right -> Previous
            if (currentSlide > 0) {
                setCurrentSlide((prev) => prev - 1);
            }
        }
        touchStart.current = null;
    };

    return (
        <div className="onboarding-backdrop" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onClick={handleBackdropClick}>
            <div
                ref={dialogRef}
                className="onboarding-modal"
                role="dialog"
                aria-modal="true"
                aria-live="polite"
                aria-labelledby="onboarding-title"
                aria-describedby="onboarding-description"
                tabIndex={-1}
            >
                <button type="button" className="onboarding-skip" onClick={handleClose} aria-label="Skip onboarding">
                    Skip
                </button>

                <div className="onboarding-content">
                    <div className="onboarding-icon">{slide.icon}</div>
                    <h2 id="onboarding-title">{slide.title}</h2>
                    <p id="onboarding-description">{slide.description}</p>
                </div>

                <div className="onboarding-dots" role="tablist" aria-label="Onboarding progress">
                    {slides.map((_, i) => (
                        <span
                            key={i}
                            className={`dot ${i === currentSlide ? 'active' : ''}`}
                            role="button"
                            tabIndex={0}
                            aria-current={i === currentSlide ? 'true' : 'false'}
                            aria-label={`Show onboarding slide ${i + 1}`}
                            onClick={() => setCurrentSlide(i)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    setCurrentSlide(i);
                                }
                            }}
                        />
                    ))}
                </div>

                <button type="button" className="onboarding-next" onClick={handleNext}>
                    {currentSlide === slides.length - 1 ? "Let's Go! 🚀" : 'Next →'}
                </button>
            </div>
        </div>
    );
}

export default React.memo(OnboardingModal);
