// import { useEffect, useState } from 'react'
// import heroImg from './assets/hero.png'
// import reactLogo from './assets/react.svg'
// import viteLogo from './assets/vite.svg'
// import './App.css'

// const Card = ({title}) => {

//   const [count, setCount] = useState(0)

//   const [hasLiked, setHasLiked] = useState(false)
//   useEffect(() => {
//     console.log(`${title} has been liked : ${hasLiked}`);

//   }, [hasLiked])

//   useEffect(() => {
//     console.log('card rendered');

//   }, [])

//   return(
//     <div className='card' onClick={() => setCount(count + 1)}>
//       <h2>{title} <br/>{count || null}</h2>
//       <button onClick={() => setHasLiked(!hasLiked)}>{hasLiked ? "💗" : "🤍"}</button>
//     </div>
//   )
// }

// const App = () => {
//   return(
//     <div className='card-container'>
//     <h2>Functional Arrow Component</h2>
//     <Card title="Star Wars" rating={5} isCool={true} actors={[{name:'actors'}]}/>
//     <Card title="Avatar"/>
//     <Card title="King Kong"/>

//     </div>
//   )
// }

// export default App

import { useEffect, useState } from "react";
import Search from "./assets/components/Search";
import Spinner from "./assets/components/Spinner";
import MovieCard from "./assets/components/MovieCard";
import { useDebounce } from "react-use";
import { getTrendingMovies, updateSearchCount } from "./appwrite";

// API = Application Programming Interface

const API_BASE_URL = "https://api.themoviedb.org/3";

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
  },
};

const App = () => {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [movieList, setMovieList] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [trendingMovies, setTrendingMovies] = useState([]);


  //Debounce the search term to prevent too many API requests
  // by waiting for the user to stop typing fo 500ms
  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  const fetchMovies = async (query = "") => {
  setIsLoading(true);
  setErrorMessage("");

  try {
    const endpoint = query
      ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(
          query
        )}&api_key=${API_KEY}`
      : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc&api_key=${API_KEY}`;

    const response = await fetch(endpoint, API_OPTIONS);

    if (!response.ok) {
      throw new Error("Error fetching movies");
    }

    const data = await response.json();

    if (data.Response === "False") {
      setErrorMessage(data.Error || "Failed to fetch movies");
      setMovieList([]);
      return;
    }

    setMovieList(data.results || []);

    // ثبت سرچ در Appwrite
    if (query && data.results.length > 0) {
      await updateSearchCount(query, data.results[0]);

      // دوباره Trending را از Appwrite بگیر
      await loadTrendingMovies();
    }

  } catch (error) {
    console.log(`Error fetching movies: ${error}`);
    setErrorMessage("Error fetching movies. Please try again later.");
  } finally {
    setIsLoading(false);
  }
};

  const loadTrendingMovies = async () => {
  try {
    const movies = await getTrendingMovies();

    console.log("Trending Movies Data:", movies);

    setTrendingMovies(movies || []);
  } catch (error) {
    console.log(`Error fetching trending movies: ${error}`);
  }
};

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You'll Enjoy
            Without the Hassle
          </h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>

            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>

                  <img src={movie.poster_url} alt={movie.searchTerm} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <h2>All Movies</h2>

          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
};

export default App;
