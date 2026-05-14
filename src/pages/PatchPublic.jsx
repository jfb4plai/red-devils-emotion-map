import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import PatchCanvas from '../components/PatchCanvas';
import JerseyLogo from '../components/JerseyLogo';
import AlphabetTitle from '../components/AlphabetTitle';
import { getPatchById } from '../lib/supabase';

export default function PatchPublic() {
  const { id } = useParams();
  const [patch, setPatch]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    getPatchById(id).then(({ data, error: err }) => {
      if (err || !data) setError('Empreinte introuvable.');
      else setPatch(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-diable-dark flex items-center justify-center text-white/50">
      Chargement…
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-diable-dark flex flex-col items-center justify-center gap-4 text-white">
      <p className="text-white/50">{error}</p>
      <Link to="/" className="text-diable-red hover:underline">Retour à l'accueil</Link>
    </div>
  );

  const years = new Date().getFullYear() - patch.annee_debut;

  return (
    <div className="min-h-screen bg-diable-dark text-white">
      <header className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
        <JerseyLogo size={32} />
        <AlphabetTitle size={18} />
      </header>

      <div className="max-w-xl mx-auto px-4 py-12 flex flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-3xl font-black mb-1">{patch.prenom}</h1>
          <p className="text-white/50">Supporter depuis {patch.annee_debut} · {patch.code_postal}</p>
        </div>

        <PatchCanvas params={patch.patch_params} size={300} />

        {patch.mot_cle && (
          <div className="text-diable-gold font-black text-xl">"{patch.mot_cle}"</div>
        )}

        {patch.premier_souvenir && (
          <p className="text-white/70 italic text-center max-w-sm">"{patch.premier_souvenir}"</p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm w-full max-w-sm">
          <div className="bg-diable-gray rounded-lg p-3">
            <div className="text-white/40 text-xs">Supporter depuis</div>
            <div className="font-semibold">{years} ans</div>
          </div>
          <div className="bg-diable-gray rounded-lg p-3">
            <div className="text-white/40 text-xs">Intensité</div>
            <div className="font-semibold">{patch.intensite} / 5</div>
          </div>
        </div>

        <div className="flex flex-col gap-3 w-full max-w-sm">
          <Link
            to="/auth"
            className="w-full text-center bg-diable-red hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors"
          >
            Créer ma propre empreinte
          </Link>
          <Link
            to="/patchwork"
            className="w-full text-center border border-white/20 hover:border-white/40 text-white/70 py-3 rounded-lg transition-colors"
          >
            Voir le patchwork complet
          </Link>
        </div>
      </div>
    </div>
  );
}
