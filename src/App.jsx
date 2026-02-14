import HomePage from './pages/HomePage';

export default function App() {
  return (
    <div className="app-shell">
      <div className="backdrop-orb orb-left" aria-hidden="true" />
      <div className="backdrop-orb orb-right" aria-hidden="true" />

      <header className="site-header">
        <div className="container nav-wrap">
          <h1 className="brand">iralink<span>.agency</span></h1>
          <p className="tagline">Ecosystème blockchain souverain • IA défensive • Traçabilité physique/numérique</p>
        </div>
      </header>

      <main className="container app-main">
        <HomePage />
      </main>

      <footer className="site-footer container">
        <p>iralink Agency — plateforme en préparation pour https://iralink.reducisagency</p>
      </footer>
    </div>
  );
}
