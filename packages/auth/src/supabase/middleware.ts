// Code partially taken from https://supabase.com/docs/guides/auth/server-side/nextjs

import { dcpFetch } from '@/api/utilisateurs/shared/data_access/dcp.fetch';
import { getRootDomain } from '@/api/utils/pathUtils';
import { createClient } from '@/api/utils/supabase/middleware-client';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSessionOrRedirect(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = await createClient(request, supabaseResponse);

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!user || error) {
    // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
    // creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    return supabaseResponse;
  }

  // ↓ After this line the user is authenticated
  // We check for specific scenarios of redirection

  const userDetails = await dcpFetch({
    dbClient: supabase,
    user_id: user.id,
  });

  const url = request.nextUrl.clone();

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
  if (url.pathname.startsWith('/rejoindre-une-collectivite')) {
    return supabaseResponse;
  }

  // For all other cases → redirect to the app

  const searchParams = url.searchParams;
  const redirectTo = searchParams.get('redirect_to');

  url.href = process.env.NEXT_PUBLIC_APP_URL!;

  if (redirectTo?.startsWith('/')) {
    url.href = url.href + redirectTo;
  } else if (redirectTo?.startsWith('http')) {
    const newUrl = new URL(redirectTo);

    console.log('newUrl.hostname', newUrl.hostname);
    console.log('url.hostname', url.hostname);

    // Allow redirection only to the same domain
    if (getRootDomain(newUrl.hostname) === getRootDomain(url.hostname)) {
      return NextResponse.redirect(newUrl);
    }
  }

  return NextResponse.redirect(url);
}
