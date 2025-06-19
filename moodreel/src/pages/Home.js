import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// TODO: Move this to a .env file for security
const apiKey = 'f2b1a353af51ccd27736c209f7ea0ca6';

const moodMap = {
  happy: 35, // Comedy
  sad: 18, // Drama
  adventurous: 12, // Adventure
  scared: 27, // Horror
  romantic: 10749, // Romance
  funny: 35, // Comedy
  thrilling: 53, // Thriller
};

function Home() {
  const [mood, setMood] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [error, setError] = useState('');
  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/genre/movie/list?api_key=${apiKey}`
        );
        setGenres(response.data.genres);
      } catch (err) {
        console.error('Error fetching genres:', err);
      }
    };
    fetchGenres();
  }, []);

  const handleGenreClick = (genreId) => {
    setSelectedGenres((prevSelected) =>
      prevSelected.includes(genreId)
        ? prevSelected.filter((id) => id !== genreId)
        : [...prevSelected, genreId]
    );
  };

  const handleMoodChange = (event) => {
    setMood(event.target.value);
  };

  const getRecommendations = async () => {
    if (!mood && selectedGenres.length === 0) {
      setError('Please enter a mood or select a genre.');
      return;
    }
    setError('');

    const lowerCaseMood = mood.toLowerCase();
    const genreIdFromMood = moodMap[lowerCaseMood];
    let url;

    const allSelectedGenres = [...selectedGenres];
    if (genreIdFromMood && !allSelectedGenres.includes(genreIdFromMood)) {
      allSelectedGenres.push(genreIdFromMood);
    }
    
    const genreQuery = allSelectedGenres.join(',');

    if (genreQuery) {
      url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${genreQuery}&sort_by=popularity.desc`;
    } else {
      // Fallback to search if no genres are selected but mood is present
      url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${mood}`;
    }

    try {
      const response = await axios.get(url);
      if (response.data.results && response.data.results.length > 0) {
        setRecommendations(response.data.results);
      } else {
        setRecommendations([]);
        setError('No results found. Try another combination!');
      }
    } catch (err) {
      setError('Error fetching data. Please check the console.');
      console.error(err);
    }
  };

  return (
    <main>
      <div className="mood-selector">
        <input
          type="text"
          value={mood}
          onChange={handleMoodChange}
          placeholder="How are you feeling? (e.g., happy, sad)"
        />
      </div>

      <div className="genre-filters">
        <h3>Or pick your genres:</h3>
        <div className="genre-buttons">
          {genres.map((genre) => (
            <button
              key={genre.id}
              onClick={() => handleGenreClick(genre.id)}
              className={selectedGenres.includes(genre.id) ? 'active' : ''}
            >
              {genre.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="search-container">
        <button onClick={getRecommendations}>Get Recommendations</button>
      </div>

      {error && <p className="error">{error}</p>}
      <div className="recommendations">
        {recommendations.map((rec) => (
          <div key={rec.id} className="recommendation">
            <Link to={`/movie/${rec.id}`}>
              <h2>{rec.title}</h2>
              <p>{rec.release_date}</p>
              {rec.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${rec.poster_path}`}
                  alt={rec.title}
                />
              ) : (
                <div className="no-poster">No Poster Available</div>
              )}
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}

export default Home; 