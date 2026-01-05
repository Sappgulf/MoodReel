import React, { useState, useEffect } from 'react';

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

    return (
        <div className="onboarding-backdrop">
            <div className="onboarding-modal">
                <button className="onboarding-skip" onClick={handleClose}>
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
                            onClick={() => setCurrentSlide(i)}
                        />
                    ))}
                </div>

                <button className="onboarding-next" onClick={handleNext}>
                    {currentSlide === slides.length - 1 ? "Let's Go! 🚀" : 'Next →'}
                </button>
            </div>
        </div>
    );
}

export default React.memo(OnboardingModal);
