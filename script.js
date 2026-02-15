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
});
