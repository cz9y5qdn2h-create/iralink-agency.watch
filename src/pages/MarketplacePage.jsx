import { useMemo, useState } from 'react';
import SectionCard from '../components/SectionCard';
import useApiData from '../components/useApiData';
import Seo from '../components/Seo';

export default function MarketplacePage() {
  const { data: listings, loading, refetch } = useApiData('/api/listings', []);
  const [draft, setDraft] = useState({ model: '', price: '', condition: '', seller: '' });
  const [result, setResult] = useState('');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return listings;
    return listings.filter(item => `${item.model} ${item.seller} ${item.condition}`.toLowerCase().includes(q));
  }, [listings, query]);

  const publish = async event => {
    event.preventDefault();
    setResult('');
    try {
      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft)
      });
      const payload = await response.json();
      setResult(payload.message || payload.error || 'Réponse inconnue');
      if (response.ok) {
        setDraft({ model: '', price: '', condition: '', seller: '' });
        refetch();
      }
    } catch {
      setResult('Erreur réseau, publication impossible.');
    }
  };

  return (
    <div className="stack">
      <Seo
        title="Marketplace montres de luxe"
        description="Parcourez les annonces, comparez les prix et publiez vos montres sur la marketplace IL-Watch."
        path="/marketplace"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Marketplace montres de luxe IL-Watch',
          url: 'https://iralink-agency.watch/marketplace'
        }}
      />
      <SectionCard title="Marketplace" subtitle="Acheter / vendre / échanger">
        <input
          placeholder="Rechercher un modèle, un vendeur, un état..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          aria-label="Recherche marketplace"
        />
        {loading ? <p>Chargement...</p> : (
          <div className="grid-2">
            {filtered.map(item => (
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

      <SectionCard title="Publier une annonce" subtitle="Endpoint POST /api/listings">
        <form className="form" onSubmit={publish}>
          <input placeholder="Modèle" required value={draft.model} onChange={e => setDraft({ ...draft, model: e.target.value })} />
          <input type="number" placeholder="Prix" required value={draft.price} onChange={e => setDraft({ ...draft, price: e.target.value })} />
          <input placeholder="État" required value={draft.condition} onChange={e => setDraft({ ...draft, condition: e.target.value })} />
          <input placeholder="Vendeur" required value={draft.seller} onChange={e => setDraft({ ...draft, seller: e.target.value })} />
          <button type="submit">Publier</button>
        </form>
        {result && <p className="message">{result}</p>}
      </SectionCard>
    </div>
  );
}
