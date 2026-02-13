async function getJson(url, options = {}) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Erreur API');
  return payload;
}

async function loadListings() {
  const grid = document.getElementById('marketplaceGrid');
  if (!grid) return;

  try {
    const listings = await getJson('/api/listings');
    grid.innerHTML = listings
      .map(
        item => `<article class="glass card">
          <p class="eyebrow">${item.condition}</p>
          <h3>${item.model}</h3>
          <p>Prix demandé: <strong>${Number(item.price).toLocaleString('fr-FR')} €</strong></p>
          <p>Vendeur: ${item.seller}</p>
          <button class="btn btn-secondary" type="button">Contacter le vendeur</button>
        </article>`
      )
      .join('');
  } catch (error) {
    grid.innerHTML = `<p>${error.message}</p>`;
  }
}

function bindListingForm() {
  const form = document.getElementById('listingForm');
  const message = document.getElementById('listingMessage');

  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    payload.seller = 'Membre IL-Watch';

    try {
      const result = await getJson('/api/listings', { method: 'POST', body: JSON.stringify(payload) });
      message.textContent = `${result.message} #${result.listing.id}`;
      form.reset();
      loadListings();
    } catch (error) {
      message.textContent = error.message;
    }
  });
}

loadListings();
bindListingForm();
