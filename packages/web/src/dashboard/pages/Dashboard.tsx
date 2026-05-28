import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

type Project = {
  id: string;
  name: string;
  description: string;
  stack: string;
  updated_at: string;
};

export function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => {
        if (!res.ok) return [];
        return res.json();
      })
      .then((data) => {
        setProjects(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setProjects([]);
        setLoading(false);
      });
  }, []);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return <div className="dashboard-loading">Ładowanie projektów...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Planora Dashboard</h1>
        {projects.length > 0 && (
          <input
            type="text"
            placeholder="Szukaj projektów..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        )}
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <h2>Brak projektów</h2>
          <p>Uruchom w terminalu aby stworzyć pierwszy projekt:</p>
          <div className="empty-state__steps">
            <code>planora init</code>
            <span className="empty-state__arrow">→</span>
            <code>planora plan --ai</code>
            <span className="empty-state__arrow">→</span>
            <code>planora web</code>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h2>Brak wyników</h2>
          <p>Nie znaleziono projektów pasujących do "{search}"</p>
        </div>
      ) : (
        <div className="project-grid">
          {filtered.map((project) => (
            <Link key={project.id} to={`/project/${project.id}`} className="project-card">
              <h3>{project.name}</h3>
              <p className="project-description">{project.description || 'Brak opisu'}</p>
              <div className="project-meta">
                <span className="project-stack">{project.stack}</span>
                <span className="project-date">
                  {new Date(project.updated_at).toLocaleDateString('pl-PL')}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
