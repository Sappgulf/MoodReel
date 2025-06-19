import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const apiKey = 'f2b1a353af51ccd27736c209f7ea0ca6';

function MovieDetails() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMovieDetails = async () => {
      try {
        const response = await axios.get(
          `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}`
        );
        setMovie(response.data);
      } catch (err) {
        setError('Error fetching movie details.');
        console.error(err);
      }
    };

    fetchMovieDetails();
  }, [id]);

  if (error) {
    return <p className="error">{error}</p>;
  }

  if (!movie) {
    return <p>Loading...</p>;
  }

  return (
    <div className="movie-details">
      <h1>{movie.title}</h1>
      <p>{movie.overview}</p>
      <p><strong>Release Date:</strong> {movie.release_date}</p>
      <p><strong>Rating:</strong> {movie.vote_average} / 10</p>
      {movie.poster_path && (
        <img
          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
          alt={movie.title}
        />
      )}
    </div>
  );
}

export default MovieDetails; 