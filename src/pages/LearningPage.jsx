import SectionCard from '../components/SectionCard';
import useApiData from '../components/useApiData';

export default function LearningPage() {
  const { data: formations, loading } = useApiData('/api/formations', []);

  return (
    <SectionCard title="Formations gratuites" subtitle="Academy">
      {loading ? <p>Chargement...</p> : (
        <div className="grid-2">
          {formations.map(course => (
            <article key={course.id} className="inner-card">
              <p className="pill">{course.level}</p>
              <h3>{course.title}</h3>
              <p>{course.summary}</p>
              <small>{course.tags.join(' • ')}</small>
            </article>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
