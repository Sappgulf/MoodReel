import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './Home';
import MovieDetails from './MovieDetails';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>MoodReel</h1>
        <p>Tell us your mood, we'll find you a reel.</p>
      </header>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/movie/:id" element={<MovieDetails />} />
      </Routes>
    </div>
  );
}

export default App;