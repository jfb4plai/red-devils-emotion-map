// Titre rendu avec l'alphabet Diables Rouges (images PNG extraites du PPTX)
// Chaque lettre = une image 1:1 (fond sombre transparent)
// Usage : <AlphabetTitle size={40} /> → affiche "RED DEVILS / EMOTION MAP"

const LETTERS = {
  A: '/alphabet/A.png',
  D: '/alphabet/D.png',
  E: '/alphabet/E.png',
  I: '/alphabet/I.png',
  L: '/alphabet/L.png',
  M: '/alphabet/M.png',
  N: '/alphabet/N.png',
  O: '/alphabet/O.png',
  P: '/alphabet/P.png',
  R: '/alphabet/R.png',
  S: '/alphabet/S.png',
  T: '/alphabet/T.png',
  V: '/alphabet/V.png',
};

function Word({ word, size }) {
  return (
    <span className="flex items-center" style={{ gap: size * 0.04 }}>
      {word.split('').map((char, i) => {
        const src = LETTERS[char];
        if (!src) return null;
        return (
          <img
            key={i}
            src={src}
            alt={char}
            style={{ width: size, height: size, display: 'block', objectFit: 'contain' }}
            draggable={false}
          />
        );
      })}
    </span>
  );
}

// size = hauteur d'une lettre en px
export default function AlphabetTitle({ size = 40 }) {
  const letterGap = size * 0.04;
  const wordGap = size * 0.6; // espace visible entre mots
  return (
    <div className="flex flex-col items-start" style={{ gap: size * 0.08 }}>
      {/* Ligne 1 : RED DEVILS */}
      <div className="flex items-center" style={{ gap: wordGap }}>
        <Word word="RED" size={size} />
        <Word word="DEVILS" size={size} />
      </div>
      {/* Ligne 2 : EMOTION MAP */}
      <div className="flex items-center" style={{ gap: wordGap }}>
        <Word word="EMOTION" size={size} />
        <Word word="MAP" size={size} />
      </div>
    </div>
  );
}
