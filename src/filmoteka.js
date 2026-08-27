import YouTubePlayer from 'youtube-player';
import { supabase } from './supabaseClient.js';

export default class FilmotekaInfo {
    constructor() {
        this.options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                Authorization: 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhOTQzZDU0YWQ3YjRlOTU2ZTM0ODc5NTdkODE0Y2VhZCIsInN1YiI6IjY1OGM1MDVmMzAzYzg1MDcxOGE1NGUyNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.l8WuJ13hO2VbApbmpEtMEuhAmw5eQdfXAdTyqDGoZYc'
            }
        };
    }

    loadData(filmId) {
        this.closeModal();

        fetch(`https://api.themoviedb.org/3/movie/${filmId}?language=en-US`, this.options)
            .then(response => response.json())
            .then(response => {
                this.createModal(response);
                this.fetchRecommendations(filmId);
            })
            .catch(err => console.error('Error loading movie details:', err));

        fetch(`https://api.themoviedb.org/3/movie/${filmId}/videos?language=en-US`, this.options)
            .then(response => response.json())
            .then(response => {
                this.playerVideo(response);
            })
            .catch(err => console.error('Error loading video:', err));
    }

    fetchRecommendations(movieId) {
        const recUrl = `https://api.themoviedb.org/3/movie/${movieId}/recommendations?language=en-US&page=1`;

        fetch(recUrl, this.options)
            .then(response => response.json())
            .then(data => {
                const recommendations = data.results;
                if (!recommendations || recommendations.length === 0) return;
                if (!this.modal) return;

                const existingRecs = this.modal.querySelector('.modal-recommendations');
                if (existingRecs) existingRecs.remove();

                const recContainer = document.createElement('div');
                recContainer.className = 'modal-recommendations';

                const title = document.createElement('h4');
                title.className = 'recommendations-title';
                title.textContent = 'You Might Also Like';
                recContainer.appendChild(title);

                const track = document.createElement('div');
                track.className = 'recommendations-track';

                recommendations.slice(0, 10).forEach(recFilm => {
                    const recCard = document.createElement('div');
                    recCard.className = 'rec-card';

                    const img = document.createElement('img');
                    img.className = 'rec-poster';
                    img.src = recFilm.poster_path 
                        ? `https://image.tmdb.org/t/p/w185${recFilm.poster_path}` 
                        : 'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';
                    img.alt = recFilm.title || 'No Image';

                    const recTitle = document.createElement('div');
                    recTitle.className = 'rec-title';
                    recTitle.textContent = recFilm.title || recFilm.original_title;

                    recCard.appendChild(img);
                    recCard.appendChild(recTitle);

                    recCard.addEventListener('click', () => {
                        this.loadData(recFilm.id);
                        if (this.modal) this.modal.scrollTo({ top: 0, behavior: 'smooth' });
                    });

                    track.appendChild(recCard);
                });

                recContainer.appendChild(track);
                this.modal.appendChild(recContainer);
            })
            .catch(err => console.error('Error loading recommendations:', err));
    }

    async createModal(filmData) {
        this.backdrop = document.createElement('div');
        this.backdrop.className = 'modal-backdrop';
        
        this.modal = document.createElement('div');
        this.modal.className = 'modal-box';

        this.closeButton = document.createElement('button');
        this.closeButton.className = 'modal-close';
        this.closeButton.innerHTML = '×';
        this.closeButton.addEventListener('click', () => this.closeModal());
        this.modal.appendChild(this.closeButton);

        this.layout = document.createElement('div');
        this.layout.className = 'modal-layout';
        this.modal.appendChild(this.layout);

        // --- ЛЕВАЯ КОЛОНКА ---
        this.leftCol = document.createElement('div');
        this.leftCol.className = 'modal-left';
        
        this.imageMovies = document.createElement('img');
        this.imageMovies.className = 'modal-poster';
        this.imageMovies.src = filmData.poster_path 
            ? 'https://image.tmdb.org/t/p/w500' + filmData.poster_path 
            : 'https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg';
        this.leftCol.appendChild(this.imageMovies);

        this.buttonYT = document.createElement('button');
        this.buttonYT.className = 'btn-modal btn-outline';
        this.buttonYT.textContent = 'WATCH TRAILER';
        this.leftCol.appendChild(this.buttonYT);

        this.layout.appendChild(this.leftCol);

        // Плеер
        this.playerContainer = document.createElement('div');
        this.playerContainer.id = 'playerContainer';
        this.playerContainer.className = 'hidden';
        this.youtubePlayer = document.createElement('div');
        this.youtubePlayer.id = 'youtubePlayer';
        this.closePlayerBtn = document.createElement('button');
        this.closePlayerBtn.className = 'btn-modal btn-outline btn-close-player';
        this.closePlayerBtn.textContent = 'Close Player';
        
        this.playerContainer.appendChild(this.youtubePlayer);
        this.playerContainer.appendChild(this.closePlayerBtn);
        document.body.appendChild(this.playerContainer);

        // --- ПРАВАЯ КОЛОНКА ---
        this.rightCol = document.createElement('div');
        this.rightCol.className = 'modal-right';

        this.title = document.createElement('h2');
        this.title.className = 'modal-title';
        this.title.textContent = filmData.original_title || filmData.title;
        this.rightCol.appendChild(this.title);

        this.statsBox = document.createElement('div');
        this.statsBox.className = 'modal-stats';

        const stats = [
            { label: 'Vote / Votes', value: `<span class="stat-highlight">${filmData.vote_average ? filmData.vote_average.toFixed(1) : '0'}</span> / ${filmData.vote_count || 0}` },
            { label: 'Popularity', value: filmData.popularity ? filmData.popularity.toFixed(1) : '0' },
            { label: 'Original Title', value: filmData.original_title || 'N/A' },
            { label: 'Genre', value: filmData.genres ? filmData.genres.map(g => g.name).join(', ') : 'N/A' }
        ];

        stats.forEach(stat => {
            const row = document.createElement('div');
            row.className = 'stat-row';
            row.innerHTML = `<span class="stat-label">${stat.label}</span><span class="stat-value">${stat.value}</span>`;
            this.statsBox.appendChild(row);
        });
        this.rightCol.appendChild(this.statsBox);

        this.aboutTitle = document.createElement('h3');
        this.aboutTitle.className = 'modal-subtitle';
        this.aboutTitle.textContent = 'About';
        this.rightCol.appendChild(this.aboutTitle);

        this.aboutText = document.createElement('p');
        this.aboutText.className = 'modal-desc';
        this.aboutText.textContent = filmData.overview || 'No overview available.';
        this.rightCol.appendChild(this.aboutText);

        this.actionsBox = document.createElement('div');
        this.actionsBox.className = 'modal-actions';

        this.buttonWT = document.createElement('button');
        this.buttonWT.className = 'btn-modal btn-solid';
        this.buttonWT.textContent = 'ADD TO WATCHED';

        this.buttonQE = document.createElement('button');
        this.buttonQE.className = 'btn-modal btn-outline';
        this.buttonQE.textContent = 'ADD TO QUEUE';

        this.buttonDT = document.createElement('button');
        this.buttonDT.className = 'btn-modal btn-danger';
        this.buttonDT.textContent = 'DELETE FROM LIST';

        this.actionsBox.appendChild(this.buttonWT);
        this.actionsBox.appendChild(this.buttonQE);
        this.actionsBox.appendChild(this.buttonDT);
        this.rightCol.appendChild(this.actionsBox);

        this.layout.appendChild(this.rightCol);
        
        this.backdrop.appendChild(this.modal);
        document.body.appendChild(this.backdrop);

        // --- SUPABASE & OPTIMISTIC UI ---
        const { data: { user } } = await supabase.auth.getUser();

        const checkMovieInDB = async () => {
            if (!user) return null;
            const { data } = await supabase
                .from('favorites')
                .select('*')
                .eq('user_id', user.id)
                .eq('movie_id', filmData.id);
            
            return data && data.length > 0 ? data[0] : null;
        };

        let currentRecord = await checkMovieInDB();

        const updateButtonsUI = () => {
            if (currentRecord) {
                this.buttonWT.style.display = 'none';
                this.buttonQE.style.display = 'none';
                this.buttonDT.style.display = 'block';
            } else {
                this.buttonWT.style.display = 'block';
                this.buttonQE.style.display = 'block';
                this.buttonDT.style.display = 'none';
            }
        };
        updateButtonsUI();

        // Добавление
        const addMovie = async (listType) => {
            if (!user) {
                alert('Please Sign In to save movies to your library!');
                const authModalBtn = document.getElementById('authModalBtn');
                if (authModalBtn) authModalBtn.click();
                return;
            }

            const previousRecord = currentRecord;
            currentRecord = { list_type: listType };
            updateButtonsUI();

            const { error } = await supabase.from('favorites').insert([{
                user_id: user.id,
                movie_id: filmData.id,
                list_type: listType,
                movie_title: filmData.original_title || filmData.title,
                poster_path: filmData.poster_path,
                vote_average: filmData.vote_average,
                release_date: filmData.release_date
            }]);

            if (error) {
                console.error('Save error:', error);
                currentRecord = previousRecord;
                updateButtonsUI();
                alert('Failed to save movie.');
            } else {
                currentRecord = await checkMovieInDB();
                window.dispatchEvent(new CustomEvent('libraryUpdated'));
            }
        };

        // Удаление
        const deleteMovie = async () => {
            if (!user) return;

            const previousRecord = currentRecord;
            currentRecord = null;
            updateButtonsUI();

            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', user.id)
                .eq('movie_id', filmData.id);

            if (error) {
                console.error('Delete error:', error);
                currentRecord = previousRecord;
                updateButtonsUI();
                alert('Failed to delete movie.');
            } else {
                window.dispatchEvent(new CustomEvent('libraryUpdated'));
            }
        };

        this.buttonQE.addEventListener('click', () => addMovie('queue'));
        this.buttonWT.addEventListener('click', () => addMovie('watched'));
        this.buttonDT.addEventListener('click', () => deleteMovie());

        this.backdrop.addEventListener('click', (e) => {
            if (e.target === this.backdrop) this.closeModal();
        });
    }

    playerVideo(videoId) {
        const playerContainer = document.getElementById('youtubePlayer');
        if (!playerContainer) return;

        playerContainer.innerHTML = '';

        const newPlayer = document.createElement('div');
        newPlayer.id = 'player';
        playerContainer.appendChild(newPlayer);

        const trailerResult = videoId.results.find(result => 
            result.name.toLowerCase().includes("official") && result.name.toLowerCase().includes("trailer")
        ) || videoId.results[0];

        const key = trailerResult ? trailerResult.key : null;

        if (key) {
            const player = YouTubePlayer(newPlayer, {
                width: '100%',
                height: '360',
                videoId: `${key}`, 
            });

            this.buttonYT.addEventListener('click', () => {
                this.playerContainer.classList.remove('hidden');
                this.playerContainer.classList.add('show');
                player.playVideo();
            });

            this.closePlayerBtn.addEventListener('click', () => {
                this.playerContainer.classList.remove('show');
                this.playerContainer.classList.add('hidden');
                player.stopVideo();
            });
        } else {
            this.buttonYT.textContent = 'TRAILER NOT FOUND';
            this.buttonYT.disabled = true;
            this.buttonYT.style.opacity = '0.5';
            this.buttonYT.style.cursor = 'not-allowed';
        }
    }

    closeModal() {
        if (this.backdrop) {
            this.backdrop.remove();
            this.backdrop = null;
        }
        if (this.playerContainer) {
            this.playerContainer.remove();
            this.playerContainer = null;
        }
    }
}