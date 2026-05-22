import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useModalDialog } from '../hooks/useModalDialog';
import { useProviderSettings } from '../hooks/useProviderSettings';
import StreamingFilter from './StreamingFilter';

const ONBOARDING_KEY = 'moodreel-onboarded';

const REGION_PRESETS = [
  { code: 'US', label: 'United States' },
  { code: 'GB', label: 'United Kingdom' },
  { code: 'CA', label: 'Canada' },
  { code: 'AU', label: 'Australia' },
  { code: 'DE', label: 'Germany' },
  { code: 'FR', label: 'France' },
];

const slides = [
  {
    icon: '🎬',
    title: 'Welcome to MoodReel!',
    description: 'Discover movies and TV shows that match exactly how you feel.',
  },
  {
    icon: '✨',
    title: 'Search by Mood',
    description:
      'Type feelings like "cozy rainy day" or tap mood emojis for instant recommendations.',
  },
  {
    icon: '🌙',
    title: 'Tonight Mode',
    description:
      'Get three curated picks—safe bet, best match, and wild card—for your mood and time.',
  },
  {
    icon: '📺',
    title: 'Your streaming setup',
    setup: true,
    description: 'Choose your region and services so picks reflect what you can actually watch.',
  },
  {
    icon: '📱',
    title: 'Install the App',
    description: 'Add MoodReel to your home screen for the best experience!',
  },
];

function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const { region, setRegion, myServices, toggleService } = useProviderSettings();
  const touchStart = useRef(null);

  useEffect(() => {
    const hasOnboarded = localStorage.getItem(ONBOARDING_KEY);
    if (!hasOnboarded) setShow(true);
  }, []);

  const handleClose = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShow(false);
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handleModalKeyDown = useCallback(
    e => {
      if (e.key === 'ArrowLeft' && currentSlide > 0) {
        e.preventDefault();
        setCurrentSlide(prev => prev - 1);
        return;
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    },
    [currentSlide]
  );

  const { dialogRef } = useModalDialog({
    isOpen: show,
    onClose: handleClose,
    onKeyDown: handleModalKeyDown,
  });

  const handleBackdropClick = e => {
    if (e.target === e.currentTarget) handleClose();
  };

  if (!show) return null;

  const slide = slides[currentSlide];

  const handleTouchStart = e => {
    touchStart.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = e => {
    if (!touchStart.current) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart.current - touchEnd;
    if (diff > 50) handleNext();
    else if (diff < -50 && currentSlide > 0) setCurrentSlide(prev => prev - 1);
    touchStart.current = null;
  };

  return (
    <div
      className="onboarding-backdrop"
      data-app-modal="true"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleBackdropClick}
    >
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
        <button
          type="button"
          className="onboarding-skip"
          onClick={handleClose}
          aria-label="Skip onboarding"
        >
          Skip
        </button>

        <div className="onboarding-content">
          <div className="onboarding-icon">{slide.icon}</div>
          <h2 id="onboarding-title">{slide.title}</h2>
          <p id="onboarding-description">{slide.description}</p>
          {slide.setup && (
            <div className="onboarding-setup">
              <label className="onboarding-region">
                Region
                <select
                  aria-label="Watch region"
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                >
                  {REGION_PRESETS.map(r => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              <StreamingFilter
                selectedProviders={myServices}
                onToggle={toggleService}
                label="My streaming services"
              />
            </div>
          )}
        </div>

        <div className="onboarding-dots" role="tablist" aria-label="Onboarding progress">
          {slides.map((_, i) => (
            <button
              type="button"
              key={i}
              className={`dot ${i === currentSlide ? 'active' : ''}`}
              aria-current={i === currentSlide ? 'true' : 'false'}
              aria-label={`Show onboarding slide ${i + 1}`}
              onClick={() => setCurrentSlide(i)}
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
