import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import mermaid from 'mermaid';

mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'strict' });

interface DiagramBlock {
  id: string;
  code: string;
  svg?: string;
  error?: string;
}

export function GraphsView() {
  const { id } = useParams<{ id: string }>();
  const [diagrams, setDiagrams] = useState<DiagramBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [fileError, setFileError] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setDiagrams([]);
    setFileError(false);

    fetch(`/api/projects/${id}/file/ARCHITECTURE.md`)
      .then((res) => {
        if (!res.ok) {
          setFileError(true);
          setLoading(false);
          return '';
        }
        return res.text();
      })
      .then(async (markdown) => {
        if (!markdown) {
          setLoading(false);
          return;
        }

        // Regex handles both \n and \r\n line endings
        const blocks = [...markdown.matchAll(/```mermaid\s*[\r\n]+([\s\S]*?)```/gi)];
        if (blocks.length === 0) {
          setFileError(true);
          setLoading(false);
          return;
        }

        const results: DiagramBlock[] = [];
        for (let i = 0; i < blocks.length; i++) {
          const code = blocks[i][1].trim();
          const diagramId = `planora-graph-${id}-${i}-${Date.now()}`;
          try {
            const { svg } = await mermaid.render(diagramId, code);
            results.push({ id: diagramId, code, svg });
          } catch (err) {
            results.push({
              id: diagramId,
              code,
              error: err instanceof Error ? err.message : String(err),
            });
          }
        }
        setDiagrams(results);
        setLoading(false);
      })
      .catch(() => {
        setFileError(true);
        setLoading(false);
      });
  }, [id]);

  return (
    <div className="graphs-view">
      <div className="view-header">
        <Link to={`/project/${id}`} className="back-link">← Powrót do projektu</Link>
        <h2>Architecture Graphs</h2>
      </div>
      {loading && <div className="loading">Ładowanie diagramów...</div>}
      {fileError ? (
        <div className="empty-state">
          <h2>Brak diagramów</h2>
          <p>
            Uruchom <code>planora plan</code> lub <code>planora plan --ai</code> aby wygenerować diagramy architektury.
          </p>
        </div>
      ) : (
        <div className="mermaid-container">
          {diagrams.map((d) => (
            <div key={d.id} className="mermaid-diagram">
              {d.error ? (
                <div className="diagram-error">
                  <p>⚠ Błąd renderowania diagramu</p>
                  <pre>{d.error}</pre>
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: d.svg || '' }} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
