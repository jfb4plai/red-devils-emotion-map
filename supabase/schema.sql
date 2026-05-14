-- PatchDiables — Schema Supabase
-- Projet partagé : dfoaumjleqtxjeaplnna
-- À coller dans l'éditeur SQL de Supabase Dashboard

CREATE TABLE IF NOT EXISTS patches (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES auth.users UNIQUE NOT NULL,
  created_at       timestamptz DEFAULT now(),
  prenom           text NOT NULL,
  code_postal      text NOT NULL CHECK (code_postal ~ '^\d{4}$'),
  annee_debut      int  NOT NULL CHECK (annee_debut >= 1970 AND annee_debut <= EXTRACT(YEAR FROM now())),
  premier_souvenir text,
  emotion          text NOT NULL CHECK (emotion IN ('joie','rage','espoir','fierté','déchirement')),
  contexte         text NOT NULL CHECK (contexte IN ('seul','famille','amis','bar','stade')),
  transmission     text NOT NULL CHECK (transmission IN ('transmis','construit')),
  intensite        int  NOT NULL CHECK (intensite BETWEEN 1 AND 5),
  mot_cle          text CHECK (length(mot_cle) <= 20),
  patch_params     jsonb
);

-- Row Level Security
ALTER TABLE patches ENABLE ROW LEVEL SECURITY;

-- Lecture publique (patchwork visible par tous)
CREATE POLICY "lecture_publique"
  ON patches FOR SELECT
  USING (true);

-- Création : un seul patch par utilisateur (UNIQUE user_id le garantit aussi)
CREATE POLICY "creation_unique"
  ON patches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Modification : seulement son propre patch
CREATE POLICY "modification_propre"
  ON patches FOR UPDATE
  USING (auth.uid() = user_id);

-- Index pour la performance sur les requêtes fréquentes
CREATE INDEX IF NOT EXISTS patches_code_postal_idx ON patches (code_postal);
CREATE INDEX IF NOT EXISTS patches_emotion_idx     ON patches (emotion);
CREATE INDEX IF NOT EXISTS patches_created_at_idx  ON patches (created_at DESC);
