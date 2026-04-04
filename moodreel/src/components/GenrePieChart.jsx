import React, { useRef, useEffect } from 'react';

const CHART_COLORS = [
    '#FFD700', '#DC143C', '#00CED1', '#FF6B6B', '#4CAF50',
    '#9C27B0', '#FF9800', '#2196F3', '#E91E63', '#8BC34A',
    '#607D8B', '#795548', '#009688', '#CDDC39', '#3F51B5'
];

/**
 * GenrePieChart - Canvas-based pie chart for genre visualization
 */
function GenrePieChart({ data, size = 200 }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || data.length === 0) return;

        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 5;

        // Calculate total for percentages
        const total = data.reduce((sum, item) => sum + item.count, 0);
        if (total === 0) return;

        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw segments
        let currentAngle = -Math.PI / 2; // Start at top

        data.forEach((item, index) => {
            const segmentAngle = (item.count / total) * Math.PI * 2;

            // Draw segment
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + segmentAngle);
            ctx.closePath();
            ctx.fillStyle = CHART_COLORS[index % CHART_COLORS.length];
            ctx.fill();

            // Add shine effect
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.lineWidth = 1;
            ctx.stroke();

            currentAngle += segmentAngle;
        });

        // Draw center hole (donut style)
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = '#09090b';
        ctx.fill();

        // Draw center text
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 18px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(total.toString(), centerX, centerY - 8);
        ctx.fillStyle = '#a1a1aa';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText('titles', centerX, centerY + 10);

    }, [data]);

    if (data.length === 0) {
        return (
            <div className="pie-chart-empty">
                <p>Add movies to see genre breakdown</p>
            </div>
        );
    }

    return (
        <div className="pie-chart-wrapper">
            <canvas
                ref={canvasRef}
                width={size}
                height={size}
                className="pie-chart-canvas"
            />
            <div className="pie-chart-legend">
                {data.slice(0, 6).map((item, index) => (
                    <div key={item.name} className="legend-item">
                        <span
                            className="legend-color"
                            style={{ background: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span className="legend-label">{item.name}</span>
                        <span className="legend-count">{item.count}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default React.memo(GenrePieChart);
