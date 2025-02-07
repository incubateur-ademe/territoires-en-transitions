// Code partially taken from https://supabase.com/docs/guides/auth/server-side/nextjs

import { Database } from '@/api';
import { dcpFetch } from '@/api/utilisateurs/shared/data_access/dcp.fetch';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { supabaseCookieOptions } from '@/api/utils/supabase/cookie-options';

export async function updateSessionOrRedirect(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: supabaseCookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  let user;
  try {
    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser();

    user = supabaseUser;

    if (!user) {
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
      if (error) {
        console.error('Error getting user session:', JSON.stringify(error));
      }

      return supabaseResponse;
    }
  } catch (error) {
    console.error('Error getting user session:', JSON.stringify(error));
    return supabaseResponse;
  }

  // ↓ After this line the user is authenticated
  // so we check for specific scenarios of redirection.

  const dcpData = await dcpFetch({
    dbClient: supabase,
    user_id: user.id,
  });

  const url = request.nextUrl.clone();

  // Authorize `/signup` route for the authenticated user
  // to allow the redirect below to work.
  if (!dcpData && url.pathname.startsWith('/signup')) {
    return supabaseResponse;
  }

  // If user is authenticated but no personal data have been filled
  // → redirect to the personal data form
  if (!dcpData) {
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
  }

  return NextResponse.redirect(url);
}
