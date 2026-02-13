async function getJson(url, options = {}) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Erreur API');
  return payload;
}

async function loadPortfolio() {
  const tbody = document.getElementById('portfolioTableBody');
  const totalEl = document.getElementById('portfolioValue');
  if (!tbody || !totalEl) return;

  try {
    const rows = await getJson('/api/portfolio?userId=1');
    let total = 0;
    tbody.innerHTML = rows
      .map(row => {
        total += row.totalValue;
        return `<tr>
          <td>${row.model}</td>
          <td>${row.quantity}</td>
          <td>${row.unitPrice.toLocaleString('fr-FR')} €</td>
          <td>${row.totalValue.toLocaleString('fr-FR')} €</td>
          <td>${row.change1Y > 0 ? '+' : ''}${row.change1Y}%</td>
        </tr>`;
      })
      .join('');
    totalEl.textContent = `${total.toLocaleString('fr-FR')} €`;
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="5">${error.message}</td></tr>`;
  }
}

function bindForm() {
  const form = document.getElementById('portfolioForm');
  const message = document.getElementById('portfolioMessage');
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.userId = 1;

    try {
      const result = await getJson('/api/portfolio', { method: 'POST', body: JSON.stringify(payload) });
      message.textContent = `${result.message} (${result.item.model})`;
      form.reset();
      loadPortfolio();
    } catch (error) {
      message.textContent = error.message;
    }
  });
}

loadPortfolio();
bindForm();
