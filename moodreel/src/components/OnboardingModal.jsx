import React, { useState, useEffect, useRef } from 'react';

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

    useEffect(() => {
        const hasOnboarded = localStorage.getItem(ONBOARDING_KEY);
        if (!hasOnboarded) {
            setShow(true);
        }
    }, []);

    const handleNext = () => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(prev => prev + 1);
        } else {
            handleClose();
        }
    };

    const handleClose = () => {
        localStorage.setItem(ONBOARDING_KEY, 'true');
        setShow(false);
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
                setCurrentSlide(prev => prev - 1);
            }
        }
        touchStart.current = null;
    };

    return (
        <div className="onboarding-backdrop" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <div className="onboarding-modal">
                <button type="button" className="onboarding-skip" onClick={handleClose}>
                    Skip
                </button>

                <div className="onboarding-content">
                    <div className="onboarding-icon">{slide.icon}</div>
                    <h2>{slide.title}</h2>
                    <p>{slide.description}</p>
                </div>

                <div className="onboarding-dots">
                    {slides.map((_, i) => (
                        <span
                            key={i}
                            className={`dot ${i === currentSlide ? 'active' : ''}`}
                            role="button"
                            tabIndex={0}
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
