import { signInPath } from '@/app/app/paths';
import {
  asProviderName,
  OIDC_LOGIN_COOKIE,
  OIDC_LOGIN_COOKIE_TTL_S,
  OIDC_PROVIDER_COOKIE,
} from '@/app/users/authentications/oidc/login-user-with-oidc/login-user-with-oidc.cookies';
import { sanitizeNextPath } from '@/app/users/authentications/sanitize-next-path';
import { getRequestUrl } from '@tet/api';
import { createSupabaseServerClient } from '@tet/api/utils/supabase/server-client';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Pont session Supabase : reçoit le `token_hash` généré côté backend
 * (`CreerSessionService.creerSession`, via `generateLink({type:'magiclink'})` —
 * aucun email envoyé) et le consomme avec le client SSR pour poser les cookies
 * Supabase standards.
 *
 * `liaison=1` (indicateur one-shot) est relayé vers la cible finale en
 * `comptes-associes=1` : jamais stocké en session, uniquement lu au montage par
 * `ToastLiaisonComptes` puis nettoyé de l'URL.
 *
 * Ce pont n'est emprunté que par les parcours OIDC : le traverser vaut
 * connexion par fournisseur d'identité réussie, d'où le marqueur one-shot
 * `OIDC_LOGIN_COOKIE` posé pour `TrackLoginUserWithOidc`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = getRequestUrl(request);
  const tokenHash = searchParams.get('token_hash');
  const next = sanitizeNextPath(searchParams.get('next'));
  const liaison = searchParams.get('liaison') === '1';

  if (!tokenHash) {
    return NextResponse.redirect(
      `${origin}${signInPath}?erreur=session-invalide`
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.verifyOtp({
    type: 'email',
    token_hash: tokenHash,
  });

  if (error) {
    return NextResponse.redirect(
      `${origin}${signInPath}?erreur=session-invalide`
    );
  }

  const destination = new URL(next ?? '/', origin);
  if (liaison) {
    destination.searchParams.set('comptes-associes', '1');
  }

  const response = NextResponse.redirect(destination);
  response.cookies.set(
    OIDC_LOGIN_COOKIE,
    asProviderName(request.cookies.get(OIDC_PROVIDER_COOKIE)?.value),
    {
      // Lu par le navigateur : le suivi PostHog se fait côté client.
      httpOnly: false,
      secure: origin.startsWith('https://'),
      sameSite: 'lax',
      path: '/',
      maxAge: OIDC_LOGIN_COOKIE_TTL_S,
    }
  );

  return response;
}
