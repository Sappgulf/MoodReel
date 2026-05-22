import { parseMoodToGenres, getGenreName, moodMap } from './moodParser';

describe('moodParser', () => {
  describe('parseMoodToGenres', () => {
    it('should return empty array for null/undefined/empty input', () => {
      expect(parseMoodToGenres(null)).toEqual([]);
      expect(parseMoodToGenres(undefined)).toEqual([]);
      expect(parseMoodToGenres('')).toEqual([]);
      expect(parseMoodToGenres('   ')).toEqual([]);
    });

    it('should match exact mood keywords', () => {
      expect(parseMoodToGenres('happy')).toContain(35); // Comedy
      expect(parseMoodToGenres('sad')).toContain(18); // Drama
      expect(parseMoodToGenres('horror')).toContain(27); // Horror
      expect(parseMoodToGenres('romantic')).toContain(10749); // Romance
    });

    it('should be case insensitive', () => {
      expect(parseMoodToGenres('HAPPY')).toContain(35);
      expect(parseMoodToGenres('Happy')).toContain(35);
      expect(parseMoodToGenres('HaPpY')).toContain(35);
    });

    it('should match multi-word phrases', () => {
      expect(parseMoodToGenres('feel good')).toContain(35); // Comedy
      expect(parseMoodToGenres('date night')).toContain(10749); // Romance
      expect(parseMoodToGenres('sci-fi')).toContain(878); // Sci-Fi
    });

    it('should match partial phrases', () => {
      expect(parseMoodToGenres('I want something happy')).toContain(35);
      expect(parseMoodToGenres('feeling sad today')).toContain(18);
    });

    it('should normalize punctuation and avoid substring false positives', () => {
      expect(parseMoodToGenres('Need SCI-FI!!!')).toContain(878);
      expect(parseMoodToGenres('happiness overload')).toEqual([]);
    });

    it('should return multiple genres for compound moods', () => {
      const genres = parseMoodToGenres('action adventure');
      expect(genres).toContain(28); // Action
      expect(genres).toContain(12); // Adventure
    });

    it('should handle mood categories correctly', () => {
      // Happy/Comedy
      expect(parseMoodToGenres('funny')).toContain(35);
      expect(parseMoodToGenres('comedy')).toContain(35);
      expect(parseMoodToGenres('uplifting')).toContain(35);

      // Thriller
      expect(parseMoodToGenres('thriller')).toContain(53);
      expect(parseMoodToGenres('suspense')).toContain(53);

      // Documentary
      expect(parseMoodToGenres('documentary')).toContain(99);
      expect(parseMoodToGenres('true story')).toContain(99);
    });
  });

  describe('getGenreName', () => {
    it('should return correct genre names', () => {
      expect(getGenreName(35)).toBe('Comedy');
      expect(getGenreName(18)).toBe('Drama');
      expect(getGenreName(27)).toBe('Horror');
      expect(getGenreName(10749)).toBe('Romance');
      expect(getGenreName(878)).toBe('Science Fiction');
    });

    it('should return Unknown for invalid genre IDs', () => {
      expect(getGenreName(0)).toBe('Unknown');
      expect(getGenreName(99999)).toBe('Unknown');
    });
  });

  describe('moodMap', () => {
    it('should have all expected mood categories', () => {
      // Verify some key moods exist
      expect(moodMap.happy).toBeDefined();
      expect(moodMap.sad).toBeDefined();
      expect(moodMap.horror).toBeDefined();
      expect(moodMap.romantic).toBeDefined();
      expect(moodMap.thriller).toBeDefined();
      expect(moodMap.documentary).toBeDefined();
    });

    it('should map to valid TMDB genre IDs', () => {
      // All mapped values should be positive integers
      Object.values(moodMap).forEach(id => {
        expect(typeof id).toBe('number');
        expect(id).toBeGreaterThan(0);
      });
    });
  });
});
