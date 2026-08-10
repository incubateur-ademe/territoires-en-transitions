import { describe, expect, it } from 'vitest';
import {
  buildCreateUserUrl,
  buildSignupWithOidcUrl,
} from './create-user-with-oidc.urls';

describe('buildSignupWithOidcUrl', () => {
  it('construit l’URL de login du provider avec l’intention de création', () => {
    expect(
      buildSignupWithOidcUrl({
        backendUrl: 'http://localhost:8080',
        provider: 'moncompteademe',
      })
    ).toBe('http://localhost:8080/api/v1/moncompteademe/login?intent=creation');
  });

  it('cible le provider demandé', () => {
    expect(
      buildSignupWithOidcUrl({
        backendUrl: 'http://localhost:8080',
        provider: 'proconnect',
      })
    ).toBe('http://localhost:8080/api/v1/proconnect/login?intent=creation');
  });

  it('ajoute `next` quand c’est un chemin interne', () => {
    expect(
      buildSignupWithOidcUrl({
        backendUrl: 'http://localhost:8080',
        provider: 'moncompteademe',
        next: '/invitation/abc',
      })
    ).toBe(
      'http://localhost:8080/api/v1/moncompteademe/login?intent=creation&next=%2Finvitation%2Fabc'
    );
  });

  it('écarte un `next` externe (open redirect)', () => {
    expect(
      buildSignupWithOidcUrl({
        backendUrl: 'http://localhost:8080',
        provider: 'moncompteademe',
        next: '//evil.example.com',
      })
    ).toBe('http://localhost:8080/api/v1/moncompteademe/login?intent=creation');
  });

  it('tolère un `next` absent ou nul', () => {
    expect(
      buildSignupWithOidcUrl({
        backendUrl: 'http://localhost:8080',
        provider: 'moncompteademe',
        next: null,
      })
    ).toBe('http://localhost:8080/api/v1/moncompteademe/login?intent=creation');
  });
});

describe('buildCreateUserUrl', () => {
  it('construit l’URL du endpoint de création de compte avec le ticket', () => {
    expect(
      buildCreateUserUrl({
        backendUrl: 'http://localhost:8080',
        ticket: 'abc.def.ghi',
      })
    ).toBe(
      'http://localhost:8080/api/v1/auth/proconnect/creer-compte?ticket=abc.def.ghi'
    );
  });

  it('ajoute `next` quand il est fourni', () => {
    expect(
      buildCreateUserUrl({
        backendUrl: 'http://localhost:8080',
        ticket: 'abc.def.ghi',
        next: '/collectivite/1',
      })
    ).toBe(
      'http://localhost:8080/api/v1/auth/proconnect/creer-compte?ticket=abc.def.ghi&next=%2Fcollectivite%2F1'
    );
  });
});
