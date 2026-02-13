import { useState } from 'react';
import SectionCard from '../components/SectionCard';
import useApiData from '../components/useApiData';
import Seo from '../components/Seo';

export default function PortfolioPage() {
  const { data: rows, loading, error, refetch } = useApiData('/api/portfolio?userId=1', []);
  const [payload, setPayload] = useState({ userId: 1, model: '', quantity: 1 });
  const [message, setMessage] = useState('');

  const addWatch = async event => {
    event.preventDefault();
    setMessage('');
    try {
      const response = await fetch('/api/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      setMessage(result.message || result.error || 'Réponse inconnue');
      if (response.ok) {
        setPayload({ userId: 1, model: '', quantity: 1 });
        refetch();
      }
    } catch {
      setMessage("Erreur réseau, impossible d'ajouter la montre.");
    }
  };

  return (
    <SectionCard title="Mon patrimoine horloger" subtitle="Valorisation dynamique">
      <Seo
        title="Patrimoine horloger et valorisation"
        description="Ajoutez vos montres et suivez automatiquement la valeur de votre portefeuille horloger de luxe."
        path="/patrimoine"
      />
      {loading && <p>Chargement du patrimoine...</p>}
      {error && <p>{error}</p>}
      <div className="grid-2">
        {rows.map(item => (
          <article key={item.id} className="inner-card">
            <h3>{item.model}</h3>
            <p>Quantité: {item.quantity}</p>
            <p>Valeur: {item.totalValue.toLocaleString('fr-FR')} €</p>
          </article>
        ))}
      </div>
      <form className="form" onSubmit={addWatch}>
        <input placeholder="Modèle" value={payload.model} onChange={e => setPayload({ ...payload, model: e.target.value })} required />
        <input type="number" min="1" value={payload.quantity} onChange={e => setPayload({ ...payload, quantity: Number(e.target.value) })} required />
        <button type="submit">Ajouter au patrimoine</button>
      </form>
      {message && <p className="message">{message}</p>}
    </SectionCard>
  );
}
