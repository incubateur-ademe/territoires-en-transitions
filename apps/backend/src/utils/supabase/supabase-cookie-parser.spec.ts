import type { Request } from 'express';
import { describe, expect, it } from 'vitest';
import { extractAccessTokenFromSupabaseCookie } from './supabase-cookie-parser';

const options = {
  supabaseUrl: 'https://supabase-api.territoiresentransitions.fr',
  appUrl: 'https://app.territoiresentransitions.fr/',
  cookieName: 'sb-tet-test-auth-token',
};

const buildRequest = (origin?: string): Request =>
  ({
    headers: {
      cookie: `${options.cookieName}=${JSON.stringify({
        access_token: 'jwt',
      })}`,
      ...(origin && { origin }),
    },
  } as unknown as Request);

describe('extractAccessTokenFromSupabaseCookie', () => {
  it("lit le cookie sans en-tête Origin (navigation, appel serveur) ou depuis l'app", async () => {
    expect(
      await extractAccessTokenFromSupabaseCookie(buildRequest(), options)
    ).toBe('jwt');
    expect(
      await extractAccessTokenFromSupabaseCookie(
        buildRequest('https://app.territoiresentransitions.fr'),
        options
      )
    ).toBe('jwt');
  });

  it("ignore le cookie d'une requête venue d'une autre origine du même site", async () => {
    expect(
      await extractAccessTokenFromSupabaseCookie(
        buildRequest('https://1-app.preview.territoiresentransitions.fr'),
        options
      )
    ).toBeNull();
  });
});
