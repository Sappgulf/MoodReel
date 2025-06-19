import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [mood, setMood] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [apiKey, setApiKey] = useState(''); // State for API key
  const [error, setError] = useState('');

  const handleMoodChange = (event) => {
    setMood(event.target.value);
  };

  const handleApiKeyChange = (event) => {
    setApiKey(event.target.value);
  };

  const getRecommendations = async () => {
    if (!apiKey) {
      setError('Please enter your OMDb API key.');
      return;
    }
    if (!mood) {
      setError('Please enter a mood or a search term.');
      return;
    }
    setError('');
    try {
      const response = await axios.get(`http://www.omdbapi.com/?s=${mood}&apikey=${apiKey}`);
      if (response.data.Search) {
        setRecommendations(response.data.Search);
      } else {
        setRecommendations([]);
        setError(response.data.Error || 'No results found.');
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
        <div className="api-key-input">
          <input
            type="text"
            value={apiKey}
            onChange={handleApiKeyChange}
            placeholder="Enter your OMDb API Key"
          />
        </div>
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
          {recommendations.map((rec, index) => (
            <div key={index} className="recommendation">
              <h2>{rec.Title}</h2>
              <p>{rec.Year}</p>
              <img src={rec.Poster} alt={rec.Title} />
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;