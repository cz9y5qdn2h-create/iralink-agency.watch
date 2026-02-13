export default function SectionCard({ title, subtitle, children }) {
  return (
    <section className="card">
      <div className="section-head">
        <p className="eyebrow">{subtitle}</p>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
