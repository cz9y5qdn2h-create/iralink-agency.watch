const STORAGE_KEY = "watch-intelligence-state-v2";

const watches = [
  {
    id: "rolex-126610ln",
    brand: "Rolex",
    model: "Submariner Date",
    reference: "126610LN",
    currentPrice: 12850,
    estimatedRetail: 10400,
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
    sourceScore: 90,
    availability: "En stock",
    history: [7210, 7030, 6880, 6480, 6190, 5950],
  },
];

const monthLabels = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"];
const availabilityScoreMap = {
  "En stock": 100,
  "Sous 24h": 80,
  "Neuf seulement": 65,
  Complet: 30,
};

const state = {
  watchlist: new Set(),
  alerts: [],
  notificationPrefs: {
    email: true,
    telegram: false,
    push: true,
    frequency: "Temps réel",
  },
  scoreWeights: {
    price: 40,
    trend: 25,
    source: 20,
    availability: 15,
  },
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
  weightPrice: document.getElementById("weightPrice"),
  weightTrend: document.getElementById("weightTrend"),
  weightSource: document.getElementById("weightSource"),
  weightAvailability: document.getElementById("weightAvailability"),
  scoreConfigSummary: document.getElementById("scoreConfigSummary"),
};

function euro(value) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, value));
}

function getTrendPercent(watch) {
  const latest = watch.history.at(-1);
  const previous = watch.history.at(-2) || latest;
  return ((latest - previous) / previous) * 100;
}

function getBuyScore(watch) {
  const priceDelta = ((watch.estimatedRetail - watch.currentPrice) / watch.estimatedRetail) * 100;
  const priceComponent = clampPercent(50 + priceDelta * 2);
  const trendComponent = clampPercent(50 - getTrendPercent(watch) * 4);
  const sourceComponent = clampPercent(watch.sourceScore);
  const availabilityComponent = availabilityScoreMap[watch.availability] ?? 50;

  const weights = state.scoreWeights;
  const totalWeight = Object.values(weights).reduce((sum, value) => sum + value, 0) || 1;
  const weightedScore =
    (priceComponent * weights.price +
      trendComponent * weights.trend +
      sourceComponent * weights.source +
      availabilityComponent * weights.availability) /
    totalWeight;

  return {
    value: Math.round(weightedScore),
    rationale: [
      `Prix vs retail: ${Math.round(priceComponent)}/100`,
      `Tendance récente: ${Math.round(trendComponent)}/100`,
      `Confiance source: ${Math.round(sourceComponent)}/100`,
      `Disponibilité: ${Math.round(availabilityComponent)}/100`,
    ],
  };
}

function saveState() {
  const payload = {
    watchlist: [...state.watchlist],
    alerts: state.alerts,
    notificationPrefs: state.notificationPrefs,
    scoreWeights: state.scoreWeights,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.watchlist)) state.watchlist = new Set(parsed.watchlist);
    if (Array.isArray(parsed.alerts)) state.alerts = parsed.alerts;
    if (parsed.notificationPrefs) state.notificationPrefs = { ...state.notificationPrefs, ...parsed.notificationPrefs };
    if (parsed.scoreWeights) state.scoreWeights = { ...state.scoreWeights, ...parsed.scoreWeights };
  } catch {
    // ignore parse/storage issues
  }
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
  const budgetRaw = els.budgetFilter.value;
  const budget = budgetRaw === "" ? Number.POSITIVE_INFINITY : Number(budgetRaw);

  return watches
    .filter((watch) => (!brand || watch.brand === brand))
    .filter((watch) => (!referenceText || watch.reference.toLowerCase().includes(referenceText)))
    .filter((watch) => watch.currentPrice <= budget)
    .sort((a, b) => getBuyScore(b).value - getBuyScore(a).value);
}

function renderOpportunities() {
  const list = filteredWatches();
  els.opportunityList.innerHTML = "";

  if (!list.length) {
    els.opportunityList.innerHTML = '<p class="muted">Aucune opportunité pour ces filtres.</p>';
    return;
  }

  list.forEach((watch) => {
    const savings = watch.estimatedRetail - watch.currentPrice;
    const buyScore = getBuyScore(watch);

    const container = document.createElement("div");
    container.className = "opportunity";
    container.innerHTML = `
      <strong>${watch.brand} ${watch.model}</strong>
      <span class="badge ${savings > 0 ? "success" : "warning"}">${savings > 0 ? "Sous retail" : "Au-dessus retail"}</span>
      <span class="badge score">buy_score ${buyScore.value}/100</span>
      <div>Réf: ${watch.reference}</div>
      <div>Prix marché: <strong>${euro(watch.currentPrice)}</strong> • Retail estimé: ${euro(watch.estimatedRetail)}</div>
      <div>Disponibilité: ${watch.availability}</div>
      <div class="muted">${buyScore.rationale.join(" • ")}</div>
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

  const trend = getTrendPercent(watch).toFixed(1);
  const buyScore = getBuyScore(watch);
  els.watchDetails.innerHTML = `
    <strong>${watch.brand} ${watch.model} (${watch.reference})</strong>
    <span>Prix actuel: ${euro(watch.currentPrice)} | Variation mensuelle: ${trend}%</span>
    <span>Confiance source: ${watch.sourceScore}/100 | Disponibilité: ${watch.availability}</span>
    <span><strong>buy_score:</strong> ${buyScore.value}/100</span>
    <span class="muted">Explication: ${buyScore.rationale.join(" • ")}</span>
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
  saveState();
  renderOpportunities();
  renderWatchlist();
}

function renderWatchlist() {
  const entries = watches.filter((watch) => state.watchlist.has(watch.id));
  els.watchlistEntries.innerHTML = entries.length
    ? entries
        .map(
          (watch) =>
            `<div class="watchlist-item"><strong>${watch.brand} ${watch.reference}</strong><div>${euro(watch.currentPrice)} • ${watch.availability}</div></div>`,
        )
        .join("")
    : '<p class="muted">Aucun favori pour le moment.</p>';
}

function wireAlertForm() {
  els.alertForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(els.alertForm);
    state.alerts.unshift({
      reference: String(data.get("reference") ?? "").trim().toUpperCase(),
      targetPrice: Number(data.get("targetPrice")),
      variation: Number(data.get("variation")),
      availability: String(data.get("availability") ?? ""),
    });
    saveState();
    els.alertForm.reset();
    renderAlerts();
  });
}

function renderAlerts() {
  els.alertsList.innerHTML = state.alerts.length
    ? state.alerts
        .map(
          (alert) =>
            `<div class="alert-item">${alert.reference} • cible ${euro(alert.targetPrice)} • variation ${alert.variation}% • ${alert.availability}</div>`,
        )
        .join("")
    : '<p class="muted">Créez votre première alerte (prix cible, variation %, disponibilité).</p>';
}

function applyNotificationPrefsToForm() {
  els.notificationForm.elements.email.checked = state.notificationPrefs.email;
  els.notificationForm.elements.telegram.checked = state.notificationPrefs.telegram;
  els.notificationForm.elements.push.checked = state.notificationPrefs.push;
  els.notificationForm.elements.frequency.value = state.notificationPrefs.frequency;
}

function wireNotificationForm() {
  els.notificationForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(els.notificationForm);
    const channels = ["email", "telegram", "push"].filter((channel) => data.get(channel));

    state.notificationPrefs = {
      email: Boolean(data.get("email")),
      telegram: Boolean(data.get("telegram")),
      push: Boolean(data.get("push")),
      frequency: String(data.get("frequency")),
    };

    saveState();
    els.notificationStatus.textContent = `Notifications enregistrées: ${channels.join(", ") || "aucun canal"} (${data.get("frequency")}).`;
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
    ["buy_score", ...selected.map((w) => `${getBuyScore(w).value}/100`)],
  ];

  const header = `<tr><th>Critère</th>${selected.map((w) => `<th>${w.model}</th>`).join("")}</tr>`;
  const body = rows.map(([label, ...values]) => `<tr><td>${label}</td>${values.map((v) => `<td>${v}</td>`).join("")}</tr>`).join("");
  els.comparisonTable.innerHTML = `<table>${header}${body}</table>`;
}

function syncScoreSliders() {
  els.weightPrice.value = state.scoreWeights.price;
  els.weightTrend.value = state.scoreWeights.trend;
  els.weightSource.value = state.scoreWeights.source;
  els.weightAvailability.value = state.scoreWeights.availability;
}

function renderScoreConfigSummary() {
  const w = state.scoreWeights;
  const total = w.price + w.trend + w.source + w.availability || 1;
  els.scoreConfigSummary.textContent = `Poids normalisés — Prix ${Math.round((w.price / total) * 100)}%, Tendance ${Math.round((w.trend / total) * 100)}%, Source ${Math.round((w.source / total) * 100)}%, Disponibilité ${Math.round((w.availability / total) * 100)}%.`;
}

function wireScoreConfig() {
  [
    ["price", els.weightPrice],
    ["trend", els.weightTrend],
    ["source", els.weightSource],
    ["availability", els.weightAvailability],
  ].forEach(([key, input]) => {
    input.addEventListener("input", () => {
      state.scoreWeights[key] = Number(input.value);
      saveState();
      renderScoreConfigSummary();
      renderOpportunities();
      renderWatchDetail();
      renderComparison();
    });
  });
}

function boot() {
  loadState();
  renderFilterOptions();
  renderWatchSelectors();
  syncScoreSliders();
  applyNotificationPrefsToForm();
  renderScoreConfigSummary();
  renderOpportunities();
  renderWatchDetail();
  renderConfidenceBoard();
  renderAlerts();
  renderComparison();
  renderWatchlist();
  els.watchlistCount.textContent = state.watchlist.size;

  [els.brandFilter, els.referenceFilter, els.budgetFilter].forEach((input) => input.addEventListener("input", renderOpportunities));
  els.watchSelector.addEventListener("change", renderWatchDetail);
  els.compareBtn.addEventListener("click", renderComparison);

  wireAlertForm();
  wireNotificationForm();
  wireScoreConfig();

  els.viewWatchlistBtn.addEventListener("click", () => {
    renderWatchlist();
    els.watchlistDialog.showModal();
  });
  els.closeWatchlistBtn.addEventListener("click", () => els.watchlistDialog.close());
}

boot();
