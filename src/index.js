import './styles/main.css';
import FilmotekaInfo from './filmoteka';
import './ui.js';
import { initAuth } from './auth.js';

document.addEventListener("DOMContentLoaded", function () {
    // 1. Инициализируем авторизацию
    initAuth();

    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhOTQzZDU0YWQ3YjRlOTU2ZTM0ODc5NTdkODE0Y2VhZCIsInN1YiI6IjY1OGM1MDVmMzAzYzg1MDcxOGE1NGUyNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.l8WuJ13hO2VbApbmpEtMEuhAmw5eQdfXAdTyqDGoZYc'
        }
    };

    let currentPage = 1;
    let totalPages = 1;
    let isFetching = false;
    let currentQuery = ''; 
    let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];

    const gridContainer = document.querySelector('.movies-grid');
    const heroTitle = document.querySelector('.hero-title');
    const subtitle = document.querySelector('.subtitle');
    
    // Элементы поиска
    const searchInput = document.getElementById('searchInput');
    const searchDropdown = document.getElementById('searchDropdown');
    const historyList = document.getElementById('historyList');
    const historySection = document.getElementById('historySection');
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    const trendingSearchesList = document.getElementById('trendingSearchesList');

    // Элементы фильтров
    const sortSelect = document.getElementById('sortSelect');
    const yearFilter = document.getElementById('yearFilter');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    const genreCheckboxes = document.querySelectorAll('.checkbox-group input[type="checkbox"]');

    // --- ФИЛЬТРЫ ---
    function getActiveFilters() {
        const selectedGenres = Array.from(genreCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value)
            .join(',');
            
        return {
            sortBy: sortSelect ? sortSelect.value : 'popularity.desc',
            year: yearFilter ? yearFilter.value.trim() : '',
            genres: selectedGenres
        };
    }

    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            currentQuery = '';
            currentPage = 1;
            
            if (heroTitle) heroTitle.textContent = 'Discover Movies.';
            if (subtitle) subtitle.textContent = 'Customized by your preferences.';
            
            const filtersPanel = document.getElementById('filtersPanel');
            if (window.innerWidth <= 900 && filtersPanel) {
                filtersPanel.classList.remove('active');
            }
            
            fetchMovies(currentPage);
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', () => {
            currentPage = 1;
            fetchMovies(currentPage);
        });
    }

    // --- ИСТОРИЯ И ТРЕНДЫ ---
    function updateHistoryUI() {
        if (!historySection || !historyList) return;

        if (searchHistory.length === 0) {
            historySection.style.display = 'none';
            return;
        }
        historySection.style.display = 'flex';
        historyList.innerHTML = '';
        
        searchHistory.forEach(term => {
            const li = document.createElement('li');
            li.className = 'dropdown-item history-item';
            li.innerHTML = `<span class="dropdown-icon">🕒</span> ${term}`;
            li.addEventListener('click', () => {
                if (searchInput) searchInput.value = term;
                if (searchDropdown) searchDropdown.classList.remove('active');
                triggerSearch(term);
            });
            historyList.appendChild(li);
        });
    }

    function addToHistory(term) {
        if (!term) return;
        searchHistory = searchHistory.filter(t => t !== term);
        searchHistory.unshift(term);
        if (searchHistory.length > 5) searchHistory.pop();
        localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
        updateHistoryUI();
    }

    if (clearHistoryBtn) {
        clearHistoryBtn.addEventListener('click', () => {
            searchHistory = [];
            localStorage.removeItem('searchHistory');
            updateHistoryUI();
        });
    }

    function fetchTrendingForDropdown() {
        if (!trendingSearchesList) return;
        const url = 'https://api.themoviedb.org/3/trending/movie/day?language=en-US';
        fetch(url, options)
            .then(response => response.json())
            .then(data => {
                const topMovies = data.results.slice(0, 4);
                trendingSearchesList.innerHTML = '';
                topMovies.forEach(movie => {
                    const title = movie.title || movie.name; 
                    const li = document.createElement('li');
                    li.className = 'dropdown-item popular-item';
                    li.innerHTML = `<span class="dropdown-icon">🔥</span> ${title}`;
                    li.addEventListener('click', () => {
                        if (searchInput) searchInput.value = title;
                        if (searchDropdown) searchDropdown.classList.remove('active');
                        triggerSearch(title);
                    });
                    trendingSearchesList.appendChild(li);
                });
            })
            .catch(err => console.error('Error:', err));
    }

    if (searchInput && searchDropdown) {
        searchInput.addEventListener('focus', () => {
            if (searchInput.value.trim() === '') searchDropdown.classList.add('active');
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                searchDropdown.classList.remove('active');
            }
        });
    }
    
    updateHistoryUI(); 
    fetchTrendingForDropdown();

    // --- ЖИВОЙ ПОИСК ---
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(this, args), wait);
        };
    }

    const triggerSearch = debounce((query) => {
        currentQuery = query;
        currentPage = 1;
        
        if (query) {
            if (searchDropdown) searchDropdown.classList.remove('active');
            if (heroTitle) heroTitle.textContent = `Search results for "${query}"`;
            if (subtitle) subtitle.textContent = 'Explore the movies matching your request.';
            
            if (yearFilter) yearFilter.value = '';
            genreCheckboxes.forEach(cb => cb.checked = false);
            
        } else {
            if (heroTitle) heroTitle.textContent = 'Discover Movies.';
            if (subtitle) subtitle.textContent = 'Explore the complete collection.';
            if (searchInput === document.activeElement && searchDropdown) searchDropdown.classList.add('active');
        }
        
        fetchMovies(currentPage);
        if (query.length > 2) addToHistory(query);
    }, 500);

    if (searchInput) {
        searchInput.addEventListener('input', (e) => triggerSearch(e.target.value.trim()));
        const searchForm = document.getElementById('searchForm');
        if (searchForm) searchForm.addEventListener('submit', (e) => e.preventDefault());
    }

    // --- СКЕЛЕТОНЫ ---
    function renderSkeletons(container, count = 20) {
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton-card';
            skeleton.innerHTML = `
                <div class="skeleton-poster skeleton-shimmer"></div>
                <div class="skeleton-details">
                    <div class="skeleton-title skeleton-shimmer"></div>
                    <div class="skeleton-meta skeleton-shimmer"></div>
                    <div class="skeleton-btn skeleton-shimmer"></div>
                </div>
            `;
            container.appendChild(skeleton);
        }
    }

    function removeSkeletons() {
        document.querySelectorAll('.skeleton-card').forEach(s => s.remove());
    }

    // --- ЗАГРУЗКА ИЗ TMDB ---
    function fetchMovies(page) {
        isFetching = true;
        
        let url = '';
        if (currentQuery) {
            url = `https://api.themoviedb.org/3/search/movie?query=${currentQuery}&include_adult=false&language=en-US&page=${page}`;
        } else {
            const filters = getActiveFilters();
            url = `https://api.themoviedb.org/3/discover/movie?include_adult=false&language=en-US&page=${page}&sort_by=${filters.sortBy}`;
            
            if (filters.genres) url += `&with_genres=${filters.genres}`;
            if (filters.year) url += `&primary_release_year=${filters.year}`;
        }

        if (gridContainer && page === 1) {
            gridContainer.innerHTML = ''; 
            renderSkeletons(gridContainer, 20); 
        }

        fetch(url, options)
            .then(response => response.json())
            .then(response => {
                const films = response.results;
                totalPages = response.total_pages;

                removeSkeletons();

                if (gridContainer) {
                    if (films.length === 0 && page === 1) {
                        gridContainer.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary);">No movies found matching your criteria.</p>`;
                    } else {
                        films.forEach(film => new MovieCardRenderer(film, gridContainer));
                    }
                }
                isFetching = false;
            })
            .catch(err => {
                console.error(err);
                removeSkeletons();
                isFetching = false;
            });
    }

    // --- БЕСКОНЕЧНЫЙ СКРОЛЛ ---
    const observerTarget = document.createElement('div');
    observerTarget.className = 'scroll-trigger';
    observerTarget.style.height = '10px';
    
    if (gridContainer) gridContainer.insertAdjacentElement('afterend', observerTarget);

    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isFetching && currentPage < totalPages) {
            currentPage++;
            fetchMovies(currentPage);
        }
    }, { rootMargin: '300px' });

    if (observerTarget) observer.observe(observerTarget);

    // Первый запуск
    fetchMovies(currentPage);

    // --- КАРТОЧКА ФИЛЬМА ---
    class MovieCardRenderer {
        constructor(film, container) {
            this.filmidss_ = film.id;
            this.container = container;

            const movieCard = document.createElement('div');
            movieCard.className = 'movie-card';
            this.container.appendChild(movieCard);

            const posterBox = document.createElement('div');
            posterBox.className = 'poster-box';
            movieCard.appendChild(posterBox);

            const ratingBadge = document.createElement('div');
            ratingBadge.className = 'rating-badge';
            const rating = film.vote_average ? film.vote_average.toFixed(1) : 'NR';
            ratingBadge.innerHTML = `<span>★</span> ${rating}`;
            posterBox.appendChild(ratingBadge);

            const contentImage = document.createElement('img');
            contentImage.src = film.poster_path ? `https://image.tmdb.org/t/p/w500${film.poster_path}` : 'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';
            contentImage.alt = film.title || film.name || 'No image';
            posterBox.appendChild(contentImage);

            const movieDetails = document.createElement('div');
            movieDetails.className = 'movie-details';
            movieCard.appendChild(movieDetails);

            const title = document.createElement('div');
            title.className = 'movie-title';
            title.textContent = film.title || film.name;
            movieDetails.appendChild(title);

            const releaseYear = film.release_date ? new Date(film.release_date).getFullYear() : (film.first_air_date ? new Date(film.first_air_date).getFullYear() : 'N/A');
            const genres = film.genre_ids ? film.genre_ids.map(genreId => getGenreName(genreId)).join(', ') : 'Unknown';

            const meta = document.createElement('div');
            meta.className = 'movie-meta';
            meta.textContent = `${releaseYear} • ${genres}`;
            movieDetails.appendChild(meta);

            const btn = document.createElement('button');
            btn.className = 'btn-apple';
            btn.textContent = 'View Details';
            movieDetails.appendChild(btn);

            btn.addEventListener('click', (event) => {
                event.preventDefault();
                const createModal = new FilmotekaInfo();
                createModal.loadData(this.filmidss_);
            });

            function getGenreName(genreId) {
                const genreMapping = {
                    12: "Adventure", 14: "Fantasy", 16: "Animation", 18: "Drama",
                    27: "Horror", 28: "Action", 35: "Comedy", 36: "History",
                    37: "Western", 53: "Thriller", 80: "Crime", 99: "Documentary",
                    878: "Science Fiction", 9648: "Mystery", 10402: "Music",
                    10749: "Romance", 10751: "Family", 10752: "War", 10770: "TV Movie"
                };
                return genreMapping[genreId] || 'Unknown';
            }
        }
    }
});