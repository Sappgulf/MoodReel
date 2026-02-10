/**
 * Mood to genre mapping and parsing utilities
 * Extracted for testability and reuse
 */

// Extended mood mapping with NLP-style phrase support
export const moodMap = {
    // Happy/Uplifting
    happy: 35, joyful: 35, cheerful: 35, funny: 35, laugh: 35, comedy: 35,
    uplifting: 35, 'feel good': 35, 'pick me up': 35, lighthearted: 35,

    // Sad/Emotional
    sad: 18, emotional: 18, dramatic: 18, crying: 18, melancholy: 18,
    heartbreak: 18, breakup: 18, 'after a breakup': 18, tearjerker: 18,

    // Adventure/Action
    adventurous: 12, adventure: 12, exciting: 28, action: 28, adrenaline: 28,
    epic: 28, explosive: 28, superhero: 28, superheroes: 28, marvel: 28, dc: 28,

    // Scary/Horror
    scared: 27, scary: 27, horror: 27, spooky: 27, creepy: 27, terrifying: 27,
    halloween: 27, nightmare: 27, zombie: 27, zombies: 27,

    // Romance
    romantic: 10749, love: 10749, romance: 10749, lovely: 10749,
    'date night': 10749, passionate: 10749, 'fall in love': 10749,

    // Thriller/Mystery
    thrilling: 53, thriller: 53, suspense: 53, mystery: 9648, mysterious: 9648,
    tense: 53, 'edge of seat': 53,

    // Sci-Fi/Fantasy
    scifi: 878, 'sci-fi': 878, futuristic: 878, fantasy: 14, magical: 14,
    space: 878, aliens: 878, wizards: 14,

    // Relaxed/Animated
    relaxed: 16, chill: 16, animated: 16, family: 10751, kids: 10751,
    cozy: 16, 'rainy day': 18, comfort: 35, wholesome: 10751, heartwarming: 10751,
    cartoon: 16, anime: 16,

    // Documentary/Learning
    curious: 99, documentary: 99, learning: 99, educational: 99,
    'true story': 99, inspiring: 99, nature: 99, history: 36,

    // Intense/Dark
    dark: 80, gritty: 80, noir: 80, intense: 53, disturbing: 27,
    'high stakes': 53, survival: 53, psychological: 9648,

    // Mind-bending
    'mind-bending': 878, 'mind bending': 878, surreal: 14, trippy: 878,
    complex: 9648, puzzle: 9648, 'thought provoking': 18,

    // Specific Activities
    'gym': 28, 'workout': 28, 'party': 35, 'date': 10749, 'study': 99,
    'sleep': 99, 'background': 35,
};

const normalizedMoodEntries = Object.entries(moodMap).map(([phrase, genreId]) => ({
    phrase: phrase.toLowerCase(),
    genreId
}));

const exactMoodMap = new Map(normalizedMoodEntries.map(({ phrase, genreId }) => [phrase, genreId]));

function normalizeMoodText(text) {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// TMDB Genre ID to name mapping
export const genreNames = {
    12: 'Adventure',
    14: 'Fantasy',
    16: 'Animation',
    18: 'Drama',
    27: 'Horror',
    28: 'Action',
    35: 'Comedy',
    53: 'Thriller',
    99: 'Documentary',
    878: 'Science Fiction',
    9648: 'Mystery',
    10749: 'Romance',
    10751: 'Family',
};

/**
 * Parse mood text to extract genre IDs
 * @param {string} text - User's mood input
 * @returns {number[]} - Array of TMDB genre IDs
 */
export function parseMoodToGenres(text) {
    if (!text || typeof text !== 'string') {
        return [];
    }

    const normalizedInput = normalizeMoodText(text);
    if (!normalizedInput) {
        return [];
    }

    const genres = new Set();
    const direct = exactMoodMap.get(normalizedInput);
    if (direct) {
        return [direct];
    }

    const paddedInput = ` ${normalizedInput} `;
    const inputTokens = new Set(normalizedInput.split(' '));

    // Check for phrase/token matches while avoiding broad reverse-substring false positives
    for (const { phrase, genreId } of normalizedMoodEntries) {
        if (phrase.includes(' ')) {
            if (paddedInput.includes(` ${phrase} `)) {
                genres.add(genreId);
            }
            continue;
        }

        if (inputTokens.has(phrase)) {
            genres.add(genreId);
        }
    }

    return Array.from(genres);
}

/**
 * Get genre name from TMDB genre ID
 * @param {number} genreId - TMDB genre ID
 * @returns {string} - Genre name or 'Unknown'
 */
export function getGenreName(genreId) {
    return genreNames[genreId] || 'Unknown';
}

// Named export for ESLint compliance
const moodParser = { moodMap, parseMoodToGenres, getGenreName, genreNames };
export default moodParser;
