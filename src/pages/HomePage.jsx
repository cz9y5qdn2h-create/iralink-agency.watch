import useApiData from '../components/useApiData';
import SectionCard from '../components/SectionCard';
import Seo from '../components/Seo';

export default function HomePage() {
  const { data: watches, loading } = useApiData('/api/watches', []);

  return (
    <div className="stack">
      <Seo
        title="Marketplace & Trading Horloger de Luxe"
        description="Suivez les prix des montres de luxe, gérez votre patrimoine et accédez à une marketplace premium sur IL-Watch."
        path="/"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          name: 'IL-Watch',
          url: 'https://iralink-agency.watch',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://iralink-agency.watch/marketplace?q={search_term_string}',
            'query-input': 'required name=search_term_string'
          }
        }}
      />
      <section className="hero card">
        <p className="eyebrow">Version Hostinger compatible</p>
        <h2>Plateforme 100% opérationnelle pour le watch trading</h2>
        <p>
          Architecture solide en Vite + React + Express avec endpoints API actifs, pages métiers
          structurées et base SEO complète pour accélérer votre visibilité organique.
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
