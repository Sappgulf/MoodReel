import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

// TODO: Move this to a .env file for security
const apiKey = 'f2b1a353af51ccd27736c209f7ea0ca6';

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
    try {
      const response = await axios.get(
        `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${mood}`
      );
      if (response.data.results) {
        setRecommendations(response.data.results);
      } else {
        setRecommendations([]);
        setError('No results found.');
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