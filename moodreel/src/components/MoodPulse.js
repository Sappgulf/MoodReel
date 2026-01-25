import React, { useMemo } from 'react';

const TRENDING_MOODS = [
    { name: 'Cozy', count: 1240, color: '#FFD700' },
    { name: 'Electric', count: 850, color: '#00CED1' },
    { name: 'Melancholy', count: 620, color: '#607D8B' },
    { name: 'Nostalgic', count: 1100, color: '#FF6B6B' },
    { name: 'Intense', count: 940, color: '#DC143C' },
    { name: 'Dreamy', count: 780, color: '#9C27B0' },
];

function MoodPulse() {
    // Simulate slight fluctuations in counts
    const pulseData = useMemo(() => {
        return TRENDING_MOODS.map(mood => ({
            ...mood,
            displayCount: mood.count + Math.floor(Math.random() * 50) - 25
        })).sort((a, b) => b.displayCount - a.displayCount);
    }, []);

    const total = pulseData.reduce((sum, m) => sum + m.displayCount, 0);

    return (
        <div className="mood-pulse-container">
            <div className="pulse-header">
                <span className="pulse-dot"></span>
                <h3>Global Mood Pulse</h3>
                <span className="pulse-live">LIVE</span>
            </div>
            <div className="pulse-track">
                {pulseData.map((mood) => (
                    <div
                        key={mood.name}
                        className="pulse-item"
                        style={{ '--mood-color': mood.color }}
                    >
                        <div className="pulse-label">
                            <span className="mood-name">{mood.name}</span>
                            <span className="mood-percentage">
                                {Math.round((mood.displayCount / total) * 100)}%
                            </span>
                        </div>
                        <div className="pulse-bar-wrapper">
                            <div
                                className="pulse-bar"
                                style={{ width: `${(mood.displayCount / total) * 200}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>
            <p className="pulse-info">Based on recent searches from the MoodReel community</p>
        </div>
    );
}

export default MoodPulse;
