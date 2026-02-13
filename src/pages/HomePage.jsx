import useApiData from '../components/useApiData';
import SectionCard from '../components/SectionCard';

export default function HomePage() {
  const { data: watches, loading } = useApiData('/api/watches', []);

  return (
    <div className="stack">
      <section className="hero card">
        <p className="eyebrow">Version Hostinger compatible</p>
        <h2>Refonte complète en Vite + React + Express</h2>
        <p>
          Cette version remplace totalement l'ancien front statique et utilise uniquement des frameworks
          supportés par Hostinger (Vite/React côté client et Express côté API).
        </p>
      </section>

      <SectionCard title="Tendances marché" subtitle="Montres suivies">
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
    </div>
  );
}
