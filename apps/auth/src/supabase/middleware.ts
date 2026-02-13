// Code partially taken from https://supabase.com/docs/guides/auth/server-side/nextjs

import { getRequestUrl } from '@tet/api';
import { dcpFetch } from '@tet/api/users/dcp.fetch';
import { getRootDomain } from '@tet/api/utils/pathUtils';
import { getNextResponseWithUpdatedSupabaseSession } from '@tet/api/utils/supabase/proxy-client';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSessionOrRedirect({
  request,
  headers,
}: {
  request: NextRequest;
  headers?: Headers;
}) {
  const { supabaseResponse, supabaseUser, supabaseClient } =
    await getNextResponseWithUpdatedSupabaseSession({ request, headers });

  if (!supabaseUser) {
    return supabaseResponse;
  }

  const url = getRequestUrl(request);

  // ↓ After this line the user is authenticated
  // We check for specific scenarios of redirection

  const userDetails = await dcpFetch({
    dbClient: supabaseClient,
    user_id: supabaseUser.sub,
  });

  // Authorize `/signup` route for the authenticated user
  // to allow the redirect below to work.
  if (!userDetails && url.pathname.startsWith('/signup')) {
    return supabaseResponse;
  }

  // If user is authenticated but no personal data have been filled
  // → redirect to the personal data form
  if (!userDetails) {
    url.pathname = '/signup';
    url.searchParams.set('view', 'etape3');

    return NextResponse.redirect(url);
  }

  // If user is authenticated and has filled her personal data
  // the only remaining allowed route is to join a collectivity
  if (
    url.pathname.startsWith('/rejoindre-une-collectivite') ||
    url.pathname.startsWith('/login')
  ) {
    return supabaseResponse;
  }

  // For all other cases → redirect to the app

  const searchParams = url.searchParams;
  const redirectTo = searchParams.get('redirect_to');

  if (redirectTo?.startsWith('http')) {
    const newUrl = new URL(redirectTo);

    console.log('newUrl.hostname', newUrl.hostname);
    console.log('url.hostname', url.hostname);

    // Allow redirection only to the same root domain
    if (getRootDomain(newUrl.hostname) === getRootDomain(url.hostname)) {
      return NextResponse.redirect(newUrl);
    }
  }

  const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL as string);

  if (redirectTo?.startsWith('/')) {
    appUrl.pathname = redirectTo;
  }

  return NextResponse.redirect(appUrl);
}
