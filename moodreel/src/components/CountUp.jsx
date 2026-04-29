import React, { useState, useEffect } from 'react';

const CountUp = ({ end, duration = 2000, suffix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime = null;
    const endValue = parseFloat(end);
    if (isNaN(endValue)) return;

    const step = timestamp => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);

      // Easing function: outExpo
      const easingProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);

      const currentCount = easingProgress * endValue;

      if (end % 1 === 0) {
        setCount(Math.floor(currentCount));
      } else {
        setCount(currentCount.toFixed(1));
      }

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [end, duration]);

  return (
    <span>
      {count}
      {suffix}
    </span>
  );
};

export default CountUp;
