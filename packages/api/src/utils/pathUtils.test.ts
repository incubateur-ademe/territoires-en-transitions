import { describe, expect, it } from 'vitest';
import { getAuthBaseUrl } from './pathUtils';

describe('getAuthBaseUrl', () => {
  it("donne l'url de l'auth. en mode dev", () => {
    expect(getAuthBaseUrl('localhost')).toEqual('http://localhost:3003');
  });

  it("donne l'url de l'auth. en mode preprod domaine tet", () => {
    expect(getAuthBaseUrl('preprod-app.tet.fr')).toEqual(
      'https://preprod-auth.tet.fr'
    );
  });

  it("donne l'url de l'auth. en mode preprod domaine koyeb", () => {
    expect(getAuthBaseUrl('preprod-app-tet.koyeb.app')).toEqual(
      'https://preprod-auth-tet.koyeb.app'
    );

    expect(getAuthBaseUrl('test-app-branch-tet.koyeb.app')).toEqual(
      'https://preprod-auth-tet.koyeb.app'
    );
  });

  it("donne l'url de l'auth. en mode prod domaine tet", () => {
    expect(getAuthBaseUrl('app.tet.fr')).toEqual('https://auth.tet.fr');
    expect(getAuthBaseUrl('tet.fr')).toEqual('https://auth.tet.fr');
  });
});
