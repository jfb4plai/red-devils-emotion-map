// Silhouette diable — tête stylisée avec deux cornes
// viewBox 0 0 280 220 — tracé horaire depuis pointe corne gauche
// Centre bbox : cx=140, cy=115

export const BELGIUM_POINTS = [
  [80, 15],   // pointe corne gauche
  [58, 65],   // base ext. corne gauche
  [18, 90],   // tête haut-gauche
  [8, 125],   // tête gauche
  [18, 165],  // tête bas-gauche
  [55, 198],  // menton gauche
  [140, 215], // menton bas
  [225, 198], // menton droit
  [262, 165], // tête bas-droit
  [272, 125], // tête droite
  [262, 90],  // tête haut-droit
  [222, 65],  // base ext. corne droite
  [200, 15],  // pointe corne droite
  [183, 48],  // base int. corne droite
  [165, 70],  // entre cornes droite
  [140, 58],  // creux entre cornes
  [115, 70],  // entre cornes gauche
  [97, 48],   // base int. corne gauche
];

// SVG path string (pour usage dans <svg> ou clip-path)
export const BELGIUM_SVG_PATH =
  'M ' + BELGIUM_POINTS.map(([x, y]) => `${x},${y}`).join(' L ') + ' Z';

export const BELGIUM_VIEWBOX = '0 0 280 220';
