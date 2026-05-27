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
      .then((res) => res.json())
      .then((data) => {
        setProjects(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return <div className="dashboard-loading">Loading projects...</div>;
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Planora Dashboard</h1>
        <input
          type="text"
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <h2>No projects yet</h2>
          <p>Run <code>planora init</code> to create your first project.</p>
        </div>
      ) : (
        <div className="project-grid">
          {filtered.map((project) => (
            <Link key={project.id} to={`/project/${project.id}`} className="project-card">
              <h3>{project.name}</h3>
              <p className="project-description">{project.description || 'No description'}</p>
              <div className="project-meta">
                <span className="project-stack">{project.stack}</span>
                <span className="project-date">
                  Updated {new Date(project.updated_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
