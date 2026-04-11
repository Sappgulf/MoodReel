import React, { useCallback, useState } from 'react';
import { copyToClipboard } from '../utils/clipboard';

function ShareButtons({ title, url }) {
    const [copied, setCopied] = useState(false);

    const shareUrl = url || window.location.href;
    const shareText = `Check out "${title}" on MoodReel!`;

    const handleTwitterShare = useCallback(() => {
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(twitterUrl, '_blank', 'width=550,height=420');
    }, [shareText, shareUrl]);

    const handleFacebookShare = useCallback(() => {
        const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        window.open(fbUrl, '_blank', 'width=550,height=420');
    }, [shareUrl]);

    const handleCopyLink = useCallback(async () => {
        try {
            await copyToClipboard(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            setCopied(false);
        }
    }, [shareUrl]);

    return (
        <div className="share-buttons" role="group" aria-label="Share options">
            <span className="share-label">Share:</span>
            <button
                className="share-btn twitter"
                onClick={handleTwitterShare}
                aria-label="Share on Twitter"
                title="Share on Twitter"
            >
                𝕏
            </button>
            <button
                className="share-btn facebook"
                onClick={handleFacebookShare}
                aria-label="Share on Facebook"
                title="Share on Facebook"
            >
                f
            </button>
            <button
                className="share-btn copy"
                onClick={handleCopyLink}
                aria-label={copied ? 'Link copied!' : 'Copy link'}
                title={copied ? 'Copied!' : 'Copy link'}
            >
                {copied ? '✓' : '🔗'}
            </button>
        </div>
    );
}

export default React.memo(ShareButtons);
