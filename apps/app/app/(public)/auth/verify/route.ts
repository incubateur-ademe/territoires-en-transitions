import { signInPath } from '@/app/app/paths';
import {
  asProviderName,
  OIDC_LOGIN_COOKIE,
  OIDC_LOGIN_COOKIE_TTL_S,
  OIDC_PROVIDER_COOKIE,
} from '@/app/users/authentications/oidc/login-user-with-oidc/login-user-with-oidc.cookies';
import {
  ConsumedInvitations,
  makeConsumedInvitationsLanding,
} from '@/app/collectivites/membres/consume-pending-invitations/consume-pending-invitations.landing';
import { readAutoAttachmentLanding } from '@/app/users/authentications/oidc/auto-attachment/auto-attachment.landing';
import { sanitizeNextPath } from '@/app/users/authentications/sanitize-next-path';
import { getRequestUrl } from '@tet/api';
import { createSupabaseServerClient } from '@tet/api/utils/supabase/server-client';
import { makeTrpcClientForAccessToken } from '@tet/api/utils/trpc/trpc-server-client';
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
 *
 * `rattachement` et `rattachement-type` disent qu'un service vient de s'ouvrir
 * à l'agent (cf. `readAutoAttachmentLanding`). Une invitation reprise par
 * l'email du compte passe devant, un `next` explicite devant les deux.
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
  const { data, error } = await supabase.auth.verifyOtp({
    type: 'email',
    token_hash: tokenHash,
  });

  if (error) {
    return NextResponse.redirect(
      `${origin}${signInPath}?erreur=session-invalide`
    );
  }

  const invitationsReprises = data.session
    ? await consumePendingInvitations(data.session.access_token)
    : [];

  const destination = new URL(
    next ??
      makeConsumedInvitationsLanding(invitationsReprises) ??
      readAutoAttachmentLanding(searchParams) ??
      '/',
    origin
  );
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

/**
 * Toute connexion par fournisseur d'identité passe ici : c'est là qu'une
 * invitation restée en attente, faute de clic sur le lien du mail, est reprise.
 * Un échec ne retient jamais la connexion.
 */
async function consumePendingInvitations(
  accessToken: string
): Promise<ConsumedInvitations> {
  try {
    return await makeTrpcClientForAccessToken(
      accessToken
    ).collectivites.membres.invitations.consumePendings.mutate();
  } catch (error) {
    console.error(error);
    return [];
  }
}
