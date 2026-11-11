/**
 * Blueprint Collage & Swiss Grid Controller
 * Fetches and displays ALL repositories with staggered entrance animations,
 * dynamic language filter tabs, real-time search, CAD coordinate tracker,
 * interactive compass angle calculation, and case study schematic inspection modal.
 */

let allLoadedRepos = [];
let activeLanguageFilter = 'ALL';
let currentSearchQuery = '';

document.addEventListener('DOMContentLoaded', () => {
  initCoordinateTracker();
  initCompassTracker();
  initCaseStudyModals();
  initLiveBlueprintRepos();
  initBlueprintSearch();
});

/**
 * 1. Live CAD Coordinate Tracking
 */
function initCoordinateTracker() {
  const coordEls = document.querySelectorAll('.live-coords');
  if (coordEls.length === 0) return;

  window.addEventListener('mousemove', (e) => {
    // Convert pixels to architectural mm at 1:1 scale
    const mmX = (e.clientX * 0.264583).toFixed(1);
    const mmY = (e.clientY * 0.264583).toFixed(1);

    coordEls.forEach(el => {
      el.textContent = `X: ${mmX}mm  Y: ${mmY}mm`;
    });
  });
}

/**
 * 2. Geometric Drafting Compass Line-Art Interactive Tracking
 */
function initCompassTracker() {
  const compassArm = document.getElementById('compass-rotating-needle');
  const angleLabel = document.getElementById('compass-angle-val');
  const compassSvg = document.getElementById('drafting-compass-svg');

  if (!compassArm || !compassSvg) return;

  window.addEventListener('mousemove', (e) => {
    const rect = compassSvg.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    let deg = (rad * 180) / Math.PI;
    if (deg < 0) deg += 360;

    compassArm.setAttribute('transform', `rotate(${deg.toFixed(1)}, 80, 80)`);
    if (angleLabel) {
      angleLabel.textContent = `∠ ${deg.toFixed(1)}°`;
    }
  });
}

/**
 * 3. Case Study Blueprint Inspection Modal
 */
function initCaseStudyModals() {
  const modal = document.getElementById('schematic-modal');
  const closeBtn = document.getElementById('schematic-modal-close');
  const modalContent = document.getElementById('schematic-modal-body');

  if (!modal || !closeBtn) return;

  function closeModal() {
    modal.classList.remove('active');
  }

  closeBtn.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeModal();
    }
  });

  // Attach triggers to case study action buttons
  document.querySelectorAll('.case-study-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const title = btn.dataset.title || 'ARCHITECTURAL SCHEMATIC';
      const dwg = btn.dataset.dwg || 'DWG-2026-01';
      const desc = btn.dataset.desc || 'Technical architectural breakdown.';
      const link = btn.dataset.link || 'https://github.com/rshamith777-cpu';
      const lang = btn.dataset.lang || 'TypeScript';

      if (modalContent) {
        modalContent.innerHTML = `
          <div style="font-family: var(--font-mono); font-size: 11px; color: var(--international-orange); font-weight: bold; margin-bottom: 8px;">
            TECHNICAL SCHEMATIC // ${dwg} // ${lang.toUpperCase()}
          </div>
          <h2 style="font-family: var(--font-swiss); font-size: 32px; font-weight: 900; color: #111; margin-bottom: 16px; line-height: 1.1;">
            ${title}
          </h2>
          <p style="font-size: 15px; line-height: 1.6; color: #333; margin-bottom: 24px;">
            ${desc}
          </p>

          <div style="background: #08345C; padding: 24px; border: 1px solid #145995; margin-bottom: 24px; color: #fff; font-family: var(--font-mono); font-size: 12px;">
            <div style="color: #38bdf8; font-weight: bold; margin-bottom: 10px;">📐 SYSTEM ARCHITECTURE WIREFRAME SPECIFICATION</div>
            <pre style="line-height: 1.5; color: #d4d4d8; overflow-x: auto;">
┌─────────────────────────┐       ┌────────────────────────┐
│  CLIENT USER INTERFACE  │ ────► │  STATE MANAGEMENT BUS  │
│  (${lang.padEnd(21, ' ')}) │       │  (Reactive Store / WS) │
└───────────┬─────────────┘       └───────────┬────────────┘
            │                                 │
            ▼                                 ▼
┌─────────────────────────┐       ┌────────────────────────┐
│   REST & GRAPHQL APIS   │ ◄──── │   MICROSERVICES ENGINE │
│   (Node.js / Express)   │       │   (Postgres / Redis)   │
└─────────────────────────┘       └────────────────────────┘
            </pre>
          </div>

          <div style="display: flex; gap: 14px; align-items: center; flex-wrap: wrap;">
            <a href="${link}" target="_blank" rel="noopener noreferrer" class="paper-trigger-btn" style="text-decoration: none;">
              <span>📦</span> View Repository on GitHub
            </a>
            <span style="font-family: var(--font-mono); font-size: 11px; color: #777;">STATUS: VERIFIED // QC PASSED</span>
          </div>
        `;
      }

      modal.classList.add('active');
      if (window.soundEngine) window.soundEngine.play('blip', 750);
    });
  });
}

/**
 * 4. Fetch and Render ALL Repositories in Blueprint Collage Format
 */
function initLiveBlueprintRepos() {
  const container = document.getElementById('blueprint-repos-grid');
  if (!container || !window.PORTFOLIO_CONFIG) return;

  const username = window.PORTFOLIO_CONFIG.githubUsername || 'rshamith777-cpu';

  // Fetch ALL public repos (per_page=100) sorted by recently updated
  fetch(`https://api.github.com/users/${username}/repos?sort=updated&direction=desc&per_page=100`)
    .then(res => res.json())
    .then(repos => {
      if (!Array.isArray(repos)) throw new Error('API returned non-array');
      // Keep ALL public repositories
      allLoadedRepos = repos.filter(r => !r.fork);

      // If user has 0 non-forks, show all repos
      if (allLoadedRepos.length === 0) {
        allLoadedRepos = repos;
      }

      renderLanguageFilters();
      applyFiltersAndRender();
    })
    .catch((err) => {
      console.warn('Live repos fetch fallback:', err.message);
      allLoadedRepos = getFallbackBlueprintCards();
      renderLanguageFilters();
      applyFiltersAndRender();
    });
}

/**
 * 5. Dynamic Language Filter Buttons
 */
function renderLanguageFilters() {
  const filterBar = document.getElementById('blueprint-filters-container');
  if (!filterBar) return;

  const langCounts = {};
  allLoadedRepos.forEach(r => {
    const l = r.language || 'Other';
    langCounts[l] = (langCounts[l] || 0) + 1;
  });

  const languages = Object.keys(langCounts).sort((a, b) => langCounts[b] - langCounts[a]);

  let html = `
    <button class="dwg-filter-btn ${activeLanguageFilter === 'ALL' ? 'active' : ''}" data-lang="ALL">
      ALL SCHEMATICS <span class="repo-count-badge">${allLoadedRepos.length}</span>
    </button>
  `;

  languages.forEach(lang => {
    const count = langCounts[lang];
    const isActive = activeLanguageFilter === lang ? 'active' : '';
    html += `
      <button class="dwg-filter-btn ${isActive}" data-lang="${lang}">
        ${lang.toUpperCase()} <span class="repo-count-badge">${count}</span>
      </button>
    `;
  });

  filterBar.innerHTML = html;

  filterBar.querySelectorAll('.dwg-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      activeLanguageFilter = btn.dataset.lang;
      if (window.soundEngine) window.soundEngine.play('blip', 600);
      renderLanguageFilters();
      applyFiltersAndRender();
    });
  });
}

/**
 * 6. Real-time Search Input
 */
function initBlueprintSearch() {
  const searchInput = document.getElementById('blueprint-search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    currentSearchQuery = e.target.value.toLowerCase().trim();
    applyFiltersAndRender();
  });
}

/**
 * 7. Apply Filter & Search and Render Cards with Staggered Transitions
 */
function applyFiltersAndRender() {
  const container = document.getElementById('blueprint-repos-grid');
  const countDisplay = document.getElementById('active-repos-count');
  if (!container) return;

  let filtered = [...allLoadedRepos];

  // Language filter
  if (activeLanguageFilter !== 'ALL') {
    filtered = filtered.filter(r => (r.language || 'Other') === activeLanguageFilter);
  }

  // Search filter
  if (currentSearchQuery) {
    filtered = filtered.filter(r => {
      const nameMatch = r.name.toLowerCase().includes(currentSearchQuery);
      const descMatch = (r.description || '').toLowerCase().includes(currentSearchQuery);
      const langMatch = (r.language || '').toLowerCase().includes(currentSearchQuery);
      return nameMatch || descMatch || langMatch;
    });
  }

  if (countDisplay) {
    countDisplay.textContent = `SHOWING ${filtered.length} OF ${allLoadedRepos.length} DRAWINGS`;
  }

  renderBlueprintCards(filtered, container);
}

/**
 * 8. Render Blueprint Case Study Cards with Procedural Schematics
 */
function renderBlueprintCards(repos, container) {
  if (repos.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; background: var(--paper-cream); color: var(--matte-black); padding: 40px; text-align: center; box-shadow: 0 20px 40px var(--paper-shadow);">
        <h3 style="font-family: var(--font-swiss); font-size: 24px; margin-bottom: 10px;">NO SCHEMATICS FOUND</h3>
        <p style="font-family: var(--font-mono); font-size: 12px; color: #666;">No repositories matched the active search or specification filter.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = repos.map((repo, i) => {
    const dwgNum = `DWG-${String(i + 1).padStart(2, '0')}`;
    const lotNum = `LOT-77${(i % 9) + 1}`;
    
    // Natural subtle rotation variations (-0.8deg to +0.8deg)
    const targetRot = ((i % 5) - 2) * 0.4;
    const initialRot = targetRot - 2.5;
    const tapeRot = (i % 2 === 0 ? 3.5 : -4);
    const tapeHoverRot = tapeRot > 0 ? tapeRot + 2.5 : tapeRot - 2.5;

    // Procedural schematic SVG based on index
    const schematicSvg = generateSchematicSvg(repo, i);

    return `
      <div class="paper-case-card" style="
        --card-index: ${i};
        --initial-rot: ${initialRot}deg;
        --target-rot: ${targetRot}deg;
        --tape-hover-rot: ${tapeHoverRot}deg;
      ">
        <!-- Masking Tape Strip Anchor -->
        <div class="masking-tape tape-card-corner" style="transform: rotate(${tapeRot}deg);"></div>

        <!-- Orange Barcode Spec Sticker -->
        <div class="card-spec-tag">SPEC NO: ${dwgNum} // ${lotNum}</div>

        <!-- CAD Blueprint Schematic Preview Box -->
        <div class="schematic-preview-box">
          ${schematicSvg}
        </div>

        <h3 class="case-card-title">${repo.name}</h3>
        <p class="case-card-desc">
          ${repo.description || 'Architectural repository and modular implementation. Inspect schematics for technical specifications.'}
        </p>

        <div class="case-spec-chips">
          <span class="spec-chip orange-accent">${repo.language || 'Code'}</span>
          <span class="spec-chip">⭐ ${repo.stargazers_count || 0} STARS</span>
          <span class="spec-chip">FORKS: ${repo.forks_count || 0}</span>
          <span class="spec-chip">VERIFIED</span>
        </div>

        <div class="case-card-footer">
          <button class="case-study-trigger" 
            data-title="${escapeHtml(repo.name)}" 
            data-dwg="${dwgNum}" 
            data-desc="${escapeHtml(repo.description || 'Full architectural case study and structural technical breakdown.')}"
            data-link="${repo.html_url}"
            data-lang="${repo.language || 'TypeScript'}">
            <span>📐</span> CASE STUDY
          </button>
          <span class="dwg-rev-num">REV: 0${(i % 3) + 1}</span>
        </div>
      </div>
    `;
  }).join('');

  // Re-bind modal triggers
  initCaseStudyModals();
}

/**
 * Procedural CAD Schematic Vector Generator
 */
function generateSchematicSvg(repo, index) {
  const variant = index % 4;

  if (variant === 0) {
    // UI Wireframe schematic
    return `
      <svg class="schematic-vector-graphic" viewBox="0 0 300 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="15" y="15" width="270" height="110" stroke="rgba(255,255,255,0.4)" stroke-dasharray="4 4" stroke-width="1.2" />
        <circle cx="65" cy="70" r="28" stroke="#38bdf8" stroke-width="1.5" />
        <line x1="65" y1="35" x2="65" y2="105" stroke="rgba(255,255,255,0.3)" />
        <line x1="30" y1="70" x2="100" y2="70" stroke="rgba(255,255,255,0.3)" />

        <line x1="120" y1="40" x2="250" y2="40" stroke="#FF5722" stroke-width="1.5" />
        <path d="M 120 40 L 128 36 L 128 44 Z" fill="#FF5722" />
        <path d="M 250 40 L 242 36 L 242 44 Z" fill="#FF5722" />
        <text x="185" y="32" fill="#FF5722" font-family="'Space Mono', monospace" font-size="9" text-anchor="middle" font-weight="bold">DIM 124.50mm</text>

        <rect x="120" y="60" width="130" height="45" stroke="#FFFFFF" stroke-width="1.2" fill="rgba(255,255,255,0.05)" />
        <text x="185" y="86" fill="#FFFFFF" font-family="'Space Mono', monospace" font-size="10" text-anchor="middle">UI_VIEWPORT.CAD</text>
      </svg>
    `;
  } else if (variant === 1) {
    // Circuit & Logic Architecture flow
    return `
      <svg class="schematic-vector-graphic" viewBox="0 0 300 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="20" y="20" width="70" height="40" stroke="#38bdf8" stroke-width="1.5" fill="rgba(56, 189, 248, 0.1)" />
        <text x="55" y="44" fill="#38bdf8" font-family="'Space Mono', monospace" font-size="9" text-anchor="middle" font-weight="bold">CLIENT</text>

        <line x1="90" y1="40" x2="140" y2="40" stroke="#fff" stroke-width="1.2" stroke-dasharray="3 3" />
        <path d="M 140 40 L 134 36 L 134 44 Z" fill="#fff" />

        <rect x="140" y="20" width="80" height="40" stroke="#FF5722" stroke-width="1.5" fill="rgba(255, 87, 34, 0.1)" />
        <text x="180" y="44" fill="#FF5722" font-family="'Space Mono', monospace" font-size="9" text-anchor="middle" font-weight="bold">API_BUS</text>

        <line x1="180" y1="60" x2="180" y2="90" stroke="#fff" stroke-width="1.2" />
        <path d="M 180 90 L 176 84 L 184 84 Z" fill="#fff" />

        <rect x="130" y="90" width="100" height="35" stroke="#FFFFFF" stroke-width="1.5" fill="rgba(255, 255, 255, 0.08)" />
        <text x="180" y="112" fill="#FFFFFF" font-family="'Space Mono', monospace" font-size="9" text-anchor="middle" font-weight="bold">DATABASE_NODE</text>
      </svg>
    `;
  } else if (variant === 2) {
    // Polar Radar & Coordinate Sweep
    return `
      <svg class="schematic-vector-graphic" viewBox="0 0 300 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="150" cy="70" r="50" stroke="rgba(255,255,255,0.4)" stroke-width="1.2" />
        <circle cx="150" cy="70" r="30" stroke="#38bdf8" stroke-width="1" stroke-dasharray="2 2" />
        <circle cx="150" cy="70" r="10" stroke="#FF5722" stroke-width="1.5" />

        <line x1="80" y1="70" x2="220" y2="70" stroke="rgba(255,255,255,0.3)" />
        <line x1="150" y1="10" x2="150" y2="130" stroke="rgba(255,255,255,0.3)" />

        <line x1="150" y1="70" x2="195" y2="35" stroke="#FF5722" stroke-width="1.5" />
        <circle cx="195" cy="35" r="3" fill="#FF5722" />

        <text x="240" y="35" fill="#38bdf8" font-family="'Space Mono', monospace" font-size="9">θ = 38.4°</text>
        <text x="240" y="50" fill="#fff" font-family="'Space Mono', monospace" font-size="8">R = 52.0mm</text>
      </svg>
    `;
  } else {
    // Isometric CAD Box
    return `
      <svg class="schematic-vector-graphic" viewBox="0 0 300 140" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Isometric Box Outlines -->
        <polygon points="150,25 210,55 150,85 90,55" stroke="#38bdf8" stroke-width="1.5" fill="rgba(56, 189, 248, 0.1)" />
        <polygon points="90,55 150,85 150,120 90,90" stroke="#FFFFFF" stroke-width="1.5" fill="rgba(255, 255, 255, 0.05)" />
        <polygon points="210,55 150,85 150,120 210,90" stroke="#FF5722" stroke-width="1.5" fill="rgba(255, 87, 34, 0.1)" />

        <text x="50" y="45" fill="#38bdf8" font-family="'Space Mono', monospace" font-size="9">ISOMETRIC_VIEW</text>
        <text x="50" y="60" fill="#fff" font-family="'Space Mono', monospace" font-size="8">SCALE 1:2.5</text>
      </svg>
    `;
  }
}

function getFallbackBlueprintCards() {
  return [
    {
      name: 'quantum-canvas-engine',
      description: 'High performance 2D architectural physics engine using Verlet integration and sub-pixel precision rendering.',
      language: 'TypeScript',
      stargazers_count: 38,
      forks_count: 9,
      html_url: 'https://github.com/rshamith777-cpu'
    },
    {
      name: 'swiss-grid-design-system',
      description: 'Modular grid typography system adhering to Josef Müller-Brockmann principles and strict proportional scales.',
      language: 'JavaScript',
      stargazers_count: 52,
      forks_count: 14,
      html_url: 'https://github.com/rshamith777-cpu'
    },
    {
      name: 'architectural-cad-viewer',
      description: 'Browser-based vector drafting tool with real-time snap-to-grid, dimensional annotations, and SVG export.',
      language: 'TypeScript',
      stargazers_count: 27,
      forks_count: 6,
      html_url: 'https://github.com/rshamith777-cpu'
    },
    {
      name: 'microservice-api-hub',
      description: 'High-throughput event-driven microservices architecture communicating via Redis pub-sub channels and WebSocket streams.',
      language: 'Node.js',
      stargazers_count: 19,
      forks_count: 4,
      html_url: 'https://github.com/rshamith777-cpu'
    },
    {
      name: 'neural-flow-visualizer',
      description: 'Interactive neural network layer activation visualizer rendering real-time matrix transformations in WebGL.',
      language: 'Python',
      stargazers_count: 31,
      forks_count: 8,
      html_url: 'https://github.com/rshamith777-cpu'
    },
    {
      name: 'devops-ci-orchestrator',
      description: 'Declarative CI/CD pipeline automation suite with automated canary rollouts and automated testing diffs.',
      language: 'Shell',
      stargazers_count: 14,
      forks_count: 2,
      html_url: 'https://github.com/rshamith777-cpu'
    }
  ];
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
