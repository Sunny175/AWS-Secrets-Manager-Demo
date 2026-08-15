document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const searchClearBtn = document.getElementById('searchClearBtn');
    const movieGrid = document.getElementById('movieGrid');
    const loader = document.getElementById('loader');
    const emptyState = document.getElementById('emptyState');
    const emptyTitle = document.getElementById('emptyTitle');
    const emptyDesc = document.getElementById('emptyDesc');
    const sectionTitle = document.getElementById('sectionTitle');
    const resultsCount = document.getElementById('resultsCount');
    const modePill = document.getElementById('modePill');
    const modeText = document.getElementById('modeText');
    const awsStatusBadge = document.getElementById('awsStatusBadge');
    
    // Watchlist Elements
    const btnNavWatchlist = document.getElementById('btnNavWatchlist');
    const navWatchlistBadge = document.getElementById('navWatchlistBadge');
    const watchlistCount = document.getElementById('watchlistCount');
    const mediaTypeToggle = document.getElementById('mediaTypeToggle');
    
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

    // Telemetry Modal Elements
    const telemetryModal = document.getElementById('telemetryModal');
    const telemetryModalCloseBtn = document.getElementById('telemetryModalCloseBtn');
    const telemetryRegion = document.getElementById('telemetryRegion');
    const telemetryKeySource = document.getElementById('telemetryKeySource');
    const btnClearBackendCache = document.getElementById('btnClearBackendCache');
    const btnTestAwsConnection = document.getElementById('btnTestAwsConnection');
    const toastContainer = document.getElementById('toastContainer');

    // Genre Chips
    const filterChips = document.querySelectorAll('.chip');

    // State
    let currentMovies = [];
    let activeTypeFilter = 'all'; // all, movie, tv
    let searchDebounceTimer = null;
    let customApiKey = localStorage.getItem('watchmode_custom_api_key') || '';

    // Initialize App
    init();

    async function init() {
        if (customApiKey) {
            apiKeyInput.value = customApiKey;
            apiKeyStatusLabel.textContent = 'Key Saved';
        }
        
        updateWatchlistBadges();
        await checkApiStatus();
        await loadPopularMovies();
        setupEventListeners();
    }

    // --- Watchlist Storage Helper ---
    function getWatchlist() {
        try {
            return JSON.parse(localStorage.getItem('cinestream_watchlist')) || [];
        } catch (e) {
            return [];
        }
    }

    function saveWatchlist(list) {
        localStorage.setItem('cinestream_watchlist', JSON.stringify(list));
        updateWatchlistBadges();
    }

    function isBookmarked(id) {
        const list = getWatchlist();
        return list.some(item => String(item.id) === String(id));
    }

    function toggleBookmark(movie) {
        let list = getWatchlist();
        const exists = list.some(item => String(item.id) === String(movie.id));
        
        if (exists) {
            list = list.filter(item => String(item.id) !== String(movie.id));
            saveWatchlist(list);
            showToast(`Removed "${movie.name || movie.title}" from Watchlist`, 'info', 'fa-bookmark');
        } else {
            const itemToSave = {
                id: movie.id,
                name: movie.name || movie.title,
                title: movie.title || movie.name,
                poster: movie.poster,
                year: movie.year,
                type: movie.type || 'MOVIE',
                userRating: movie.userRating,
                plotOverview: movie.plotOverview
            };
            list.push(itemToSave);
            saveWatchlist(list);
            showToast(`Added "${movie.name || movie.title}" to Watchlist!`, 'success', 'fa-heart');
        }

        // Re-render bookmark icons on active cards
        document.querySelectorAll(`.card-bookmark-btn[data-id="${movie.id}"]`).forEach(btn => {
            if (isBookmarked(movie.id)) {
                btn.classList.add('bookmarked');
                btn.innerHTML = '<i class="fa-solid fa-bookmark"></i>';
            } else {
                btn.classList.remove('bookmarked');
                btn.innerHTML = '<i class="fa-regular fa-bookmark"></i>';
            }
        });
    }

    function updateWatchlistBadges() {
        const count = getWatchlist().length;
        if (navWatchlistBadge) navWatchlistBadge.textContent = count;
        if (watchlistCount) watchlistCount.textContent = count;
    }

    function renderWatchlist() {
        const list = getWatchlist();
        currentMovies = list;
        renderMovieGrid(list, 'My Saved Watchlist');
        if (list.length === 0) {
            emptyTitle.textContent = 'Your Watchlist is empty';
            emptyDesc.textContent = 'Explore movies and click the bookmark icon to save titles for later!';
            showEmptyState(true);
        }
    }

    // --- API Communication ---
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
                return data;
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

        if (telemetryRegion) telemetryRegion.textContent = data.awsRegion || 'us-east-1';
        if (telemetryKeySource) telemetryKeySource.textContent = data.activeKeySource || 'AWS Secrets Manager';
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
            filterAndRenderGrid(data, 'Popular Releases');
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
            filterAndRenderGrid(data, `Results for "${query}"`);
        } catch (e) {
            console.error(e);
            emptyTitle.textContent = 'No movies found';
            emptyDesc.textContent = `No search matches found for "${query}". Try another title or category.`;
            showEmptyState(true);
        } finally {
            showLoader(false);
        }
    }

    function filterAndRenderGrid(movies, title) {
        let filtered = movies;
        if (activeTypeFilter === 'movie') {
            filtered = movies.filter(m => !m.type || m.type.toLowerCase().includes('movie'));
        } else if (activeTypeFilter === 'tv') {
            filtered = movies.filter(m => m.type && (m.type.toLowerCase().includes('tv') || m.type.toLowerCase().includes('series')));
        }
        renderMovieGrid(filtered, title);
    }

    function renderMovieGrid(movies, title) {
        sectionTitle.textContent = title;
        resultsCount.textContent = `${movies.length} title${movies.length === 1 ? '' : 's'} found`;

        if (!movies || movies.length === 0) {
            movieGrid.innerHTML = '';
            emptyTitle.textContent = 'No matching titles';
            emptyDesc.textContent = 'Try resetting your type filter or search term.';
            showEmptyState(true);
            return;
        }

        showEmptyState(false);
        movieGrid.innerHTML = movies.map(movie => {
            const bookmarked = isBookmarked(movie.id);
            return `
            <div class="movie-card" data-id="${movie.id}">
                <div class="poster-wrapper">
                    <button class="card-bookmark-btn ${bookmarked ? 'bookmarked' : ''}" data-id="${movie.id}" title="${bookmarked ? 'Remove from Watchlist' : 'Add to Watchlist'}">
                        <i class="fa-${bookmarked ? 'solid' : 'regular'} fa-bookmark"></i>
                    </button>
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
            `;
        }).join('');

        // Attach listeners for card click & bookmark toggle
        document.querySelectorAll('.movie-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('.card-bookmark-btn')) return; // Ignore card click if bookmark clicked
                const id = card.getAttribute('data-id');
                openMovieDetails(id);
            });
        });

        document.querySelectorAll('.card-bookmark-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                const movie = movies.find(m => String(m.id) === String(id)) || { id: id, name: 'Movie' };
                toggleBookmark(movie);
            });
        });
    }

    async function openMovieDetails(id) {
        movieModal.classList.remove('hidden');
        modalBody.innerHTML = `
            <div class="loader-container">
                <div class="spinner"></div>
                <p>Loading title details, trailer & streaming platforms...</p>
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
        const bookmarked = isBookmarked(movie.id);

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
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; flex-wrap: wrap; gap: 0.75rem;">
                    <div class="genre-list" style="margin-bottom: 0;">
                        ${genres.map(g => `<span class="genre-tag">${escapeHtml(g)}</span>`).join('')}
                    </div>
                    <button class="btn btn-secondary ${bookmarked ? 'bookmarked' : ''}" id="modalBookmarkBtn" style="border-radius: 20px;">
                        <i class="fa-${bookmarked ? 'solid' : 'regular'} fa-bookmark" style="color: ${bookmarked ? 'var(--secondary)' : 'inherit'}"></i>
                        <span>${bookmarked ? 'In Watchlist' : 'Add to Watchlist'}</span>
                    </button>
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

                ${movie.trailer ? `
                    <div class="trailer-section">
                        <h4><i class="fa-solid fa-play" style="color: var(--secondary)"></i> Official Trailer</h4>
                        <div class="trailer-container">
                            <iframe class="trailer-iframe" src="${movie.trailer}" title="${escapeHtml(movie.title)} Trailer" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        </div>
                    </div>
                ` : ''}

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

        // Attach modal bookmark toggle
        const modalBookmarkBtn = document.getElementById('modalBookmarkBtn');
        if (modalBookmarkBtn) {
            modalBookmarkBtn.addEventListener('click', () => {
                toggleBookmark(movie);
                renderMovieDetails(movie); // refresh modal state
            });
        }
    }

    function setupEventListeners() {
        // Search submit & live debounce
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleSearch(searchInput.value);
        });

        searchInput.addEventListener('input', () => {
            const val = searchInput.value;
            if (val.trim()) {
                searchClearBtn.classList.remove('hidden');
            } else {
                searchClearBtn.classList.add('hidden');
            }

            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                handleSearch(val);
            }, 350);
        });

        searchClearBtn.addEventListener('click', () => {
            searchInput.value = '';
            searchClearBtn.classList.add('hidden');
            loadPopularMovies();
        });

        // Media Type Switcher (All, Movies, TV Shows)
        if (mediaTypeToggle) {
            mediaTypeToggle.querySelectorAll('.type-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    mediaTypeToggle.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    activeTypeFilter = btn.getAttribute('data-type');
                    filterAndRenderGrid(currentMovies, sectionTitle.textContent);
                });
            });
        }

        // Nav Watchlist button
        btnNavWatchlist.addEventListener('click', () => {
            filterChips.forEach(c => c.classList.remove('active'));
            const watchChip = document.querySelector('.chip-watchlist');
            if (watchChip) watchChip.classList.add('active');
            renderWatchlist();
        });

        // Filter chips
        filterChips.forEach(chip => {
            chip.addEventListener('click', () => {
                filterChips.forEach(c => c.classList.remove('active'));
                chip.classList.add('active');

                const genre = chip.getAttribute('data-genre');
                if (genre === 'watchlist') {
                    renderWatchlist();
                } else if (genre === 'all') {
                    loadPopularMovies();
                } else if (genre === 'top-rated') {
                    handleSearch('Dark Knight');
                } else {
                    handleSearch(genre);
                }
            });
        });

        // AWS Telemetry Badge Click
        if (awsStatusBadge) {
            awsStatusBadge.addEventListener('click', () => {
                telemetryModal.classList.remove('hidden');
                checkApiStatus();
            });
        }

        // Telemetry clear cache
        if (btnClearBackendCache) {
            btnClearBackendCache.addEventListener('click', async () => {
                try {
                    const res = await fetch('/api/movies/cache/clear', { method: 'POST' });
                    if (res.ok) {
                        showToast('Spring Boot Cache Cleared Successfully!', 'success', 'fa-circle-check');
                    }
                } catch (e) {
                    showToast('Could not clear backend cache', 'warning', 'fa-triangle-exclamation');
                }
            });
        }

        if (btnTestAwsConnection) {
            btnTestAwsConnection.addEventListener('click', async () => {
                const data = await checkApiStatus();
                showToast(`Refreshed Diagnostics: AWS Secret Active (${data?.mode || 'Demo'})`, 'info', 'fa-aws');
            });
        }

        // Modals close
        modalCloseBtn.addEventListener('click', () => movieModal.classList.add('hidden'));
        apiModalCloseBtn.addEventListener('click', () => apiKeyModal.classList.add('hidden'));
        if (telemetryModalCloseBtn) telemetryModalCloseBtn.addEventListener('click', () => telemetryModal.classList.add('hidden'));

        movieModal.addEventListener('click', (e) => {
            if (e.target === movieModal) movieModal.classList.add('hidden');
        });

        apiKeyModal.addEventListener('click', (e) => {
            if (e.target === apiKeyModal) apiKeyModal.classList.add('hidden');
        });

        if (telemetryModal) {
            telemetryModal.addEventListener('click', (e) => {
                if (e.target === telemetryModal) telemetryModal.classList.add('hidden');
            });
        }

        // Keyboard ESC close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                movieModal.classList.add('hidden');
                apiKeyModal.classList.add('hidden');
                if (telemetryModal) telemetryModal.classList.add('hidden');
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
                showToast('Custom Watchmode API Key Saved!', 'success', 'fa-key');
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
            showToast('Reset to default AWS Secrets Manager key', 'info', 'fa-rotate-left');
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

    function showToast(message, type = 'info', icon = 'fa-info-circle') {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${escapeHtml(message)}</span>`;
        toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
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

