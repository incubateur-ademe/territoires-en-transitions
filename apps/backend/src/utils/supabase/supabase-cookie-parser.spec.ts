import type { Request } from 'express';
import { describe, expect, it } from 'vitest';
import { extractAccessTokenFromSupabaseCookie } from './supabase-cookie-parser';

const supabaseUrl = 'https://supabase-api.territoiresentransitions.fr';
const cookieName = 'sb-tet-test-auth-token';

const request = {
  headers: {
    cookie: `${cookieName}=${JSON.stringify({ access_token: 'jwt' })}`,
  },
} as unknown as Request;

describe('extractAccessTokenFromSupabaseCookie', () => {
  it('lit le cookie de session', async () => {
    expect(
      await extractAccessTokenFromSupabaseCookie(
        request,
        supabaseUrl,
        cookieName
      )
    ).toBe('jwt');
  });

  it("avec un nom __Host-, lit aussi l'ancien cookie sans préfixe", async () => {
    expect(
      await extractAccessTokenFromSupabaseCookie(
        request,
        supabaseUrl,
        `__Host-${cookieName}`
      )
    ).toBe('jwt');
  });
});
