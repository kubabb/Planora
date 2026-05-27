import { useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Transformer } from 'markmap-lib';
import { Markmap } from 'markmap-view';

const transformer = new Transformer();

export function MindMapView() {
  const { id } = useParams<{ id: string }>();
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!id || !svgRef.current) return;

    fetch(`/api/projects/${id}/file/MINDMAP.md`)
      .then((res) => res.text())
      .then((markdown) => {
        const { root } = transformer.transform(markdown);
        const mm = Markmap.create(svgRef.current!, undefined, root);
        mm.fit();
      })
      .catch(console.error);
  }, [id]);

  return (
    <div className="mindmap-view">
      <div className="view-header">
        <Link to={`/project/${id}`} className="back-link">← Back to Project</Link>
        <h2>Mind Map</h2>
      </div>
      <svg ref={svgRef} className="mindmap-svg" />
    </div>
  );
}
