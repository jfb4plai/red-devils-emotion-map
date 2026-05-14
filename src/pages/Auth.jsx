import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import JerseyLogo from '../components/JerseyLogo';
import AlphabetTitle from '../components/AlphabetTitle';
import { sendMagicLink, getSession, getMyPatch } from '../lib/supabase';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [email, setEmail]   = useState('');
  const [sent, setSent]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const navigate = useNavigate();

  // Gérer le callback magic link (hash dans l'URL)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data } = await getMyPatch(session.user.id);
        navigate(data ? '/mon-patch' : '/creer');
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await sendMagicLink(email);
    setLoading(false);
    if (err) { setError(err.message); return; }
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-diable-dark flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <JerseyLogo size={56} />
        </div>
        <div className="flex justify-center mb-2"><AlphabetTitle size={20} /></div>
        <p className="text-white/50 text-center mb-8 text-sm">Un lien, pas de mot de passe.</p>

        {sent ? (
          <div className="flex flex-col gap-4">
            <div className="bg-green-900/40 border border-green-500/40 rounded-lg p-6 text-center">
              <p className="text-green-300 font-semibold mb-2">Lien envoyé !</p>
              <p className="text-white/60 text-sm">
                Vérifie ta boîte mail ({email}).<br />
                Clique sur le lien pour créer ton empreinte.
              </p>
            </div>

            {/* Aperçu de l'email Supabase pour rassurer */}
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <div className="bg-white/5 px-4 py-2 text-xs text-white/40 uppercase tracking-widest">
                À quoi ressemble l'email
              </div>
              <div className="bg-white/[0.03] p-4 font-mono text-xs text-white/50 leading-relaxed">
                <div className="text-white/30 mb-2">De : noreply@mail.app.supabase.io</div>
                <div className="text-white/30 mb-3">Objet : <span className="text-white/60">Confirm Your Signup</span></div>
                <div className="border border-white/10 rounded p-3 bg-black/30">
                  <p className="text-white/70 font-sans text-sm font-semibold mb-1">Confirm your signup</p>
                  <p className="text-white/50 font-sans text-xs mb-2">Follow this link to confirm your user:</p>
                  <p className="text-blue-400 font-sans text-xs underline">Confirm your mail</p>
                  <p className="text-white/30 font-sans text-xs mt-3 italic">
                    C'est bien l'email de Red Devils Emotion Map — clique sur le lien pour continuer.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="text-white/70 text-sm font-semibold">Ton adresse email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="toi@example.com"
              className="bg-diable-gray border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-diable-red"
            />
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="bg-diable-red hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors"
            >
              {loading ? 'Envoi…' : 'Recevoir mon lien'}
            </button>
          </form>
        )}

        <p className="text-white/30 text-xs text-center mt-8">
          Un email = une empreinte. Chaque supporter est unique.
        </p>
      </div>
    </div>
  );
}
