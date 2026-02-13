import { NavLink, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AccountPage from './pages/AccountPage';
import PortfolioPage from './pages/PortfolioPage';
import LearningPage from './pages/LearningPage';
import MarketplacePage from './pages/MarketplacePage';
import Seo from './components/Seo';

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/compte', label: 'Compte' },
  { to: '/patrimoine', label: 'Patrimoine' },
  { to: '/formations', label: 'Formations' },
  { to: '/marketplace', label: 'Marketplace' }
];

function NotFoundPage() {
  return (
    <section className="card">
      <Seo
        title="Page introuvable"
        description="La page demandée n'existe pas sur IL-Watch."
        path="/404"
      />
      <h2>404 — Page introuvable</h2>
      <p>Retournez à l'accueil pour continuer votre navigation.</p>
    </section>
  );
}

export default function App() {
  return (
    <>
      <header className="site-header">
        <div className="container nav-wrap">
          <h1 className="brand">IL-<span>Watch</span></h1>
          <nav>
            {links.map(link => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => (isActive ? 'active' : '')}>
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="container app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/compte" element={<AccountPage />} />
          <Route path="/patrimoine" element={<PortfolioPage />} />
          <Route path="/formations" element={<LearningPage />} />
          <Route path="/marketplace" element={<MarketplacePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="container footer">
        <p>© {new Date().getFullYear()} IL-Watch — Plateforme trading horloger premium.</p>
      </footer>
    </>
  );
}
