import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import PatchCanvas from '../components/PatchCanvas';
import JerseyLogo from '../components/JerseyLogo';
import AlphabetTitle from '../components/AlphabetTitle';
import { getSession, getMyPatch, signOut } from '../lib/supabase';

const EMOTION_LABELS = {
  joie: 'Joie', rage: 'Rage', espoir: 'Espoir', fierté: 'Fierté', déchirement: 'Déchirement',
};
const CONTEXTE_LABELS = {
  seul: 'Seul', famille: 'En famille', amis: 'Entre amis', bar: 'Dans un bar', stade: 'Au stade',
};
const TRANSMISSION_LABELS = {
  transmis: 'Transmis', construit: 'Construit seul',
};

export default function MyPatch() {
  const [patch, setPatch]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]         = useState(false);
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [qrUrl, setQrUrl]     = useState('');
  const canvasRef             = useRef(null);
  const navigate              = useNavigate();

  useEffect(() => {
    getSession().then(async s => {
      if (!s) { navigate('/auth'); return; }
      const { data } = await getMyPatch(s.user.id);
      if (!data) { navigate('/creer'); return; }
      setPatch(data);
      setLoading(false);

      // Générer QR code
      const url = `${window.location.origin}/patch/${data.id}`;
      QRCode.toDataURL(url, { width: 200, margin: 2, color: { dark: '#ffffff', light: '#1a1a1a' } })
        .then(dataUrl => setQrUrl(dataUrl))
        .catch(() => {});
    });
  }, [navigate]);

  function copyLink() {
    const url = `${window.location.origin}/patch/${patch.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function copyReferral() {
    const url = `${window.location.origin}/auth?ref=${encodeURIComponent(patch.prenom)}`;
    navigator.clipboard.writeText(url);
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  }

  function downloadPatch() {
    const canvas = canvasRef.current?.querySelector('canvas') || document.querySelector('canvas');
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `patch-diables-${patch.prenom}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  async function downloadInstagram() {
    // Canvas 1080x1080 pour Instagram
    const patchCanvas = canvasRef.current?.querySelector('canvas') || document.querySelector('canvas');
    if (!patchCanvas) return;

    const size = 1080;
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d');

    // Fond noir
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, size, size);

    // Bandes belges en haut et en bas (décoratives)
    const stripeH = 12;
    ['#000000', '#FFD700', '#CC0000'].forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(i * (size / 3), 0, size / 3, stripeH);
      ctx.fillRect(i * (size / 3), size - stripeH, size / 3, stripeH);
    });

    // Patch centré (420x420)
    const patchSize = 420;
    const patchX = (size - patchSize) / 2;
    const patchY = 160;
    ctx.drawImage(patchCanvas, patchX, patchY, patchSize, patchSize);

    // Prénom
    const color = patch.patch_params?.colors?.primary || '#CC0000';
    ctx.fillStyle = color;
    ctx.font = 'bold 64px Inter, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(patch.prenom.toUpperCase(), size / 2, patchY + patchSize + 80);

    // Émotion + année
    ctx.fillStyle = '#ffffff99';
    ctx.font = '32px Inter, Arial, sans-serif';
    ctx.fillText(`${EMOTION_LABELS[patch.emotion] || patch.emotion} · supporter depuis ${patch.annee_debut}`, size / 2, patchY + patchSize + 130);

    // Mot-clé
    if (patch.mot_cle) {
      ctx.fillStyle = '#ffffff55';
      ctx.font = 'italic 28px Inter, Arial, sans-serif';
      ctx.fillText(`"${patch.mot_cle}"`, size / 2, patchY + patchSize + 180);
    }

    // URL
    ctx.fillStyle = '#ffffff30';
    ctx.font = '22px Inter, Arial, sans-serif';
    ctx.fillText(`${window.location.origin}/patch/${patch.id}`, size / 2, size - 50);

    const link = document.createElement('a');
    link.download = `patch-diables-instagram-${patch.prenom}.png`;
    link.href = c.toDataURL('image/png');
    link.click();
  }

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  const shareUrl = patch ? `${window.location.origin}/patch/${patch.id}` : '';
  const shareText = patch ? `Mon empreinte de supporter des #DiablesRouges ! ${shareUrl}` : '';
  const referralUrl = patch ? `${window.location.origin}/auth?ref=${encodeURIComponent(patch.prenom)}` : '';

  if (loading) return (
    <div className="min-h-screen bg-diable-dark flex items-center justify-center">
      <div className="text-white/50">Chargement…</div>
    </div>
  );

  const years = patch ? new Date().getFullYear() - patch.annee_debut : 0;

  return (
    <div className="min-h-screen bg-diable-dark text-white">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <JerseyLogo size={32} />
          <AlphabetTitle size={18} />
        </div>
        <button onClick={handleSignOut} className="text-white/40 hover:text-white/70 text-sm transition-colors">
          Déconnexion
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-black mb-1">Mon empreinte</h1>
        <p className="text-white/50 mb-10">{patch.prenom} · {patch.code_postal}</p>

        {/* Patch */}
        <div ref={canvasRef} className="flex flex-col items-center gap-6 mb-10">
          <PatchCanvas params={patch.patch_params} size={300} />
          <div
            className="px-4 py-1 rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: patch.patch_params?.colors?.primary || '#CC0000' }}
          >
            {EMOTION_LABELS[patch.emotion]}
          </div>
        </div>

        {/* Données */}
        <div className="bg-diable-gray rounded-xl p-6 mb-8 grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-white/40">Supporter depuis</div>
            <div className="font-semibold">{patch.annee_debut} ({years} an{years !== 1 ? 's' : ''})</div>
          </div>
          <div>
            <div className="text-white/40">Contexte</div>
            <div className="font-semibold">{CONTEXTE_LABELS[patch.contexte]}</div>
          </div>
          <div>
            <div className="text-white/40">Transmission</div>
            <div className="font-semibold">{TRANSMISSION_LABELS[patch.transmission]}</div>
          </div>
          <div>
            <div className="text-white/40">Intensité</div>
            <div className="font-semibold">{patch.intensite} / 5</div>
          </div>
          {patch.mot_cle && (
            <div className="col-span-2">
              <div className="text-white/40">Mot-clé</div>
              <div className="font-semibold text-diable-gold">"{patch.mot_cle}"</div>
            </div>
          )}
          {patch.premier_souvenir && (
            <div className="col-span-2">
              <div className="text-white/40">Premier souvenir</div>
              <div className="font-semibold italic text-white/80">"{patch.premier_souvenir}"</div>
            </div>
          )}
        </div>

        {/* QR code */}
        {qrUrl && (
          <div className="flex flex-col items-center gap-2 mb-8">
            <p className="text-white/40 text-xs uppercase tracking-widest">QR code de ton patch</p>
            <img src={qrUrl} alt="QR code" className="w-32 h-32 rounded-lg" />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={copyLink}
            className="w-full bg-diable-red hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors"
          >
            {copied ? 'Lien copié !' : 'Copier le lien de mon patch'}
          </button>

          <a
            href={`https://x.com/intent/tweet?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Partager sur X (Twitter)
          </a>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full text-center border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Partager sur WhatsApp
          </a>

          <button
            onClick={downloadInstagram}
            className="w-full border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Télécharger pour Instagram (1080×1080)
          </button>

          <button
            onClick={downloadPatch}
            className="w-full border border-white/20 hover:border-white/40 text-white/70 hover:text-white font-semibold py-3 rounded-lg transition-colors"
          >
            Télécharger mon patch (PNG)
          </button>

          {/* Lien de parrainage */}
          <div className="mt-2 bg-white/5 rounded-xl p-4">
            <p className="text-white/50 text-xs mb-2">Invite un ami à créer son patch avec ton lien :</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={referralUrl}
                className="flex-1 bg-diable-dark border border-white/10 rounded px-3 py-2 text-white/50 text-xs truncate"
              />
              <button
                onClick={copyReferral}
                className="px-3 py-2 bg-diable-red hover:bg-red-700 text-white text-xs font-bold rounded transition-colors shrink-0"
              >
                {copiedReferral ? 'Copié !' : 'Copier'}
              </button>
            </div>
          </div>

          <Link
            to="/patchwork"
            className="w-full text-center text-diable-gold hover:text-yellow-300 font-semibold py-2 transition-colors"
          >
            Voir le patchwork complet →
          </Link>
        </div>
      </div>
    </div>
  );
}
