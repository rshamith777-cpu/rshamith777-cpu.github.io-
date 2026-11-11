/**
 * Retro Arcade Mini-Game: "Git Defender / Bug Blaster"
 * 2D Canvas space shooter where players blast bugs, catch git stars,
 * unlock secret badges, and climb the high score ladder!
 */
class ArcadeGame {
  constructor() {
    this.canvas = document.getElementById('arcade-canvas');
    this.modal = document.getElementById('arcade-modal');
    this.openBtn = document.getElementById('open-arcade-btn');
    this.closeBtn = document.getElementById('close-arcade-btn');
    this.scoreEl = document.getElementById('arcade-score');
    this.highScoreEl = document.getElementById('arcade-high-score');
    this.restartBtn = document.getElementById('arcade-restart-btn');

    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // High Score
    this.highScore = parseInt(localStorage.getItem('arcade_highscore') || '0', 10);
    if (this.highScoreEl) this.highScoreEl.textContent = this.highScore;

    // Game state
    this.running = false;
    this.score = 0;
    this.lives = 3;
    this.gameOver = false;
    this.keys = {};

    // Entities
    this.player = null;
    this.lasers = [];
    this.enemies = [];
    this.particles = [];
    this.stars = [];
    this.spawnTimer = 0;
    this.lastFrameTime = 0;

    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    if (this.openBtn) {
      this.openBtn.addEventListener('click', () => this.open());
    }

    if (this.closeBtn) {
      this.closeBtn.addEventListener('click', () => this.close());
    }

    if (this.restartBtn) {
      this.restartBtn.addEventListener('click', () => this.restart());
    }

    // Input handlers
    window.addEventListener('keydown', (e) => {
      if (!this.running) return;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' ', 'KeyA', 'KeyD', 'KeyW', 'KeyS'].includes(e.code)) {
        this.keys[e.code] = true;
        if (e.code === ' ' || e.code === 'Space') {
          this.shootLaser();
          e.preventDefault();
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (!this.running) return;
      this.keys[e.code] = false;
    });

    // Touch / Pointer controls on canvas for mobile
    let isTouchDown = false;
    this.canvas.addEventListener('pointerdown', (e) => {
      if (!this.running || this.gameOver) return;
      isTouchDown = true;
      this.movePlayerTo(e.offsetX);
      this.shootLaser();
    });

    this.canvas.addEventListener('pointermove', (e) => {
      if (!this.running || !isTouchDown || this.gameOver) return;
      this.movePlayerTo(e.offsetX);
    });

    this.canvas.addEventListener('pointerup', () => {
      isTouchDown = false;
    });
  }

  resizeCanvas() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    const w = Math.min(680, parent.clientWidth - 20);
    const h = 420;
    this.canvas.width = w;
    this.canvas.height = h;

    if (this.player) {
      this.player.y = this.canvas.height - 40;
    }
  }

  open() {
    if (!this.modal) return;
    this.modal.classList.add('active');
    this.resizeCanvas();
    this.restart();
    if (window.soundEngine) window.soundEngine.play('coin');

    if (window.achievements) {
      window.achievements.unlock('arcade_init', 'Insert Coin', 'Fired up the retro arcade console!');
    }
  }

  close() {
    if (!this.modal) return;
    this.modal.classList.remove('active');
    this.running = false;
  }

  restart() {
    this.score = 0;
    this.lives = 3;
    this.gameOver = false;
    this.lasers = [];
    this.enemies = [];
    this.particles = [];
    this.stars = [];
    this.spawnTimer = 0;

    this.player = {
      x: this.canvas.width / 2,
      y: this.canvas.height - 40,
      width: 32,
      height: 24,
      speed: 6,
      lastShoot: 0
    };

    if (this.scoreEl) this.scoreEl.textContent = '0';
    if (this.restartBtn) this.restartBtn.style.display = 'none';

    this.running = true;
    this.lastFrameTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  movePlayerTo(x) {
    if (!this.player) return;
    this.player.x = Math.max(this.player.width / 2, Math.min(this.canvas.width - this.player.width / 2, x));
  }

  shootLaser() {
    const now = performance.now();
    if (now - this.player.lastShoot < 180) return; // Fire rate limit
    this.player.lastShoot = now;

    // Double lasers
    this.lasers.push({
      x: this.player.x - 10,
      y: this.player.y - 12,
      speed: 10,
      width: 4,
      height: 14
    });
    this.lasers.push({
      x: this.player.x + 10,
      y: this.player.y - 12,
      speed: 10,
      width: 4,
      height: 14
    });

    if (window.soundEngine) window.soundEngine.play('laser');
  }

  spawnEnemy() {
    const types = [
      { label: 'BUG', color: '#ff0055', points: 15, hp: 1, speed: 2.2 },
      { label: '404', color: '#fcee0a', points: 25, hp: 1, speed: 2.8 },
      { label: 'MERGE', color: '#bd00ff', points: 50, hp: 2, speed: 1.6 }
    ];
    const chosen = types[Math.floor(Math.random() * types.length)];

    this.enemies.push({
      x: 30 + Math.random() * (this.canvas.width - 60),
      y: -20,
      width: 32,
      height: 24,
      ...chosen
    });

    // Occasional Git Star pickup
    if (Math.random() < 0.25) {
      this.stars.push({
        x: 30 + Math.random() * (this.canvas.width - 60),
        y: -15,
        radius: 8,
        speed: 2.0
      });
    }
  }

  createExplosion(x, y, color) {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.2;
      const speed = 1.5 + Math.random() * 3.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color || '#00f3ff',
        life: 1.0,
        decay: 0.03 + Math.random() * 0.03
      });
    }
  }

  update() {
    if (!this.running || this.gameOver) return;

    // Move player
    if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
      this.player.x = Math.max(this.player.width / 2, this.player.x - this.player.speed);
    }
    if (this.keys['ArrowRight'] || this.keys['KeyD']) {
      this.player.x = Math.min(this.canvas.width - this.player.width / 2, this.player.x + this.player.speed);
    }

    // Auto-fire if space is held
    if (this.keys[' '] || this.keys['Space']) {
      this.shootLaser();
    }

    // Spawn enemies
    this.spawnTimer++;
    if (this.spawnTimer > 45) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    // Update lasers
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const l = this.lasers[i];
      l.y -= l.speed;
      if (l.y < -20) {
        this.lasers.splice(i, 1);
      }
    }

    // Update stars
    for (let i = this.stars.length - 1; i >= 0; i--) {
      const s = this.stars[i];
      s.y += s.speed;

      // Check collision with player
      const dist = Math.hypot(s.x - this.player.x, s.y - this.player.y);
      if (dist < s.radius + this.player.width / 2) {
        this.score += 50;
        this.createExplosion(s.x, s.y, '#fcee0a');
        if (window.soundEngine) window.soundEngine.play('coin');
        this.stars.splice(i, 1);
        if (this.scoreEl) this.scoreEl.textContent = this.score;
        continue;
      }

      if (s.y > this.canvas.height + 20) {
        this.stars.splice(i, 1);
      }
    }

    // Update enemies & collision
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.y += e.speed;

      // Laser collision
      for (let j = this.lasers.length - 1; j >= 0; j--) {
        const l = this.lasers[j];
        if (
          l.x > e.x - e.width / 2 &&
          l.x < e.x + e.width / 2 &&
          l.y > e.y - e.height / 2 &&
          l.y < e.y + e.height / 2
        ) {
          this.lasers.splice(j, 1);
          e.hp--;
          if (e.hp <= 0) {
            this.createExplosion(e.x, e.y, e.color);
            if (window.soundEngine) window.soundEngine.play('explosion');
            this.score += e.points;
            if (this.scoreEl) this.scoreEl.textContent = this.score;
            this.enemies.splice(i, 1);

            // Check Achievements
            if (this.score >= 300 && window.achievements) {
              window.achievements.unlock('bug_hunter', 'Bug Exterminator', 'Scored over 300 points in Git Defender arcade!');
            }
            break;
          }
        }
      }

      // Player collision
      if (
        e.y + e.height / 2 > this.player.y - this.player.height / 2 &&
        Math.abs(e.x - this.player.x) < (e.width + this.player.width) / 2
      ) {
        this.createExplosion(this.player.x, this.player.y, '#ff0055');
        if (window.soundEngine) window.soundEngine.play('explosion');
        this.enemies.splice(i, 1);
        this.lives--;

        if (this.lives <= 0) {
          this.endGame();
        }
        break;
      }

      // Past bottom
      if (e.y > this.canvas.height + 30) {
        this.enemies.splice(i, 1);
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Check High Score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('arcade_highscore', this.highScore.toString());
      if (this.highScoreEl) this.highScoreEl.textContent = this.highScore;
    }
  }

  endGame() {
    this.gameOver = true;
    if (this.restartBtn) this.restartBtn.style.display = 'inline-block';
    if (window.soundEngine) window.soundEngine.play('blip', 150);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Starfield background grid
    ctx.strokeStyle = 'rgba(0, 243, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.canvas.width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.canvas.height);
      ctx.stroke();
    }

    // Draw Lasers
    ctx.fillStyle = '#00f3ff';
    ctx.shadowColor = '#00f3ff';
    ctx.shadowBlur = 10;
    this.lasers.forEach(l => {
      ctx.fillRect(l.x - l.width / 2, l.y, l.width, l.height);
    });
    ctx.shadowBlur = 0;

    // Draw Collectible Stars
    this.stars.forEach(s => {
      ctx.fillStyle = '#fcee0a';
      ctx.shadowColor = '#fcee0a';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = '10px monospace';
      ctx.fillStyle = '#000';
      ctx.textAlign = 'center';
      ctx.fillText('★', s.x, s.y + 3);
    });
    ctx.shadowBlur = 0;

    // Draw Enemies
    this.enemies.forEach(e => {
      ctx.fillStyle = e.color;
      ctx.shadowColor = e.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(e.x - e.width / 2, e.y - e.height / 2, e.width, e.height, 4);
      ctx.fill();

      // Enemy label
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(e.label, e.x, e.y + 3);
    });
    ctx.shadowBlur = 0;

    // Draw Particles
    this.particles.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillRect(p.x, p.y, 3, 3);
    });
    ctx.globalAlpha = 1.0;

    // Draw Player Ship
    if (this.player && !this.gameOver) {
      ctx.save();
      ctx.translate(this.player.x, this.player.y);

      // Ship body
      ctx.fillStyle = '#00f3ff';
      ctx.shadowColor = '#00f3ff';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(16, 12);
      ctx.lineTo(0, 6);
      ctx.lineTo(-16, 12);
      ctx.closePath();
      ctx.fill();

      // Thruster flame
      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.moveTo(-6, 8);
      ctx.lineTo(0, 18 + Math.random() * 6);
      ctx.lineTo(6, 8);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    // Draw Lives HUD
    ctx.fillStyle = '#ff0055';
    ctx.font = '12px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('❤️ '.repeat(Math.max(0, this.lives)), 12, 22);

    // Game Over Overlay
    if (this.gameOver) {
      ctx.fillStyle = 'rgba(10, 11, 16, 0.85)';
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

      ctx.fillStyle = '#ff0055';
      ctx.font = 'bold 26px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SYSTEM OVERLOAD: GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);

      ctx.fillStyle = '#00f3ff';
      ctx.font = '14px monospace';
      ctx.fillText(`FINAL SCORE: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 15);
      ctx.fillText(`HIGH SCORE: ${this.highScore}`, this.canvas.width / 2, this.canvas.height / 2 + 38);
    }
  }

  loop(timestamp) {
    if (!this.running) return;
    this.update();
    this.draw();
    requestAnimationFrame((t) => this.loop(t));
  }
}

window.ArcadeGame = ArcadeGame;

