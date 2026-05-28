import { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'strict' });

export function GraphsView() {
  const { id } = useParams<{ id: string }>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id || !containerRef.current) return;

    fetch(`/api/projects/${id}/file/ARCHITECTURE.md`)
      .then((res) => res.text())
      .then(async (markdown) => {
        const blocks = markdown.match(/```mermaid\n([\s\S]*?)```/g) || [];
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
      .catch(console.error);
  }, [id]);

  return (
    <div className="graphs-view">
      <div className="view-header">
        <Link to={`/project/${id}`} className="back-link">← Back to Project</Link>
        <h2>Architecture Graphs</h2>
      </div>
      <div ref={containerRef} className="mermaid-container" />
    </div>
  );
}
