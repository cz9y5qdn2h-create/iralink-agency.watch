async function loadFormations() {
  const grid = document.getElementById('formationsGrid');
  if (!grid) return;

  try {
    const response = await fetch('/api/formations');
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || 'Erreur API');

    grid.innerHTML = payload
      .map(
        item => `<article class="glass card">
          <p class="eyebrow">${item.level}</p>
          <h3>${item.title}</h3>
          <p>${item.summary}</p>
          <div class="pill-row">${item.tags.map(tag => `<span class="pill">${tag}</span>`).join('')}</div>
        </article>`
      )
      .join('');
  } catch (error) {
    grid.innerHTML = `<p>${error.message}</p>`;
  }
}

loadFormations();
