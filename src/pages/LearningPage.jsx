import SectionCard from '../components/SectionCard';
import useApiData from '../components/useApiData';

const tracks = [
  {
    title: 'Blockchain mère & sous-chaînes',
    text: 'Modéliser la hiérarchie marque > modèle > variation pour certifier l’origine et les changements de propriété.'
  },
  {
    title: 'RFID et preuve physique',
    text: 'Relier l’objet réel au token pour rendre impossible la duplication sans rupture de confiance.'
  },
  {
    title: 'Sécurité transactionnelle',
    text: 'Appliquer MFA, politiques de permissions et récupération contrôlée des actifs numériques.'
  }
];

export default function LearningPage() {
  const { data: formations, loading } = useApiData('/api/formations', []);

  return (
    <div className="stack">
      <SectionCard title="Parcours Academy" subtitle="Compétences critiques">
        <div className="grid-2">
          {tracks.map(track => (
            <article key={track.title} className="inner-card">
              <h3>{track.title}</h3>
              <p>{track.text}</p>
            </article>
          ))}
        </div>
      </SectionCard>

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
    </div>
  );
}
