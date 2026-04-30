import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FALLBACK_BACKDROP,
  FALLBACK_POSTER,
  getBackdropUrl,
  getPosterUrl,
} from '../utils/mediaUtils';

function MediaImage({
  path,
  sources,
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
  const imageSources = useMemo(() => {
    const candidates =
      Array.isArray(sources) && sources.length > 0 ? sources : [{ path, type, size }];
    return candidates
      .filter(source => source?.path)
      .map(source => ({
        path: source.path,
        type: source.type || type,
        size: source.size || size,
      }));
  }, [path, size, sources, type]);
  const sourceKey = useMemo(() => JSON.stringify(imageSources), [imageSources]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [failed, setFailed] = useState(false);
  const fallbackSrc = fallback || (type === 'backdrop' ? FALLBACK_BACKDROP : FALLBACK_POSTER);
  const src = useMemo(() => {
    if (failed) return fallbackSrc;
    const candidate = imageSources[sourceIndex];
    if (!candidate) return fallbackSrc;
    return candidate.type === 'backdrop'
      ? getBackdropUrl(candidate.path, candidate.size)
      : getPosterUrl(candidate.path, candidate.size);
  }, [failed, fallbackSrc, imageSources, sourceIndex]);

  useEffect(() => {
    setSourceIndex(0);
    setFailed(false);
  }, [sourceKey]);

  const handleError = useCallback(
    event => {
      if (failed) return;
      if (sourceIndex < imageSources.length - 1) {
        setSourceIndex(index => index + 1);
        return;
      }
      setFailed(true);
      event.currentTarget.onerror = null;
      onError?.(event);
    },
    [failed, imageSources.length, onError, sourceIndex]
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
