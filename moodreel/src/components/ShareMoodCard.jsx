import React, { useCallback, useRef } from 'react';
import { getDisplayTitle, getPosterUrl } from '../utils/mediaUtils';

function ShareMoodCard({ mood = 'Tonight', picks = [], className = '' }) {
  const canvasRef = useRef(null);

  const drawCard = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    const width = 1080;
    const height = 1350;
    canvas.width = width;
    canvas.height = height;

    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0f0f1a');
    gradient.addColorStop(1, '#1a1028');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 56px Georgia, serif';
    ctx.fillText('MoodReel Tonight', 64, 96);
    ctx.fillStyle = '#f5f5f5';
    ctx.font = '32px system-ui, sans-serif';
    ctx.fillText(`Mood: ${mood}`, 64, 160);

    picks.slice(0, 3).forEach((item, index) => {
      const y = 240 + index * 340;
      ctx.fillStyle = '#dc143c';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillText(['Safe Bet', 'Best Match', 'Wild Card'][index] || `Pick ${index + 1}`, 64, y);
      ctx.fillStyle = '#ffffff';
      ctx.font = '36px system-ui, sans-serif';
      const title = getDisplayTitle(item);
      ctx.fillText(title.length > 42 ? `${title.slice(0, 39)}…` : title, 64, y + 48);
    });

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '24px system-ui, sans-serif';
    ctx.fillText('moodreel.app', 64, height - 48);

    return canvas;
  }, [mood, picks]);

  const handleDownload = () => {
    const canvas = drawCard();
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `moodreel-tonight-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleCopyText = async () => {
    const lines = picks.map(
      (item, i) => `${['Safe Bet', 'Best Match', 'Wild Card'][i]}: ${getDisplayTitle(item)}`
    );
    const text = `MoodReel Tonight — ${mood}\n${lines.join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // ignore
    }
  };

  return (
    <div className={`share-mood-card ${className}`.trim()}>
      <canvas ref={canvasRef} className="share-mood-card__canvas" aria-hidden="true" />
      <div className="share-mood-card__previews">
        {picks.map(item => (
          <img
            key={`${item.media_type}:${item.id}`}
            src={getPosterUrl(item.poster_path, 'w185')}
            alt=""
            loading="lazy"
          />
        ))}
      </div>
      <div className="share-mood-card__actions">
        <button type="button" onClick={handleDownload}>
          Download share card
        </button>
        <button type="button" className="secondary" onClick={handleCopyText}>
          Copy text summary
        </button>
      </div>
    </div>
  );
}

export default ShareMoodCard;
