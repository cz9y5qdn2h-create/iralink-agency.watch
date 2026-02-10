import { formatOpportunityLabel } from '../lib/opportunity';

const opportunities = [
  { id: 'w_001', score: 0.91 },
  { id: 'w_002', score: 0.74 }
];

export default function Home() {
  return (
    <main style={{ padding: 24, fontFamily: 'Arial, sans-serif' }}>
      <h1>Watch Opportunities Dashboard</h1>
      <p>Monorepo bootstrap (Next.js + FastAPI + services).</p>
      <ul>
        {opportunities.map((item) => (
          <li key={item.id}>{formatOpportunityLabel(item.id, item.score)}</li>
        ))}
      </ul>
    </main>
  );
}
