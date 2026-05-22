import React from 'react';
import { getPosterUrl } from '../utils/mediaUtils';
import { availabilityLabel } from '../utils/providerAvailability';

function ProviderBadges({ providers = [], max = 3, availabilityStatus = null }) {
  if (!providers || providers.length === 0) {
    if (!availabilityStatus || availabilityStatus === 'unknown') return null;
    return (
      <span className={`provider-status provider-status--${availabilityStatus}`}>
        {availabilityLabel(availabilityStatus)}
      </span>
    );
  }
  const visible = providers.slice(0, max);
  const overflow = providers.length - visible.length;

  return (
    <div className="provider-badges-wrap">
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
      {availabilityStatus && availabilityStatus !== 'confirmed' && (
        <span className={`provider-status provider-status--${availabilityStatus}`}>
          {availabilityLabel(availabilityStatus)}
        </span>
      )}
    </div>
  );
}

export default React.memo(ProviderBadges);
