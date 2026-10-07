import { describe, expect, it } from 'vitest';
import { buildLoginWithOidcUrl } from './login-user-with-oidc.urls';

describe('buildLoginWithOidcUrl', () => {
  it('construit l’URL de login du provider', () => {
    expect(
      buildLoginWithOidcUrl({
        backendUrl: 'http://localhost:8080',
        provider: 'proconnect',
      })
    ).toBe('http://localhost:8080/api/v1/proconnect/login');
  });

  it('relaie `next` pour revenir sur la destination après authentification', () => {
    expect(
      buildLoginWithOidcUrl({
        backendUrl: 'http://localhost:8080',
        provider: 'proconnect',
        next: '/invitation/a35176bd',
      })
    ).toBe(
      'http://localhost:8080/api/v1/proconnect/login?next=%2Finvitation%2Fa35176bd'
    );
  });

  it('écarte un `next` externe (open redirect)', () => {
    expect(
      buildLoginWithOidcUrl({
        backendUrl: 'http://localhost:8080',
        provider: 'proconnect',
        next: '//evil.example.com',
      })
    ).toBe('http://localhost:8080/api/v1/proconnect/login');
  });

  it('n’ajoute pas `next` pour la destination par défaut', () => {
    expect(
      buildLoginWithOidcUrl({
        backendUrl: 'http://localhost:8080',
        provider: 'moncompteademe',
        next: '/',
      })
    ).toBe('http://localhost:8080/api/v1/moncompteademe/login');
  });

  it('tolère un `next` absent ou nul', () => {
    expect(
      buildLoginWithOidcUrl({
        backendUrl: 'http://localhost:8080',
        provider: 'moncompteademe',
        next: null,
      })
    ).toBe('http://localhost:8080/api/v1/moncompteademe/login');
  });
});
