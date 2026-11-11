/**
 * Interactive Physics Hanging Badge
 * Simulates a realistic pendulum lanyard with rope tension, spring elasticity,
 * mouse dragging, momentum release, 3D holographic foil tilt, and card flipping.
 */
class HangingBadge {
  constructor() {
    this.container = document.getElementById('badge-interactive-container');
    this.badgeEl = document.getElementById('hanging-badge');
    this.lanyardCanvas = document.getElementById('lanyard-canvas');
    this.flipBtn = document.getElementById('flip-badge-btn');
    this.shineEl = document.getElementById('badge-shine');

    if (!this.badgeEl || !this.lanyardCanvas) return;

    this.ctx = this.lanyardCanvas.getContext('2d');

    // Physics parameters
    this.anchorX = 0;
    this.anchorY = 0;
    this.ropeLength = 170;
    this.angle = 0.05; // slight initial tilt
    this.angularVelocity = 0;
    this.angularAcceleration = 0;
    this.damping = 0.985;
    this.gravity = 0.45;

    // Badge position offset
    this.badgeWidth = 280;
    this.badgeHeight = 420;
    this.currentX = 0;
    this.currentY = 0;
    this.cardTiltX = 0;
    this.cardTiltY = 0;
    this.isFlipped = false;

    // Interaction state
    this.isDragging = false;
    this.dragStartX = 0;
    this.dragStartY = 0;
    this.lastPointerX = 0;
    this.lastPointerY = 0;
    this.velocityTrack = [];
    this.swingCount = 0;
    this.lastSwingDir = 0;

    this.init();
  }

  init() {
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.bindEvents();
    this.animate();

    // Trigger initial welcoming nudge after load
    setTimeout(() => {
      this.angularVelocity = 0.08;
      if (window.soundEngine) window.soundEngine.play('swing');
    }, 600);
  }

  resizeCanvas() {
    const rect = this.container.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.lanyardCanvas.width = this.width;
    this.lanyardCanvas.height = this.height;

    // Anchor is at top-center of container
    this.anchorX = this.width / 2;
    this.anchorY = 15;
    this.ropeLength = Math.min(180, this.height * 0.32);
  }

  bindEvents() {
    // Pointer down (Mouse + Touch)
    const onStart = (clientX, clientY) => {
      this.isDragging = true;
      this.dragStartX = clientX;
      this.dragStartY = clientY;
      this.lastPointerX = clientX;
      this.lastPointerY = clientY;
      this.velocityTrack = [];
      if (window.soundEngine) window.soundEngine.play('hover', 500);
    };

    this.badgeEl.addEventListener('mousedown', (e) => {
      if (e.target.closest('#flip-badge-btn') || e.target.closest('a')) return;
      onStart(e.clientX, e.clientY);
      e.preventDefault();
    });

    this.badgeEl.addEventListener('touchstart', (e) => {
      if (e.target.closest('#flip-badge-btn') || e.target.closest('a')) return;
      const t = e.touches[0];
      onStart(t.clientX, t.clientY);
    }, { passive: true });

    // Pointer move
    const onMove = (clientX, clientY) => {
      // 3D holographic tilt based on cursor over badge
      const rect = this.badgeEl.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const normX = (clientX - centerX) / (rect.width / 2);
      const normY = (clientY - centerY) / (rect.height / 2);

      this.cardTiltX = -normY * 18;
      this.cardTiltY = normX * 18;

      // Update holographic foil sheen
      if (this.shineEl) {
        const shineX = (normX + 1) * 50;
        const shineY = (normY + 1) * 50;
        this.shineEl.style.background = `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.45) 0%, rgba(0,243,255,0.18) 35%, rgba(255,0,128,0.12) 65%, transparent 80%)`;
      }

      if (this.isDragging) {
        const deltaX = clientX - this.anchorX;
        const deltaY = clientY - this.anchorY;

        // Angle relative to vertical
        this.angle = Math.atan2(deltaX, Math.max(deltaY, 30));
        // Clamp angle so it doesn't flip crazy
        this.angle = Math.max(-1.3, Math.min(1.3, this.angle));

        this.angularVelocity = 0;

        // Track drag velocity
        this.velocityTrack.push({
          vx: clientX - this.lastPointerX,
          vy: clientY - this.lastPointerY,
          time: performance.now()
        });
        if (this.velocityTrack.length > 5) this.velocityTrack.shift();

        this.lastPointerX = clientX;
        this.lastPointerY = clientY;
      }
    };

    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('touchmove', (e) => {
      if (this.isDragging) {
        const t = e.touches[0];
        onMove(t.clientX, t.clientY);
      }
    }, { passive: true });

    // Pointer release
    const onEnd = () => {
      if (!this.isDragging) return;
      this.isDragging = false;

      // Calculate release flick impulse
      if (this.velocityTrack.length > 1) {
        const latest = this.velocityTrack[this.velocityTrack.length - 1];
        const oldest = this.velocityTrack[0];
        const dt = (latest.time - oldest.time) || 16;
        const flickVx = (latest.vx / dt) * 1.5;

        this.angularVelocity = Math.max(-0.25, Math.min(0.25, flickVx * 0.04));
      }

      if (Math.abs(this.angularVelocity) > 0.05 && window.soundEngine) {
        window.soundEngine.play('swing');
      }
    };

    window.addEventListener('mouseup', onEnd);
    window.addEventListener('touchend', onEnd);

    // Flip card button
    if (this.flipBtn) {
      this.flipBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFlip();
      });
    }

    // Double click to flip
    this.badgeEl.addEventListener('dblclick', () => this.toggleFlip());

    // Nudge badge on hover
    this.badgeEl.addEventListener('mouseenter', () => {
      if (!this.isDragging && Math.abs(this.angularVelocity) < 0.01) {
        this.angularVelocity += (Math.random() > 0.5 ? 0.015 : -0.015);
      }
    });
  }

  toggleFlip() {
    this.isFlipped = !this.isFlipped;
    this.badgeEl.classList.toggle('flipped', this.isFlipped);
    if (window.soundEngine) window.soundEngine.play('blip', 750);

    // Track achievement
    if (window.achievements) {
      window.achievements.unlock('badge_flipper', 'Hacker Identity', 'Flipped your VIP clearance badge to view secret credentials!');
    }
  }

  updatePhysics() {
    if (!this.isDragging) {
      // Pendulum equation: alpha = -(g / L) * sin(theta) - damping * omega
      const restoringForce = -(this.gravity / (this.ropeLength * 0.1)) * Math.sin(this.angle);
      this.angularAcceleration = restoringForce;
      this.angularVelocity += this.angularAcceleration;
      this.angularVelocity *= this.damping;
      this.angle += this.angularVelocity;

      // Count swings for achievement
      const dir = Math.sign(this.angularVelocity);
      if (dir !== 0 && dir !== this.lastSwingDir && Math.abs(this.angularVelocity) > 0.02) {
        this.lastSwingDir = dir;
        this.swingCount++;
        if (this.swingCount >= 8 && window.achievements) {
          window.achievements.unlock('physics_master', 'Kinetic Master', 'Swung your interactive badge like a true cyber champ!');
        }
      }

      // Smooth reset tilt when not hovered
      this.cardTiltX *= 0.94;
      this.cardTiltY *= 0.94;
    }

    // Attachment point at bottom of rope (clip position)
    this.clipX = this.anchorX + Math.sin(this.angle) * this.ropeLength;
    this.clipY = this.anchorY + Math.cos(this.angle) * this.ropeLength;

    // Badge top-center hangs from clipX, clipY
    this.currentX = this.clipX;
    this.currentY = this.clipY;
  }

  drawLanyard() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // 1. Draw top lanyard mount / ceiling clamp
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(this.anchorX - 24, 0, 48, 14, [0, 0, 6, 6]);
    ctx.fill();
    ctx.stroke();

    // Metallic clip hole
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(this.anchorX, 8, 4, 0, Math.PI * 2);
    ctx.fill();

    // 2. Draw woven lanyard strap
    const strapWidth = 14;
    const dx = this.clipX - this.anchorX;
    const dy = this.clipY - this.anchorY;
    const dist = Math.hypot(dx, dy);
    const perpX = (-dy / dist) * (strapWidth / 2);
    const perpY = (dx / dist) * (strapWidth / 2);

    // Left edge and right edge of strap
    ctx.beginPath();
    ctx.moveTo(this.anchorX + perpX, this.anchorY + perpY);
    ctx.lineTo(this.clipX + perpX, this.clipY + perpY);
    ctx.lineTo(this.clipX - perpX, this.clipY - perpY);
    ctx.lineTo(this.anchorX - perpX, this.anchorY - perpY);
    ctx.closePath();

    // Cyberpunk gradient strap
    const strapGrad = ctx.createLinearGradient(this.anchorX, this.anchorY, this.clipX, this.clipY);
    strapGrad.addColorStop(0, '#0f172a');
    strapGrad.addColorStop(0.5, '#1e1b4b');
    strapGrad.addColorStop(1, '#0284c7');
    ctx.fillStyle = strapGrad;
    ctx.fill();

    // Cyber neon edge stitching
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(this.anchorX + perpX, this.anchorY + perpY);
    ctx.lineTo(this.clipX + perpX, this.clipY + perpY);
    ctx.moveTo(this.anchorX - perpX, this.anchorY - perpY);
    ctx.lineTo(this.clipX - perpX, this.clipY - perpY);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Draw metal swivel hook / lobster claw clip connecting to card
    ctx.fillStyle = '#94a3b8';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(this.clipX, this.clipY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.fillRect(this.clipX - 4, this.clipY, 8, 12);

    ctx.restore();
  }

  updateBadgeTransform() {
    // Angular rotation in degrees
    const swingDeg = (this.angle * 180) / Math.PI;

    // Combine pendulum swing with 3D cursor tilt
    const flipRotate = this.isFlipped ? 180 : 0;
    
    // Position badge so its top-center is at (this.currentX, this.currentY + 10)
    this.badgeEl.style.transform = `
      translate3d(${this.currentX}px, ${this.currentY + 10}px, 0)
      rotate(${swingDeg}deg)
      perspective(1000px)
      rotateX(${this.cardTiltX}deg)
      rotateY(${this.cardTiltY + flipRotate}deg)
    `;
  }

  animate() {
    this.updatePhysics();
    this.drawLanyard();
    this.updateBadgeTransform();
    requestAnimationFrame(() => this.animate());
  }
}

window.HangingBadge = HangingBadge;
