import React, { useCallback, useMemo, useState } from 'react';
import {
  FALLBACK_BACKDROP,
  FALLBACK_POSTER,
  getBackdropUrl,
  getPosterUrl,
} from '../utils/mediaUtils';

function MediaImage({
  path,
  alt,
  type = 'poster',
  size,
  fallback,
  className,
  loading = 'lazy',
  decoding = 'async',
  onError,
  ...props
}) {
  const [failed, setFailed] = useState(false);
  const fallbackSrc = fallback || (type === 'backdrop' ? FALLBACK_BACKDROP : FALLBACK_POSTER);
  const src = useMemo(() => {
    if (failed) return fallbackSrc;
    return type === 'backdrop' ? getBackdropUrl(path, size) : getPosterUrl(path, size);
  }, [failed, fallbackSrc, path, size, type]);

  const handleError = useCallback(
    event => {
      if (failed) return;
      setFailed(true);
      event.currentTarget.onerror = null;
      onError?.(event);
    },
    [failed, onError]
  );

  return (
    <img
      {...props}
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      decoding={decoding}
      referrerPolicy="no-referrer"
      data-image-state={failed ? 'fallback' : 'remote'}
      onError={handleError}
    />
  );
}

export default React.memo(MediaImage);
