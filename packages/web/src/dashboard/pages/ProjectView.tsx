import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';

type Project = {
  id: string;
  name: string;
  description: string;
  stack: string;
  base_path: string;
  updated_at: string;
};

export function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [markdown, setMarkdown] = useState('');
  const [loading, setLoading] = useState(true);
  const [fileError, setFileError] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/projects/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProject(data);
        return fetch(`/api/projects/${id}/file/PROJECT_PLAN.md`);
      })
      .then((res) => {
        if (!res.ok) {
          setFileError(true);
          return '';
        }
        return res.text();
      })
      .then((text) => {
        setMarkdown(text);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="loading">Ładowanie projektu...</div>;
  }

  if (!project) {
    return <div className="error">Nie znaleziono projektu</div>;
  }

  return (
    <div className="project-view">
      <div className="project-header">
        <Link to="/" className="back-link">← Powrót do dashboardu</Link>
        <h1>{project.name}</h1>
        <p>{project.description}</p>
      </div>

      <nav className="project-tabs">
        <Link to={`/project/${id}`} className="tab active">Overview</Link>
        <Link to={`/project/${id}/mindmap`} className="tab">Mind Map</Link>
        <Link to={`/project/${id}/graphs`} className="tab">Graphs</Link>
      </nav>

      <div className="markdown-content">
        {fileError ? (
          <div className="empty-state">
            <h2>Brak planu projektu</h2>
            <p>
              Uruchom <code>planora plan</code> lub <code>planora plan --ai</code> aby wygenerować plan.
            </p>
          </div>
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
            {markdown}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
