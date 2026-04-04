import React, { useRef, useState, useCallback, useEffect } from 'react';

const WHEEL_COLORS = [
    '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE'
];

/**
 * Spin the Wheel - Animated random movie picker
 * Shows a colorful wheel with movie titles, spins dramatically, and lands on a winner
 */
function SpinWheel({ movies, onSelect, onClose }) {
    const canvasRef = useRef(null);
    const [isSpinning, setIsSpinning] = useState(false);
    const [winner, setWinner] = useState(null);
    const [rotation, setRotation] = useState(0);
    const animationRef = useRef(null);

    // Limit to 10 movies max for readability
    const wheelMovies = movies.slice(0, 10);
    const segmentAngle = 360 / wheelMovies.length;

    // Draw the wheel
    const drawWheel = useCallback((currentRotation) => {
        const canvas = canvasRef.current;
        if (!canvas || wheelMovies.length === 0) return;

        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 10;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw segments
        wheelMovies.forEach((movie, i) => {
            const startAngle = (i * segmentAngle + currentRotation) * Math.PI / 180;
            const endAngle = ((i + 1) * segmentAngle + currentRotation) * Math.PI / 180;

            // Draw segment
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
            ctx.fill();
            ctx.strokeStyle = '#09090b';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw text
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + (segmentAngle * Math.PI / 360));
            ctx.textAlign = 'right';
            ctx.fillStyle = '#09090b';
            ctx.font = 'bold 12px Inter, sans-serif';
            const title = (movie.title || movie.name || '').substring(0, 15);
            ctx.fillText(title + (title.length < (movie.title || movie.name || '').length ? '...' : ''), radius - 15, 5);
            ctx.restore();
        });

        // Draw center circle
        ctx.beginPath();
        ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
        ctx.fillStyle = '#09090b';
        ctx.fill();
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 3;
        ctx.stroke();

        // Draw pointer at top
        ctx.beginPath();
        ctx.moveTo(centerX, 10);
        ctx.lineTo(centerX - 15, 40);
        ctx.lineTo(centerX + 15, 40);
        ctx.closePath();
        ctx.fillStyle = '#dc143c';
        ctx.fill();
        ctx.strokeStyle = '#09090b';
        ctx.lineWidth = 2;
        ctx.stroke();
    }, [wheelMovies, segmentAngle]);

    // Initial draw
    useEffect(() => {
        drawWheel(rotation);
    }, [drawWheel, rotation]);

    // Spin the wheel
    const spin = useCallback(() => {
        if (isSpinning || wheelMovies.length === 0) return;

        setIsSpinning(true);
        setWinner(null);

        // Random final rotation (5-8 full spins + random offset)
        const spins = 5 + Math.random() * 3;
        const randomOffset = Math.random() * 360;
        const finalRotation = rotation + (spins * 360) + randomOffset;

        const startTime = Date.now();
        const duration = 5000; // 5 seconds
        const startRotation = rotation;

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Easing: slow down at the end
            const easeOut = 1 - Math.pow(1 - progress, 4);
            const currentRotation = startRotation + (finalRotation - startRotation) * easeOut;

            setRotation(currentRotation);
            drawWheel(currentRotation);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(animate);
            } else {
                // Determine winner based on final rotation
                const normalizedRotation = ((currentRotation % 360) + 360) % 360;
                const winnerIndex = Math.floor((360 - normalizedRotation) / segmentAngle) % wheelMovies.length;
                setWinner(wheelMovies[winnerIndex]);
                setIsSpinning(false);
            }
        };

        animationRef.current = requestAnimationFrame(animate);
    }, [isSpinning, rotation, wheelMovies, segmentAngle, drawWheel]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    const handleSelect = useCallback(() => {
        if (winner) {
            onSelect(winner);
            onClose();
        }
    }, [winner, onSelect, onClose]);

    if (wheelMovies.length === 0) {
        return (
            <div className="spin-wheel-overlay" onClick={onClose}>
                <div className="spin-wheel-modal" onClick={e => e.stopPropagation()}>
                    <h2>🎲 Spin the Wheel</h2>
                    <p>Add some movies to your watchlist first!</p>
                    <button className="spin-close-btn" onClick={onClose}>Close</button>
                </div>
            </div>
        );
    }

    return (
        <div className="spin-wheel-overlay" onClick={onClose}>
            <div className="spin-wheel-modal" onClick={e => e.stopPropagation()}>
                <button className="spin-wheel-close" onClick={onClose}>✕</button>
                <h2>🎲 Spin the Wheel!</h2>
                <p className="spin-subtitle">Can't decide? Let fate choose!</p>

                <div className="spin-wheel-container">
                    <canvas
                        ref={canvasRef}
                        width={350}
                        height={350}
                        className="spin-wheel-canvas"
                    />
                </div>

                {!winner ? (
                    <button
                        className="spin-button"
                        onClick={spin}
                        disabled={isSpinning}
                    >
                        {isSpinning ? '🎡 Spinning...' : '🎰 SPIN!'}
                    </button>
                ) : (
                    <div className="spin-winner">
                        <h3>🎉 Tonight's Pick:</h3>
                        <p className="winner-title">{winner.title || winner.name}</p>
                        <div className="winner-actions">
                            <button className="spin-again-btn" onClick={spin}>
                                🔄 Spin Again
                            </button>
                            <button className="watch-btn" onClick={handleSelect}>
                                ▶️ Let's Watch!
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default React.memo(SpinWheel);
