import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

// TODO: Move this to a .env file for security
const apiKey = 'f2b1a353af51ccd27736c209f7ea0ca6';

function App() {
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
    <div className="App">
      <header className="App-header">
        <h1>MoodReel</h1>
        <p>Tell us your mood, we'll find you a reel.</p>
      </header>
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
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;