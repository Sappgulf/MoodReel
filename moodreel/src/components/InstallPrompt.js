import React, { useState, useEffect } from 'react';

/**
 * Install prompt banner for PWA
 * Shows "Add to Home Screen" on supported mobile browsers
 */
function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Check if dismissed recently
        const dismissed = localStorage.getItem('moodreel-install-dismissed');
        if (dismissed) {
            const dismissedTime = parseInt(dismissed, 10);
            // Don't show for 7 days after dismiss
            if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
                return;
            }
        }

        // Capture install prompt
        const handleBeforeInstall = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setShowPrompt(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstall);

        // Track successful install
        window.addEventListener('appinstalled', () => {
            setIsInstalled(true);
            setShowPrompt(false);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
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
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('moodreel-install-dismissed', Date.now().toString());
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
                <button className="install-btn" onClick={handleInstall}>
                    Install
                </button>
                <button className="install-dismiss" onClick={handleDismiss}>
                    Not now
                </button>
            </div>
        </div>
    );
}

export default React.memo(InstallPrompt);
