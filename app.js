const watches = [
  {
    brand: 'Rolex', reference: '126610LN', model: 'Submariner Date', marketPrice: 13500, retailPrice: 10250,
    confidence: 92, availability: 'in-stock', history: [11800, 12050, 12500, 12950, 13400, 13500]
  },
  {
    brand: 'Omega', reference: '310.30.42.50.01.001', model: 'Speedmaster Professional', marketPrice: 6800, retailPrice: 7600,
    confidence: 88, availability: 'in-stock', history: [7200, 7100, 6990, 6900, 6840, 6800]
  },
  {
    brand: 'Audemars Piguet', reference: '15510ST', model: 'Royal Oak', marketPrice: 42000, retailPrice: 27300,
    confidence: 81, availability: 'backorder', history: [39000, 40100, 41000, 42300, 42600, 42000]
  },
  {
    brand: 'Patek Philippe', reference: '5167A', model: 'Aquanaut', marketPrice: 72000, retailPrice: 25600,
    confidence: 77, availability: 'backorder', history: [68000, 70000, 71000, 72600, 73500, 72000]
  },
  {
    brand: 'Tudor', reference: 'M79030N-0001', model: 'Black Bay Fifty-Eight', marketPrice: 3500, retailPrice: 4050,
    confidence: 90, availability: 'in-stock', history: [4200, 4050, 3900, 3780, 3600, 3500]
  }
];

const state = { watchlist: [], alerts: [] };
const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const scoreLabel = (s) => s >= 90 ? 'Très fiable' : s >= 80 ? 'Fiable' : 'À surveiller';

function init() {
  populateBrandFilter();
  populateWatchSelectors();
  renderOpportunities();
  renderWatchDetails(0);
  renderWatchlist();
  setupEvents();
}

function populateBrandFilter() {
  const brands = [...new Set(watches.map(w => w.brand))];
  const select = document.getElementById('filter-brand');
  brands.forEach(b => {
    const o = document.createElement('option');
    o.value = b; o.textContent = b;
    select.appendChild(o);
  });
}

function populateWatchSelectors() {
  const selector = document.getElementById('watch-selector');
  const alertWatch = document.getElementById('alert-watch');
  watches.forEach((w, idx) => {
    const label = `${w.brand} ${w.reference}`;
    [selector, alertWatch].forEach(el => {
      const o = document.createElement('option');
      o.value = idx; o.textContent = label;
      el.appendChild(o);
    });
  });
}

function renderOpportunities() {
  const brand = document.getElementById('filter-brand').value;
  const reference = document.getElementById('filter-reference').value.toLowerCase();
  const budget = Number(document.getElementById('filter-budget').value || Infinity);
  const container = document.getElementById('opportunities');
  container.innerHTML = '';

  const filtered = watches
    .filter(w => !brand || w.brand === brand)
    .filter(w => !reference || w.reference.toLowerCase().includes(reference))
    .filter(w => w.marketPrice <= budget)
    .sort((a, b) => (b.retailPrice - b.marketPrice) - (a.retailPrice - a.marketPrice));

  filtered.forEach((w, idx) => {
    const spread = w.retailPrice - w.marketPrice;
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <strong>${w.brand} ${w.model}</strong>
      <div class="meta">Réf. ${w.reference}</div>
      <div>Prix marché: <b>${fmt(w.marketPrice)}</b></div>
      <div>Prix retail: ${fmt(w.retailPrice)}</div>
      <div><span class="badge">Potentiel: ${fmt(spread)}</span></div>
      <div class="meta">Score source: ${w.confidence}/100 (${scoreLabel(w.confidence)})</div>
      <button data-fav="${w.reference}">☆ Ajouter aux favoris</button>
      <button data-open="${watches.indexOf(w)}">Voir la fiche</button>
    `;
    container.appendChild(card);
  });

  if (!filtered.length) {
    container.innerHTML = '<p class="meta">Aucune opportunité ne correspond aux filtres.</p>';
  }
}

function renderWatchDetails(idx) {
  const w = watches[idx];
  document.getElementById('watch-selector').value = String(idx);
  document.getElementById('watch-details').innerHTML = `
    <strong>${w.brand} ${w.model}</strong>
    <div>Référence: ${w.reference}</div>
    <div>Marché: ${fmt(w.marketPrice)}</div>
    <div>Retail: ${fmt(w.retailPrice)}</div>
    <div>Disponibilité: ${w.availability === 'in-stock' ? 'En stock' : 'Backorder'}</div>
    <div>Confiance source: ${w.confidence}/100 (${scoreLabel(w.confidence)})</div>
  `;
  drawHistory(w.history);
}

function drawHistory(history) {
  const canvas = document.getElementById('price-chart');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const max = Math.max(...history) * 1.05;
  const min = Math.min(...history) * 0.95;
  const pad = 30;

  ctx.strokeStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(pad, 10); ctx.lineTo(pad, canvas.height - pad); ctx.lineTo(canvas.width - 10, canvas.height - pad);
  ctx.stroke();

  ctx.strokeStyle = '#255ff4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  history.forEach((v, i) => {
    const x = pad + (i / (history.length - 1)) * (canvas.width - pad - 20);
    const y = 10 + (1 - (v - min) / (max - min)) * (canvas.height - 40);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    ctx.fillStyle = '#255ff4'; ctx.fillRect(x - 2, y - 2, 4, 4);
  });
  ctx.stroke();
}

function renderWatchlist() {
  const ul = document.getElementById('watchlist');
  ul.innerHTML = '';
  state.watchlist.forEach(ref => {
    const w = watches.find(x => x.reference === ref);
    const li = document.createElement('li');
    li.textContent = `${w.brand} ${w.reference} — ${fmt(w.marketPrice)}`;
    ul.appendChild(li);
  });
  if (!state.watchlist.length) ul.innerHTML = '<li class="meta">Aucun favori pour l’instant.</li>';
}

function renderAlerts() {
  const ul = document.getElementById('alerts-list');
  ul.innerHTML = '';
  state.alerts.forEach(a => {
    const li = document.createElement('li');
    li.textContent = `${a.watch} | cible ${fmt(a.target)} | variation ${a.variation}% | dispo ${a.availability} | notif ${a.channels.join(', ')}`;
    ul.appendChild(li);
  });
}

function renderComparison(indices) {
  const holder = document.getElementById('comparison');
  if (indices.length < 2 || indices.length > 3) {
    holder.innerHTML = '<p class="meta">Sélectionnez 2 à 3 références pour comparer.</p>';
    return;
  }
  const selected = indices.map(i => watches[i]);
  const rows = ['brand', 'reference', 'model', 'marketPrice', 'retailPrice', 'availability', 'confidence'];
  holder.innerHTML = `
    <table>
      <thead><tr><th>Critère</th>${selected.map(w => `<th>${w.brand} ${w.reference}</th>`).join('')}</tr></thead>
      <tbody>${rows.map(r => `<tr><td>${r}</td>${selected.map(w => `<td>${r.includes('Price') ? fmt(w[r]) : w[r]}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  `;
}

function setupEvents() {
  ['filter-brand', 'filter-reference', 'filter-budget'].forEach(id => {
    document.getElementById(id).addEventListener('input', renderOpportunities);
  });

  document.getElementById('opportunities').addEventListener('click', (e) => {
    const fav = e.target.getAttribute('data-fav');
    if (fav) {
      if (!state.watchlist.includes(fav)) state.watchlist.push(fav);
      renderWatchlist();
    }
    const open = e.target.getAttribute('data-open');
    if (open !== null) renderWatchDetails(Number(open));
  });

  document.getElementById('watch-selector').addEventListener('change', (e) => renderWatchDetails(Number(e.target.value)));

  document.getElementById('alert-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const idx = Number(document.getElementById('alert-watch').value);
    const watch = `${watches[idx].brand} ${watches[idx].reference}`;
    const channels = [...document.getElementById('notification-channel').selectedOptions].map(o => o.value);
    state.alerts.push({
      watch,
      target: Number(document.getElementById('target-price').value),
      variation: Number(document.getElementById('variation').value),
      availability: document.getElementById('availability').value,
      channels
    });
    renderAlerts();
    e.target.reset();
  });

  document.querySelectorAll('.compare-check').forEach(box => {
    box.addEventListener('change', () => {
      const idx = [...document.querySelectorAll('.compare-check:checked')].map(x => Number(x.value));
      renderComparison(idx);
    });
  });

  renderComparison([]);
}

init();
