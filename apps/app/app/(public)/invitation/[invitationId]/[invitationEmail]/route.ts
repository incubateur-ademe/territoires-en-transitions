import { signInPath, signUpPath } from '@/app/app/paths';
import { getAuthUrl, getRequestUrl } from '@tet/api';
import { getAuthUser } from '@tet/api/utils/supabase/auth-user.server';
import { trpcInServerFunction } from '@tet/api/utils/trpc/trpc-server-client';
import { redirect, RedirectType } from 'next/navigation';

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ invitationId: string; invitationEmail: string }>;
  }
) {
  const { invitationId, invitationEmail } = await params;
  const user = await getAuthUser();

  if (!user) {
    const url = getRequestUrl(request);

    const searchParams = new URLSearchParams({
      email: invitationEmail,
      redirect_to: url.href,
    });

    const authUrl = getAuthUrl(signUpPath, searchParams, url.hostname);
    redirect(authUrl.toString(), RedirectType.replace);
  }

  // Si l'utilisateur est connecté avec un email différent de celui de l'invitation,
  // on le redirige vers la page de connexion avec le bon email pré-rempli
  if (
    user.email &&
    invitationEmail &&
    user.email.toLowerCase() !== decodeURIComponent(invitationEmail).toLowerCase()
  ) {
    const url = getRequestUrl(request);

    const searchParams = new URLSearchParams({
      email: decodeURIComponent(invitationEmail),
      redirect_to: url.href,
    });

    const authUrl = getAuthUrl(signInPath, searchParams, url.hostname);
    redirect(authUrl.toString(), RedirectType.replace);
  }

  // Else consume invitation and redirect to the home page
  try {
    await trpcInServerFunction.collectivites.membres.invitations.consume.mutate(
      {
        invitationId,
      }
    );
  } catch (error) {
    console.error(
      `Error consuming invitation ${invitationId}`,
      JSON.stringify(error)
    );

    // Redirige vers la page de finalisation avec un message d'erreur
    redirect(
      `/finaliser-mon-inscription?error=invitation`,
      RedirectType.replace
    );
  }

  redirect('/', RedirectType.replace);
}
