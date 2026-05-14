import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, key);

// Auth helpers
export async function sendMagicLink(email) {
  return supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: window.location.origin },
  });
}

export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function signOut() {
  return supabase.auth.signOut();
}

// Patch helpers
export async function getMyPatch(userId) {
  return supabase.from('patches').select('*').eq('user_id', userId).maybeSingle();
}

export async function saveMyPatch(userId, patchData) {
  return supabase.from('patches').upsert({ user_id: userId, ...patchData }, { onConflict: 'user_id' });
}

export async function getPatchById(id) {
  return supabase.from('patches').select('*').eq('id', id).single();
}

export async function getAllPatches() {
  return supabase
    .from('patches')
    .select('id, prenom, code_postal, emotion, contexte, transmission, intensite, mot_cle, annee_debut, patch_params, created_at')
    .order('created_at', { ascending: false });
}

export async function getPatchCount() {
  return supabase.from('patches').select('id', { count: 'exact', head: true });
}

export async function getEmotionStats() {
  return supabase.from('patches').select('emotion');
}

export async function getRecentPatches(limit = 10) {
  return supabase.from('patches')
    .select('id, prenom, code_postal, emotion, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
}

export async function getCPRanking() {
  return supabase.from('patches').select('code_postal');
}
