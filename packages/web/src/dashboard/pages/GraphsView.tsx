import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'strict' });

export function GraphsView() {
  const { id } = useParams<{ id: string }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [fileError, setFileError] = useState(false);

  useEffect(() => {
    if (!id || !containerRef.current) return;

    fetch(`/api/projects/${id}/file/ARCHITECTURE.md`)
      .then((res) => {
        if (!res.ok) {
          setFileError(true);
          return '';
        }
        return res.text();
      })
      .then(async (markdown) => {
        if (!markdown) return;
        const blocks = markdown.match(/```mermaid\n([\s\S]*?)```/g) || [];
        if (blocks.length === 0) {
          setFileError(true);
          return;
        }
        const container = containerRef.current!;
        container.innerHTML = '';

        for (let i = 0; i < blocks.length; i++) {
          const code = blocks[i].replace(/```mermaid\n|```/g, '').trim();
          const div = document.createElement('div');
          div.className = 'mermaid-diagram';
          container.appendChild(div);

          const mermaidId = `mermaid-${id}-${Date.now()}-${i}`;
          const { svg } = await mermaid.render(mermaidId, code);
          div.innerHTML = svg;
        }
      })
      .catch(() => setFileError(true));
  }, [id]);

  return (
    <div className="graphs-view">
      <div className="view-header">
        <Link to={`/project/${id}`} className="back-link">← Powrót do projektu</Link>
        <h2>Architecture Graphs</h2>
      </div>
      {fileError ? (
        <div className="empty-state">
          <h2>Brak diagramów</h2>
          <p>
            Uruchom <code>planora plan</code> lub <code>planora plan --ai</code> aby wygenerować diagramy architektury.
          </p>
        </div>
      ) : (
        <div ref={containerRef} className="mermaid-container" />
      )}
    </div>
  );
}
