/**
 * Blueprint Collage & Swiss Grid Controller
 * Handles live CAD coordinate tracking, interactive compass angle calculation,
 * case study schematic inspection modal, and dynamic paper card tape effects.
 */

document.addEventListener('DOMContentLoaded', () => {
  initCoordinateTracker();
  initCompassTracker();
  initCaseStudyModals();
  initLiveBlueprintRepos();
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

      if (modalContent) {
        modalContent.innerHTML = `
          <div style="font-family: var(--font-mono); font-size: 11px; color: var(--international-orange); font-weight: bold; margin-bottom: 8px;">
            TECHNICAL SCHEMATIC // ${dwg}
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
│  (React / Canvas / TS)  │       │  (Reactive Store / WS) │
└───────────┬─────────────┘       └───────────┬────────────┘
            │                                 │
            ▼                                 ▼
┌─────────────────────────┐       ┌────────────────────────┐
│   REST & GRAPHQL APIS   │ ◄──── │   MICROSERVICES ENGINE │
│   (Node.js / Express)   │       │   (Postgres / Redis)   │
└─────────────────────────┘       └────────────────────────┘
            </pre>
          </div>

          <div style="display: flex; gap: 14px; align-items: center;">
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
 * 4. Render Live Repositories in Blueprint Collage Format
 */
function initLiveBlueprintRepos() {
  const container = document.getElementById('blueprint-repos-grid');
  if (!container || !window.PORTFOLIO_CONFIG) return;

  const username = window.PORTFOLIO_CONFIG.githubUsername || 'rshamith777-cpu';

  // Fetch live repos from GitHub API
  fetch(`https://api.github.com/users/${username}/repos?sort=updated&direction=desc&per_page=9`)
    .then(res => res.json())
    .then(repos => {
      if (!Array.isArray(repos)) return;
      const publicRepos = repos.filter(r => !r.fork).slice(0, 6);
      renderBlueprintCards(publicRepos, container);
    })
    .catch(() => {
      // Fallback if rate limited or offline
      renderBlueprintCards(getFallbackBlueprintCards(), container);
    });
}

function renderBlueprintCards(repos, container) {
  if (repos.length === 0) return;

  container.innerHTML = repos.map((repo, i) => {
    const dwgNum = `DWG-${String(i + 1).padStart(2, '0')}`;
    const lotNum = `LOT-77${i + 1}`;
    const tapeRot = (i % 2 === 0 ? 3 : -4);

    return `
      <div class="paper-case-card">
        <!-- Masking Tape Strip Anchor -->
        <div class="masking-tape tape-card-corner" style="transform: rotate(${tapeRot}deg);"></div>

        <!-- Orange Barcode Spec Sticker -->
        <div class="card-spec-tag">SPEC NO: ${dwgNum} // ${lotNum}</div>

        <!-- CAD Blueprint Schematic Preview Box -->
        <div class="schematic-preview-box">
          <svg class="schematic-vector-graphic" viewBox="0 0 300 140" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="15" y="15" width="270" height="110" stroke="rgba(255,255,255,0.4)" stroke-dasharray="4 4" stroke-width="1.2" />
            <circle cx="65" cy="70" r="28" stroke="#38bdf8" stroke-width="1.5" />
            <line x1="65" y1="35" x2="65" y2="105" stroke="rgba(255,255,255,0.3)" />
            <line x1="30" y1="70" x2="100" y2="70" stroke="rgba(255,255,255,0.3)" />

            <!-- Dimension callout -->
            <line x1="120" y1="40" x2="250" y2="40" stroke="#FF5722" stroke-width="1.5" />
            <path d="M 120 40 L 128 36 L 128 44 Z" fill="#FF5722" />
            <path d="M 250 40 L 242 36 L 242 44 Z" fill="#FF5722" />
            <text x="185" y="32" fill="#FF5722" font-family="'Space Mono', monospace" font-size="9" text-anchor="middle" font-weight="bold">DIM 124.50mm</text>

            <rect x="120" y="60" width="130" height="45" stroke="#FFFFFF" stroke-width="1.2" fill="rgba(255,255,255,0.05)" />
            <text x="185" y="86" fill="#FFFFFF" font-family="'Space Mono', monospace" font-size="10" text-anchor="middle">UI_MOCKUP.CAD</text>
          </svg>
        </div>

        <h3 class="case-card-title">${repo.name}</h3>
        <p class="case-card-desc">
          ${repo.description || 'Architectural web system & modular implementation. Click Case Study to inspect schematics and technical specs.'}
        </p>

        <div class="case-spec-chips">
          <span class="spec-chip orange-accent">${repo.language || 'TypeScript'}</span>
          <span class="spec-chip">⭐ ${repo.stargazers_count || 0} STARS</span>
          <span class="spec-chip">FORKS: ${repo.forks_count || 0}</span>
          <span class="spec-chip">ACTIVE</span>
        </div>

        <div class="case-card-footer">
          <button class="case-study-trigger" 
            data-title="${repo.name}" 
            data-dwg="${dwgNum}" 
            data-desc="${repo.description || 'Full architectural case study and structural technical breakdown.'}"
            data-link="${repo.html_url}">
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
    }
  ];
}
