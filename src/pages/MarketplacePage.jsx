import { useState } from 'react';
import SectionCard from '../components/SectionCard';
import useApiData from '../components/useApiData';

const verificationFlow = [
  'Vérification RFID et correspondance du token avant publication',
  'Contrôle historique de propriété et statut des transactions',
  'Validation opérée par iralink-agency pour les opérations sensibles'
];

export default function MarketplacePage() {
  const { data: listings, loading } = useApiData('/api/listings', []);
  const [draft, setDraft] = useState({ model: '', price: '', condition: '', seller: '' });
  const [result, setResult] = useState('');

  const publish = async event => {
    event.preventDefault();
    const response = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft)
    });
    const payload = await response.json();
    setResult(payload.message || payload.error);
  };

  return (
    <div className="stack">
      <SectionCard title="Marketplace" subtitle="Acheter / vendre / échanger avec preuve d’authenticité">
        {loading ? <p>Chargement...</p> : (
          <div className="grid-2">
            {listings.map(item => (
              <article className="inner-card" key={item.id}>
                <h3>{item.model}</h3>
                <p>{item.condition}</p>
                <p>{item.price.toLocaleString('fr-FR')} €</p>
                <small>Vendeur: {item.seller}</small>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Workflow de vérification" subtitle="Intégration plateformes de revente">
        <ul className="list">
          {verificationFlow.map(step => <li key={step}>{step}</li>)}
        </ul>
      </SectionCard>

      <SectionCard title="Publier une annonce" subtitle="Endpoint POST /api/listings">
        <form className="form" onSubmit={publish}>
          <input placeholder="Modèle" required value={draft.model} onChange={e => setDraft({ ...draft, model: e.target.value })} />
          <input type="number" placeholder="Prix" required value={draft.price} onChange={e => setDraft({ ...draft, price: e.target.value })} />
          <input placeholder="État" required value={draft.condition} onChange={e => setDraft({ ...draft, condition: e.target.value })} />
          <input placeholder="Vendeur" required value={draft.seller} onChange={e => setDraft({ ...draft, seller: e.target.value })} />
          <button type="submit">Publier</button>
        </form>
        {result && <p>{result}</p>}
      </SectionCard>
    </div>
  );
}
