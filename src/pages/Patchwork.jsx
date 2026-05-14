import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import JerseyLogo from '../components/JerseyLogo';
import AlphabetTitle from '../components/AlphabetTitle';
import { getAllPatches } from '../lib/supabase';
import { getCoords } from '../lib/postalCodes';
import { BELGIUM_POINTS } from '../lib/belgiumPath';

// CSS pulse animation injecté une fois
const PULSE_STYLE = `
@keyframes markerPulse {
  0%   { box-shadow: 0 0 0 0 rgba(255,255,255,0.35); }
  70%  { box-shadow: 0 0 0 10px rgba(255,255,255,0); }
  100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); }
}
.marker-pulse { animation: markerPulse 2.2s ease-out infinite; }
`;
if (typeof document !== 'undefined' && !document.getElementById('marker-pulse-style')) {
  const s = document.createElement('style');
  s.id = 'marker-pulse-style';
  s.textContent = PULSE_STYLE;
  document.head.appendChild(s);
}



export default function Patchwork() {
  const mapRef      = useRef(null);
  const leafletRef  = useRef(null);
  const [patches, setPatches]   = useState([]);
  const [count, setCount]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]         = useState('tous');
  const [selectedCP, setSelectedCP] = useState('');
  const [openEmotion, setOpenEmotion] = useState(null);
  const [showRanking, setShowRanking] = useState(false);

  useEffect(() => {
    getAllPatches().then(({ data }) => {
      setPatches(data || []);
      setCount((data || []).length);
      setLoading(false);
    });
  }, []);

  // Initialiser Leaflet après chargement des patches
  useEffect(() => {
    if (loading || !mapRef.current || leafletRef.current) return;

    import('leaflet').then(L => {
      import('leaflet/dist/leaflet.css');

      const map = L.map(mapRef.current, {
        center: [50.5, 4.5],
        zoom: 8,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '© OpenStreetMap © CARTO',
        subdomains: 'abcd',
        maxZoom: 18,
      }).addTo(map);

      leafletRef.current = map;

      // Overlay drapeau belge : 3 bandes verticales N/J/R, opacité 12%
      // Belgique : ~49.5°N–51.5°N, 2.5°E–6.4°E → tiers longitudinaux
      const lng1 = 2.5, lng2 = 6.4, lngStep = (lng2 - lng1) / 3;
      const latS = 49.4, latN = 51.55;
      [
        { color: '#000000', w: [lng1, lng1 + lngStep] },
        { color: '#FFD700', w: [lng1 + lngStep, lng1 + lngStep * 2] },
        { color: '#CC0000', w: [lng1 + lngStep * 2, lng2] },
      ].forEach(({ color, w }) => {
        L.rectangle([[latS, w[0]], [latN, w[1]]], {
          color: 'transparent',
          fillColor: color,
          fillOpacity: 0.12,
          interactive: false,
        }).addTo(map);
      });

      addMarkers(L, map, patches, filter);
    });

    return () => {
      leafletRef.current?.remove();
      leafletRef.current = null;
    };
  }, [loading]);

  // Rafraîchir les markers quand filtre change
  useEffect(() => {
    const map = leafletRef.current;
    if (!map) return;
    import('leaflet').then(L => {
      map.eachLayer(layer => { if (layer instanceof L.Marker) map.removeLayer(layer); });
      addMarkers(L, map, patches, filter);
    });
  }, [filter, patches]);

  const emotions = ['tous', 'joie', 'rage', 'espoir', 'fierté', 'déchirement'];
  const emotionColors = {
    joie: '#3B82F6', rage: '#F97316', espoir: '#10B981', fierté: '#6366F1', déchirement: '#7C3AED',
  };

  // Liste triée des CP avec au moins 1 supporter
  const cpList = [...new Set(patches.map(p => p.code_postal))].sort();

  // Classement CP par nombre de supporters
  const cpRanking = Object.entries(
    patches.reduce((acc, p) => { acc[p.code_postal] = (acc[p.code_postal] || 0) + 1; return acc; }, {})
  ).sort((a, b) => b[1] - a[1]).slice(0, 10);

  // Groupes émotion pour le CP sélectionné
  const cpGroups = selectedCP
    ? emotions.slice(1).reduce((acc, e) => {
        const group = patches.filter(p => p.code_postal === selectedCP && p.emotion === e);
        if (group.length > 0) acc[e] = group;
        return acc;
      }, {})
    : {};

  return (
    <div className="min-h-screen bg-diable-dark text-white flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center gap-3">
          <JerseyLogo size={32} />
          <AlphabetTitle size={18} />
        </div>
        <Link to="/" className="text-white/40 hover:text-white/70 text-sm transition-colors">Accueil</Link>
      </header>

      {/* Barre de contrôles */}
      <div className="px-6 py-3 border-b border-white/10 flex items-center gap-4 flex-wrap flex-shrink-0">
        <span className="text-white/50 text-sm">
          <span className="text-diable-gold font-bold">{count}</span> empreinte{count !== 1 ? 's' : ''}
        </span>
        <div className="flex gap-2 flex-wrap">
          {emotions.map(e => (
            <button
              key={e}
              onClick={() => setFilter(e)}
              className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                filter === e
                  ? 'bg-diable-red border-diable-red text-white'
                  : 'border-white/20 text-white/50 hover:border-white/40'
              }`}
            >
              {e.charAt(0).toUpperCase() + e.slice(1)}
            </button>
          ))}
        </div>
        {/* Sélecteur code postal */}
        <select
          value={selectedCP}
          onChange={e => { setSelectedCP(e.target.value); setOpenEmotion(null); }}
          className="ml-auto bg-diable-gray border border-white/20 rounded-lg px-3 py-1 text-white text-xs focus:outline-none focus:border-diable-red"
        >
          <option value="">Zoom sur un CP…</option>
          {cpList.map(cp => (
            <option key={cp} value={cp}>{cp}</option>
          ))}
        </select>

        <button
          onClick={() => setShowRanking(r => !r)}
          className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
            showRanking ? 'bg-diable-gold border-diable-gold text-black' : 'border-white/20 text-white/50 hover:border-white/40'
          }`}
        >
          Top CP
        </button>

        <Link to="/auth" className="text-diable-red hover:text-red-400 text-sm font-semibold transition-colors">
          + Ajouter
        </Link>
      </div>

      {/* Classement CP */}
      {showRanking && cpRanking.length > 0 && (
        <div className="px-6 py-4 border-b border-white/10 bg-black/20 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-diable-gold font-bold text-sm">Top 10 codes postaux</span>
            <button onClick={() => setShowRanking(false)} className="ml-auto text-white/30 hover:text-white/60 text-xs">✕</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {cpRanking.map(([cp, n], i) => (
              <button
                key={cp}
                onClick={() => { setSelectedCP(cp); setOpenEmotion(null); setShowRanking(false); }}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-sm"
              >
                <span className="text-white/30 text-xs w-5 text-right">{i + 1}.</span>
                <span className="font-bold text-white">{cp}</span>
                <span className="text-diable-gold font-black text-xs">{n}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Panneau détail CP */}
      {selectedCP && Object.keys(cpGroups).length > 0 && (
        <div className="px-6 py-4 border-b border-white/10 bg-black/30 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-diable-gold font-bold text-sm">CP {selectedCP}</span>
            <span className="text-white/40 text-xs">— {patches.filter(p => p.code_postal === selectedCP).length} supporter{patches.filter(p => p.code_postal === selectedCP).length > 1 ? 's' : ''}</span>
            <button onClick={() => { setSelectedCP(''); setOpenEmotion(null); }} className="ml-auto text-white/30 hover:text-white/60 text-xs">✕</button>
          </div>

          {/* Cercles émotion côte à côte */}
          <div className="flex flex-wrap gap-4 items-end">
            {Object.entries(cpGroups).map(([emotion, group]) => {
              const count = group.length;
              const color = emotionColors[emotion];
              const size = Math.min(44 + (count - 1) * 10, 88);
              const fontSize = Math.max(13, Math.min(size * 0.35, 22));
              const isOpen = openEmotion === emotion;
              return (
                <div key={emotion} className="flex flex-col items-center gap-2">
                  <button
                    onClick={() => setOpenEmotion(isOpen ? null : emotion)}
                    style={{
                      width: size, height: size, borderRadius: '50%',
                      background: color, border: `3px solid ${isOpen ? '#fff' : '#1A1A1A'}`,
                      boxShadow: `0 0 12px ${color}80`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize, fontWeight: 900, color: '#fff', cursor: 'pointer',
                      transition: 'border 0.15s',
                    }}
                  >
                    {count}
                  </button>
                  <span className="text-xs text-white/60 capitalize">{emotion}</span>
                  {isOpen && (
                    <div className="flex flex-col gap-1 mt-1 min-w-[100px]">
                      {group.map(p => (
                        <a
                          key={p.id}
                          href={`/patch/${p.id}`}
                          className="text-xs text-white/80 hover:text-white bg-white/5 rounded px-2 py-1 transition-colors"
                        >
                          {p.prenom}
                          {p.mot_cle && <span style={{ color }} className="ml-1">· {p.mot_cle}</span>}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Carte */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-white/50 z-10">
            Chargement de la carte…
          </div>
        )}
        <div ref={mapRef} className="w-full h-full min-h-[600px]" />
      </div>
    </div>
  );
}

function addMarkers(L, map, patches, filter) {
  const filtered = filter === 'tous' ? patches : patches.filter(p => p.emotion === filter);

  // Grouper par code postal + émotion → un cercle par combinaison
  const groups = {};
  filtered.forEach(patch => {
    const key = `${patch.code_postal}__${patch.emotion}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(patch);
  });

  // Légère dispersion par émotion au sein d'un même CP pour éviter superposition exacte
  const emotionJitter = { joie: [0.006, 0], rage: [-0.006, 0.004], espoir: [0, -0.006],
    fierté: [0.004, 0.006], déchirement: [-0.004, -0.004] };

  Object.entries(groups).forEach(([key, group]) => {
    const cp = group[0].code_postal;
    const emotion = group[0].emotion;
    const coords = getCoords(cp);
    if (!coords) return;

    const count = group.length;
    const size = Math.min(22 + (count - 1) * 6, 60);
    const half = size / 2;

    const color = group[0].patch_params?.colors?.primary || '#CC0000';
    const fontSize = Math.max(10, Math.min(size * 0.38, 16));

    const [jx, jy] = emotionJitter[emotion] || [0, 0];

    const icon = L.divIcon({
      className: '',
      html: `<div class="marker-pulse" style="
        width:${size}px; height:${size}px; border-radius:50%;
        background:${color}; border:2px solid #1A1A1A;
        box-shadow: 0 0 8px ${color}80;
        display:flex; align-items:center; justify-content:center;
        font-family:Inter,sans-serif; font-weight:900;
        font-size:${fontSize}px; color:#fff;
        cursor:pointer;
      ">${count > 1 ? count : ''}</div>`,
      iconSize: [size, size],
      iconAnchor: [half, half],
    });

    const marker = L.marker([coords.lat + jy, coords.lng + jx], { icon }).addTo(map);

    const listItems = group.map(p => {
      return `<div style="padding:4px 0; border-bottom:1px solid #333;">
        <span style="font-weight:700">${p.prenom}</span>
        <span style="color:#999; font-size:11px;"> · depuis ${p.annee_debut}</span>
        ${p.mot_cle ? `<span style="color:${color}; font-size:11px;"> · "${p.mot_cle}"</span>` : ''}
        <br/><a href="/patch/${p.id}" style="color:#CC0000; font-size:11px; font-weight:600;">Voir →</a>
      </div>`;
    }).join('');

    marker.bindPopup(`
      <div style="font-family:Inter,sans-serif; color:#fff; background:#1A1A1A; padding:12px; border-radius:8px; min-width:180px; max-height:220px; overflow-y:auto;">
        <div style="font-weight:900; font-size:14px; margin-bottom:8px; color:${color};">${cp} · ${emotion} · ${count} supporter${count > 1 ? 's' : ''}</div>
        ${listItems}
      </div>
    `, { className: 'leaflet-dark-popup' });
  });
}
