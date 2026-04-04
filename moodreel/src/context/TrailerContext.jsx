import React, { createContext, useContext, useState } from 'react';

const TrailerContext = createContext();

export function TrailerProvider({ children }) {
    const [activeTrailer, setActiveTrailer] = useState(null);

    const playTrailer = (videoKey, title) => {
        setActiveTrailer({ videoKey, title });
    };

    const closeTrailer = () => {
        setActiveTrailer(null);
    };

    return (
        <TrailerContext.Provider value={{ activeTrailer, playTrailer, closeTrailer }}>
            {children}
        </TrailerContext.Provider>
    );
}

export function useTrailer() {
    const context = useContext(TrailerContext);
    if (!context) {
        throw new Error('useTrailer must be used within a TrailerProvider');
    }
    return context;
}
