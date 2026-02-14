import { useState } from 'react';
import SectionCard from '../components/SectionCard';
import useApiData from '../components/useApiData';

const roles = [
  'Particuliers : gestion de portefeuille tokenisé et historique de propriété',
  'Professionnels : administration flotte de montres et récupération de tokens',
  'Administrateurs : contrôle des identifiants, permissions et validation GitHub',
  'Employés (futur) : accès limité selon rôle opérationnel'
];

export default function AccountPage() {
  const { data: overview, loading } = useApiData('/api/account-overview?userId=1', {});
  const { data: activities, loading: loadingActivities } = useApiData('/api/account-activities?userId=1', []);
  const [form, setForm] = useState({ fullName: '', email: '', idNumber: '' });
  const [message, setMessage] = useState('');

  const onSubmit = async event => {
    event.preventDefault();
    setMessage('');

    const response = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });

    const payload = await response.json();
    setMessage(payload.message || payload.error);
  };

  return (
    <div className="stack">
      <SectionCard title="Vue compte" subtitle="KYC, gouvernance et permissions">
        {loading ? <p>Chargement...</p> : (
          <ul className="list">
            <li>Profil: {overview.profile?.tier || 'Aucun'}</li>
            <li>Score liquidité: {overview.profile?.liquidityScore || '-'}</li>
            <li>Nombre de montres: {overview.watchCount}</li>
            <li>Unités totales: {overview.totalUnits || 0}</li>
            <li>Valeur calculée: {(overview.computedPortfolioValue || 0).toLocaleString('fr-FR')} €</li>
          </ul>
        )}
      </SectionCard>

      <SectionCard title="Architecture des accès" subtitle="Rôles applicatifs">
        <ul className="list">
          {roles.map(role => <li key={role}>{role}</li>)}
        </ul>
      </SectionCard>

      <SectionCard title="Sécurité renforcée" subtitle="MFA + wallet + protocoles">
        <div className="grid-2">
          <article className="inner-card">
            <h3>Authentification multi-facteurs</h3>
            <p>Connexion prévue avec identifiant, mot de passe, A2F et identifiant wallet.</p>
          </article>
          <article className="inner-card">
            <h3>Récupération contrôlée</h3>
            <p>Restauration de token soumise à validation iralink-agency pour limiter les fraudes.</p>
          </article>
        </div>
      </SectionCard>

      <SectionCard title="Journal d’activité" subtitle="Suivi opérationnel du compte">
        {loadingActivities ? <p>Chargement...</p> : (
          <ul className="list">
            {activities.map(item => (
              <li key={item.id}>{item.label} — {item.date}</li>
            ))}
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
        {message && <p>{message}</p>}
      </SectionCard>
    </div>
  );
}
