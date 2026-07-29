'use server';

import { cookies } from 'next/headers';
import { createSupabaseServerClient } from './server-client';

/**
 * Provider OIDC de la session courante, posé par le backend dans un cookie
 * lisible (`OIDC_COOKIES.provider`). Absent si la connexion s'est faite par
 * mot de passe.
 */
const OIDC_PROVIDER_COOKIE = 'oidc-provider';

/**
 * Ferme la session Supabase et, si elle avait été ouverte via un provider OIDC,
 * renvoie l'URL de déconnexion amont : sans elle, le provider ré-authentifie
 * silencieusement à la connexion suivante.
 *
 * À suivre par une navigation navigateur complète — l'URL est cross-origin
 * (domaine `api.*`), hors de portée du router Next.
 */
export async function signOutUser(): Promise<{ oidcLogoutUrl: string | null }> {
  const cookieStore = await cookies();
  const provider = cookieStore.get(OIDC_PROVIDER_COOKIE)?.value;
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;

  const supabaseClient = await createSupabaseServerClient();
  await supabaseClient.auth.signOut();

  // Le cookie est modifiable côté client : on ne l'injecte dans une URL que
  // s'il ressemble à un nom de provider.
  const isProviderName = provider && /^[a-z]+$/.test(provider);

  return {
    oidcLogoutUrl:
      isProviderName && backendUrl
        ? `${backendUrl}/api/v1/${provider}/logout`
        : null,
  };
}
