import { useEffect, useState } from 'react';
import SectionCard from '../components/SectionCard';

const ecosystems = [
  {
    title: 'Accès opérateur Eralink Agency',
    text: 'Une gouvernance centrale avec rôles, audit de décisions IA et contrôle humain pour valider les actions critiques.'
  },
  {
    title: 'Multi-blockchains interconnectées',
    text: 'Connecteurs EVM, L2 et registres privés pour centraliser la supervision sans verrouiller l’écosystème sur une seule chaîne.'
  },
  {
    title: 'Défense autonome + notifications',
    text: 'Détection des menaces, score de risque en temps réel et alertes applicatives pour activer rapidement les équipes.'
  },
  {
    title: 'Pont puce ↔ token',
    text: 'Architecture prête pour relier puces physiques et actifs numériques afin de renforcer l’infalsifiabilité produit.'
  }
];

const modules = [
  'Hub de supervision blockchain avec traces horodatées.',
  'Assistant IA décisionnel (recommandations, pas d’action irréversible sans validation).',
  'API de raccordement pour futurs produits et applications partenaires.',
  'Système de tickets pour demandes de déploiement et intégration métier.'
];

export default function HomePage() {
  const [accountForm, setAccountForm] = useState({ fullName: 'Matéo Coutard', email: '', idNumber: '' });
  const [productForm, setProductForm] = useState({ company: '', contact: '', useCase: '' });
  const [accountMessage, setAccountMessage] = useState('');
  const [productMessage, setProductMessage] = useState('');
  const [chainStatus, setChainStatus] = useState(null);
  const [chainMessage, setChainMessage] = useState('');


  useEffect(() => {
    let mounted = true;

    const loadChain = async () => {
      const response = await fetch('/api/blockchain/status');
      const payload = await response.json();
      if (mounted) setChainStatus(payload);
    };

    loadChain();
    const timer = setInterval(loadChain, 2200);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const pushSampleBatch = async () => {
    setChainMessage('');
    const transactions = Array.from({ length: 25 }, (_, index) => ({
      type: 'watch_trace',
      assetId: `batch-watch-${Date.now()}-${index + 1}`,
      ownerId: 'eralink-agency',
      metadata: { qualityScore: 99, source: 'demo_batch' }
    }));

    const response = await fetch('/api/blockchain/tx/batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactions })
    });

    const payload = await response.json();
    setChainMessage(payload.message || payload.error || 'Batch envoyé.');
  };

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
  };

  return (
    <div className="stack">
      <section className="hero card">
        <p className="eyebrow">Vision de plateforme</p>
        <h2>Un écosystème blockchain autonome, sobre et prêt pour l’échelle entreprise</h2>
        <p>
          Cette version présente le cadrage : architecture multi-chaînes, intelligence embarquée, supervision Eralink Agency
          et connecteur futur puce/token. L’objectif est de lancer un socle robuste avant déploiement complet.
        </p>
        <a className="cta-link" href="#inscription">S’inscrire et lancer une demande</a>
      </section>

      <SectionCard title="Fondations techniques" subtitle="Ce qui est prévu dans le socle">
        <div className="grid-2">
          {ecosystems.map(item => (
            <article key={item.title} className="inner-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </SectionCard>



      <SectionCard title="Blockchain prête à l'emploi" subtitle="Mainnet PoA optimisé pour la latence et le débit">
        <div className="grid-2">
          <article className="inner-card">
            <h3>État réseau</h3>
            <p>Statut: <span className="pill">{chainStatus?.status || 'loading'}</span></p>
            <p>Consensus: {chainStatus?.consensus || '—'}</p>
            <p>Hauteur bloc: {chainStatus?.blockHeight ?? '—'}</p>
            <p>Mempool: {chainStatus?.mempoolSize ?? '—'} tx</p>
          </article>

          <article className="inner-card">
            <h3>Performance</h3>
            <p>TPS observé: {chainStatus?.estimatedTps ?? '—'}</p>
            <p>Capacité max: {chainStatus?.capacityPerSecond ?? '—'} tx/s</p>
            <p>Temps de bloc: {chainStatus?.blockTimeMs ?? '—'} ms</p>
            <p>Transactions traitées: {chainStatus?.processedTx ?? '—'}</p>
          </article>
        </div>
        <button type="button" onClick={pushSampleBatch}>Injecter un batch de test (25 tx)</button>
        {chainMessage && <p>{chainMessage}</p>}
      </SectionCard>

      <SectionCard title="Modules en préparation" subtitle="Conçus pour se raccorder facilement à vos produits">
        <ul className="list">
          {modules.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </SectionCard>

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
