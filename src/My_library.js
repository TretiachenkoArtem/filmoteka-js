import './styles/main.css';
import FilmotekaInfo from './filmoteka';
import { supabase } from './supabaseClient.js';
import { initAuth } from './auth.js';
import './ui.js';

class FilmotekaQueue {
    constructor(container) {
        this.container = container;
        this.watchedBtn = document.getElementById('watchedBtn');
        this.queueBtn = document.getElementById('queueBtn');
        this.currentFetchId = 0;

        this.initializeLibrary();
        this.renderCurrentTab();
    }

    initializeLibrary() {
        if (this.watchedBtn) {
            this.watchedBtn.addEventListener('click', () => {
                if (this.watchedBtn.classList.contains('active')) return;
                this.setActiveTab(this.watchedBtn, this.queueBtn);
                this.renderCurrentTab();
            });
        }

        if (this.queueBtn) {
            this.queueBtn.addEventListener('click', () => {
                if (this.queueBtn.classList.contains('active')) return;
                this.setActiveTab(this.queueBtn, this.watchedBtn);
                this.renderCurrentTab();
            });
        }

        let timeout;
        const safeRender = () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => this.renderCurrentTab(), 100);
        };

        window.addEventListener('libraryUpdated', safeRender);
        window.addEventListener('userStateChanged', safeRender);
    }

    setActiveTab(activeBtn, inactiveBtn) {
        activeBtn.classList.add('active');
        inactiveBtn.classList.remove('active');
    }

    renderCurrentTab() {
        const listType = (this.watchedBtn && this.watchedBtn.classList.contains('active')) ? 'watched' : 'queue';
        this.loadAndRenderMovies(listType);
    }

    async loadAndRenderMovies(listType) {
        const fetchId = ++this.currentFetchId;
        const { data: { user } } = await supabase.auth.getUser();

        if (fetchId !== this.currentFetchId) return;
        this.container.innerHTML = '';

        if (!user) {
            this.container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                    <p style="font-size: 1.1rem;">Please Sign In to view your library.</p>
                </div>
            `;
            return;
        }

        const { data: movies, error } = await supabase
            .from('favorites')
            .select('*')
            .eq('user_id', user.id)
            .eq('list_type', listType)
            .order('id', { ascending: false });

        if (fetchId !== this.currentFetchId) return;

        if (error) {
            console.error('Error fetching library:', error);
            this.container.innerHTML = `<p style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary);">Failed to load library.</p>`;
            return;
        }

        if (!movies || movies.length === 0) {
            this.container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: var(--text-secondary);">
                    <p style="font-size: 1.1rem;">No movies in your ${listType} list yet.</p>
                </div>
            `;
            return;
        }

        // Фильтрация дубликатов
        const seen = new Set();
        const uniqueMovies = movies.filter(movie => {
            const duplicate = seen.has(movie.movie_id);
            seen.add(movie.movie_id);
            return !duplicate;
        });

        this.container.innerHTML = '';
        uniqueMovies.forEach(movie => this.addFilm(movie));
    }

    addFilm(movie) {
        const movieCard = document.createElement('div');
        movieCard.className = 'movie-card';

        const posterBox = document.createElement('div');
        posterBox.className = 'poster-box';

        const contentImage = document.createElement('img');
        contentImage.src = movie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` 
            : 'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';
        contentImage.alt = movie.movie_title || movie.title || 'No Image';
        posterBox.appendChild(contentImage);

        if (movie.vote_average) {
            const ratingBadge = document.createElement('div');
            ratingBadge.className = 'rating-badge';
            ratingBadge.innerHTML = `<span>★</span> ${Number(movie.vote_average).toFixed(1)}`;
            posterBox.appendChild(ratingBadge);
        }

        const movieDetails = document.createElement('div');
        movieDetails.className = 'movie-details';

        const title = document.createElement('h5');
        title.className = 'movie-title';
        title.textContent = movie.movie_title || movie.title || 'Untitled';

        const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';

        const meta = document.createElement('div');
        meta.className = 'movie-meta';
        meta.textContent = `${releaseYear}`;

        const btn = document.createElement('button');
        btn.className = 'btn-apple';
        btn.textContent = 'View Details';

        btn.addEventListener('click', (event) => {
            event.preventDefault();
            const createModal = new FilmotekaInfo();
            createModal.loadData(movie.movie_id);
        });

        movieDetails.appendChild(title);
        movieDetails.appendChild(meta);
        movieDetails.appendChild(btn);

        movieCard.appendChild(posterBox);
        movieCard.appendChild(movieDetails);

        this.container.appendChild(movieCard);
    }
}

document.addEventListener('DOMContentLoaded', function () {
    initAuth();

    const container = document.getElementById('filmContainer');
    if (container) {
        new FilmotekaQueue(container);
    }
});