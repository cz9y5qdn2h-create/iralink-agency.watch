import { NavLink, Route, Routes } from 'react-router-dom';
import HomePage from './pages/HomePage';
import AccountPage from './pages/AccountPage';
import PortfolioPage from './pages/PortfolioPage';
import LearningPage from './pages/LearningPage';
import MarketplacePage from './pages/MarketplacePage';

const links = [
  { to: '/', label: 'Accueil' },
  { to: '/compte', label: 'Compte' },
  { to: '/patrimoine', label: 'Patrimoine' },
  { to: '/formations', label: 'Formations' },
  { to: '/marketplace', label: 'Marketplace' }
];

export default function App() {
  return (
    <div className="app-shell">
      <div className="backdrop-orb orb-left" aria-hidden="true" />
      <div className="backdrop-orb orb-right" aria-hidden="true" />

      <header className="site-header">
        <div className="container nav-wrap">
          <h1 className="brand">IL-<span>Watch</span></h1>
          <nav>
            {links.map(link => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => isActive ? 'active' : ''}>
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
        </Routes>
      </main>

      <footer className="site-footer container">
        <p>IL-Watch Private Club • Analyse, acquisition & valorisation horlogère.</p>
      </footer>
    </div>
  );
}
