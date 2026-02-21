// Navigation toggle
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle) toggle.addEventListener('click', () => links.classList.toggle('open'));

  // Close mobile menu on link click
  document.querySelectorAll('.nav-links a').forEach(a => {
    a.addEventListener('click', () => links.classList.remove('open'));
  });

  // Active nav on scroll
  const sections = document.querySelectorAll('.section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(s => {
      if (window.scrollY >= s.offsetTop - 120) current = s.id;
    });
    navLinks.forEach(a => {
      a.classList.remove('active');
      if (a.getAttribute('href') === '#' + current) a.classList.add('active');
    });
  });

  // Scroll reveal
  const reveals = document.querySelectorAll('.reveal');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
  reveals.forEach(el => observer.observe(el));

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.tab-group');
      group.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      group.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      group.querySelector(`#${btn.dataset.tab}`).classList.add('active');
    });
  });

  // Counter animation
  const counters = document.querySelectorAll('[data-count]');
  const counterObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const el = e.target;
        const target = parseFloat(el.dataset.count);
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        const isDecimal = String(target).includes('.');
        let current = 0;
        const step = target / 40;
        const timer = setInterval(() => {
          current += step;
          if (current >= target) { current = target; clearInterval(timer); }
          el.textContent = prefix + (isDecimal ? current.toFixed(1) : Math.round(current).toLocaleString()) + suffix;
        }, 30);
        counterObs.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach(el => counterObs.observe(el));

  // Tooltip positioning (fixed to avoid card overflow clipping)
  document.querySelectorAll('.tooltip-wrap').forEach(wrap => {
    wrap.addEventListener('mouseenter', () => {
      const box = wrap.querySelector('.tooltip-box');
      if (!box) return;
      const rect = wrap.getBoundingClientRect();
      const boxH = 120; // approximate height
      // show above if enough space, else below
      if (rect.top > boxH + 20) {
        box.style.top = (rect.top - boxH - 8) + 'px';
      } else {
        box.style.top = (rect.bottom + 8) + 'px';
      }
      // center horizontally, clamp to viewport
      let left = rect.left;
      if (left + 280 > window.innerWidth) left = window.innerWidth - 290;
      if (left < 10) left = 10;
      box.style.left = left + 'px';
    });
  });

  // MRR vs Burn Rate Chart
  const canvas = document.getElementById('mrrChart');
  if (canvas) {
    const chartObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          renderMRRChart(canvas);
          chartObs.unobserve(canvas);
        }
      });
    }, { threshold: 0.3 });
    chartObs.observe(canvas);
  }
});

function renderMRRChart(canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const W = rect.width, H = rect.height;

  // Data: 24 months
  const months = Array.from({ length: 24 }, (_, i) => i + 1);
  // MRR growth: starts slow, ramps up (SaaS Year 1, then Enterprise kicks in Year 2)
  const mrr = [
    1, 3, 5, 7, 10, 14, 17, 20, 23, 26, 30, 33,     // Year 1: SaaS ramp (~$259K)
    38, 44, 50, 58, 68, 80, 95, 110, 125, 138, 150, 160  // Year 2: Enterprise
  ];
  const burn = Array(24).fill(45); // ~$45K/month burn (conservative)

  const pad = { top: 40, right: 30, bottom: 45, left: 55 };
  const gW = W - pad.left - pad.right;
  const gH = H - pad.top - pad.bottom;
  const maxY = 180;
  const xScale = i => pad.left + (i / 23) * gW;
  const yScale = v => pad.top + gH - (v / maxY) * gH;

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let v = 0; v <= maxY; v += 30) {
    const y = yScale(v);
    ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    ctx.fillStyle = '#64748b'; ctx.font = '11px Inter, sans-serif'; ctx.textAlign = 'right';
    ctx.fillText(`$${v}K`, pad.left - 8, y + 4);
  }
  // X labels
  ctx.textAlign = 'center'; ctx.fillStyle = '#64748b'; ctx.font = '11px Inter, sans-serif';
  for (let i = 0; i < 24; i += 3) {
    ctx.fillText(`M${i + 1}`, xScale(i), H - pad.bottom + 20);
  }
  // Year markers
  ctx.fillStyle = 'rgba(59,130,246,0.15)'; ctx.font = '10px Inter';
  ctx.fillText('← Năm 1 (SaaS) →', xScale(5.5), H - 5);
  ctx.fillStyle = 'rgba(16,185,129,0.15)';
  ctx.fillText('← Năm 2 (Enterprise) →', xScale(17.5), H - 5);

  // Animate drawing
  let progress = 0;
  const totalFrames = 60;
  function animate() {
    progress++;
    const pct = Math.min(progress / totalFrames, 1);
    const ease = 1 - Math.pow(1 - pct, 3); // easeOutCubic
    const pts = Math.floor(ease * 24);

    // Clear chart area
    ctx.clearRect(pad.left, pad.top - 5, gW + 5, gH + 10);
    // Redraw grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    for (let v = 0; v <= maxY; v += 30) {
      const y = yScale(v);
      ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(W - pad.right, y); ctx.stroke();
    }

    // Burn rate line (red, dashed)
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < pts; i++) {
      const x = xScale(i), y = yScale(burn[i]);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // MRR line (blue gradient)
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < pts; i++) {
      const x = xScale(i), y = yScale(mrr[i]);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();

    // MRR fill
    if (pts > 1) {
      ctx.beginPath();
      ctx.moveTo(xScale(0), yScale(mrr[0]));
      for (let i = 1; i < pts; i++) ctx.lineTo(xScale(i), yScale(mrr[i]));
      ctx.lineTo(xScale(pts - 1), yScale(0));
      ctx.lineTo(xScale(0), yScale(0));
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + gH);
      grad.addColorStop(0, 'rgba(59,130,246,0.15)');
      grad.addColorStop(1, 'rgba(59,130,246,0)');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Break-even marker (around month 20-21)
    if (pts >= 19) {
      const bx = xScale(18), by = yScale(burn[18]);
      ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981'; ctx.fill();
      ctx.strokeStyle = '#0a0e1a'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#10b981'; ctx.font = 'bold 11px Inter';
      ctx.textAlign = 'left';
      ctx.fillText('⬆ Break-even', bx + 12, by - 8);
    }

    // Dots on current endpoints
    if (pts > 0) {
      const lastIdx = pts - 1;
      // MRR dot
      ctx.beginPath(); ctx.arc(xScale(lastIdx), yScale(mrr[lastIdx]), 4, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6'; ctx.fill();
      // Burn dot
      ctx.beginPath(); ctx.arc(xScale(lastIdx), yScale(burn[lastIdx]), 4, 0, Math.PI * 2);
      ctx.fillStyle = '#f43f5e'; ctx.fill();
    }

    if (progress < totalFrames) requestAnimationFrame(animate);
    else {
      // Legend
      ctx.fillStyle = '#3b82f6'; ctx.font = 'bold 12px Inter'; ctx.textAlign = 'left';
      ctx.fillText('● MRR', pad.left + 10, pad.top - 15);
      ctx.fillStyle = '#f43f5e';
      ctx.fillText('- - Burn Rate (~$45K/m)', pad.left + 80, pad.top - 15);
    }
  }
  animate();
}
