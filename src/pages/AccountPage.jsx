import { useState } from 'react';
import SectionCard from '../components/SectionCard';
import useApiData from '../components/useApiData';
import Seo from '../components/Seo';

export default function AccountPage() {
  const { data: overview, loading, refetch } = useApiData('/api/account-overview?userId=1', {});
  const [form, setForm] = useState({ fullName: '', email: '', idNumber: '' });
  const [message, setMessage] = useState('');

  const onSubmit = async event => {
    event.preventDefault();
    setMessage('');

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const payload = await response.json();
      setMessage(payload.message || payload.error || 'Réponse inconnue');
      if (response.ok) {
        setForm({ fullName: '', email: '', idNumber: '' });
        refetch();
      }
    } catch {
      setMessage("Erreur réseau, réessayez dans quelques secondes.");
    }
  };

  return (
    <div className="stack">
      <Seo
        title="Compte sécurisé et onboarding KYC"
        description="Créez un compte IL-Watch, passez le KYC et suivez vos indicateurs de liquidité en temps réel."
        path="/compte"
      />
      <SectionCard title="Vue compte" subtitle="KYC & onboarding">
        {loading ? <p>Chargement...</p> : (
          <ul className="list">
            <li>Profil: {overview.profile?.tier || 'Aucun'}</li>
            <li>Score liquidité: {overview.profile?.liquidityScore || '-'}</li>
            <li>Nombre de montres: {overview.watchCount || 0}</li>
            <li>Valeur calculée: {(overview.computedPortfolioValue || 0).toLocaleString('fr-FR')} €</li>
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Créer un compte" subtitle="Formulaire API">
        <form className="form" onSubmit={onSubmit}>
          <input placeholder="Nom complet" value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} required />
          <input type="email" placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          <input placeholder="Pièce d'identité" value={form.idNumber} onChange={e => setForm({ ...form, idNumber: e.target.value })} required />
          <button type="submit">Créer mon compte</button>
        </form>
        {message && <p className="message">{message}</p>}
      </SectionCard>
    </div>
  );
}
