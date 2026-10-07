import { signUpPath } from '@/app/app/paths';
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

  // L'email de la session est asserté par le fournisseur d'identité : il n'a
  // aucune raison d'égaler celui saisi par l'admin (alias, domaine différent,
  // coquille). Le lien d'invitation — opaque, à usage unique et révocable —
  // fait donc seul preuve : on consomme quelle que soit l'adresse de la session.
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
