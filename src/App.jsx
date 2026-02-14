import HomePage from './pages/HomePage';

function LogoMark() {
  return (
    <div className="logo-wrap" aria-hidden="true">
      <span className="logo-ring" />
      <span className="logo-core" />
    </div>
  );
}

export default function App() {
  return (
    <div className="app-shell">
      <div className="backdrop-orb orb-left" aria-hidden="true" />
      <div className="backdrop-orb orb-right" aria-hidden="true" />

      <header className="site-header">
        <div className="container nav-wrap">
          <div className="brand-line">
            <LogoMark />
            <div>
              <h1 className="brand">iralink<span>.agency</span></h1>
              <p className="tagline">AI-native blockchain operations</p>
            </div>
          </div>
          <p className="subtagline">Identité sombre, premium et technologique basée sur votre logo noir.</p>
        </div>
      </header>

      <main className="container app-main">
        <HomePage />
      </main>

      <footer className="site-footer container">
        <p>iralink Agency — Beta opérationnelle • accès, demandes produit et supervision en direct.</p>
      </footer>
    </div>
  );
}
