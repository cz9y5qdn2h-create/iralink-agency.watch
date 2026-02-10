const watches = [
  {
    id: "rolex-126610ln",
    brand: "Rolex",
    model: "Submariner Date",
    reference: "126610LN",
    currentPrice: 12850,
    estimatedRetail: 10400,
    budgetFit: 13000,
    sourceScore: 92,
    availability: "En stock",
    history: [11800, 12020, 12150, 12300, 12620, 12850],
  },
  {
    id: "omega-31030425001001",
    brand: "Omega",
    model: "Speedmaster Moonwatch",
    reference: "310.30.42.50.01.001",
    currentPrice: 6650,
    estimatedRetail: 7600,
    budgetFit: 7000,
    sourceScore: 88,
    availability: "Sous 24h",
    history: [7100, 6980, 6860, 6790, 6710, 6650],
  },
  {
    id: "patek-57111a",
    brand: "Patek Philippe",
    model: "Nautilus",
    reference: "5711/1A",
    currentPrice: 109000,
    estimatedRetail: 34000,
    budgetFit: 120000,
    sourceScore: 77,
    availability: "Complet",
    history: [145000, 138000, 129000, 122500, 116000, 109000],
  },
  {
    id: "cartier-wssa0039",
    brand: "Cartier",
    model: "Santos Large",
    reference: "WSSA0039",
    currentPrice: 5950,
    estimatedRetail: 8000,
    budgetFit: 6500,
    sourceScore: 90,
    availability: "En stock",
    history: [7210, 7030, 6880, 6480, 6190, 5950],
  },
];

const monthLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"];
const state = {
  watchlist: new Set(),
  alerts: [],
};

const els = {
  brandFilter: document.getElementById("brandFilter"),
  referenceFilter: document.getElementById("referenceFilter"),
  budgetFilter: document.getElementById("budgetFilter"),
  opportunityList: document.getElementById("opportunityList"),
  watchSelector: document.getElementById("watchSelector"),
  watchDetails: document.getElementById("watchDetails"),
  priceChart: document.getElementById("priceChart"),
  alertForm: document.getElementById("alertForm"),
  alertsList: document.getElementById("alertsList"),
  confidenceBoard: document.getElementById("confidenceBoard"),
  notificationForm: document.getElementById("notificationForm"),
  notificationStatus: document.getElementById("notificationStatus"),
  compareA: document.getElementById("compareA"),
  compareB: document.getElementById("compareB"),
  compareC: document.getElementById("compareC"),
  compareBtn: document.getElementById("compareBtn"),
  comparisonTable: document.getElementById("comparisonTable"),
  watchlistDialog: document.getElementById("watchlistDialog"),
  viewWatchlistBtn: document.getElementById("viewWatchlistBtn"),
  closeWatchlistBtn: document.getElementById("closeWatchlistBtn"),
  watchlistEntries: document.getElementById("watchlistEntries"),
  watchlistCount: document.getElementById("watchlistCount"),
};

function euro(value) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function renderFilterOptions() {
  [...new Set(watches.map((w) => w.brand))].forEach((brand) => {
    const option = document.createElement("option");
    option.value = brand;
    option.textContent = brand;
    els.brandFilter.append(option);
  });
}

function filteredWatches() {
  const brand = els.brandFilter.value;
  const referenceText = els.referenceFilter.value.trim().toLowerCase();
  const budget = Number(els.budgetFilter.value || Infinity);

  return watches
    .filter((w) => (!brand || w.brand === brand))
    .filter((w) => (!referenceText || w.reference.toLowerCase().includes(referenceText)))
    .filter((w) => w.currentPrice <= budget)
    .sort((a, b) => (b.estimatedRetail - b.currentPrice) - (a.estimatedRetail - a.currentPrice));
}

function renderOpportunities() {
  const list = filteredWatches();
  els.opportunityList.innerHTML = "";

  if (!list.length) {
    els.opportunityList.innerHTML = `<p class="muted">Aucune opportunité pour ces filtres.</p>`;
    return;
  }

  list.forEach((watch) => {
    const savings = watch.estimatedRetail - watch.currentPrice;
    const container = document.createElement("div");
    container.className = "opportunity";
    container.innerHTML = `
      <strong>${watch.brand} ${watch.model}</strong> <span class="badge ${savings > 0 ? "success" : "warning"}">${savings > 0 ? "Sous retail" : "Au-dessus retail"}</span>
      <div>Réf: ${watch.reference}</div>
      <div>Prix marché: <strong>${euro(watch.currentPrice)}</strong> • Retail estimé: ${euro(watch.estimatedRetail)}</div>
      <div>Disponibilité: ${watch.availability}</div>
      <button data-watch="${watch.id}">${state.watchlist.has(watch.id) ? "Retirer des favoris" : "Ajouter aux favoris"}</button>
    `;

    container.querySelector("button").addEventListener("click", () => toggleWatchlist(watch.id));
    els.opportunityList.append(container);
  });
}

function renderWatchSelectors() {
  [els.watchSelector, els.compareA, els.compareB, els.compareC].forEach((select) => {
    select.innerHTML = "";
    watches.forEach((watch) => {
      const option = document.createElement("option");
      option.value = watch.id;
      option.textContent = `${watch.brand} ${watch.reference}`;
      select.append(option);
    });
  });
  els.compareB.selectedIndex = 1;
  els.compareC.selectedIndex = 2;
}

function renderWatchDetail() {
  const watch = watches.find((w) => w.id === els.watchSelector.value) ?? watches[0];
  if (!watch) return;

  const lastChange = (((watch.history.at(-1) - watch.history.at(-2)) / watch.history.at(-2)) * 100).toFixed(1);
  els.watchDetails.innerHTML = `
    <strong>${watch.brand} ${watch.model} (${watch.reference})</strong>
    <span>Prix actuel: ${euro(watch.currentPrice)} | Variation mensuelle: ${lastChange}%</span>
    <span>Confiance source: ${watch.sourceScore}/100 | Disponibilité: ${watch.availability}</span>
  `;

  drawChart(watch.history);
}

function drawChart(history) {
  const ctx = els.priceChart.getContext("2d");
  const { width, height } = els.priceChart;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#141928";
  ctx.fillRect(0, 0, width, height);

  const max = Math.max(...history);
  const min = Math.min(...history);
  const padding = 40;
  const stepX = (width - padding * 2) / (history.length - 1);

  ctx.strokeStyle = "#5f9fff";
  ctx.lineWidth = 3;
  ctx.beginPath();

  history.forEach((value, i) => {
    const x = padding + i * stepX;
    const y = padding + (1 - (value - min) / (max - min || 1)) * (height - padding * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);

    ctx.fillStyle = "#67f5ca";
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#9ba5b7";
    ctx.font = "12px Inter";
    ctx.fillText(monthLabels[i] ?? `M${i + 1}`, x - 12, height - 12);
  });

  ctx.stroke();
  ctx.fillStyle = "#9ba5b7";
  ctx.fillText(`${euro(min)} - ${euro(max)}`, 12, 18);
}

function renderConfidenceBoard() {
  els.confidenceBoard.innerHTML = "";
  watches.forEach((watch) => {
    const row = document.createElement("div");
    row.className = "confidence-source";
    row.innerHTML = `
      <div>${watch.brand} ${watch.reference} <strong>${watch.sourceScore}/100</strong></div>
      <div class="progress"><span style="width:${watch.sourceScore}%"></span></div>
    `;
    els.confidenceBoard.append(row);
  });
}

function toggleWatchlist(id) {
  if (state.watchlist.has(id)) state.watchlist.delete(id);
  else state.watchlist.add(id);

  els.watchlistCount.textContent = state.watchlist.size;
  renderOpportunities();
  renderWatchlist();
}

function renderWatchlist() {
  const entries = watches.filter((watch) => state.watchlist.has(watch.id));
  els.watchlistEntries.innerHTML = entries.length
    ? entries
        .map(
          (watch) => `<div class="watchlist-item"><strong>${watch.brand} ${watch.reference}</strong><div>${euro(watch.currentPrice)} • ${watch.availability}</div></div>`,
        )
        .join("")
    : '<p class="muted">Aucun favori pour le moment.</p>';
}

function wireAlertForm() {
  els.alertForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(els.alertForm);
    state.alerts.unshift({
      reference: data.get("reference"),
      targetPrice: Number(data.get("targetPrice")),
      variation: Number(data.get("variation")),
      availability: data.get("availability"),
    });
    els.alertForm.reset();
    renderAlerts();
  });
}

function renderAlerts() {
  els.alertsList.innerHTML = state.alerts.length
    ? state.alerts
        .map(
          (alert) => `<div class="alert-item">${alert.reference} • cible ${euro(alert.targetPrice)} • variation ${alert.variation}% • ${alert.availability}</div>`,
        )
        .join("")
    : '<p class="muted">Créez votre première alerte (prix cible, variation %, disponibilité).</p>';
}

function wireNotificationForm() {
  els.notificationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(els.notificationForm);
    const channels = ["email", "telegram", "push"].filter((channel) => data.get(channel));
    els.notificationStatus.textContent = `Notifications enregistrées: ${channels.join(", ")} (${data.get("frequency")}).`;
  });
}

function renderComparison() {
  const ids = [els.compareA.value, els.compareB.value, els.compareC.value].filter((id, index, arr) => id && arr.indexOf(id) === index);
  const selected = ids.map((id) => watches.find((watch) => watch.id === id)).filter(Boolean);

  if (selected.length < 2) {
    els.comparisonTable.innerHTML = '<p class="muted">Sélectionnez au moins 2 références différentes.</p>';
    return;
  }

  const rows = [
    ["Marque", ...selected.map((w) => w.brand)],
    ["Référence", ...selected.map((w) => w.reference)],
    ["Prix", ...selected.map((w) => euro(w.currentPrice))],
    ["Retail estimé", ...selected.map((w) => euro(w.estimatedRetail))],
    ["Disponibilité", ...selected.map((w) => w.availability)],
    ["Confiance source", ...selected.map((w) => `${w.sourceScore}/100`)],
  ];

  const header = `<tr><th>Critère</th>${selected.map((w) => `<th>${w.model}</th>`).join("")}</tr>`;
  const body = rows.map(([label, ...values]) => `<tr><td>${label}</td>${values.map((v) => `<td>${v}</td>`).join("")}</tr>`).join("");
  els.comparisonTable.innerHTML = `<table>${header}${body}</table>`;
}

function boot() {
  renderFilterOptions();
  renderWatchSelectors();
  renderOpportunities();
  renderWatchDetail();
  renderConfidenceBoard();
  renderAlerts();
  renderComparison();

  [els.brandFilter, els.referenceFilter, els.budgetFilter].forEach((input) => input.addEventListener("input", renderOpportunities));
  els.watchSelector.addEventListener("change", renderWatchDetail);
  els.compareBtn.addEventListener("click", renderComparison);

  wireAlertForm();
  wireNotificationForm();

  els.viewWatchlistBtn.addEventListener("click", () => {
    renderWatchlist();
    els.watchlistDialog.showModal();
  });
  els.closeWatchlistBtn.addEventListener("click", () => els.watchlistDialog.close());
}

boot();
