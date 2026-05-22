export const calculatePersona = stats => {
  if (!stats || stats.totalMovies === 0) {
    return {
      title: 'The Newcomer',
      emoji: '🌱',
      description: 'Just starting their cinematic journey.',
    };
  }

  const { genreData } = stats;

  // Most watched genre
  const topGenre = genreData?.[0]?.name;

  if (topGenre === 'Action' || topGenre === 'Adventure') {
    return {
      title: 'The Adrenaline Junkie',
      emoji: '💥',
      description: 'Lives for explosions, car chases, and epic quests.',
    };
  }

  if (topGenre === 'Comedy') {
    return {
      title: 'The Laugh Master',
      emoji: '😂',
      description: 'Always in search of the next big laugh.',
    };
  }

  if (topGenre === 'Horror' || topGenre === 'Thriller') {
    return {
      title: 'The Thrill Seeker',
      emoji: '👻',
      description: "Not afraid of the dark, or what's hiding in it.",
    };
  }

  if (topGenre === 'Romance' || topGenre === 'Drama') {
    return {
      title: 'The Soul Searcher',
      emoji: '❤️',
      description: 'Connects deeply with human emotions and stories.',
    };
  }

  if (topGenre === 'Science Fiction' || topGenre === 'Mystery') {
    return {
      title: 'The Mind-Bender',
      emoji: '🧠',
      description: 'Enjoys puzzles, alternate realities, and the future.',
    };
  }

  if (topGenre === 'Animation' || topGenre === 'Family') {
    return {
      title: 'The Joy Bringer',
      emoji: '🎈',
      description: 'Young at heart and loves a good family adventure.',
    };
  }

  return {
    title: 'The Curator',
    emoji: '🎞️',
    description: 'A balanced lover of all high-quality cinema.',
  };
};
