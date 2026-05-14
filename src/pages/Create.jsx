import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import PatchCanvas from '../components/PatchCanvas';
import JerseyLogo from '../components/JerseyLogo';
import AlphabetTitle from '../components/AlphabetTitle';
import { getSession, getMyPatch, saveMyPatch } from '../lib/supabase';
import { computePatchParams } from '../lib/patchAlgo';

const QUESTIONS = [
  {
    key: 'annee_debut',
    label: 'Supporter des Diables depuis quelle année ?',
    type: 'select',
    options: Array.from({ length: new Date().getFullYear() - 1944 }, (_, i) => {
      const y = new Date().getFullYear() - i;
      return { value: String(y), label: String(y) };
    }),
  },
  {
    key: 'emotion',
    label: 'Ton émotion dominante quand tu suis les Diables ?',
    type: 'radio',
    options: [
      { value: 'joie',        label: 'Joie',        color: '#3B82F6' },
      { value: 'rage',        label: 'Rage',        color: '#F97316' },
      { value: 'espoir',      label: 'Espoir',      color: '#10B981' },
      { value: 'fierté',      label: 'Fierté',      color: '#6366F1' },
      { value: 'déchirement', label: 'Déchirement', color: '#7C3AED' },
    ],
  },
  {
    key: 'contexte',
    label: 'Tu regardes plutôt…',
    type: 'radio',
    options: [
      { value: 'seul',    label: 'Seul' },
      { value: 'famille', label: 'En famille' },
      { value: 'amis',    label: 'Entre amis' },
      { value: 'bar',     label: 'Dans un bar' },
      { value: 'stade',   label: 'Au stade' },
    ],
  },
  {
    key: 'transmission',
    label: 'L\'attachement aux Diables t\'a été…',
    type: 'radio',
    options: [
      { value: 'transmis',  label: 'Transmis (par un parent, un ami…)' },
      { value: 'construit', label: 'Construit seul' },
    ],
  },
  {
    key: 'intensite',
    label: 'Intensité de ton supporterisme (1 = casual → 5 = ma vie s\'organise autour)',
    type: 'range',
    min: 1, max: 5,
  },
  {
    key: 'mot_cle',
    label: 'Un mot qui te définit comme supporter (20 caractères max)',
    type: 'text',
    maxLength: 20,
    placeholder: 'ex : Allez, Fidèle, Ensemble…',
  },
  {
    key: 'premier_souvenir',
    label: 'Ton premier souvenir fort avec les Diables (80 caractères max)',
    type: 'text',
    maxLength: 80,
    placeholder: 'ex : France 98, le but de Fellaini, la finale 2018…',
  },
  {
    key: 'code_postal',
    label: 'Ton code postal belge',
    type: 'text',
    maxLength: 4,
    placeholder: '4000',
    pattern: '[0-9]{4}',
  },
];

const INITIAL = {
  annee_debut: String(new Date().getFullYear() - 10),
  emotion: 'espoir', contexte: 'famille', transmission: 'transmis',
  intensite: 3, mot_cle: '', premier_souvenir: '', code_postal: '',
};

export default function Create() {
  const [form, setForm]       = useState(INITIAL);
  const [session, setSession] = useState(null);
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');
  const [prenom, setPrenom]   = useState('');
  const navigate = useNavigate();

  const params = computePatchParams(form);

  useEffect(() => {
    getSession().then(s => {
      if (!s) { navigate('/auth'); return; }
      setSession(s);
      // Rediriger si patch déjà créé
      getMyPatch(s.user.id).then(({ data }) => {
        if (data) navigate('/mon-patch');
      });
    });
  }, [navigate]);

  function set(key, value) {
    setForm(f => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.code_postal.match(/^\d{4}$/)) { setError('Code postal invalide (4 chiffres).'); return; }
    if (!prenom.trim()) { setError('Ton prénom est requis.'); return; }
    setError(''); setSaving(true);

    const patchData = {
      prenom: prenom.trim(),
      annee_debut: parseInt(form.annee_debut),
      emotion: form.emotion,
      contexte: form.contexte,
      transmission: form.transmission,
      intensite: Number(form.intensite),
      mot_cle: form.mot_cle.trim(),
      premier_souvenir: form.premier_souvenir.trim(),
      code_postal: form.code_postal,
      patch_params: computePatchParams(form),
    };

    const { error: err } = await saveMyPatch(session.user.id, patchData);
    setSaving(false);
    if (err) { setError(err.message); return; }

    // Son de stade via Web Audio API
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Simulation cri de foule : bruit filtré + enveloppe
      const bufferSize = ctx.sampleRate * 1.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 800;
      filter.Q.value = 0.5;
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.2);
      gainNode.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.8);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
      source.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(ctx.destination);
      source.start();
    } catch (_) { /* audio non supporté */ }

    // Confettis belges
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 }, colors: ['#000000', '#FFD700', '#CC0000'] });
    setTimeout(() => confetti({ particleCount: 60, spread: 120, origin: { y: 0.3 }, colors: ['#CC0000', '#FFD700'] }), 400);
    setTimeout(() => navigate('/mon-patch'), 1200);
  }

  return (
    <div className="min-h-screen bg-diable-dark text-white">
      {/* Header */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-white/10">
        <JerseyLogo size={32} />
        <AlphabetTitle size={18} />
      </header>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-black mb-2">Crée ton empreinte</h1>
        <p className="text-white/50 mb-10">Les réponses génèrent ton patch en temps réel.</p>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-8">
            {/* Prénom */}
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-white/80">Ton prénom (affiché sur la carte)</label>
              <input
                type="text"
                required
                maxLength={30}
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                placeholder="ex : Jean-François"
                className="bg-diable-gray border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-diable-red"
              />
            </div>

            {QUESTIONS.map(q => (
              <div key={q.key} className="flex flex-col gap-3">
                <label className="font-semibold text-white/80">{q.label}</label>

                {q.type === 'select' && (
                  <select
                    value={form[q.key]}
                    onChange={e => set(q.key, e.target.value)}
                    className="bg-diable-gray border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-diable-red"
                  >
                    {q.options.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                )}

                {q.type === 'radio' && (
                  <div className="flex flex-wrap gap-2">
                    {q.options.map(o => (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => set(q.key, o.value)}
                        className={`px-4 py-2 rounded-lg border text-sm font-semibold transition-all ${
                          form[q.key] === o.value
                            ? 'bg-diable-red border-diable-red text-white'
                            : 'border-white/20 text-white/60 hover:border-white/40'
                        }`}
                      >
                        {o.label}
                      </button>
                    ))}
                  </div>
                )}

                {q.type === 'range' && (
                  <div className="flex items-center gap-4">
                    <span className="text-white/40 text-sm">{q.min}</span>
                    <input
                      type="range"
                      min={q.min}
                      max={q.max}
                      value={form[q.key]}
                      onChange={e => set(q.key, Number(e.target.value))}
                      className="flex-1 accent-diable-red"
                    />
                    <span className="text-white/40 text-sm">{q.max}</span>
                    <span className="text-diable-gold font-bold w-6 text-center">{form[q.key]}</span>
                  </div>
                )}

                {q.type === 'text' && (
                  <input
                    type="text"
                    maxLength={q.maxLength}
                    pattern={q.pattern}
                    placeholder={q.placeholder}
                    value={form[q.key]}
                    onChange={e => set(q.key, e.target.value)}
                    className="bg-diable-gray border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-diable-red"
                  />
                )}
              </div>
            ))}

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="bg-diable-red hover:bg-red-700 disabled:opacity-50 text-white font-black py-4 rounded-lg text-lg transition-colors"
            >
              {saving ? 'Sauvegarde…' : 'Valider mon empreinte'}
            </button>
          </form>

          {/* Aperçu patch — sticky */}
          <div className="lg:w-72 flex flex-col items-center gap-4 lg:sticky lg:top-8 lg:self-start">
            <p className="text-white/50 text-sm">Aperçu en temps réel</p>
            <PatchCanvas params={params} size={260} />
            <div className="text-center">
              <div
                className="inline-block px-3 py-1 rounded-full text-sm font-bold text-white"
                style={{ backgroundColor: params.colors.primary }}
              >
                {form.emotion.toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
