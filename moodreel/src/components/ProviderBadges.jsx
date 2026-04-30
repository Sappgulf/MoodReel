import React, { useState, useCallback } from 'react';
import { getPosterUrl } from '../utils/mediaUtils';

function ProviderBadgeItem({ provider }) {
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (hasError) {
    const initials = (provider.name || '?')
      .split(' ')
      .map(w => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    return (
      <span className="provider-badge provider-badge-fallback" title={provider.name}>
        {initials}
      </span>
    );
  }

  return (
    <img
      src={getPosterUrl(provider.logoPath, 'w45')}
      alt={provider.name}
      title={provider.name}
      className="provider-badge"
      loading="lazy"
      decoding="async"
      onError={handleError}
    />
  );
}

function ProviderBadges({ providers = [], max = 3 }) {
  if (!providers || providers.length === 0) return null;
  const visible = providers.slice(0, max);
  const overflow = providers.length - visible.length;

  return (
    <div className="provider-badges" aria-label="Streaming providers">
      {visible.map(provider => (
        <ProviderBadgeItem key={provider.id} provider={provider} />
      ))}
      {overflow > 0 && <span className="provider-badge overflow">+{overflow}</span>}
    </div>
  );
}

export default React.memo(ProviderBadges);
