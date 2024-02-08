import {type EmailOtpType} from '@supabase/supabase-js';
import {cookies} from 'next/headers';
import {type NextRequest, NextResponse} from 'next/server';

import {createClient} from 'src/supabase/server';

/**
 * URL appelée pour valider un lien d'auth. reçu par mail.
 *
 * Echange le code reçu par mail par le token d'auth.
 */
export const GET = async (request: NextRequest) => {
  const cookieStore = cookies();

  const {searchParams} = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  const redirectTo = request.nextUrl.clone();
  redirectTo.pathname = next;
  redirectTo.searchParams.delete('token_hash');
  redirectTo.searchParams.delete('type');

  if (token_hash && type) {
    const supabase = createClient(cookieStore);

    const {error} = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error) {
      redirectTo.searchParams.delete('next');
      return NextResponse.redirect(redirectTo);
    }
    console.log('/auth/confirm error:', error);
  }

  // renvoi vers une page d'erreur
  redirectTo.pathname = '/auth/error';
  return NextResponse.redirect(redirectTo);
};
