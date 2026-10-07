import { describe, expect, it } from 'vitest';
import {
  buildLinkIdentityUrl,
  isLinkIdentityErrorCode,
} from './link-oidc-identity.profile-urls';

describe('buildLinkIdentityUrl', () => {
  it('construit l’URL de liaison volontaire avec mode=link et next', () => {
    expect(
      buildLinkIdentityUrl({
        backendUrl: 'http://localhost:8080',
        provider: 'proconnect',
        next: '/profil',
      })
    ).toBe(
      'http://localhost:8080/api/v1/proconnect/login?mode=link&next=%2Fprofil'
    );
  });

  it('encode correctement un chemin `next` avec des paramètres', () => {
    expect(
      buildLinkIdentityUrl({
        backendUrl: 'http://localhost:8080',
        provider: 'moncompteademe',
        next: '/profil?tab=securite',
      })
    ).toBe(
      'http://localhost:8080/api/v1/moncompteademe/login?mode=link&next=%2Fprofil%3Ftab%3Dsecurite'
    );
  });
});

describe('isLinkIdentityErrorCode', () => {
  it('reconnaît les codes d’erreur de liaison volontaire connus', () => {
    expect(isLinkIdentityErrorCode('oidc-identite-deja-liee-ailleurs')).toBe(
      true
    );
    expect(isLinkIdentityErrorCode('oidc-compte-supprime')).toBe(true);
  });

  it('rejette un code inconnu ou hors périmètre de la liaison volontaire', () => {
    expect(isLinkIdentityErrorCode('oidc-state-invalide')).toBe(false);
    expect(isLinkIdentityErrorCode('')).toBe(false);
    expect(isLinkIdentityErrorCode('n-importe-quoi')).toBe(false);
  });
});
