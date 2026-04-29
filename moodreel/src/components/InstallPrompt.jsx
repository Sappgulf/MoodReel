import React, { useState, useEffect } from 'react';

/**
 * Install prompt banner for PWA
 * Shows "Add to Home Screen" on supported mobile browsers
 */
function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const readDismissPreference = () => {
    try {
      const dismissed = localStorage.getItem('moodreel-install-dismissed');
      return dismissed ? parseInt(dismissed, 10) : null;
    } catch {
      return null;
    }
  };

  const persistDismissPreference = value => {
    try {
      localStorage.setItem('moodreel-install-dismissed', String(value));
    } catch {
      // Ignore environments where localStorage is blocked.
    }
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

  if (!showPrompt || isInstalled) return null;

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
