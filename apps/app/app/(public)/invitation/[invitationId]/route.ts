import { signInPath, signUpPath } from '@/app/app/paths';
import { getRequestUrl } from '@tet/api';
import { getAuthUser } from '@tet/api/utils/supabase/auth-user.server';
import { trpcInServerFunction } from '@tet/api/utils/trpc/trpc-server-client';
import { redirect, RedirectType } from 'next/navigation';

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ invitationId: string }>;
  }
) {
  const { invitationId } = await params;

  const invitation =
    await trpcInServerFunction.collectivites.membres.invitations.getEmail.query(
      { invitationId }
    );

  if (!invitation) {
    redirect(
      `/finaliser-mon-inscription?error=invitation`,
      RedirectType.replace
    );
  }

  const invitationEmail = invitation.email;
  const user = await getAuthUser();

  if (!user) {
    const url = getRequestUrl(request);

    const searchParams = new URLSearchParams({
      email: invitationEmail,
      redirect_to: `${url.pathname}${url.search}`,
    });

    redirect(`${signUpPath}?${searchParams}`, RedirectType.replace);
  }

  // Si l'utilisateur est connecté avec un email différent de celui de l'invitation,
  // on le redirige vers la page de connexion avec le bon email pré-rempli
  if (
    user.email &&
    user.email.toLowerCase() !== invitationEmail.toLowerCase()
  ) {
    const url = getRequestUrl(request);

    const searchParams = new URLSearchParams({
      email: invitationEmail,
      redirect_to: `${url.pathname}${url.search}`,
    });

    redirect(`${signInPath}?${searchParams}`, RedirectType.replace);
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
