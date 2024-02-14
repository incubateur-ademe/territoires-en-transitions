import {type EmailOtpType} from '@supabase/supabase-js';
import {ACCESS_TOKEN, REFRESH_TOKEN, formatAuthToken} from '@tet/api';
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

  const {searchParams} = new URL(request.url);
  const token_hash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/';

  if (token_hash && type) {
    const supabase = createClient(cookieStore);

    const {data, error} = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });
    if (!error && data.session) {
      // Le partage des tokens entre sous-domaines nécessite le nom du domaine racine.
      // On extrait celui-ci depuis l'url vers laquelle on doit rediriger.
      const domain =
        new URL(next).hostname.split('.').toSpliced(0, 1).join('.') ||
        'localhost';

      // Enregistre les tokens dans le domaine racine pour pouvoir les partager entre les sous-domaines
      const response = NextResponse.redirect(next);
      response.headers.append(
        'Set-Cookie',
        formatAuthToken(ACCESS_TOKEN, data.session.access_token, domain),
      );
      response.headers.append(
        'Set-Cookie',
        formatAuthToken(REFRESH_TOKEN, data.session.refresh_token, domain),
      );
      return response;
    }
    console.log('/auth/confirm error:', error);
  }

  // renvoi vers une page d'erreur
  return NextResponse.redirect('/auth/error');
};
