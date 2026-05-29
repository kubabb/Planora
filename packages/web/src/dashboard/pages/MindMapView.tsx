import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';

const transformer = new Transformer();

export function MindMapView() {
  const { id } = useParams<{ id: string }>();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const markmapRef = useRef<Markmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [fileError, setFileError] = useState(false);

  useEffect(() => {
    if (!id || !svgRef.current) return;
    setLoading(true);
    setFileError(false);

    // Cleanup previous Markmap instance
    markmapRef.current = null;
    // Clear SVG content
    if (svgRef.current) {
      svgRef.current.innerHTML = '';
    }

    fetch(`/api/projects/${id}/file/MINDMAP.md`)
      .then((res) => {
        if (!res.ok) {
          setFileError(true);
          setLoading(false);
          return '';
        }
        return res.text();
      })
      .then((markdown) => {
        if (!markdown) {
          setLoading(false);
          return;
        }
        const { root } = transformer.transform(markdown);
        const mm = Markmap.create(svgRef.current!, undefined, root);
        markmapRef.current = mm;
        // fit() after DOM is ready
        requestAnimationFrame(() => {
          mm.fit();
          setLoading(false);
        });
      })
      .catch(() => {
        setFileError(true);
        setLoading(false);
      });

    // Cleanup on unmount
    return () => {
      markmapRef.current = null;
    };
  }, [id]);

  return (
    <div className="mindmap-view">
      <div className="view-header">
        <Link to={`/project/${id}`} className="back-link">← Powrót do projektu</Link>
        <h2>Mind Map</h2>
      </div>
      {loading && <div className="loading">Ładowanie mapy myśli...</div>}
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
