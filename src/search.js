import './styles/main.css'
import FilmotekaInfo from './filmoteka';

let currentPage = 1;
let totalPages = 0;
let isFetching = false;
let currentQuery = ''; // Сохраняем текущий запрос, чтобы скролл знал, что грузить дальше

const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhOTQzZDU0YWQ3YjRlOTU2ZTM0ODc5NTdkODE0Y2VhZCIsInN1YiI6IjY1OGM1MDVmMzAzYzg1MDcxOGE1NGUyNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.l8WuJ13hO2VbApbmpEtMEuhAmw5eQdfXAdTyqDGoZYc'
    }
};

document.addEventListener('DOMContentLoaded', function () {
    const searchForm = document.getElementById('searchForm');
    const filmContainer = document.querySelector('.movies-grid'); // Используем новый чистый селектор

    // 1. Создаем триггер-невидимку для Observer'а
    const observerTarget = document.createElement('div');
    observerTarget.className = 'scroll-trigger';
    observerTarget.style.height = '10px';
    
    if (filmContainer) {
        filmContainer.insertAdjacentElement('afterend', observerTarget);
    }

    // 2. Настраиваем Intersection Observer
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && !isFetching && currentPage < totalPages) {
            currentPage++;
            searchMovies(currentQuery, filmContainer, currentPage);
        }
    }, {
        rootMargin: '300px' // Начинаем грузить чуть раньше, чем пользователь дойдет до низа
    });

    if (observerTarget) {
        observer.observe(observerTarget);
    }

    // 3. Логика формы поиска
    if (searchForm) {
        searchForm.addEventListener('submit', function (event) {
            event.preventDefault();
            const searchInput = document.getElementById('searchInput').value.trim();
            
            if (searchInput && filmContainer) {
                currentQuery = searchInput; // Запоминаем, что ищем
                currentPage = 1; // Сбрасываем страницу на первую
                searchMovies(currentQuery, filmContainer, currentPage);
            }
        });
    }
});

function searchMovies(searchInput, filmContainer, page) {
    if (!searchInput) return;
    
    isFetching = true;
    
    fetch(`https://api.themoviedb.org/3/search/movie?query=${searchInput}&include_adult=false&language=en-US&page=${page}`, options)
        .then(response => response.json())
        .then(response => {
            const films = response.results;
            totalPages = response.total_pages;

            // Если это новый поиск (первая страница), очищаем старую выдачу и скроллим вверх
            if (page === 1) {
                filmContainer.innerHTML = '';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
                
            films.forEach(film => {
                new SearchFilmoteka(film, filmContainer);
            });
            
            isFetching = false;
        })
        .catch(err => {
            console.error(err);
            isFetching = false;
        });
}

class SearchFilmoteka {
    constructor(film, filmContainer) {
        this.container = filmContainer;
        this.created(film);
    }

    created(film) {
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
        if (film.poster_path) {
            contentImage.src = `https://image.tmdb.org/t/p/w500${film.poster_path}`;
        } else {
            contentImage.src = 'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';
        }
        contentImage.alt = film.title || film.name || 'No Image';
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
            createModal.loadData(film.id);
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