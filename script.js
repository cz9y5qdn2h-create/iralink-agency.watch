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
    const value = Math.floor(target * (1 - Math.pow(1 - progress, 3)));
    element.textContent = value;
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

async function getJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Erreur API');
  return payload;
}

async function loadWatches() {
  const tbody = document.getElementById('watchesTableBody');
  if (!tbody) return;

  try {
    const watches = await getJson('/api/watches');
    tbody.innerHTML = watches
      .map(
        w => `<tr>
          <td>${w.model}</td>
          <td>${w.currentPrice.toLocaleString('fr-FR')}</td>
          <td>${w.change1Y > 0 ? '+' : ''}${w.change1Y}%</td>
          <td>${w.change5Y > 0 ? '+' : ''}${w.change5Y}%</td>
          <td class="trend-${w.trend}">${w.trend}</td>
        </tr>`
      )
      .join('');
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="5">Impossible de charger les données: ${error.message}</td></tr>`;
  }
}

async function loadPosts() {
  const grid = document.getElementById('postsGrid');
  if (!grid) return;
  try {
    const posts = await getJson('/api/posts');
    grid.innerHTML = posts
      .map(
        post => `<article class="glass card reveal is-visible">
          <p class="eyebrow">${post.category}</p>
          <h3>${post.title}</h3>
          <p>${post.excerpt}</p>
        </article>`
      )
      .join('');
  } catch (error) {
    grid.innerHTML = `<p>Impossible de charger les articles: ${error.message}</p>`;
  }
}

function bindForms() {
  const registerForm = document.getElementById('registerForm');
  const registerMessage = document.getElementById('registerMessage');
  const transactionForm = document.getElementById('transactionForm');
  const transactionMessage = document.getElementById('transactionMessage');

  registerForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const formData = new FormData(registerForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const result = await getJson('/api/register', { method: 'POST', body: JSON.stringify(payload) });
      registerMessage.textContent = `${result.message} (ID masqué: ${result.user.idNumberMasked})`;
      registerForm.reset();
    } catch (error) {
      registerMessage.textContent = error.message;
    }
  });

  transactionForm?.addEventListener('submit', async event => {
    event.preventDefault();
    const formData = new FormData(transactionForm);
    const payload = Object.fromEntries(formData.entries());

    try {
      const result = await getJson('/api/transactions', { method: 'POST', body: JSON.stringify(payload) });
      transactionMessage.textContent = `${result.message} #${result.transaction.id}`;
      transactionForm.reset();
    } catch (error) {
      transactionMessage.textContent = error.message;
    }
  });
}

loadWatches();
loadPosts();
bindForms();
