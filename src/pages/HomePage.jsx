import { useEffect, useState } from 'react';
import SectionCard from '../components/SectionCard';

const ecosystems = [
  {
    title: 'Command center Eralink',
    text: 'Pilotage unifié des chaînes, décisions IA assistées et validation humaine sur les actions critiques.'
  },
  {
    title: 'Defensive AI Engine',
    text: 'Surveillance continue des risques, scoring de menace et alertes instantanées pour vos équipes.'
  },
  {
    title: 'Chip ↔ Token bridge',
    text: 'Socle prêt pour connecter le physique au numérique et sécuriser l’authenticité des actifs.'
  },
  {
    title: 'Connecteurs entreprise',
    text: 'APIs et webhooks pensés pour raccorder rapidement vos produits, ERP et apps métier.'
  }
];

const modules = [
  'Portail d’onboarding entreprise avec gestion d’accès.',
  'Gestion des demandes produit sans prix public (contact commercial).',
  'Assistant IA pour scénarios de crise et recommandations d’exploitation.',
  'Suivi des dernières demandes afin d’accélérer le traitement client.'
];

export default function HomePage() {
  const [accountForm, setAccountForm] = useState({ fullName: 'Matéo Coutard', email: '', idNumber: '' });
  const [productForm, setProductForm] = useState({ company: '', contact: '', useCase: '' });
  const [assistantForm, setAssistantForm] = useState('Comment sécuriser une blockchain menacée ?');
  const [accountMessage, setAccountMessage] = useState('');
  const [productMessage, setProductMessage] = useState('');
  const [assistantMessage, setAssistantMessage] = useState('');
  const [metrics, setMetrics] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);

  const loadPlatformData = async () => {
    const [metricsResponse, requestsResponse] = await Promise.all([
      fetch('/api/platform-metrics'),
      fetch('/api/product-requests?limit=4')
    ]);

    const metricsPayload = await metricsResponse.json();
    const requestsPayload = await requestsResponse.json();

    setMetrics(metricsPayload);
    setRecentRequests(Array.isArray(requestsPayload) ? requestsPayload : []);
  };

  useEffect(() => {
    loadPlatformData();
  }, []);

  const submitAccount = async event => {
    event.preventDefault();
    setAccountMessage('');

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(accountForm)
    });

    const payload = await response.json();
    setAccountMessage(payload.message || payload.error || 'Demande envoyée.');
    if (response.ok) {
      setAccountForm({ fullName: 'Matéo Coutard', email: '', idNumber: '' });
      loadPlatformData();
    }
  };

  const submitProductRequest = async event => {
    event.preventDefault();
    setProductMessage('');

    const response = await fetch('/api/product-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productForm)
    });

    const payload = await response.json();
    setProductMessage(payload.message || payload.error || 'Demande envoyée.');
    if (response.ok) {
      setProductForm({ company: '', contact: '', useCase: '' });
      loadPlatformData();
    }
  };

  const askAssistant = async event => {
    event.preventDefault();
    setAssistantMessage('');

    const response = await fetch('/api/ai-assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: assistantForm })
    });

    const payload = await response.json();
    setAssistantMessage(payload.answer || payload.error || 'Réponse indisponible.');
  };

  return (
    <div className="stack">
      <section className="hero card">
        <p className="eyebrow">Beta iralink.agency</p>
        <h2>Une plateforme opérationnelle, design et prête à tourner dès maintenant</h2>
        <p>
          Votre identité est traitée en mode noir premium avec une direction techno sobre. La plateforme est déjà
          fonctionnelle : inscription, demandes produit, supervision et assistant IA.
        </p>
        <a className="cta-link" href="#inscription">Activer mon accès</a>
      </section>

      <SectionCard title="Pulse de la plateforme" subtitle="Indicateurs en direct">
        <div className="grid-4">
          <article className="inner-card metric-card"><h3>{metrics?.liveChains ?? '-'}</h3><p>blockchains monitorées</p></article>
          <article className="inner-card metric-card"><h3>{metrics?.pendingRequests ?? '-'}</h3><p>demandes en attente</p></article>
          <article className="inner-card metric-card"><h3>{metrics?.totalUsers ?? '-'}</h3><p>accès créés</p></article>
          <article className="inner-card metric-card"><h3>{metrics?.threatLevel ?? '-'}</h3><p>niveau de menace</p></article>
        </div>
      </SectionCard>

      <SectionCard title="Fondations techniques" subtitle="Ecosystème construit autour de votre identité">
        <div className="grid-2">
          {ecosystems.map(item => (
            <article key={item.title} className="inner-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Modules actifs" subtitle="Pensés pour scaler rapidement">
        <ul className="list">
          {modules.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </SectionCard>

      <section className="grid-2">
        <SectionCard title="Assistant IA" subtitle="Décisions opérationnelles assistées">
          <form className="form" onSubmit={askAssistant}>
            <input
              placeholder="Posez votre question"
              value={assistantForm}
              onChange={event => setAssistantForm(event.target.value)}
              required
            />
            <button type="submit">Analyser</button>
          </form>
          {assistantMessage && <p>{assistantMessage}</p>}
        </SectionCard>

        <SectionCard title="Dernières demandes" subtitle="Suivi commercial">
          <ul className="list request-list">
            {recentRequests.length === 0 && <li>Aucune demande pour le moment.</li>}
            {recentRequests.map(item => (
              <li key={item.id}>
                <strong>{item.company}</strong> — {item.useCase}
                <small>{item.contact}</small>
              </li>
            ))}
          </ul>
        </SectionCard>
      </section>

      <section id="inscription" className="grid-2">
        <SectionCard title="Créer un accès Eralink Agency" subtitle="Inscription pilote">
          <form className="form" onSubmit={submitAccount}>
            <input
              placeholder="Nom complet"
              value={accountForm.fullName}
              onChange={event => setAccountForm({ ...accountForm, fullName: event.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email professionnel"
              value={accountForm.email}
              onChange={event => setAccountForm({ ...accountForm, email: event.target.value })}
              required
            />
            <input
              placeholder="Pièce d'identité"
              value={accountForm.idNumber}
              onChange={event => setAccountForm({ ...accountForm, idNumber: event.target.value })}
              required
            />
            <button type="submit">Créer mon accès</button>
          </form>
          <p className="helper">Aucun tarif affiché : contactez-nous pour en savoir plus.</p>
          {accountMessage && <p>{accountMessage}</p>}
        </SectionCard>

        <SectionCard title="Demande produit" subtitle="Contact uniquement (sans prix)">
          <form className="form" onSubmit={submitProductRequest}>
            <input
              placeholder="Entreprise"
              value={productForm.company}
              onChange={event => setProductForm({ ...productForm, company: event.target.value })}
              required
            />
            <input
              placeholder="Contact"
              value={productForm.contact}
              onChange={event => setProductForm({ ...productForm, contact: event.target.value })}
              required
            />
            <input
              placeholder="Besoin principal"
              value={productForm.useCase}
              onChange={event => setProductForm({ ...productForm, useCase: event.target.value })}
              required
            />
            <button type="submit">Contacter pour en savoir plus</button>
          </form>
          {productMessage && <p>{productMessage}</p>}
        </SectionCard>
      </section>
    </div>
  );
}
