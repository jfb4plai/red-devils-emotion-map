import { useEffect, useRef } from 'react';
import { BELGIUM_POINTS } from '../lib/belgiumPath';
import { drawPatch } from '../lib/patchAlgo';

// Expose les points au module patchAlgo (évite l'import circulaire avec canvas)
if (typeof window !== 'undefined') {
  window.__belgiumPath__ = { BELGIUM_POINTS };
}

export default function PatchCanvas({ params, size = 220, className = '' }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !params) return;
    // Ratio Belgique : ~1.27 largeur/hauteur
    canvas.width  = size;
    canvas.height = Math.round(size * 0.76);
    drawPatch(canvas, params);
  }, [params, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={Math.round(size * 0.76)}
      className={`rounded ${className}`}
      style={{ imageRendering: 'crisp-edges' }}
    />
  );
}
