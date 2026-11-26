import { type CookieOptions, createServerClient } from '@supabase/ssr';
import type { JwtPayload, SupabaseClient } from '@supabase/supabase-js';
import { type NextRequest, NextResponse } from 'next/server';
import { ENV } from '../../environmentVariables';
import { getCookieOptions, getLegacyRootDomainCookie } from './cookie-options';

type Output = {
  supabaseResponse: NextResponse;
  supabaseUser: JwtPayload | undefined;
  supabaseClient: SupabaseClient;
};

export async function getNextResponseWithUpdatedSupabaseSession({
  request,
  headers,
}: {
  request: NextRequest;
  headers?: Headers;
}): Promise<Output> {
  // Fusionne les en-têtes additionnels (x-nonce, Content-Security-Policy,
  // x-current-path…) avec ceux de la requête courante, puis les transmet *côté
  // requête*. C'est indispensable pour que Next.js lise la CSP et propage le
  // nonce sur ses scripts inline, et pour que les RSCs puissent lire ces
  // en-têtes. On reconstruit à chaque écriture de cookie pour conserver les
  // cookies de session rafraîchis (cf. avertissement Supabase ci-dessous).
  const buildRequestHeaders = () => {
    const merged = new Headers(request.headers);
    headers?.forEach((value, key) => merged.set(key, value));
    return merged;
  };

  const cookieOptions = getCookieOptions();
  const migratedCookies = migrateLegacyRootDomainCookies(
    request,
    cookieOptions
  );

  let supabaseResponse = NextResponse.next({
    request: { headers: buildRequestHeaders() },
  });

  const supabaseClient = createServerClient(
    ENV.supabase_url ?? '',
    ENV.supabase_anon_key ?? '',
    {
      cookieOptions,
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          supabaseResponse = NextResponse.next({
            request: { headers: buildRequestHeaders() },
          });

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and supabase.auth.getClaims().
  // A simple mistake could make it very hard to debug issues with users being randomly logged out.
  // IMPORTANT: If you remove getClaims() and you use server-side rendering
  // with the Supabase client, your users may be randomly logged out.
  const { data } = await supabaseClient.auth.getClaims();
  const supabaseUser = data?.claims;

  // Après getClaims : un rafraîchissement de session recrée la réponse et pose
  // ses propres cookies, qui priment sur la recopie.
  migratedCookies.forEach(({ name, value, options }) => {
    if (!supabaseResponse.cookies.get(name)) {
      supabaseResponse.cookies.set(name, value, options);
    }
  });

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

  return {
    supabaseResponse,
    supabaseUser,
    supabaseClient,
  };
}

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

/**
 * Passage du cookie de session du domaine racine à un cookie `__Host-` : recopie
 * l'ancien cookie (morceaux `.0`, `.1`… compris) sous le nouveau nom, sans
 * déconnecter, puis le supprime du domaine racine. La suppression est faite
 * même sans recopie : tant qu'il existe, l'ancien cookie est envoyé à tous les
 * sous-domaines.
 *
 * Un onglet chargé avant l'activation garde l'ancienne configuration (nom du
 * cookie, URL du backend) : ses appels échouent en 401 jusqu'à son
 * rechargement. Garder les deux cookies le temps d'une transition ferait
 * diverger leurs jetons de rafraîchissement.
 *
 * Modifie les cookies de la requête (vus par Supabase et les RSC) et renvoie
 * ceux à poser sur la réponse.
 */
export function migrateLegacyRootDomainCookies(
  request: NextRequest,
  cookieOptions: ReturnType<typeof getCookieOptions>
): CookieToSet[] {
  const legacy = getLegacyRootDomainCookie();
  const name = cookieOptions.name;
  if (!legacy || !name) {
    return [];
  }

  const isChunkOf = (base: string, cookieName: string) =>
    cookieName === base || cookieName.startsWith(`${base}.`);

  const allCookies = request.cookies.getAll();
  const legacyCookies = allCookies.filter((c) =>
    isChunkOf(legacy.name, c.name)
  );
  const hasCurrentCookie = allCookies.some((c) => isChunkOf(name, c.name));

  const { name: _name, ...options } = cookieOptions;

  return legacyCookies.flatMap((legacyCookie) => {
    request.cookies.delete(legacyCookie.name);
    const removal: CookieToSet = {
      name: legacyCookie.name,
      value: '',
      options: { ...options, domain: legacy.domain, maxAge: 0 },
    };
    if (hasCurrentCookie) {
      return [removal];
    }
    const migratedName = name + legacyCookie.name.slice(legacy.name.length);
    request.cookies.set(migratedName, legacyCookie.value);
    return [
      removal,
      { name: migratedName, value: legacyCookie.value, options },
    ];
  });
}
