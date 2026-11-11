/**
 * Main Application Controller
 * Handles Theme Switching, Interactive Terminal, Skill Tree,
 * Particles Background, and System Initializations.
 */
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Sound Toggle
  const soundBtn = document.getElementById('sound-toggle-btn');
  const soundIcon = document.getElementById('sound-toggle-icon');

  function updateSoundUI() {
    if (!soundIcon) return;
    const isMuted = !window.soundEngine.enabled;
    soundIcon.textContent = isMuted ? '🔇' : '🔊';
    soundBtn.title = isMuted ? 'Sound FX: OFF' : 'Sound FX: ON';
  }

  if (soundBtn) {
    updateSoundUI();
    soundBtn.addEventListener('click', () => {
      const nowEnabled = window.soundEngine.toggle();
      updateSoundUI();
    });
  }

  // 2. Initialize Themes
  const themeSelect = document.getElementById('theme-switcher-select');
  const currentTheme = localStorage.getItem('portfolio_theme') || 'cyberpunk';
  document.documentElement.setAttribute('data-theme', currentTheme);

  if (themeSelect) {
    themeSelect.value = currentTheme;
    themeSelect.addEventListener('change', (e) => {
      const newTheme = e.target.value;
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('portfolio_theme', newTheme);
      if (window.soundEngine) window.soundEngine.play('blip', 720);

      if (window.achievements) {
        window.achievements.unlock('theme_hopper', 'Chameleon', 'Customized the portfolio aesthetics theme!');
      }
    });
  }

  // 3. Render Skill Tree
  renderSkills();

  // 4. Initialize Interactive Hacker Terminal
  initTerminal();

  // 5. Initialize Background Particle Canvas
  initParticles();

  // 6. Initialize Hanging Badge & GitHub API Engine
  if (window.HangingBadge) {
    window.badgeInstance = new window.HangingBadge();
  }

  if (window.GitHubEngine) {
    window.githubInstance = new window.GitHubEngine(window.PORTFOLIO_CONFIG);
    window.githubInstance.init();
  }

  if (window.ArcadeGame) {
    window.arcadeInstance = new window.ArcadeGame();
  }

  // 7. Attach sound effects to interactive buttons
  document.querySelectorAll('button, .nav-link, a.action-btn').forEach(btn => {
    btn.addEventListener('mouseenter', () => {
      if (window.soundEngine) window.soundEngine.play('hover', 360);
    });
  });
});

/**
 * Render Skill Tree Bars from CONFIG
 */
function renderSkills() {
  const container = document.getElementById('skills-grid');
  if (!container || !window.PORTFOLIO_CONFIG) return;

  const skills = window.PORTFOLIO_CONFIG.skills || [];
  container.innerHTML = skills.map(skill => `
    <div class="skill-card glass-panel">
      <div class="skill-header">
        <span class="skill-icon-name">
          <span class="skill-icon">${skill.icon}</span>
          <span class="skill-name">${skill.name}</span>
        </span>
        <span class="skill-level-badge">LVL. ${skill.level}%</span>
      </div>
      <div class="skill-bar-track">
        <div class="skill-bar-fill" style="width: ${skill.level}%"></div>
      </div>
    </div>
  `).join('');
}

/**
 * Interactive Hacker Terminal
 */
function initTerminal() {
  const terminalModal = document.getElementById('terminal-modal');
  const openBtn = document.getElementById('open-terminal-btn');
  const closeBtn = document.getElementById('close-terminal-btn');
  const inputEl = document.getElementById('terminal-input');
  const outputEl = document.getElementById('terminal-output');

  if (!terminalModal || !inputEl || !outputEl) return;

  function openTerm() {
    terminalModal.classList.add('active');
    inputEl.focus();
    if (window.soundEngine) window.soundEngine.play('blip', 650);
  }

  function closeTerm() {
    terminalModal.classList.remove('active');
  }

  if (openBtn) openBtn.addEventListener('click', openTerm);
  if (closeBtn) closeBtn.addEventListener('click', closeTerm);

  // Keyboard shortcut `~`
  window.addEventListener('keydown', (e) => {
    if (e.key === '`' || e.key === '~') {
      if (!terminalModal.classList.contains('active')) {
        openTerm();
        e.preventDefault();
      } else {
        closeTerm();
      }
    }
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const cmd = inputEl.value.trim();
      inputEl.value = '';
      executeCommand(cmd);
    }
  });

  function printLine(text, className = '') {
    const line = document.createElement('div');
    line.className = `term-line ${className}`;
    line.innerHTML = text;
    outputEl.appendChild(line);
    outputEl.scrollTop = outputEl.scrollHeight;
  }

  function executeCommand(cmdStr) {
    printLine(`<span class="term-prompt">user@git-portfolio:~$</span> ${escapeHtml(cmdStr)}`);
    if (!cmdStr) return;

    const parts = cmdStr.split(' ');
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    if (window.soundEngine) window.soundEngine.play('click');

    switch (cmd) {
      case 'help':
        printLine('Available Terminal Commands:');
        printLine('  <span class="cmd-hl">help</span>        - Show this manual page');
        printLine('  <span class="cmd-hl">repos</span>       - List cached public repositories');
        printLine('  <span class="cmd-hl">skills</span>      - Display current tech stack power levels');
        printLine('  <span class="cmd-hl">theme &lt;name&gt;</span> - Switch theme: cyberpunk | synthwave | matrix | nebula');
        printLine('  <span class="cmd-hl">user &lt;name&gt;</span>  - Live inspect any GitHub user account');
        printLine('  <span class="cmd-hl">play</span>        - Launch Git Defender arcade shooter');
        printLine('  <span class="cmd-hl">clear</span>       - Clear terminal window');
        break;

      case 'repos':
        if (window.githubInstance && window.githubInstance.repos) {
          printLine(`Loaded ${window.githubInstance.repos.length} live repositories:`);
          window.githubInstance.repos.slice(0, 10).forEach(r => {
            printLine(`  • <strong>${r.name}</strong> (${r.language || 'Code'}) - ⭐ ${r.stargazers_count}`);
          });
          if (window.githubInstance.repos.length > 10) {
            printLine(`  ...and ${window.githubInstance.repos.length - 10} more on GitHub.`);
          }
        } else {
          printLine('Repositories still synchronizing...');
        }
        break;

      case 'skills':
        (window.PORTFOLIO_CONFIG.skills || []).forEach(s => {
          printLine(`  ${s.icon} ${s.name.padEnd(20, '.')} [${'#'.repeat(Math.floor(s.level / 10)).padEnd(10, ' ')}] ${s.level}%`);
        });
        break;

      case 'theme':
        const validThemes = ['cyberpunk', 'synthwave', 'matrix', 'nebula'];
        if (validThemes.includes(arg.toLowerCase())) {
          document.documentElement.setAttribute('data-theme', arg.toLowerCase());
          localStorage.setItem('portfolio_theme', arg.toLowerCase());
          const sel = document.getElementById('theme-switcher-select');
          if (sel) sel.value = arg.toLowerCase();
          printLine(`Theme switched to: <strong style="color:var(--neon-accent)">${arg}</strong>`);
        } else {
          printLine(`Unknown theme. Choose from: ${validThemes.join(', ')}`, 'term-error');
        }
        break;

      case 'user':
        if (!arg) {
          printLine('Usage: user <github_username>', 'term-error');
        } else {
          printLine(`Connecting to GitHub profile @${arg}...`);
          window.PORTFOLIO_CONFIG.githubUsername = arg;
          window.githubInstance.username = arg;
          window.githubInstance.fetchData(true);
        }
        break;

      case 'play':
        closeTerm();
        if (window.arcadeInstance) window.arcadeInstance.open();
        break;

      case 'clear':
        outputEl.innerHTML = '';
        break;

      default:
        printLine(`Command not found: "${cmd}". Type <span class="cmd-hl">help</span> for command list.`, 'term-error');
    }

    if (window.achievements) {
      window.achievements.unlock('cli_hacker', 'Terminal Root', 'Executed hacker CLI commands in developer terminal!');
    }
  }
}

/**
 * Ambient Particles Canvas
 */
function initParticles() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const particleCount = 45;
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 1 + Math.random() * 2,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      alpha: 0.15 + Math.random() * 0.4
    });
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--neon-cyan').trim() || '#00f3ff';

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      ctx.fillStyle = accentColor;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.globalAlpha = 1.0;
    requestAnimationFrame(render);
  }

  render();
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
