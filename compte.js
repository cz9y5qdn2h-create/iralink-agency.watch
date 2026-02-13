async function getJson(url, options = {}) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Erreur API');
  return payload;
}

async function loadNews() {
  const widget = document.getElementById('newsWidget');
  if (!widget) return;
  try {
    const news = await getJson('/api/news');
    widget.innerHTML = news.map(item => `<div class="subtle-box"><strong>${item.title}</strong><br/><small>${item.source}</small></div>`).join('');
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
    } catch (error) {
      msg.textContent = error.message;
    }
  });
}

function bindAi() {
  const form = document.getElementById('aiForm');
  const msg = document.getElementById('aiMessage');
  form?.addEventListener('submit', async event => {
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(form).entries());
    try {
      const result = await getJson('/api/ai-assistant', { method: 'POST', body: JSON.stringify(payload) });
      msg.textContent = result.answer;
      form.reset();
    } catch (error) {
      msg.textContent = error.message;
    }
  });
}

loadNews();
bindRegister();
bindAi();
