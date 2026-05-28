import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';

const transformer = new Transformer();

export function MindMapView() {
  const { id } = useParams<{ id: string }>();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [fileError, setFileError] = useState(false);

  useEffect(() => {
    if (!id || !svgRef.current) return;

    fetch(`/api/projects/${id}/file/MINDMAP.md`)
      .then((res) => {
        if (!res.ok) {
          setFileError(true);
          return '';
        }
        return res.text();
      })
      .then((markdown) => {
        if (!markdown) return;
        const { root } = transformer.transform(markdown);
        const mm = Markmap.create(svgRef.current!, undefined, root);
        mm.fit();
      })
      .catch(() => setFileError(true));
  }, [id]);

  return (
    <div className="mindmap-view">
      <div className="view-header">
        <Link to={`/project/${id}`} className="back-link">← Powrót do projektu</Link>
        <h2>Mind Map</h2>
      </div>
      {fileError ? (
        <div className="empty-state">
          <h2>Brak mapy myśli</h2>
          <p>
            Uruchom <code>planora plan</code> lub <code>planora mindmap</code> aby wygenerować mindmapę.
          </p>
        </div>
      ) : (
        <svg ref={svgRef} className="mindmap-svg" />
      )}
    </div>
  );
}
