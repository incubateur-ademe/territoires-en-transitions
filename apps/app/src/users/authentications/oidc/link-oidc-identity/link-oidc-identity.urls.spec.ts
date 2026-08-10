import { describe, expect, it } from 'vitest';
import { sanitizeNextPath } from '../../sanitize-next-path';
import {
  appendLinkedAccountsParam,
  buildConfirmSessionUrl,
} from './link-oidc-identity.urls';

describe('sanitizeNextPath', () => {
  it('accepte un chemin relatif sûr', () => {
    expect(sanitizeNextPath('/collectivite/1')).toBe('/collectivite/1');
  });

  it('rejette une URL protocole-relative (//)', () => {
    expect(sanitizeNextPath('//evil.example.com')).toBeUndefined();
  });

  it('rejette une URL absolue', () => {
    expect(sanitizeNextPath('https://evil.example.com')).toBeUndefined();
  });

  it('rejette un chemin contenant un backslash', () => {
    expect(sanitizeNextPath('/foo\\bar')).toBeUndefined();
  });

  it('rejette une valeur vide, null ou undefined', () => {
    expect(sanitizeNextPath('')).toBeUndefined();
    expect(sanitizeNextPath(null)).toBeUndefined();
    expect(sanitizeNextPath(undefined)).toBeUndefined();
  });
});

describe('buildConfirmSessionUrl', () => {
  it('construit l’URL de la page confirmer-session avec le ticket', () => {
    const url = buildConfirmSessionUrl({
      appUrl: 'http://localhost:3000',
      ticket: 'abc.def.ghi',
    });

    expect(url).toBe(
      'http://localhost:3000/auth/proconnect/confirmer-session?ticket=abc.def.ghi'
    );
  });

  it('ajoute `next` (encodé) quand il est fourni', () => {
    const url = buildConfirmSessionUrl({
      appUrl: 'http://localhost:3000',
      ticket: 'abc.def.ghi',
      next: '/collectivite/1',
    });

    expect(url).toBe(
      'http://localhost:3000/auth/proconnect/confirmer-session?ticket=abc.def.ghi&next=%2Fcollectivite%2F1'
    );
  });
});

describe('appendLinkedAccountsParam', () => {
  it('ajoute le paramètre sur un chemin simple', () => {
    expect(appendLinkedAccountsParam('/')).toBe('/?comptes-associes=1');
  });

  it('ajoute le paramètre sur un chemin avec sous-chemin', () => {
    expect(appendLinkedAccountsParam('/collectivite/1')).toBe(
      '/collectivite/1?comptes-associes=1'
    );
  });

  it('préserve les paramètres de requête existants', () => {
    expect(appendLinkedAccountsParam('/collectivite/1?tab=fiches')).toBe(
      '/collectivite/1?tab=fiches&comptes-associes=1'
    );
  });
});
