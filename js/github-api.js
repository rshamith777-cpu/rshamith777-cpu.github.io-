/**
 * GitHub API Real-time Engine
 * Fetches user profile, live repos sorted by latest push, auto-polls for new pushes,
 * handles smart local caching, language color mappings, and instant UI updates.
 */
class GitHubEngine {
  constructor(config) {
    this.config = config || window.PORTFOLIO_CONFIG;
    this.username = this.config.githubUsername;
    this.userData = null;
    this.repos = [];
    this.filteredRepos = [];
    this.activeFilter = 'all';
    this.searchQuery = '';
    this.sortBy = 'pushed'; // pushed, stars, name
    this.lastSyncTime = null;
    this.pollingTimer = null;
    this.lastPushedTimestamps = new Map();

    // Cache keys
    this.CACHE_KEY_USER = `gh_user_${this.username}`;
    this.CACHE_KEY_REPOS = `gh_repos_${this.username}`;
    this.CACHE_KEY_TIME = `gh_time_${this.username}`;
    this.CACHE_TTL = 3 * 60 * 1000; // 3 minutes cache freshness

    // Language colors map
    this.langColors = {
      JavaScript: '#f1e05a',
      TypeScript: '#3178c6',
      HTML: '#e34c26',
      CSS: '#563d7c',
      Python: '#3572A5',
      Java: '#b07219',
      'C++': '#f34b7d',
      'C#': '#178600',
      C: '#555555',
      PHP: '#4F5D95',
      Ruby: '#701516',
      Go: '#00ADD8',
      Rust: '#dea584',
      Dart: '#00B4AB',
      Swift: '#F05138',
      Kotlin: '#A97BFF',
      Shell: '#89e051',
      Vue: '#41b883',
      Svelte: '#ff3e00'
    };
  }

  async init() {
    this.loadFromCache();
    await this.fetchData();
    this.startAutoSync();
    this.bindSearchAndFilter();
  }

  getHeaders() {
    const headers = {
      'Accept': 'application/vnd.github.v3+json'
    };
    const customToken = localStorage.getItem('gh_pat_token');
    if (customToken) {
      headers['Authorization'] = `token ${customToken}`;
    }
    return headers;
  }

  loadFromCache() {
    try {
      const cachedUser = localStorage.getItem(this.CACHE_KEY_USER);
      const cachedRepos = localStorage.getItem(this.CACHE_KEY_REPOS);
      const cachedTime = localStorage.getItem(this.CACHE_KEY_TIME);

      if (cachedUser && cachedRepos) {
        this.userData = JSON.parse(cachedUser);
        this.repos = JSON.parse(cachedRepos);
        this.lastSyncTime = cachedTime ? new Date(parseInt(cachedTime)) : new Date();
        this.renderAll();
      }
    } catch (e) {
      console.warn('Cache read error:', e);
    }
  }

  saveToCache() {
    try {
      if (this.userData) localStorage.setItem(this.CACHE_KEY_USER, JSON.stringify(this.userData));
      if (this.repos) localStorage.setItem(this.CACHE_KEY_REPOS, JSON.stringify(this.repos));
      this.lastSyncTime = new Date();
      localStorage.setItem(this.CACHE_KEY_TIME, this.lastSyncTime.getTime().toString());
    } catch (e) {
      console.warn('Cache write error:', e);
    }
  }

  async fetchData(isManualSync = false) {
    this.updateSyncStatus('syncing', 'Syncing with GitHub...');
    try {
      // 1. Fetch User Profile
      const userRes = await fetch(`https://api.github.com/users/${this.username}`, {
        headers: this.getHeaders()
      });

      if (userRes.status === 403) {
        throw new Error('RATE_LIMITED');
      }

      if (!userRes.ok) {
        throw new Error(`User fetch failed: ${userRes.status}`);
      }
      this.userData = await userRes.json();

      // 2. Fetch Repositories sorted by recently updated/pushed
      const reposRes = await fetch(
        `https://api.github.com/users/${this.username}/repos?sort=updated&direction=desc&per_page=100`,
        { headers: this.getHeaders() }
      );

      if (!reposRes.ok) {
        throw new Error(`Repos fetch failed: ${reposRes.status}`);
      }
      const rawRepos = await reposRes.json();

      // Filter out forks if desired, or keep all public repos
      const freshRepos = rawRepos.filter(r => !r.fork);

      // Check if any repo was updated since last poll
      this.checkForFreshPushes(freshRepos);

      this.repos = freshRepos;
      this.saveToCache();
      this.renderAll();
      this.updateSyncStatus('live', 'Live connected to GitHub');

      if (isManualSync) {
        if (window.soundEngine) window.soundEngine.play('coin');
        this.showToast('🚀 GitHub Data Synced!', `Loaded ${this.repos.length} live repositories.`);
      }

      if (window.achievements) {
        window.achievements.unlock('git_connected', 'GitHub Uplink', 'Established real-time API connection to GitHub!');
      }

    } catch (err) {
      console.warn('GitHub API fetch notice:', err.message);
      if (err.message === 'RATE_LIMITED') {
        this.updateSyncStatus('cached', 'API limit reached (Cached data active)');
        this.showRateLimitNotice();
      } else {
        this.updateSyncStatus('offline', 'Offline (Displaying cached projects)');
      }

      // If no data at all yet, populate rich demo projects so UI looks fantastic
      if (!this.repos || this.repos.length === 0) {
        this.populateFallbackData();
      }
    }
  }

  checkForFreshPushes(newRepos) {
    if (this.lastPushedTimestamps.size === 0) {
      // First run: record baseline
      newRepos.forEach(r => this.lastPushedTimestamps.set(r.name, r.pushed_at));
      return;
    }

    let detectedPush = null;
    for (const repo of newRepos) {
      const prevPushed = this.lastPushedTimestamps.get(repo.name);
      if (prevPushed && prevPushed !== repo.pushed_at) {
        detectedPush = repo;
        break;
      }
    }

    // Update timestamps map
    this.lastPushedTimestamps.clear();
    newRepos.forEach(r => this.lastPushedTimestamps.set(r.name, r.pushed_at));

    if (detectedPush) {
      if (window.soundEngine) window.soundEngine.play('fanfare');
      this.showToast('🔥 Fresh GitHub Push Detected!', `Repo "${detectedPush.name}" was updated just now!`);
    }
  }

  startAutoSync() {
    if (!this.config.autoSync.enabled) return;
    const intervalMs = (this.config.autoSync.intervalSeconds || 60) * 1000;
    if (this.pollingTimer) clearInterval(this.pollingTimer);
    this.pollingTimer = setInterval(() => {
      this.fetchData(false);
    }, intervalMs);
  }

  populateFallbackData() {
    this.userData = {
      login: this.username,
      name: this.config.name,
      avatar_url: `https://avatars.githubusercontent.com/u/9919?s=200&v=4`,
      bio: this.config.statusMessage,
      public_repos: 8,
      followers: 24,
      following: 15,
      html_url: `https://github.com/${this.username}`
    };

    this.repos = [
      {
        id: 101,
        name: 'quantum-game-engine',
        description: 'Interactive high-performance 2D canvas physics and particle engine with WebGL shaders.',
        html_url: `https://github.com/${this.username}/quantum-game-engine`,
        homepage: 'https://github.com',
        language: 'TypeScript',
        stargazers_count: 32,
        forks_count: 7,
        pushed_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        topics: ['game-development', 'physics', 'canvas', 'typescript']
      },
      {
        id: 102,
        name: 'cyberpunk-portfolio-v2',
        description: 'Ultra-modern interactive developer portfolio featuring realistic hanging badge physics and live GitHub sync.',
        html_url: `https://github.com/${this.username}/cyberpunk-portfolio-v2`,
        homepage: 'https://github.com',
        language: 'JavaScript',
        stargazers_count: 58,
        forks_count: 14,
        pushed_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        topics: ['portfolio', 'interactive', 'physics', 'web-audio']
      },
      {
        id: 103,
        name: 'ai-code-companion',
        description: 'Autonomous AI assistant workflow integrating agentic coding, automated unit testing and real-time diffs.',
        html_url: `https://github.com/${this.username}/ai-code-companion`,
        homepage: '',
        language: 'Python',
        stargazers_count: 24,
        forks_count: 5,
        pushed_at: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
        topics: ['ai', 'python', 'automation', 'cli']
      },
      {
        id: 104,
        name: 'neon-synth-audio-kit',
        description: 'Procedural 8-bit sound synthesizer using Web Audio API oscillators, noise generators, and chiptune soundscapes.',
        html_url: `https://github.com/${this.username}/neon-synth-audio-kit`,
        homepage: '',
        language: 'JavaScript',
        stargazers_count: 19,
        forks_count: 3,
        pushed_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
        topics: ['webaudio', 'chiptune', 'synth']
      }
    ];

    this.renderAll();
  }

  renderAll() {
    this.renderProfile();
    this.renderHangingBadge();
    this.renderFilterPills();
    this.applyFilterAndSort();
    this.renderStatsHud();
  }

  renderProfile() {
    if (!this.userData) return;
    const avatarEls = document.querySelectorAll('.gh-avatar');
    avatarEls.forEach(img => {
      img.src = this.userData.avatar_url || 'https://github.com/ghost.png';
      img.alt = `${this.userData.name || this.username} Avatar`;
    });

    const nameEls = document.querySelectorAll('.gh-name');
    nameEls.forEach(el => el.textContent = this.userData.name || this.username);

    const bioEls = document.querySelectorAll('.gh-bio');
    bioEls.forEach(el => el.textContent = this.userData.bio || this.config.roleTitle);

    const repoCountEls = document.querySelectorAll('.gh-repo-count');
    repoCountEls.forEach(el => el.textContent = this.repos.length || this.userData.public_repos || 0);

    const followersEls = document.querySelectorAll('.gh-followers');
    followersEls.forEach(el => el.textContent = this.userData.followers || 0);
  }

  renderHangingBadge() {
    if (!this.userData) return;
    // Populate the badge elements
    const badgeAvatar = document.getElementById('badge-avatar');
    if (badgeAvatar) badgeAvatar.src = this.userData.avatar_url;

    const badgeName = document.getElementById('badge-name');
    if (badgeName) badgeName.textContent = (this.userData.name || this.username).toUpperCase();

    const badgeHandle = document.getElementById('badge-handle');
    if (badgeHandle) badgeHandle.textContent = `@${this.username}`;

    const badgeRank = document.getElementById('badge-rank');
    if (badgeRank) {
      // Calculate dynamic level based on repos and stars
      const totalStars = this.repos.reduce((acc, r) => acc + (r.stargazers_count || 0), 0);
      const calculatedLevel = Math.max(1, Math.min(99, Math.floor(this.repos.length * 3 + totalStars * 2 + 10)));
      badgeRank.textContent = `LVL. ${calculatedLevel} CYBER CODER`;
    }

    const badgeRepos = document.getElementById('badge-repos');
    if (badgeRepos) badgeRepos.textContent = this.repos.length;

    const badgeStars = document.getElementById('badge-stars');
    if (badgeStars) {
      const totalStars = this.repos.reduce((acc, r) => acc + (r.stargazers_count || 0), 0);
      badgeStars.textContent = totalStars;
    }
  }

  renderStatsHud() {
    const totalStars = this.repos.reduce((acc, r) => acc + (r.stargazers_count || 0), 0);
    const totalForks = this.repos.reduce((acc, r) => acc + (r.forks_count || 0), 0);

    const starsEl = document.getElementById('hud-total-stars');
    if (starsEl) starsEl.textContent = totalStars;

    const reposEl = document.getElementById('hud-total-repos');
    if (reposEl) reposEl.textContent = this.repos.length;

    const forksEl = document.getElementById('hud-total-forks');
    if (forksEl) forksEl.textContent = totalForks;
  }

  renderFilterPills() {
    const filterContainer = document.getElementById('language-filters');
    if (!filterContainer) return;

    // Collect all unique languages
    const languages = new Set();
    this.repos.forEach(r => {
      if (r.language) languages.add(r.language);
    });

    let html = `<button class="filter-pill ${this.activeFilter === 'all' ? 'active' : ''}" data-lang="all">
      ⚡ All Repos (${this.repos.length})
    </button>`;

    languages.forEach(lang => {
      const count = this.repos.filter(r => r.language === lang).length;
      const dotColor = this.langColors[lang] || '#00f3ff';
      const isActive = this.activeFilter === lang ? 'active' : '';
      html += `
        <button class="filter-pill ${isActive}" data-lang="${lang}">
          <span class="lang-dot" style="background-color: ${dotColor}"></span>
          ${lang} (${count})
        </button>
      `;
    });

    filterContainer.innerHTML = html;

    // Attach listeners
    filterContainer.querySelectorAll('.filter-pill').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.soundEngine) window.soundEngine.play('blip', 650);
        this.activeFilter = btn.dataset.lang;
        this.renderFilterPills();
        this.applyFilterAndSort();

        if (window.achievements) {
          window.achievements.unlock('repo_explorer', 'Code Cartographer', 'Filtered through tech stack repositories!');
        }
      });
    });
  }

  bindSearchAndFilter() {
    const searchInput = document.getElementById('repo-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase().trim();
        this.applyFilterAndSort();
      });
    }

    const sortSelect = document.getElementById('repo-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        if (window.soundEngine) window.soundEngine.play('blip', 580);
        this.applyFilterAndSort();
      });
    }

    const syncBtn = document.getElementById('manual-sync-btn');
    if (syncBtn) {
      syncBtn.addEventListener('click', () => {
        this.fetchData(true);
      });
    }
  }

  applyFilterAndSort() {
    let result = [...this.repos];

    // Language filter
    if (this.activeFilter !== 'all') {
      result = result.filter(r => r.language === this.activeFilter);
    }

    // Search query filter (name, description, topics)
    if (this.searchQuery) {
      result = result.filter(r => {
        const nameMatch = r.name.toLowerCase().includes(this.searchQuery);
        const descMatch = (r.description || '').toLowerCase().includes(this.searchQuery);
        const topicMatch = (r.topics || []).some(t => t.toLowerCase().includes(this.searchQuery));
        return nameMatch || descMatch || topicMatch;
      });
    }

    // Sort order
    if (this.sortBy === 'pushed') {
      result.sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime());
    } else if (this.sortBy === 'stars') {
      result.sort((a, b) => (b.stargazers_count || 0) - (a.stargazers_count || 0));
    } else if (this.sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    this.filteredRepos = result;
    this.renderReposList();
  }

  renderReposList() {
    const grid = document.getElementById('repos-grid');
    if (!grid) return;

    if (this.filteredRepos.length === 0) {
      grid.innerHTML = `
        <div class="empty-repos-state">
          <div class="empty-icon">👾</div>
          <h3>No repositories found</h3>
          <p>No projects match your current search or filter query.</p>
        </div>
      `;
      return;
    }

    const now = Date.now();

    grid.innerHTML = this.filteredRepos.map((repo, index) => {
      const pushedTime = new Date(repo.pushed_at).getTime();
      const hoursAgo = Math.floor((now - pushedTime) / (1000 * 60 * 60));
      const isFresh = hoursAgo < 48; // Updated in the last 48 hours
      const relativeTime = this.formatRelativeTime(pushedTime);
      const langColor = this.langColors[repo.language] || '#00f3ff';

      const topicsHtml = (repo.topics || []).slice(0, 4).map(t => `
        <span class="topic-tag">#${t}</span>
      `).join('');

      return `
        <div class="repo-card glass-panel ${isFresh ? 'fresh-push' : ''}" style="animation-delay: ${index * 0.05}s">
          ${isFresh ? `<div class="fresh-push-badge">⚡ RECENTLY PUSHED</div>` : ''}
          <div class="repo-card-header">
            <div class="repo-icon-title">
              <span class="folder-icon">📁</span>
              <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="repo-title-link">
                ${repo.name}
              </a>
            </div>
            <div class="repo-visibility">${repo.private ? '🔒 Private' : '🌐 Public'}</div>
          </div>

          <p class="repo-desc">
            ${repo.description || 'No description provided. Click to view repository on GitHub.'}
          </p>

          ${topicsHtml ? `<div class="repo-topics">${topicsHtml}</div>` : ''}

          <div class="repo-card-footer">
            <div class="repo-meta-left">
              ${repo.language ? `
                <span class="repo-lang">
                  <span class="lang-dot" style="background-color: ${langColor}"></span>
                  ${repo.language}
                </span>
              ` : ''}
              <span class="repo-stat" title="Stars">⭐ ${repo.stargazers_count || 0}</span>
              <span class="repo-stat" title="Forks">🍴 ${repo.forks_count || 0}</span>
            </div>
            <div class="repo-meta-right" title="Last commit timestamp">
              🕒 ${relativeTime}
            </div>
          </div>

          <div class="repo-card-actions">
            <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="repo-action-btn primary">
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
              View Code
            </a>
            ${repo.homepage ? `
              <a href="${repo.homepage}" target="_blank" rel="noopener noreferrer" class="repo-action-btn secondary">
                🚀 Live Demo
              </a>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  formatRelativeTime(timestamp) {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  }

  updateSyncStatus(status, text) {
    const indicator = document.getElementById('sync-indicator');
    const label = document.getElementById('sync-label');
    if (!indicator || !label) return;

    indicator.className = `sync-radar-dot ${status}`;
    label.textContent = text;
  }

  showToast(title, message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'cyber-toast';
    toast.innerHTML = `
      <div class="toast-glow-bar"></div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-msg">${message}</div>
      </div>
      <button class="toast-close">&times;</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    });

    container.appendChild(toast);
    setTimeout(() => {
      if (toast.parentElement) {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
      }
    }, 4500);
  }

  showRateLimitNotice() {
    const notice = document.getElementById('rate-limit-banner');
    if (notice) notice.classList.remove('hidden');
  }
}

window.GitHubEngine = GitHubEngine;

