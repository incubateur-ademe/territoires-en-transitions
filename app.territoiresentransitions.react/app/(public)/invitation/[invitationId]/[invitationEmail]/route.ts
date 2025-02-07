import { getAuthUrl } from '@/api';
import { getAuthUser } from '@/api/utils/supabase/auth-user.server';
import { createClient } from '@/api/utils/supabase/server-client';
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
    const searchParams = new URLSearchParams({
      email: invitationEmail,
      redirect_to: url.href,
    });

    const authUrl = getAuthUrl(signUpPath, searchParams, url.hostname);
    redirect(authUrl.toString(), RedirectType.replace);
  }

  // Else consume invitation and redirect to the home page

  const supabase = await createClient();

  const { error } = await supabase.rpc('consume_invitation', {
    id: invitationId,
  });

  if (error) {
    console.error(
      `Error consuming invitation ${invitationId}`,
      JSON.stringify(error)
    );
  }

  redirect('/', RedirectType.replace);
}
