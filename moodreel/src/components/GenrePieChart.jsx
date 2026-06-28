import React, { useMemo } from 'react';

const CHART_COLORS = [
  '#FFD700',
  '#DC143C',
  '#00CED1',
  '#FF6B6B',
  '#4CAF50',
  '#9C27B0',
  '#FF9800',
  '#2196F3',
  '#E91E63',
  '#8BC34A',
  '#607D8B',
  '#795548',
  '#009688',
  '#CDDC39',
  '#3F51B5',
];

function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y} Z`;
}

/**
 * GenrePieChart - SVG donut chart for genre visualization
 * Renders each genre as an arc segment with a soft gap between slices.
 */
function GenrePieChart({ data, size = 200 }) {
  const segments = useMemo(() => {
    const total = data.reduce((sum, item) => sum + item.count, 0);
    if (total === 0) return [];
    let current = 0;
    return data.map((item, index) => {
      const start = (current / total) * 360;
      current += item.count;
      const end = (current / total) * 360;
      const safeEnd = end - start <= 0.5 ? start + 0.5 : end;
      return {
        ...item,
        color: CHART_COLORS[index % CHART_COLORS.length],
        path: describeArc(size / 2, size / 2, size / 2 - 4, start, safeEnd),
      };
    });
  }, [data, size]);

  if (data.length === 0) {
    return (
      <div className="pie-chart-empty">
        <p>Add movies to see genre breakdown</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="pie-chart-wrapper">
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="pie-chart-canvas"
        role="img"
        aria-label={`Genre breakdown: ${data
          .slice(0, 6)
          .map(d => `${d.name} ${d.count}`)
          .join(', ')}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={size / 2 - 4}
          fill="var(--color-bg-primary, #09090b)"
          stroke="var(--color-border, rgba(255,255,255,0.1))"
          strokeWidth="1"
        />
        {segments.map(seg => (
          <path
            key={seg.name}
            d={seg.path}
            fill={seg.color}
            stroke="var(--color-bg-primary, #09090b)"
            strokeWidth="1.5"
          >
            <title>
              {seg.name}: {seg.count}
            </title>
          </path>
        ))}
        <text
          x={size / 2}
          y={size / 2 - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--color-gold, #FFD700)"
          fontSize="18"
          fontWeight="700"
          fontFamily="Inter, sans-serif"
        >
          {total}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 12}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="var(--color-text-on-dark-muted, #a1a1aa)"
          fontSize="11"
          fontFamily="Inter, sans-serif"
        >
          titles
        </text>
      </svg>
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
