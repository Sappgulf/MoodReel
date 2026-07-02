import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useModalDialog } from '../hooks/useModalDialog';
import { TOP_STREAMING_SERVICES } from '../constants/streamingServices';
import { StorageKeys as SK } from '../storage/storageKeys';
import { safeGetRaw, safeSetJSON, safeSetRaw } from '../storage/safeStorage';

const TASTE_SETTINGS_KEY = 'moodreel-taste-settings';

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
    icon: '👆',
    title: 'Swipe to Save',
    description: 'On mobile, swipe right to save movies to your watchlist, left to pass.',
  },
  {
    icon: '🎛️',
    title: 'Tune the first picks',
    description:
      'Choose your format, runtime comfort, and streaming services so Tonight Mode starts smarter.',
    setup: true,
  },
  {
    icon: '📱',
    title: 'Install the App',
    description: 'Add MoodReel to your home screen for the best experience!',
  },
];

/**
 * First-time onboarding modal with feature highlights
 */
function OnboardingModal() {
  const [show, setShow] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [starterPrefs, setStarterPrefs] = useState({
    contentType: 'any',
    maxRuntime: 0,
    avoidHorror: false,
    hiddenGemBias: false,
    services: [],
  });

  const touchStart = useRef(null);

  useEffect(() => {
    const hasOnboarded = safeGetRaw(SK.ONBOARDED, null);
    if (!hasOnboarded) {
      setShow(true);
    }
  }, []);

  const handleClose = useCallback(() => {
    safeSetJSON(TASTE_SETTINGS_KEY, {
      contentType: starterPrefs.contentType,
      maxRuntime: starterPrefs.maxRuntime,
      avoidHorror: starterPrefs.avoidHorror,
      hiddenGemBias: starterPrefs.hiddenGemBias,
      preferredDecades: [],
    });
    safeSetJSON(SK.MY_SERVICES, starterPrefs.services);
    safeSetRaw(SK.ONBOARDED, 'true');
    setShow(false);
  }, [starterPrefs]);

  const handleNext = useCallback(() => {
    setCurrentSlide(prev => {
      if (prev >= slides.length - 1) {
        handleClose();
        return prev;
      }
      return prev + 1;
    });
  }, [handleClose]);

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
    [currentSlide, handleNext]
  );

  const { dialogRef } = useModalDialog({
    isOpen: show,
    onClose: handleClose,
    onKeyDown: handleModalKeyDown,
  });

  const handleBackdropClick = e => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!show) return null;

  const slide = slides[currentSlide];

  const updateStarterPref = (key, value) => {
    setStarterPrefs(prev => ({ ...prev, [key]: value }));
  };

  const toggleStarterService = id => {
    setStarterPrefs(prev => ({
      ...prev,
      services: prev.services.includes(id)
        ? prev.services.filter(serviceId => serviceId !== id)
        : [...prev.services, id],
    }));
  };

  // Swipe support for mobile
  const handleTouchStart = e => {
    touchStart.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = e => {
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
            <div className="onboarding-setup" aria-label="Starter preferences">
              <label>
                Format
                <select
                  value={starterPrefs.contentType}
                  onChange={e => updateStarterPref('contentType', e.target.value)}
                >
                  <option value="any">Movies and TV</option>
                  <option value="movie">Movies first</option>
                  <option value="tv">Series first</option>
                </select>
              </label>
              <label>
                Runtime
                <select
                  value={starterPrefs.maxRuntime}
                  onChange={e => updateStarterPref('maxRuntime', Number(e.target.value))}
                >
                  <option value={0}>No limit</option>
                  <option value={90}>90 minutes</option>
                  <option value={110}>110 minutes</option>
                  <option value={130}>130 minutes</option>
                </select>
              </label>
              <div className="onboarding-toggle-row">
                <label>
                  <input
                    type="checkbox"
                    checked={starterPrefs.avoidHorror}
                    onChange={e => updateStarterPref('avoidHorror', e.target.checked)}
                  />
                  Avoid horror
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={starterPrefs.hiddenGemBias}
                    onChange={e => updateStarterPref('hiddenGemBias', e.target.checked)}
                  />
                  Prefer hidden gems
                </label>
              </div>
              <div className="onboarding-service-grid" role="group" aria-label="Streaming services">
                {TOP_STREAMING_SERVICES.slice(0, 6).map(service => (
                  <button
                    key={service.id}
                    type="button"
                    className={starterPrefs.services.includes(service.id) ? 'active' : ''}
                    aria-pressed={starterPrefs.services.includes(service.id)}
                    onClick={() => toggleStarterService(service.id)}
                  >
                    {service.label}
                  </button>
                ))}
              </div>
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

        <button
          type="button"
          className="onboarding-next"
          onClick={handleNext}
          aria-label={currentSlide === slides.length - 1 ? 'Finish onboarding' : undefined}
        >
          {currentSlide === slides.length - 1 ? "Let's Go!" : 'Next →'}
          {currentSlide === slides.length - 1 && <span aria-hidden="true"> 🚀</span>}
        </button>
      </div>
    </div>
  );
}

export default React.memo(OnboardingModal);
