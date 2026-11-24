import {
  combineChunks,
  parseCookieHeader,
  stringFromBase64URL,
} from '@supabase/ssr';
import { supabaseUrlToAuthCookieName } from '@tet/domain/utils';
import { Request } from 'express';

const BASE64_PREFIX = 'base64-';

/**
 * Extracts the Supabase access_token from the request cookies.
 * Supports the @supabase/ssr cookie format (base64url-encoded JSON, optionally chunked).
 *
 * Le cookie est une autorité ambiante : le navigateur le joint à toute requête
 * d'un sous-domaine du même site (une preview, par exemple). Il n'est donc
 * honoré que si la requête ne porte pas d'en-tête `Origin` (navigation, appel
 * serveur) ou si celui-ci est l'origine de l'app.
 *
 * @returns The access_token if found, null otherwise
 */
export async function extractAccessTokenFromSupabaseCookie(
  req: Request,
  {
    supabaseUrl,
    appUrl,
    cookieName,
  }: { supabaseUrl: string; appUrl: string; cookieName?: string }
): Promise<string | null> {
  const origin = req.headers.origin;
  if (origin && origin !== new URL(appUrl).origin) {
    return null;
  }

  const cookies = parseCookieHeader(req.headers.cookie ?? '');

  const supabaseAuthCookieName =
    cookieName ?? supabaseUrlToAuthCookieName(supabaseUrl);

  const base64CookieValue = await combineChunks(
    supabaseAuthCookieName,
    (name) => cookies.find((cookie) => cookie.name === name)?.value
  );

  if (!base64CookieValue) {
    return null;
  }

  let decoded: string;
  if (base64CookieValue.startsWith(BASE64_PREFIX)) {
    try {
      decoded = stringFromBase64URL(
        base64CookieValue.substring(BASE64_PREFIX.length)
      );
    } catch {
      return null;
    }
  } else {
    decoded = base64CookieValue;
  }

  try {
    const session = JSON.parse(decoded) as {
      access_token?: string;
    };
    return session.access_token ?? null;
  } catch {
    return null;
  }
}
