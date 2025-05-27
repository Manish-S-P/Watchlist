const sideLinks = document.querySelectorAll('.sidebar .side-menu li a:not(.logout)');
const API_BASE_URL = 'http://localhost:5000/api';
let currentUserId = localStorage.getItem('userId');


/*Login Mandatory
const userId = localStorage.getItem('userId');
if (!userId) {
  alert("You must log in first.");
  window.location.href = 'login.html';
}
  */

// Utility Functions
function showLoading(container) {
  container.innerHTML = '<div class="loading-spinner"></div>';
}

function showError(container, message) {
  container.innerHTML = `<div class="error-message">${message}</div>`;
}

// Movie Cache
const movieCache = new Map();

// Sidebar Navigation
sideLinks.forEach(item => {
    const li = item.parentElement;
    item.addEventListener('click', () => {
        sideLinks.forEach(i => i.parentElement.classList.remove('active'));
        li.classList.add('active');
    });
});

// Mobile Menu Toggle
const menuBar = document.querySelector('.content nav .bx.bx-menu');
const sideBar = document.querySelector('.sidebar');

menuBar.addEventListener('click', () => {
    sideBar.classList.toggle('close');
});

// Search Functionality
const searchBtn = document.querySelector('.content nav form .form-input button');
const searchBtnIcon = document.querySelector('.content nav form .form-input button .bx');
const navSearchForm = document.querySelector('.content nav form');

searchBtn.addEventListener('click', function (e) {
    if (window.innerWidth < 576) {
        e.preventDefault();
        navSearchForm.classList.toggle('show');
        if (navSearchForm.classList.contains('show')) {
            searchBtnIcon.classList.replace('bx-search', 'bx-x');
        } else {
            searchBtnIcon.classList.replace('bx-x', 'bx-search');
        }
    }
});

// Responsive Adjustments
window.addEventListener('resize', () => {
    if (window.innerWidth < 768) {
        sideBar.classList.add('close');
    } else {
        sideBar.classList.remove('close');
    }
    if (window.innerWidth > 576) {
        searchBtnIcon.classList.replace('bx-x', 'bx-search');
        navSearchForm.classList.remove('show');
    }
});

// Theme Toggle
const toggler = document.getElementById('theme-toggle');

function setInitialTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark' || theme === null) {
        document.body.classList.add('dark');
        toggler.checked = true;
    } else {
        document.body.classList.remove('dark');
        toggler.checked = false;
    }
}
setInitialTheme();

toggler.addEventListener('change', function () {
    if (this.checked) {
        document.body.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
});

// Movie API Configuration
const apiKey = '855d131d';
const searchInput = document.getElementById('search-input');
const movieSearchForm = document.getElementById('search-form');
const resultsContainer = document.getElementById('trending-section');

// Movie Display Functions
function displayMovies(movies) {
    resultsContainer.innerHTML = '';
    movies.forEach(movie => {
        const movieDiv = document.createElement('div');
        movieDiv.classList.add('movie-item');

        movieDiv.innerHTML = `
            <img src="${movie.Poster !== "N/A" ? movie.Poster : 'https://via.placeholder.com/150x220?text=No+Image'}" alt="${movie.Title}" />
            <h4>${movie.Title}</h4>
            <p>${movie.Year}</p>
        `;

        resultsContainer.appendChild(movieDiv);
        movieDiv.addEventListener('click', () => {
            fetch(`https://www.omdbapi.com/?i=${movie.imdbID}&apikey=${apiKey}`)
                .then(res => res.json())
                .then(fullMovieData => {
                    showMovieDetail(fullMovieData);
                });
        });
    });
}

async function searchMovies(query) {
    if (!query) {
        resultsContainer.innerHTML = '<p>Please enter a movie or show name to search.</p>';
        return;
    }

    showLoading(resultsContainer);

    try {
        const response = await fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${apiKey}`);
        const data = await response.json();
        
        if (data.Response === "True") {
            displayMovies(data.Search);
        } else {
            showError(resultsContainer, data.Error || 'No results found');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        showError(resultsContainer, 'Error loading results');
    }
}

movieSearchForm.addEventListener('submit', e => {
    e.preventDefault();
    const query = searchInput.value.trim();
    searchMovies(query);
});

// Autocomplete Suggestions
const suggestionBox = document.createElement('div');
suggestionBox.className = 'suggestion-box';
searchInput.parentElement.appendChild(suggestionBox);

function debounce(func, delay) {
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

const showSuggestions = debounce(function () {
    const query = searchInput.value.trim();
    if (query.length < 3) {
        suggestionBox.innerHTML = '';
        suggestionBox.style.display = 'none';
        return;
    }

    fetch(`https://www.omdbapi.com/?s=${encodeURIComponent(query)}&apikey=${apiKey}`)
        .then(res => res.json())
        .then(data => {
            if (data.Response === "True") {
                suggestionBox.innerHTML = '';
                data.Search.slice(0, 5).forEach(movie => {
                    const suggestionItem = document.createElement('div');
                    suggestionItem.className = 'suggestion-item';
                    suggestionItem.innerHTML = `
                        <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'https://via.placeholder.com/50x70?text=No+Image'}" />
                        <span>${movie.Title} (${movie.Year})</span>
                    `;

                    suggestionItem.addEventListener('click', () => {
                        searchInput.value = movie.Title;
                        suggestionBox.innerHTML = '';
                        suggestionBox.style.display = 'none';

                        fetch(`https://www.omdbapi.com/?i=${movie.imdbID}&apikey=${apiKey}`)
                            .then(res => res.json())
                            .then(fullMovieData => {
                                showMovieDetail(fullMovieData);
                            })
                            .catch(err => {
                                console.error('Error fetching movie details:', err);
                            });
                    });

                    suggestionBox.appendChild(suggestionItem);
                });

                suggestionBox.style.display = 'block';
            } else {
                suggestionBox.innerHTML = '';
                suggestionBox.style.display = 'none';
            }
        });
}, 300);

searchInput.addEventListener('input', showSuggestions);

// Movie Detail Modal
const movieDetail = document.getElementById('movie-detail');
const detailPoster = document.getElementById('detail-poster');
const detailTitle = document.getElementById('detail-title');
const detailYear = document.getElementById('detail-year');
const detailPlot = document.getElementById('detail-plot');
const statusSelect = document.getElementById('status-select');
const episodeCounterContainer = document.getElementById('episode-counter-container');
const episodeCountInput = document.getElementById('episode-count');
const increaseEpisodeBtn = document.getElementById('increase-episode');
const decreaseEpisodeBtn = document.getElementById('decrease-episode');
const startDateInput = document.getElementById('start-date');
const endDateInput = document.getElementById('end-date');
const saveButton = document.getElementById('save-button');
const closeDetailBtn = document.getElementById('close-detail');

let currentMovie = null;

function showMovieDetail(movie) {
    currentMovie = movie;

    detailPoster.src = movie.Poster !== "N/A" ? movie.Poster : 'https://via.placeholder.com/250x330?text=No+Image';
    detailPoster.alt = movie.Title;
    detailTitle.textContent = movie.Title;
    detailYear.textContent = `Release Year: ${movie.Year}`;
    detailPlot.textContent = movie.Plot || 'No synopsis available.';

    if (movie.Type && movie.Type.toLowerCase() === 'series') {
        episodeCounterContainer.classList.remove('hidden');
    } else {
        episodeCounterContainer.classList.add('hidden');
    }

    statusSelect.value = movie.status || 'watching';
    episodeCountInput.value = movie.episodeCount || 1;
    startDateInput.value = movie.startDate || '';
    endDateInput.value = movie.endDate || '';

    movieDetail.classList.remove('hidden');
}

increaseEpisodeBtn.onclick = () => {
    episodeCountInput.value = parseInt(episodeCountInput.value) + 1;
};

decreaseEpisodeBtn.onclick = () => {
    let val = parseInt(episodeCountInput.value);
    if (val > 1) {
        episodeCountInput.value = val - 1;
    }
};

saveButton.onclick = async () => {
    if (!currentMovie) return;

    const status = statusSelect.value;
    const episodeCount = parseInt(episodeCountInput.value) || 1;
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    const movieData = {
        imdbID: currentMovie.imdbID,
        title: currentMovie.Title,
        year: currentMovie.Year,
        poster: currentMovie.Poster,
        type: currentMovie.Type,
        status,
        episodeCount,
        startDate,
        endDate,
        userId: currentUserId
    };

    try {
        const response = await fetch(`${API_BASE_URL}/movies`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(movieData)
        });

        if (!response.ok) throw new Error('Failed to save movie');

        const data = await response.json();
        alert('Movie saved successfully!');
        movieDetail.classList.add('hidden');

        // Clear cache for all statuses
        movieCache.clear();

        // Refresh current view
        const activeLink = document.querySelector('.side-menu li.active a');
        if (activeLink) {
            const section = activeLink.dataset.section;
            if (section === 'home') {
                await loadTrending();
            } else {
                const movies = await fetchMoviesByStatus(section);
                displayMoviesInSection(movies, `${section}-section`);
            }
        }
    } catch (error) {
        alert('Failed to save movie.');
        console.error(error);
    }
};

closeDetailBtn.onclick = () => {
    movieDetail.classList.add('hidden');
};

// Trending Section
const trendingTitles = [
    'House of the Dragon',
    'Stranger Things',
    'Kantara A Legend: Chapter 1',
    'Breaking Bad',
    'The Last of Us',
    'Game of Thrones',
    'Retro',
    'Aavesham',
    'Rifle Club',
    'The Witcher',
    'One Piece'
];

async function loadTrending() {
    const resultsContainer = document.getElementById('trending-section');
    showLoading(resultsContainer);

    try {
        const fetchPromises = trendingTitles.map(title =>
            fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${apiKey}`)
                .then(res => res.json())
                .catch(err => {
                    console.error(`Error fetching ${title}:`, err);
                    return null;
                })
        );

        const movies = await Promise.all(fetchPromises);
        const validMovies = movies.filter(movie => movie && movie.Response === "True");

        if (validMovies.length === 0) {
            showError(resultsContainer, 'Failed to load trending movies. Please try again later.');
            return;
        }

        resultsContainer.innerHTML = '';
        const track = document.createElement('div');
        track.className = 'trending-marquee-track';

        function createMovieItem(movie) {
            const movieDiv = document.createElement('div');
            movieDiv.className = 'movie-item';
            movieDiv.innerHTML = `
                <img src="${movie.Poster !== "N/A" ? movie.Poster : 'https://via.placeholder.com/150x220?text=No+Image'}" alt="${movie.Title}" />
                <h4>${movie.Title}</h4>
                <p>${movie.Year}</p>
            `;
            movieDiv.addEventListener('click', () => {
                showMovieDetail(movie);
            });
            return movieDiv;
        }

        for (let i = 0; i < 2; i++) {
            validMovies.forEach(movie => {
                track.appendChild(createMovieItem(movie));
            });
        }

        resultsContainer.appendChild(track);
    } catch (error) {
        console.error('Error loading trending movies:', error);
        showError(resultsContainer, 'Error loading trending content. Please try again later.');
    }
    
    try {
        const { movieCount, tvShowCount, hoursSpent } = await fetchMediaCounts(currentUserId);
        updateMediaCounts(movieCount, tvShowCount, hoursSpent);
    } catch (error) {
        console.error('Error updating media counts:', error);
    }
}


// Section Navigation
const sidebarLinks = document.querySelectorAll('.side-menu a');
const dashboardView = document.getElementById('dashboard-view');
const sectionView = document.getElementById('section-view');
const sectionTitle = document.getElementById('section-title');

sidebarLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
        e.preventDefault();

        sidebarLinks.forEach(l => l.parentElement.classList.remove('active'));
        link.parentElement.classList.add('active');

        const section = link.dataset.section;

        if (section === 'home') {
            dashboardView.classList.remove('hidden');
            sectionView.classList.add('hidden');
            await loadTrending();
        } else {
            dashboardView.classList.add('hidden');
            sectionView.classList.remove('hidden');
            sectionTitle.textContent = section.charAt(0).toUpperCase() + section.slice(1);

            document.querySelectorAll('.status-section').forEach(s => s.classList.add('hidden'));
            const selectedSection = document.getElementById(`${section}-section`);
            selectedSection.classList.remove('hidden');

            try {
                const movies = await fetchMoviesByStatus(section);
                displayMoviesInSection(movies, `${section}-section`);
            } catch (error) {
                showError(document.querySelector(`#${section}-section .movies-container`), 
                          'Failed to load movies. Please try again later.');
            }
        }
    });
});

// Enhanced Movie Fetching with Caching
async function fetchMoviesByStatus(status) {
    const cacheKey = `${currentUserId}-${status}`;
    
    if (movieCache.has(cacheKey)) {
        return movieCache.get(cacheKey);
    }

    try {
        const response = await fetch(`${API_BASE_URL}/movies/${currentUserId}/${status}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        movieCache.set(cacheKey, data);
        return data;
    } catch (error) {
        console.error('Error fetching movies:', error);
        throw error;
    }
}

// Display Movies in Section
function displayMoviesInSection(movies, sectionId) {
    const container = document.querySelector(`#${sectionId} .movies-container`);
    if (!container) {
        console.error(`Container not found for: ${sectionId}`);
        return;
    }

    container.innerHTML = '';

    if (movies.length === 0) {
        container.innerHTML = '<div class="empty-message">No movies found in this category</div>';
        return;
    }

    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';

        // Create image element
        const img = document.createElement('img');
        img.src = movie.poster || 'https://via.placeholder.com/150x220?text=No+Image';
        img.alt = movie.title;
        img.loading = 'lazy';

        // Create title element
        const title = document.createElement('h4');
        title.textContent = movie.title;

        // Create status element
        const status = document.createElement('p');
        status.textContent = `Status: ${movie.status}`;
        status.className = 'movie-status';

        // Create delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '<i class="bx bx-trash"></i> Delete';
        
        // Append all elements to card
        card.appendChild(img);
        card.appendChild(title);
        card.appendChild(status);
        
        // Add episode count if it's a series
        if (movie.type === 'series') {
            const episodes = document.createElement('p');
            episodes.textContent = `Episodes: ${movie.episodeCount || 1}`;
            episodes.className = 'movie-episodes';
            card.appendChild(episodes);
        }
        
        card.appendChild(deleteBtn);

        // Click handler for the card (excluding delete button)
        card.addEventListener('click', (e) => {
            // Only proceed if not clicking on delete button or its children
            if (!e.target.closest('.delete-btn')) {
                handleCardClick(movie);
            }
        });

        // Click handler specifically for delete button
        deleteBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            e.preventDefault();
            await deleteMovie(currentUserId, movie.imdbID);
        });

        container.appendChild(card);
    });
}

// Separate function to handle card clicks
async function handleCardClick(movie) {
    try {
        const response = await fetch(`https://www.omdbapi.com/?i=${movie.imdbID}&apikey=${apiKey}`);
        if (!response.ok) throw new Error('Failed to fetch movie details');

        const omdbData = await response.json();
        if (omdbData.Response === "False") throw new Error(omdbData.Error);

        const combinedMovie = {
            ...omdbData,
            status: movie.status,
            episodeCount: movie.episodeCount,
            startDate: movie.startDate,
            endDate: movie.endDate,
            userId: movie.userId || currentUserId
        };

        showMovieDetail(combinedMovie);
    } catch (error) {
        console.error('Error loading full movie details:', error);
        showMovieDetail(movie);
    }
}

// Fixed Delete Function
async function deleteMovie(userId, imdbID) {
    if (!confirm('Are you sure you want to delete this movie?')) return;

    try {
        // Encode the parameters to handle special characters
        const encodedUserId = encodeURIComponent(userId);
        const encodedImdbID = encodeURIComponent(imdbID);
        const deleteUrl = `${API_BASE_URL}/movies/${encodedUserId}/${encodedImdbID}`;
        
        console.log('Attempting to delete at:', deleteUrl);

        const response = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('Delete response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to delete movie');
        }

        // Clear the cache for all statuses
        movieCache.clear();

        // Close the detail modal if open
        movieDetail.classList.add('hidden');

        // Refresh the current view
        const activeLink = document.querySelector('.side-menu li.active a');
        if (activeLink) {
            const section = activeLink.dataset.section;
            if (section === 'home') {
                await loadTrending();
            } else {
                // Force a fresh fetch by bypassing the cache
                const movies = await fetch(`${API_BASE_URL}/movies/${currentUserId}/${section}`)
                    .then(res => res.json());
                displayMoviesInSection(movies, `${section}-section`);
            }
        }

        console.log('Movie deleted successfully');
    } catch (error) {
        console.error('Delete error:', error);
        alert(`Failed to delete movie: ${error.message}`);
    }
}

// Initialize
window.addEventListener('DOMContentLoaded', () => {
    loadTrending();
    // Load the first section by default if not on home
    const activeLink = document.querySelector('.side-menu li.active a');
    if (activeLink && activeLink.dataset.section !== 'home') {
        activeLink.click();
    }
});

async function fetchMediaCounts(userId) {
  try {
    const response = await fetch(`${API_BASE_URL}/movies/${userId}/completed`);
    if (!response.ok) throw new Error('Failed to fetch media counts');

    const movies = await response.json();
    const apiKey = '855d131d';
    let totalMinutes = 0;
    let movieCount = 0;
    let tvShowCount = 0;

    for (const movie of movies) {
      if (movie.type === 'movie') {
        const res = await fetch(`https://www.omdbapi.com/?i=${movie.imdbID}&apikey=${apiKey}`);
        const data = await res.json();

        if (data.Response === "True" && data.Runtime && data.Runtime.includes('min')) {
          const minutes = parseInt(data.Runtime.split(' ')[0]);
          if (!isNaN(minutes)) {
            totalMinutes += minutes;
            movieCount++;
          }
        }
      } else if (movie.type === 'series') {
        const episodesWatched = movie.episodeCount || 0;

        // Optional: Fetch average episode runtime from OMDb
        const res = await fetch(`https://www.omdbapi.com/?i=${movie.imdbID}&apikey=${apiKey}`);
        const data = await res.json();

        let runtime = 45; // default fallback
        if (data.Response === "True" && data.Runtime && data.Runtime.includes('min')) {
          const minutes = parseInt(data.Runtime.split(' ')[0]);
          if (!isNaN(minutes)) {
            runtime = minutes;
          }
        }

        totalMinutes += episodesWatched * runtime;
        tvShowCount++;
      }
    }

    const hoursSpent = (totalMinutes / 60).toFixed(1);

    return {
      movieCount,
      tvShowCount,
      hoursSpent
    };
  } catch (error) {
    console.error('Error fetching media counts:', error);
    return { movieCount: 0, tvShowCount: 0, hoursSpent: 0 };
  }
}



// Add this function to update the counters in the UI
function updateMediaCounts(movieCount, tvShowCount, hoursSpent) {
  const movieCountElement = document.querySelector('.insights li:nth-child(1) .info h3');
  const tvShowCountElement = document.querySelector('.insights li:nth-child(2) .info h3');
  const hoursSpentElement = document.querySelector('.insights li:nth-child(3) .info h3');
  
  if (movieCountElement) movieCountElement.textContent = movieCount;
  if (tvShowCountElement) tvShowCountElement.textContent = tvShowCount;
  if (hoursSpentElement) hoursSpentElement.textContent = `${hoursSpent} hrs`;
}

document.querySelector('.logout').addEventListener('click', () => {
  localStorage.clear();
  window.location.href = 'login.html';
});
