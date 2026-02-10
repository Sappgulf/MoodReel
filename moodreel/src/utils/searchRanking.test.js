import { applySearchRanking } from './searchRanking';

const sample = [
    { id: 1, title: 'The Batman', popularity: 10 },
    { id: 2, title: 'Batman Begins', popularity: 40 },
    { id: 3, title: 'Batgirl', popularity: 60 },
    { id: 4, title: 'Random Movie', popularity: 99 }
];

describe('searchRanking', () => {
    it('prioritizes exact and prefix matches before loose matches', () => {
        const ranked = applySearchRanking(sample, 'batman');
        expect(ranked[0].title).toBe('Batman Begins');
        expect(ranked[1].title).toBe('The Batman');
        expect(ranked[2].title).toBe('Batgirl');
    });

    it('returns source list when query is empty', () => {
        expect(applySearchRanking(sample, '')).toBe(sample);
    });

    it('uses tie breaker when rank score is equal', () => {
        const ranked = applySearchRanking(
            [
                { id: 1, title: 'Spider Man', popularity: 10 },
                { id: 2, title: 'Spider Woman', popularity: 20 }
            ],
            'spider',
            (a, b) => b.popularity - a.popularity
        );

        expect(ranked[0].title).toBe('Spider Woman');
    });
});
