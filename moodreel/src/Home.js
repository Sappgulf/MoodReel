import React, { useState } from 'react';
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

  const handleMoodChange = (event) => {
    setMood(event.target.value);
  };

  const getRecommendations = async () => {
    if (!mood) {
      setError('Please enter a mood or a search term.');
      return;
    }
    setError('');

    const lowerCaseMood = mood.toLowerCase();
    const genreId = moodMap[lowerCaseMood];
    let url;

    if (genreId) {
      // If the mood is in our map, discover movies by genre
      url = `https://api.themoviedb.org/3/discover/movie?api_key=${apiKey}&with_genres=${genreId}&sort_by=popularity.desc`;
    } else {
      // Otherwise, search by the term directly
      url = `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${mood}`;
    }

    try {
      const response = await axios.get(url);
      if (response.data.results && response.data.results.length > 0) {
        setRecommendations(response.data.results);
      } else {
        setRecommendations([]);
        setError('No results found for that mood. Try another!');
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
          placeholder="How are you feeling?"
        />
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