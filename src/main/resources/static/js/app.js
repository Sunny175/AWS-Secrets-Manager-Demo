document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const movieGrid = document.getElementById('movieGrid');
    const loader = document.getElementById('loader');
    const emptyState = document.getElementById('emptyState');
    const sectionTitle = document.getElementById('sectionTitle');
    const resultsCount = document.getElementById('resultsCount');
    const modePill = document.getElementById('modePill');
    const modeText = document.getElementById('modeText');
    const awsStatusBadge = document.getElementById('awsStatusBadge');
    
    // Modal Elements
    const movieModal = document.getElementById('movieModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalBody = document.getElementById('modalBody');
    
    // Config Modal Elements
    const btnApiKeyConfig = document.getElementById('btnApiKeyConfig');
    const apiKeyModal = document.getElementById('apiKeyModal');
    const apiModalCloseBtn = document.getElementById('apiModalCloseBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const btnSaveApiKey = document.getElementById('btnSaveApiKey');
    const btnClearApiKey = document.getElementById('btnClearApiKey');
    const configStatusDetails = document.getElementById('configStatusDetails');
    const apiKeyStatusLabel = document.getElementById('apiKeyStatusLabel');

    // Genre Chips
    const filterChips = document.querySelectorAll('.chip');

    // State
    let currentMovies = [];
    let customApiKey = localStorage.getItem('watchmode_custom_api_key') || '';

    // Initialize App
    init();

    async function init() {
        if (customApiKey) {
            apiKeyInput.value = customApiKey;
            apiKeyStatusLabel.textContent = 'Key Saved';
        }
        
        await checkApiStatus();
        await loadPopularMovies();
        setupEventListeners();
    }

    function getAuthHeaders() {
        const headers = {};
        if (customApiKey) {
            headers['X-Watchmode-Api-Key'] = customApiKey;
        }
        return headers;
    }

    async function checkApiStatus() {
        try {
            const res = await fetch('/api/movies/status', { headers: getAuthHeaders() });
            if (res.ok) {
                const data = await res.json();
                updateStatusUI(data);
            } else {
                setFallbackStatusUI();
            }
        } catch (e) {
            setFallbackStatusUI();
        }
    }

    function updateStatusUI(data) {
        if (data.apiKeyConfigured) {
            modePill.className = 'status-pill active';
            modeText.textContent = 'Live Watchmode API';
        } else {
            modePill.className = 'status-pill demo';
            modeText.textContent = 'Demo Mode (Fallback)';
        }

        if (configStatusDetails) {
            configStatusDetails.innerHTML = `
                <div><strong>Service Status:</strong> ${data.service} (${data.status})</div>
                <div><strong>AWS Secrets Manager:</strong> Enabled (${data.awsSecretsManagerIntegration ? 'Active' : 'Disabled'})</div>
                <div><strong>Active Mode:</strong> ${data.mode}</div>
            `;
        }
    }

    function setFallbackStatusUI() {
        modePill.className = 'status-pill demo';
        modeText.textContent = 'Demo Mode';
    }

    async function loadPopularMovies() {
        showLoader(true);
        try {
            const res = await fetch('/api/movies/popular', { headers: getAuthHeaders() });
            if (!res.ok) throw new Error('Failed to load popular movies');
            const data = await res.json();
            currentMovies = data;
            renderMovieGrid(data, 'Popular Releases');
        } catch (e) {
            console.error(e);
            showEmptyState(true);
        } finally {
            showLoader(false);
        }
    }

    async function handleSearch(query) {
        if (!query.trim()) {
            loadPopularMovies();
            return;
        }

        showLoader(true);
        showEmptyState(false);
        try {
            const res = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}`, { headers: getAuthHeaders() });
            if (!res.ok) throw new Error('Search failed');
            const data = await res.json();
            currentMovies = data;
            renderMovieGrid(data, `Results for "${query}"`);
        } catch (e) {
            console.error(e);
            showEmptyState(true);
        } finally {
            showLoader(false);
        }
    }

    function renderMovieGrid(movies, title) {
        sectionTitle.textContent = title;
        resultsCount.textContent = `${movies.length} title${movies.length === 1 ? '' : 's'} found`;

        if (!movies || movies.length === 0) {
            movieGrid.innerHTML = '';
            showEmptyState(true);
            return;
        }

        showEmptyState(false);
        movieGrid.innerHTML = movies.map(movie => `
            <div class="movie-card" data-id="${movie.id}">
                <div class="poster-wrapper">
                    <img src="${movie.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop'}" 
                         alt="${escapeHtml(movie.name || movie.title)}" 
                         class="poster-img"
                         loading="lazy"
                         onerror="this.src='https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop'">
                    ${movie.userRating ? `
                        <div class="rating-badge">
                            <i class="fa-solid fa-star"></i> ${movie.userRating.toFixed(1)}
                        </div>
                    ` : ''}
                </div>
                <div class="card-content">
                    <div class="card-meta">
                        <span class="type-badge">${movie.type || 'MOVIE'}</span>
                        ${movie.year ? `<span>${movie.year}</span>` : ''}
                    </div>
                    <h3 class="card-title">${escapeHtml(movie.name || movie.title)}</h3>
                    <p class="card-plot">${escapeHtml(movie.plotOverview || 'Click to view streaming availability, details, and sources.')}</p>
                    <div class="card-action">
                        <span>Where to watch</span>
                        <i class="fa-solid fa-chevron-right"></i>
                    </div>
                </div>
            </div>
        `).join('');

        // Attach click listeners to cards
        document.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', () => {
                const id = card.getAttribute('data-id');
                openMovieDetails(id);
            });
        });
    }

    async function openMovieDetails(id) {
        movieModal.classList.remove('hidden');
        modalBody.innerHTML = `
            <div class="loader-container">
                <div class="spinner"></div>
                <p>Loading title details & streaming platforms...</p>
            </div>
        `;

        try {
            const res = await fetch(`/api/movies/${id}`, { headers: getAuthHeaders() });
            if (!res.ok) throw new Error('Could not fetch details');
            const movie = await res.json();
            renderMovieDetails(movie);
        } catch (e) {
            console.error(e);
            modalBody.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-triangle-exclamation empty-icon"></i>
                    <h3>Error Loading Movie Details</h3>
                    <p>Unable to retrieve streaming sources for this title.</p>
                </div>
            `;
        }
    }

    function renderMovieDetails(movie) {
        const backdropUrl = movie.backdrop || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?q=80&w=1200&auto=format&fit=crop';
        const posterUrl = movie.poster || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=600&auto=format&fit=crop';
        
        const genres = (movie.genreNames && movie.genreNames.length) ? movie.genreNames : ['Action', 'Drama'];
        const sources = (movie.sources && movie.sources.length) ? movie.sources : [];

        modalBody.innerHTML = `
            <div class="detail-header" style="background-image: url('${backdropUrl}')">
                <div class="detail-header-overlay"></div>
                <div class="detail-header-content">
                    <img src="${posterUrl}" alt="${escapeHtml(movie.title)}" class="detail-poster">
                    <div class="detail-titles">
                        <h2 class="detail-title">${escapeHtml(movie.title)}</h2>
                        <div class="detail-sub">
                            ${movie.year ? `<span>${movie.year}</span> • ` : ''}
                            ${movie.runtimeMinutes ? `<span>${movie.runtimeMinutes} mins</span> • ` : ''}
                            <span class="type-badge">${movie.type || 'MOVIE'}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="detail-main">
                <div class="genre-list">
                    ${genres.map(g => `<span class="genre-tag">${escapeHtml(g)}</span>`).join('')}
                </div>

                <div class="detail-scores">
                    ${movie.userRating ? `
                        <div class="score-box star">
                            <i class="fa-solid fa-star"></i>
                            <div>
                                <div class="score-val">${movie.userRating.toFixed(1)} / 10</div>
                                <div class="score-lbl">User Rating</div>
                            </div>
                        </div>
                    ` : ''}
                    
                    ${movie.criticScore ? `
                        <div class="score-box critic">
                            <i class="fa-solid fa-award"></i>
                            <div>
                                <div class="score-val">${movie.criticScore}%</div>
                                <div class="score-lbl">Critic Score</div>
                            </div>
                        </div>
                    ` : ''}

                    ${movie.imdbId ? `
                        <div class="score-box">
                            <i class="fa-brands fa-imdb" style="color:#f5c518"></i>
                            <div>
                                <div class="score-val">${movie.imdbId}</div>
                                <div class="score-lbl">IMDb ID</div>
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="detail-overview">
                    <h4>Overview</h4>
                    <p>${escapeHtml(movie.plotOverview || 'No description available for this title.')}</p>
                </div>

                <div class="sources-section">
                    <h4><i class="fa-solid fa-tv" style="color: var(--primary)"></i> Where to Watch & Stream</h4>
                    ${sources.length > 0 ? `
                        <div class="sources-grid">
                            ${sources.map(src => `
                                <a href="${src.webUrl || '#'}" target="_blank" rel="noopener" class="source-card">
                                    <div>
                                        <div class="source-name">${escapeHtml(src.name)}</div>
                                        <div class="source-price">${src.format ? src.format : ''} ${src.price && src.price > 0 ? '$' + src.price.toFixed(2) : 'Included with Sub'}</div>
                                    </div>
                                    <div class="source-tags">
                                        <span class="tag-type ${src.type}">${src.type || 'stream'}</span>
                                        <i class="fa-solid fa-arrow-up-right-from-square" style="font-size: 0.75rem; color: var(--text-dim)"></i>
                                    </div>
                                </a>
                            `).join('')}
                        </div>
                    ` : `
                        <p style="color: var(--text-dim); font-size: 0.9rem;">No active streaming providers listed for your region currently.</p>
                    `}
                </div>
            </div>
        `;
    }

    function setupEventListeners() {
        // Search submit
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSearch(searchInput.value);
        });

        // Filter chips
        filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                filterChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');

                const genre = chip.getAttribute('data-genre');
                if (genre === 'all') {
                    loadPopularMovies();
                } else if (genre === 'top-rated') {
                    handleSearch('Dark Knight');
                } else {
                    handleSearch(genre);
                }
            });
        });

        // Modals close
        modalCloseBtn.addEventListener('click', () => movieModal.classList.add('hidden'));
        apiModalCloseBtn.addEventListener('click', () => apiKeyModal.classList.add('hidden'));

        movieModal.addEventListener('click', (e) => {
            if (e.target === movieModal) movieModal.classList.add('hidden');
        });

        apiKeyModal.addEventListener('click', (e) => {
            if (e.target === apiKeyModal) apiKeyModal.classList.add('hidden');
        });

        // Keyboard ESC close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                movieModal.classList.add('hidden');
                apiKeyModal.classList.add('hidden');
            }
        });

        // API Key Config toggle
        btnApiKeyConfig.addEventListener('click', () => {
            apiKeyModal.classList.remove('hidden');
            checkApiStatus();
        });

        // Save Custom Key
        btnSaveApiKey.addEventListener('click', () => {
            const keyVal = apiKeyInput.value.trim();
            if (keyVal) {
                customApiKey = keyVal;
                localStorage.setItem('watchmode_custom_api_key', keyVal);
                apiKeyStatusLabel.textContent = 'Key Saved';
            }
            apiKeyModal.classList.add('hidden');
            checkApiStatus();
            loadPopularMovies();
        });

        // Clear Custom Key
        btnClearApiKey.addEventListener('click', () => {
            customApiKey = '';
            localStorage.removeItem('watchmode_custom_api_key');
            apiKeyInput.value = '';
            apiKeyStatusLabel.textContent = 'API Key';
            apiKeyModal.classList.add('hidden');
            checkApiStatus();
            loadPopularMovies();
        });
    }

    function showLoader(show) {
        if (show) {
            loader.classList.remove('hidden');
            movieGrid.innerHTML = '';
        } else {
            loader.classList.add('hidden');
        }
    }

    function showEmptyState(show) {
        if (show) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
        }
    }

    function escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>"']/g, function(m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[m];
        });
    }
});
