import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

const TrailerContext = createContext();

export function TrailerProvider({ children }) {
  const [activeTrailer, setActiveTrailer] = useState(null);

  const playTrailer = useCallback((videoKey, title) => {
    setActiveTrailer({ videoKey, title });
  }, []);

  const closeTrailer = useCallback(() => {
    setActiveTrailer(null);
  }, []);

  const value = useMemo(
    () => ({ activeTrailer, playTrailer, closeTrailer }),
    [activeTrailer, playTrailer, closeTrailer]
  );

  return <TrailerContext.Provider value={value}>{children}</TrailerContext.Provider>;
}

export function useTrailer() {
  const context = useContext(TrailerContext);
  if (!context) {
    throw new Error('useTrailer must be used within a TrailerProvider');
  }
  return context;
}
