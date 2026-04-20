(function () {
  // ── Canvas particle-network background ──────────────────────────────────
  const canvas = document.getElementById('robot-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  class Particle {
    constructor() { this.init(); }
    init() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.vx = (Math.random() - 0.5) * 0.55;
      this.vy = (Math.random() - 0.5) * 0.55;
      this.r  = Math.random() * 1.8 + 0.4;
      this.led       = Math.random() > 0.72;
      this.phase     = Math.random() * Math.PI * 2;
      this.phaseSpd  = 0.018 + Math.random() * 0.028;
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.phase += this.phaseSpd;
      if (this.x < 0 || this.x > W) this.vx *= -1;
      if (this.y < 0 || this.y > H) this.vy *= -1;
    }
    draw() {
      ctx.save();
      if (this.led) {
        const pulse = 0.5 + 0.5 * Math.sin(this.phase);
        const gr = 1.4 + pulse * 2.2;
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur  = 10 * pulse;
        ctx.beginPath();
        ctx.arc(this.x, this.y, gr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,136,${0.55 + 0.45 * pulse})`;
        ctx.fill();
      } else {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,212,255,0.75)';
        ctx.fill();
      }
      ctx.restore();
    }
  }

  function drawLines() {
    const MAX = 135;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx * dx + dy * dy);
        if (d < MAX) {
          const a = (1 - d / MAX) * 0.38;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,212,255,${a})`;
          ctx.lineWidth   = 0.55;
          ctx.stroke();
        }
      }
    }
  }

  function frame() {
    ctx.clearRect(0, 0, W, H);
    drawLines();
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(frame);
  }

  function init() {
    resize();
    const count = Math.min(90, Math.max(40, Math.floor((W * H) / 10000)));
    particles = Array.from({ length: count }, () => new Particle());
    frame();
  }

  window.addEventListener('resize', () => {
    resize();
    particles.forEach(p => { p.x = Math.random() * W; p.y = Math.random() * H; });
  });

  init();

  // ── Typing effect for hero subtitle ─────────────────────────────────────
  const typingEl = document.getElementById('typing-text');
  if (!typingEl) return;

  let phrases = ['Full-Stack Developer', 'UI/UX Designer', 'Creative Builder'];
  // Allow page-data.js to update phrases from the content API
  window._setTypingPhrases = (p) => { if (p && p.length) { phrases = p; pi = 0; ci = 0; deleting = false; } };
  let pi = 0, ci = 0, deleting = false;

  function tick() {
    const current = phrases[pi];
    if (deleting) {
      ci--;
      typingEl.textContent = current.slice(0, ci);
      if (ci === 0) {
        deleting = false;
        pi = (pi + 1) % phrases.length;
        setTimeout(tick, 380);
        return;
      }
    } else {
      ci++;
      typingEl.textContent = current.slice(0, ci);
      if (ci === current.length) {
        deleting = true;
        setTimeout(tick, 2000);
        return;
      }
    }
    setTimeout(tick, deleting ? 55 : 95);
  }
  tick();
})();
