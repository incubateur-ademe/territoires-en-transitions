import { signUpPath } from '@/app/app/paths';
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

  // Else consume invitation and redirect to the home page
  try {
    await trpcInServerFunction.users.invitations.consume.mutate({
      invitationId,
    });
  } catch (error) {
    console.error(
      `Error consuming invitation ${invitationId}`,
      JSON.stringify(error)
    );
  }

  redirect('/', RedirectType.replace);
}
