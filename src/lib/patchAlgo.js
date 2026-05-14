// Génération déterministe des paramètres visuels du patch
// Mêmes inputs → même patch, toujours.

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < (str || '').length; i++) {
    hash = Math.imul(31, hash) + str.charCodeAt(i) | 0;
  }
  return Math.abs(hash);
}

// Couleurs évitant noir/jaune/rouge (conflit avec drapeau belge sur la carte)
const EMOTION_COLORS = {
  joie:        { primary: '#3B82F6', secondary: '#BFDBFE' }, // bleu
  rage:        { primary: '#F97316', secondary: '#FED7AA' }, // orange vif (pas rouge)
  espoir:      { primary: '#10B981', secondary: '#A7F3D0' }, // vert émeraude (pas or)
  fierté:      { primary: '#6366F1', secondary: '#C7D2FE' }, // indigo (pas noir)
  déchirement: { primary: '#7C3AED', secondary: '#DDD6FE' }, // violet
};

const PATTERN_MAP = {
  seul:    'circles',
  famille: 'horizontal',
  amis:    'diagonal',
  bar:     'dots',
  stade:   'grid',
};

export function computePatchParams(form) {
  const { annee_debut, emotion, contexte, transmission, intensite, mot_cle, premier_souvenir } = form;

  const years = Math.max(0, new Date().getFullYear() - (annee_debut || new Date().getFullYear()));
  const sizeRatio = 0.55 + Math.min(years / 35, 1) * 0.45; // 0.55 (récent) → 1.0 (35+ ans)

  const colors = EMOTION_COLORS[emotion] || EMOTION_COLORS.espoir;
  const pattern = PATTERN_MAP[contexte] || 'horizontal';
  const texture = transmission === 'transmis' ? 'solid' : 'dashed';
  const lineWidth = 1 + (Number(intensite) || 3) * 0.7;

  const hash = hashString(premier_souvenir || 'diables');
  const asymmetry = ((hash % 21) - 10) / 100;  // −0.10 → +0.10
  const rotation  = ((hash % 13) - 6) * 0.4;   // −2.4° → +2.4°

  return { sizeRatio, colors, pattern, texture, lineWidth, filigrane: mot_cle || '', asymmetry, rotation, seed: hash };
}

// Dessin complet sur un HTMLCanvasElement
export function drawPatch(canvas, params) {
  if (!canvas || !params) return;
  const { BELGIUM_POINTS } = window.__belgiumPath__ || {};
  if (!BELGIUM_POINTS) return;

  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);

  const { sizeRatio, colors, pattern, texture, lineWidth, filigrane, rotation } = params;

  const scaleX = W / 264;
  const scaleY = H / 200;
  const cx = 140, cy = 115;

  // Construire Path2D depuis les points Belgique
  const path = new Path2D();
  BELGIUM_POINTS.forEach(([x, y], i) => {
    const px = (x - cx) * sizeRatio * scaleX + W / 2;
    const py = (y - cy) * sizeRatio * scaleY + H / 2;
    if (i === 0) path.moveTo(px, py);
    else path.lineTo(px, py);
  });
  path.closePath();

  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.translate(-W / 2, -H / 2);

  // Remplissage fond
  ctx.fillStyle = colors.primary;
  ctx.fill(path);

  // Clip + motif
  ctx.save();
  ctx.clip(path);
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(texture === 'dashed' ? [8, 5] : []);
  drawPattern(ctx, pattern, W, H, lineWidth, params.seed);

  // Filigrane
  if (filigrane) {
    const fs = Math.max(14, W * 0.16);
    ctx.font = `900 ${fs}px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(filigrane.toUpperCase(), W / 2, H / 2);
  }
  ctx.restore();

  // Bordure
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([]);
  ctx.stroke(path);

  ctx.restore();
}

function drawPattern(ctx, pattern, W, H, lineWidth, seed) {
  const spacing = Math.max(10, 22 - lineWidth * 1.5);

  switch (pattern) {
    case 'horizontal':
      for (let y = spacing / 2; y < H; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      break;

    case 'diagonal':
      for (let x = -H; x < W + H; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H, H); ctx.stroke();
      }
      break;

    case 'grid':
      for (let x = 0; x < W; x += spacing) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += spacing) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }
      break;

    case 'dots': {
      const r = Math.max(1.5, lineWidth * 0.7);
      const origStyle = ctx.strokeStyle;
      ctx.fillStyle = origStyle;
      for (let x = spacing / 2; x < W; x += spacing) {
        for (let y = spacing / 2; y < H; y += spacing) {
          ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        }
      }
      break;
    }

    case 'circles': {
      const maxR = Math.min(W, H) * 0.48;
      for (let r = spacing; r < maxR; r += spacing) {
        ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2); ctx.stroke();
      }
      break;
    }
  }
}
