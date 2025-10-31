import { NextRequest } from 'next/server';
import { createClient } from './actions';

/**
 * Vérifie un utilisateur depuis le token trouvé dans les headers
 */
export const getDbUserFromRequest = async (request: NextRequest) => {
  // lit le token depuis les en-têtes
  const token = request.headers
    .get('authorization')
    // et supprime le préfixe
    ?.substring('Bearer '.length);

  // utilise le token pour vérifier l'utilisateur
  const supabase = createClient(request.cookies);
  const { data, error } = await supabase.auth.getUser(token ?? '');
  if (error || !data?.user) {
    console.error('auth error', error?.message);
    return null;
  }

  return data.user;
};

export const authError = Response.json(
  { error: 'Non autorisé' },
  { status: 403 }
);
