import useApiData from '../components/useApiData';
import SectionCard from '../components/SectionCard';

const pillars = [
  {
    title: 'Authentification infalsifiable',
    text: 'Association physique RFID + token blockchain pour empêcher la copie et sécuriser l’identité de chaque montre.'
  },
  {
    title: 'Traçabilité hiérarchique',
    text: 'Chaîne mère, sous-chaînes par marque puis modèle pour auditer chaque variation et son historique complet.'
  },
  {
    title: 'Plateforme unifiée',
    text: 'Un même cockpit pour collectionneurs, marques, revendeurs et administrateurs avec permissions granulaires.'
  }
];

const roadmap = [
  'Recherche & cadrage des rôles (particuliers, pros, admin, employés)',
  'Développement front web/mobile orienté portefeuille & ownership',
  'Intégration API blockchain, smart contracts et vérification RFID',
  'Tests de sécurité (MFA, récupération token, protocoles d’accès)'
];

export default function HomePage() {
  const { data: watches, loading } = useApiData('/api/watches', []);

  return (
    <div className="stack">
      <section className="hero card">
        <p className="eyebrow">Fiche technique finale iralink-agency</p>
        <h2>Passeport numérique sécurisé pour montres d’exception</h2>
        <p>
          L’application connecte de façon infalsifiable la montre physique, son identité RFID et son NFT afin de
          garantir authenticité, traçabilité et confiance sur le marché secondaire.
        </p>
      </section>

      <SectionCard title="Fondations produit" subtitle="Vision stratégique">
        <div className="grid-2">
          {pillars.map(item => (
            <article key={item.title} className="inner-card">
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Tendances marché" subtitle="Montres tokenisées suivies">
        {loading ? (
          <p>Chargement des prix...</p>
        ) : (
          <div className="grid-2">
            {watches.map(item => (
              <article key={item.id} className="inner-card">
                <h3>{item.model}</h3>
                <p>{item.brand}</p>
                <p>{item.currentPrice.toLocaleString('fr-FR')} €</p>
                <span className={item.change1Y >= 0 ? 'up' : 'down'}>{item.change1Y}% (1 an)</span>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Roadmap d’exécution" subtitle="Du prototype au déploiement">
        <ol className="list numbered-list">
          {roadmap.map(step => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </SectionCard>
    </div>
  );
}
