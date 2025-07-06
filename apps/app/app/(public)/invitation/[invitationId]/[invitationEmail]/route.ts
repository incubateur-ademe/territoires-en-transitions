import { getAuthUrl } from '@/api';
import { ENV } from '@/api/environmentVariables';
import { getAuthUser } from '@/api/utils/supabase/auth-user.server';
import { trpcInServerFunction } from '@/api/utils/trpc/server-client';
import { signUpPath } from '@/app/app/paths';
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
    const url = new URL(request.url);

    // Get the hostname of the request, e.g. 'app.territoiresentransitions.fr'
    // We cannot simply use `url.hostname` because it returns '0.0.0.0' in Docker environment
    url.hostname = request.headers.get('host') ?? url.hostname;
    url.port =
      ENV.node_env !== 'development' && url.hostname !== 'localhost'
        ? '443'
        : url.port;

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
