// Maillot des Diables Rouges — SVG pur, sans image externe
export default function JerseyLogo({ size = 48, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 110"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Maillot des Diables Rouges"
    >
      {/* Corps du maillot */}
      <path
        d="M28 28 L10 45 L18 50 L18 100 L82 100 L82 50 L90 45 L72 28 L62 22 C60 30 40 30 38 22 Z"
        fill="#CC0000"
      />
      {/* Manche gauche */}
      <path
        d="M28 28 L10 20 L5 38 L18 45 Z"
        fill="#CC0000"
      />
      {/* Manche droite */}
      <path
        d="M72 28 L90 20 L95 38 L82 45 Z"
        fill="#CC0000"
      />
      {/* Col V */}
      <path
        d="M38 22 C40 30 60 30 62 22 L50 40 Z"
        fill="#1A1A1A"
      />
      {/* Liseré col manche gauche */}
      <path
        d="M10 20 L28 28 L10 45 L5 38 Z"
        fill="none"
        stroke="#1A1A1A"
        strokeWidth="2"
      />
      {/* Liseré col manche droite */}
      <path
        d="M90 20 L72 28 L90 45 L95 38 Z"
        fill="none"
        stroke="#1A1A1A"
        strokeWidth="2"
      />
      {/* Étoile centre */}
      <path
        d="M50 55 L51.5 60 L56.5 60 L52.5 63 L54 68 L50 65 L46 68 L47.5 63 L43.5 60 L48.5 60 Z"
        fill="#FFD700"
      />
      {/* Numéro fictif */}
      <text
        x="50"
        y="90"
        textAnchor="middle"
        fontSize="18"
        fontWeight="900"
        fontFamily="Inter, sans-serif"
        fill="#FFD700"
        letterSpacing="-1"
      >
        10
      </text>
      {/* Contour général */}
      <path
        d="M28 28 L10 20 L5 38 L10 45 L18 50 L18 100 L82 100 L82 50 L90 45 L95 38 L90 20 L72 28 L62 22 C60 30 40 30 38 22 Z"
        fill="none"
        stroke="#990000"
        strokeWidth="1.5"
      />
    </svg>
  );
}
