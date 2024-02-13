import {type EmailOtpType} from '@supabase/supabase-js';
import {cookies} from 'next/headers';
import {type NextRequest, NextResponse} from 'next/server';
import {createClient} from 'src/supabase/server';

/**
 * URL appelée pour valider un lien d'auth. reçu par mail.
 *
 * Echange le code reçu par mail par le token d'auth. et redirige vers la page
 * dont l'url est donnée par `searchParams.next`.
 */
export const GET = async (request: NextRequest) => {
  const cookieStore = cookies();

  const {searchParams, hostname, host} = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  console.log(request.url);
  console.log(searchParams, hostname, host);
  console.log(request.nextUrl.searchParams, request.nextUrl.hostname,
    request.nextUrl.host);

  if (token_hash && type) {
    const supabase = createClient(cookieStore);

    const {data, error} = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error && data.session) {
      // Enregistre les tokens dans le domaine racine pour pouvoir les partager entre les sous-domaines
      const domain = 'territoiresentransitions.fr';
      const response = NextResponse.redirect(next)
      response.headers.append(
        'Set-Cookie',
        `tet-access-token=${data.session.access_token}; Domain=${domain}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax; Secure`
      );
      response.headers.append(
        'Set-Cookie',
        `tet-refresh-token=${data.session.refresh_token}; Domain=${domain}; Max-Age=${60 * 60 * 24 * 365}; Path=/; SameSite=Lax; Secure`
      );
      return response;
    }
    console.log('/auth/confirm error:', error);
  }

  // renvoi vers une page d'erreur
  return NextResponse.redirect('/auth/error');
};
