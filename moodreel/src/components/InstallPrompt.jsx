import React, { useState, useEffect } from 'react';

import { StorageKeys as SK } from '../storage/storageKeys';
import { safeGetRaw, safeSetRaw } from '../storage/safeStorage';

/**
 * iOS Safari detection. iOS doesn't fire `beforeinstallprompt`, so we
 * detect it and show a hand-holdy instruction sheet instead of the
 * generic one-click install prompt used on Chrome/Edge.
 */
function isIosSafari() {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIos = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  // Safari (not Chrome/Firefox on iOS)
  const isWebkit = /WebKit/.test(ua);
  const isCriOS = /CriOS/.test(ua);
  const isFxiOS = /FxiOS/.test(ua);
  return isIos && isWebkit && !isCriOS && !isFxiOS;
}

/**
 * Install prompt banner for PWA. Shows:
 *  - the native "Add to Home Screen" sheet on Chrome/Edge Android
 *  - a custom iOS Safari instruction card on iOS (since it doesn't
 *    fire beforeinstallprompt)
 */
function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  const readDismissPreference = () => {
    const dismissed = safeGetRaw(SK.INSTALL_DISMISSED, null);
    return dismissed ? parseInt(dismissed, 10) : null;
  };

  const persistDismissPreference = value => {
    safeSetRaw(SK.INSTALL_DISMISSED, String(value));
  };

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed recently
    const dismissed = readDismissPreference();
    if (dismissed) {
      // Don't show for 7 days after dismiss
      if (Date.now() - dismissed < 7 * 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Capture install prompt
    const handleBeforeInstall = e => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowPrompt(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // iOS Safari doesn't fire beforeinstallprompt; surface a friendly
    // instruction sheet after a small delay so first-time iOS visitors
    // discover the "Add to Home Screen" affordance.
    if (isIosSafari()) {
      const timer = setTimeout(() => setShowIosHelp(true), 4000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
    persistDismissPreference(Date.now());
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    persistDismissPreference(Date.now());
  };

  if (isInstalled) return null;

  // iOS Safari: hand-holdy instructions card
  if (showIosHelp && !showPrompt) {
    return (
      <div
        className="install-prompt install-prompt-ios"
        role="dialog"
        aria-modal="false"
        aria-label="Install MoodReel on your iPhone or iPad"
      >
        <div className="install-content">
          <span className="install-icon" aria-hidden="true">
            📲
          </span>
          <div className="install-text">
            <p className="install-title">Add MoodReel to your Home Screen</p>
            <p className="install-desc">
              Tap{' '}
              <span className="ios-share-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M12 3l5 5h-3v6h-4v-6H7l5-5zm-7 16h14v2H5v-2z" />
                </svg>
              </span>{' '}
              then choose <strong>Add to Home Screen</strong>.
            </p>
          </div>
        </div>
        <div className="install-actions">
          <button
            type="button"
            className="install-btn"
            onClick={() => {
              persistDismissPreference(Date.now());
              setShowIosHelp(false);
            }}
          >
            Got it
          </button>
          <button
            type="button"
            className="install-dismiss"
            onClick={() => {
              persistDismissPreference(Date.now());
              setShowIosHelp(false);
            }}
          >
            Not now
          </button>
        </div>
      </div>
    );
  }

  if (!showPrompt) return null;

  return (
    <div className="install-prompt">
      <div className="install-content">
        <span className="install-icon">📲</span>
        <div className="install-text">
          <p className="install-title">Install MoodReel</p>
          <p className="install-desc">Add to your home screen for quick access</p>
        </div>
      </div>
      <div className="install-actions">
        <button type="button" className="install-btn" onClick={handleInstall}>
          Install
        </button>
        <button type="button" className="install-dismiss" onClick={handleDismiss}>
          Not now
        </button>
      </div>
    </div>
  );
}

export default React.memo(InstallPrompt);
