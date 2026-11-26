import { describe, expect, it } from 'vitest';
import { getOidcFlowRedirectUrl } from './oidc.utils';

const appUrl = 'https://app.territoiresentransitions.fr';
const originalUrl = '/api/v1/proconnect/login?mode=link';
const onApp = `${appUrl}/api/v1/proconnect/callback`;
const onApi =
  'https://api.territoiresentransitions.fr/api/v1/proconnect/callback';

const redirectUrl = (redirectUri: string, headers: Record<string, string>) =>
  getOidcFlowRedirectUrl({
    req: { headers, originalUrl },
    appUrl,
    redirectUri,
  });

describe('getOidcFlowRedirectUrl', () => {
  it("renvoie vers l'origine de l'app une requête arrivée par api.*", () => {
    expect(
      redirectUrl(onApp, { host: 'api.territoiresentransitions.fr' })
    ).toBe(`${appUrl}${originalUrl}`);
  });

  it('ne renvoie pas une requête déjà passée par le proxy (pas de boucle)', () => {
    expect(
      redirectUrl(onApp, {
        host: 'api.territoiresentransitions.fr',
        'x-forwarded-host': 'app.territoiresentransitions.fr',
      })
    ).toBeNull();
  });

  it('ne fait rien tant que la redirect URI est sur api.*', () => {
    expect(redirectUrl(onApi, { host: 'autre.example.fr' })).toBeNull();
  });
});
