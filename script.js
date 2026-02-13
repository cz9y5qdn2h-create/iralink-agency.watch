const revealElements = document.querySelectorAll('.reveal');
const kpiElements = document.querySelectorAll('.kpi');
const glow = document.querySelector('.cursor-glow');

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        if (entry.target.classList.contains('kpi')) animateKPI(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

revealElements.forEach(el => observer.observe(el));
kpiElements.forEach(el => observer.observe(el));

function animateKPI(element) {
  if (element.dataset.animated === 'true') return;
  const target = Number(element.dataset.target) || 0;
  const duration = 1200;
  const startTime = performance.now();

  function frame(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    element.textContent = Math.floor(target * (1 - Math.pow(1 - progress, 3)));
    if (progress < 1) requestAnimationFrame(frame);
    else {
      element.textContent = target;
      element.dataset.animated = 'true';
    }
  }

  requestAnimationFrame(frame);
}

window.addEventListener('pointermove', event => {
  if (!glow) return;
  glow.style.left = `${event.clientX}px`;
  glow.style.top = `${event.clientY}px`;
});
