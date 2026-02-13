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
 * @returns The access_token if found, null otherwise
 */
export async function extractAccessTokenFromSupabaseCookie(
  req: Request,
  supabaseUrl: string
): Promise<string | null> {
  const cookies = parseCookieHeader(req.headers.cookie ?? '');

  const supabaseAuthCookieName = supabaseUrlToAuthCookieName(supabaseUrl);

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
