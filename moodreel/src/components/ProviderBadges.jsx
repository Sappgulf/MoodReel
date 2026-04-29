import React from 'react';
import { getPosterUrl } from '../utils/mediaUtils';

function ProviderBadges({ providers = [], max = 3 }) {
  if (!providers || providers.length === 0) return null;
  const visible = providers.slice(0, max);
  const overflow = providers.length - visible.length;

  return (
    <div className="provider-badges" aria-label="Streaming providers">
      {visible.map(provider => (
        <img
          key={provider.id}
          src={getPosterUrl(provider.logoPath, 'w45')}
          alt={provider.name}
          title={provider.name}
          className="provider-badge"
          loading="lazy"
          decoding="async"
        />
      ))}
      {overflow > 0 && <span className="provider-badge overflow">+{overflow}</span>}
    </div>
  );
}

export default React.memo(ProviderBadges);
