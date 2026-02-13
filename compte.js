async function getJson(url, options = {}) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Erreur API');
  return payload;
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} €`;
}

async function loadOverview() {
  const valueEl = document.getElementById('kpiValue');
  const watchesEl = document.getElementById('kpiWatches');
  const liquidityEl = document.getElementById('kpiLiquidity');
  const advisorEl = document.getElementById('kpiAdvisor');
  const badgeEl = document.getElementById('profileBadge');
  const servicesEl = document.getElementById('servicesWidget');

  try {
    const payload = await getJson('/api/account-overview?userId=1');
    const profile = payload.profile || {};

    valueEl.textContent = formatCurrency(payload.computedPortfolioValue || profile.portfolioValue || 0);
    watchesEl.textContent = payload.watchCount || 0;
    liquidityEl.textContent = profile.liquidityScore || 0;
    advisorEl.textContent = profile.advisor || 'Conseiller assigné';
    badgeEl.innerHTML = `<strong>${profile.tier || 'Compte IL-Watch'}</strong><br/>KYC: ${profile.kycStatus || 'En cours'} · Profil risque: ${profile.riskProfile || 'Standard'}`;

    servicesEl.innerHTML = (profile.services || [])
      .map(service => `<div class="subtle-box">${service}</div>`)
      .join('');
  } catch (error) {
    badgeEl.textContent = error.message;
  }
}

async function loadActivities() {
  const timeline = document.getElementById('activityTimeline');
  if (!timeline) return;

  try {
    const activities = await getJson('/api/account-activities?userId=1');
    timeline.innerHTML = activities
      .map(
        item => `<div class="timeline-item">
          <span class="timeline-dot timeline-${item.type}"></span>
          <div><strong>${item.label}</strong><br/><small>${item.date}</small></div>
        </div>`
      )
      .join('');
  } catch (error) {
    timeline.textContent = error.message;
  }
}

async function loadNews() {
  const widget = document.getElementById('newsWidget');
  if (!widget) return;
  try {
    const news = await getJson('/api/news');
    widget.innerHTML = news
      .map(item => `<div class="subtle-box"><strong>${item.title}</strong><br/><small>${item.source}</small></div>`)
      .join('');
  } catch (error) {
    widget.textContent = error.message;
  }
}

function bindRegister() {
  const form = document.getElementById('registerForm');
  const msg = document.getElementById('registerMessage');
  const info = document.getElementById('accountInfo');
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const result = await getJson('/api/register', { method: 'POST', body: JSON.stringify(payload) });
      msg.textContent = result.message;
      info.innerHTML = `Compte #${result.user.id} · ${result.user.fullName}<br/>Email: ${result.user.email}<br/>KYC: ${result.user.status}`;
      form.reset();
      loadOverview();
    } catch (error) {
      msg.textContent = error.message;
    }
  });
}

function bindAi() {
  const form = document.getElementById('aiForm');
  const output = document.getElementById('aiMessage');
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const result = await getJson('/api/ai-assistant', { method: 'POST', body: JSON.stringify(payload) });
      output.textContent = result.answer;
      form.reset();
    } catch (error) {
      output.textContent = error.message;
    }
  });
}

loadOverview();
loadActivities();
loadNews();
bindRegister();
bindAi();
