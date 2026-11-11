/**
 * Gamification & Quest Badges Engine
 * Tracks unlockable achievements, displays celebratory toasts,
 * and maintains the trophy case modal.
 */
class AchievementEngine {
  constructor() {
    this.storageKey = 'portfolio_achievements';
    this.unlocked = new Set(JSON.parse(localStorage.getItem(this.storageKey) || '[]'));
    this.modal = document.getElementById('trophy-modal');
    this.btn = document.getElementById('trophy-btn');
    this.closeBtn = document.getElementById('close-trophy-btn');
    this.counterEl = document.getElementById('trophy-count-badge');
    this.listEl = document.getElementById('trophy-grid');

    this.allBadges = [
      { id: 'welcome', icon: '🌟', title: 'First Contact', desc: 'Visited the portfolio realm.' },
      { id: 'physics_master', icon: '🎯', title: 'Kinetic Master', desc: 'Swung the interactive hanging badge.' },
      { id: 'badge_flipper', icon: '💳', title: 'Hacker Identity', desc: 'Flipped badge to inspect VIP clearance.' },
      { id: 'git_connected', icon: '📡', title: 'GitHub Uplink', desc: 'Synchronized live repository streams.' },
      { id: 'arcade_init', icon: '🕹️', title: 'Insert Coin', desc: 'Booted up the retro arcade emulator.' },
      { id: 'bug_hunter', icon: '👾', title: 'Bug Exterminator', desc: 'Scored 300+ in Git Defender shooter.' },
      { id: 'theme_hopper', icon: '🎨', title: 'Chameleon', desc: 'Toggled custom cyberpunk aesthetics.' },
      { id: 'repo_explorer', icon: '🧭', title: 'Code Cartographer', desc: 'Filtered repositories by tech stack.' },
      { id: 'cli_hacker', icon: '💻', title: 'Terminal Root', desc: 'Discovered and executed terminal commands.' }
    ];

    this.init();
  }

  init() {
    if (this.btn) this.btn.addEventListener('click', () => this.open());
    if (this.closeBtn) this.closeBtn.addEventListener('click', () => this.close());
    this.updateCounter();

    // Unlock initial welcome badge on first load
    setTimeout(() => {
      this.unlock('welcome', 'First Contact', 'Welcome to the interactive portfolio realm!');
    }, 1200);
  }

  open() {
    if (!this.modal) return;
    this.renderGrid();
    this.modal.classList.add('active');
    if (window.soundEngine) window.soundEngine.play('coin');
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.remove('active');
  }

  unlock(id, title, desc) {
    if (this.unlocked.has(id)) return;

    this.unlocked.add(id);
    localStorage.setItem(this.storageKey, JSON.stringify(Array.from(this.unlocked)));
    this.updateCounter();

    if (window.soundEngine) window.soundEngine.play('fanfare');

    // Trigger toast
    this.showCelebration(title, desc);
  }

  updateCounter() {
    if (this.counterEl) {
      this.counterEl.textContent = `${this.unlocked.size}/${this.allBadges.length}`;
    }
  }

  showCelebration(title, desc) {
    const toast = document.createElement('div');
    toast.className = 'cyber-toast achievement-toast';
    toast.innerHTML = `
      <div class="toast-glow-bar" style="background: linear-gradient(to bottom, #fcee0a, #ff0055);"></div>
      <div class="toast-icon">🏆</div>
      <div class="toast-content">
        <div class="toast-tag">ACHIEVEMENT UNLOCKED</div>
        <div class="toast-title">${title}</div>
        <div class="toast-msg">${desc}</div>
      </div>
    `;

    const container = document.getElementById('toast-container');
    if (container) {
      container.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 400);
      }, 5000);
    }
  }

  renderGrid() {
    if (!this.listEl) return;
    this.listEl.innerHTML = this.allBadges.map(b => {
      const isUnlocked = this.unlocked.has(b.id);
      return `
        <div class="trophy-card glass-panel ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="trophy-icon">${isUnlocked ? b.icon : '🔒'}</div>
          <div class="trophy-info">
            <h4 class="trophy-title">${b.title}</h4>
            <p class="trophy-desc">${b.desc}</p>
            <span class="trophy-status">${isUnlocked ? '✓ UNLOCKED' : 'LOCKED'}</span>
          </div>
        </div>
      `;
    }).join('');
  }
}

window.achievements = new AchievementEngine();
