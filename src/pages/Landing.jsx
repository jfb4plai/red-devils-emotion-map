import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import JerseyLogo from '../components/JerseyLogo';
import AlphabetTitle from '../components/AlphabetTitle';
import { getPatchCount, getEmotionStats, getRecentPatches, supabase } from '../lib/supabase';

const EMOTION_COLORS = {
  joie: '#3B82F6', rage: '#F97316', espoir: '#10B981', fierté: '#6366F1', déchirement: '#7C3AED',
};
const EMOTION_LABELS = {
  joie: 'Joie', rage: 'Rage', espoir: 'Espoir', fierté: 'Fierté', déchirement: 'Déchirement',
};

function useAnimatedCount(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return value;
}

export default function Landing() {
  const [count, setCount]         = useState(null);
  const [emotionData, setEmotionData] = useState({});
  const [recentFeed, setRecentFeed]   = useState([]);
  const animatedCount = useAnimatedCount(count);

  useEffect(() => {
    getPatchCount().then(({ count: c }) => setCount(c));

    getEmotionStats().then(({ data }) => {
      if (!data) return;
      const totals = {};
      data.forEach(({ emotion }) => {
        totals[emotion] = (totals[emotion] || 0) + 1;
      });
      setEmotionData(totals);
    });

    getRecentPatches(8).then(({ data }) => {
      if (data) setRecentFeed(data);
    });

    // Realtime : nouvelles empreintes
    const channel = supabase
      .channel('landing-feed')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'patches',
      }, payload => {
        setCount(c => (c || 0) + 1);
        setRecentFeed(prev => [payload.new, ...prev].slice(0, 8));
        setEmotionData(prev => ({
          ...prev,
          [payload.new.emotion]: (prev[payload.new.emotion] || 0) + 1,
        }));
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const totalEmotions = Object.values(emotionData).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-diable-dark text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
        <JerseyLogo size={40} />
        <AlphabetTitle size={20} />
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6">
            Ton empreinte.<br />
            <span className="text-diable-red">Unique.</span> Pour toujours.
          </h1>

          <p className="text-lg text-white/70 mb-4 leading-relaxed">
            Chaque supporter des Diables Rouges a une histoire différente.
            Réponds à 8 questions. L'algo génère ton diable unique
            — couleurs, motif, texture, intensité.
          </p>

          {/* Compteur animé */}
          <p className="text-white/50 mb-6 text-sm">
            Ton patch rejoint le patchwork géographique de tous les supporters.
            {count !== null && (
              <> <span className="text-diable-gold font-black text-2xl">{animatedCount}</span>
              <span className="text-diable-gold font-bold"> empreinte{count !== 1 ? 's' : ''}</span> créée{count !== 1 ? 's' : ''} jusqu'ici.</>
            )}
          </p>

          {/* Barres émotion */}
          {totalEmotions > 0 && (
            <div className="mb-10 bg-white/5 rounded-xl p-5 text-left">
              <p className="text-white/40 text-xs uppercase tracking-widest mb-4">Émotions des supporters</p>
              <div className="flex flex-col gap-3">
                {Object.entries(EMOTION_LABELS).map(([key, label]) => {
                  const n = emotionData[key] || 0;
                  const pct = totalEmotions > 0 ? Math.round((n / totalEmotions) * 100) : 0;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="text-white/60 text-sm w-24 shrink-0">{label}</span>
                      <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
                        <div
                          className="h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${pct}%`, backgroundColor: EMOTION_COLORS[key] }}
                        />
                      </div>
                      <span className="text-white/40 text-xs w-8 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <Link
              to="/auth"
              className="bg-diable-red hover:bg-red-700 text-white font-bold px-8 py-4 rounded-lg text-lg transition-colors"
            >
              Créer mon empreinte
            </Link>
            <Link
              to="/patchwork"
              className="border border-white/30 hover:border-white/60 text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors"
            >
              Voir le patchwork
            </Link>
          </div>

          {/* Feed temps réel */}
          {recentFeed.length > 0 && (
            <div className="border border-white/10 rounded-xl overflow-hidden">
              <p className="text-white/30 text-xs uppercase tracking-widest px-4 py-2 border-b border-white/10 text-left">
                Dernières empreintes
              </p>
              <div className="divide-y divide-white/5">
                {recentFeed.map(p => (
                  <div key={p.id} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-white/5 transition-colors">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: EMOTION_COLORS[p.emotion] || '#CC0000' }}
                    />
                    <span className="font-semibold text-white/80">{p.prenom}</span>
                    <span className="text-white/30">{p.code_postal}</span>
                    <span className="ml-auto text-white/20 text-xs">
                      {new Date(p.created_at).toLocaleDateString('fr-BE', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Comment ça marche */}
      <section className="bg-diable-gray px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-center mb-8 text-white/80">Comment ça marche</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
              { n: '1', title: 'Inscris-toi', desc: 'Ton email, un lien magique. Pas de mot de passe.' },
              { n: '2', title: 'Réponds à 8 questions', desc: 'Depuis quand ? Quelle émotion ? Seul ou en groupe ?' },
              { n: '3', title: 'Ton patch rejoint la carte', desc: 'Positionné sur ton code postal. Partageable.' },
            ].map(({ n, title, desc }) => (
              <div key={n} className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-diable-red flex items-center justify-center font-black text-lg">{n}</div>
                <div className="font-bold text-white">{title}</div>
                <div className="text-white/50 text-sm">{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="text-center py-6 text-white/30 text-xs">
        Red Devils Emotion Map — Concours RTBF Coupe du Monde · Un patch par personne
      </footer>
    </div>
  );
}
