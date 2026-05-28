import { describe, expect, it } from 'vitest';
import {
  isAllowedStorageUrl,
  MAX_FILES,
  sanitizeFilename,
  zipRequestSchema,
} from './validate';

const SUPABASE = 'https://abcd1234.supabase.co';

describe('isAllowedStorageUrl', () => {
  it('accepte une URL signée Supabase Storage', () => {
    expect(
      isAllowedStorageUrl(
        `${SUPABASE}/storage/v1/object/sign/collectivites-1/hash123?token=eyJ&t=1`,
        SUPABASE
      )
    ).toBe(true);
  });

  it('accepte le même origine en local (http + 127.0.0.1)', () => {
    const local = 'http://127.0.0.1:54321';
    expect(
      isAllowedStorageUrl(
        `${local}/storage/v1/object/sign/collectivites-1/abc?token=x`,
        local
      )
    ).toBe(true);
  });

  // Régression du pentest V4 : la preuve d'exploit envoyait une URL externe
  // contrôlée par l'attaquant — doit être rejetée.
  describe('protection SSRF (pentest V4)', () => {
    it.each([
      'https://orhus.fr/exfil',
      'https://attacker.example.com/storage/v1/object/sign/x/y',
      'https://abcd1234.supabase.co.attacker.tld/storage/v1/object/sign/x/y',
      // Métadonnées cloud AWS / GCP / Azure
      'http://169.254.169.254/latest/meta-data/',
      'http://metadata.google.internal/computeMetadata/v1/',
      // Réseaux privés
      'http://127.0.0.1:8000/admin',
      'http://localhost/admin',
      'http://10.0.0.1/secret',
      'http://192.168.1.1/router',
      'http://172.16.0.1/internal',
      // Autres protocoles
      'file:///etc/passwd',
      'gopher://abcd1234.supabase.co/',
      // Faux préfixe pour bypass naïf de startsWith()
      'https://abcd1234.supabase.co.evil.tld/storage/v1/object/sign/x/y',
    ])('rejette l\'URL hostile `%s`', (url) => {
      expect(isAllowedStorageUrl(url, SUPABASE)).toBe(false);
    });

    it('rejette une URL Supabase pointant ailleurs que vers `/storage/v1/object/sign/`', () => {
      expect(
        isAllowedStorageUrl(
          `${SUPABASE}/storage/v1/object/public/bucket/file`,
          SUPABASE
        )
      ).toBe(false);
      expect(
        isAllowedStorageUrl(`${SUPABASE}/auth/v1/admin/users`, SUPABASE)
      ).toBe(false);
      expect(
        isAllowedStorageUrl(`${SUPABASE}/rest/v1/users`, SUPABASE)
      ).toBe(false);
    });

    it('rejette une URL non parsable', () => {
      expect(isAllowedStorageUrl('not a url', SUPABASE)).toBe(false);
      expect(isAllowedStorageUrl('', SUPABASE)).toBe(false);
    });

    it("rejette toutes les URL si SUPABASE_URL n'est pas configuré", () => {
      expect(
        isAllowedStorageUrl(
          `${SUPABASE}/storage/v1/object/sign/x/y`,
          undefined
        )
      ).toBe(false);
      expect(
        isAllowedStorageUrl(`${SUPABASE}/storage/v1/object/sign/x/y`, '')
      ).toBe(false);
    });

    it('refuse un changement de protocole (https → http)', () => {
      expect(
        isAllowedStorageUrl(
          'http://abcd1234.supabase.co/storage/v1/object/sign/x/y',
          SUPABASE
        )
      ).toBe(false);
    });
  });
});

describe('sanitizeFilename', () => {
  it('garde un nom de fichier basique tel quel', () => {
    expect(sanitizeFilename('rapport.pdf')).toBe('rapport.pdf');
    expect(sanitizeFilename('  rapport.pdf  ')).toBe('rapport.pdf');
  });

  it('réduit un chemin à son basename (anti zip slip)', () => {
    expect(sanitizeFilename('../../etc/passwd')).toBe('passwd');
    expect(sanitizeFilename('a/b/c.txt')).toBe('c.txt');
    expect(sanitizeFilename('C:\\Windows\\system32\\cmd.exe')).toBe('cmd.exe');
  });

  it('rejette les noms vides, `.`, `..` ou contenant un NUL', () => {
    expect(sanitizeFilename('')).toBeNull();
    expect(sanitizeFilename('   ')).toBeNull();
    expect(sanitizeFilename('.')).toBeNull();
    expect(sanitizeFilename('..')).toBeNull();
    expect(sanitizeFilename('rap\0port.pdf')).toBeNull();
  });
});

describe('zipRequestSchema', () => {
  const validEntry = {
    filename: 'rapport.pdf',
    url: `${SUPABASE}/storage/v1/object/sign/bucket/hash?token=t`,
  };

  it('accepte un payload bien formé', () => {
    expect(
      zipRequestSchema.safeParse({ signedUrls: [validEntry] }).success
    ).toBe(true);
  });

  it('rejette un tableau vide', () => {
    expect(zipRequestSchema.safeParse({ signedUrls: [] }).success).toBe(false);
  });

  it("rejette un tableau trop long (>MAX_FILES)", () => {
    const tooMany = Array.from({ length: MAX_FILES + 1 }, () => validEntry);
    expect(
      zipRequestSchema.safeParse({ signedUrls: tooMany }).success
    ).toBe(false);
  });

  it('rejette une URL non parsable', () => {
    expect(
      zipRequestSchema.safeParse({
        signedUrls: [{ filename: 'rapport.pdf', url: 'pas-une-url' }],
      }).success
    ).toBe(false);
  });

  it('rejette un filename vide', () => {
    expect(
      zipRequestSchema.safeParse({
        signedUrls: [{ filename: '', url: validEntry.url }],
      }).success
    ).toBe(false);
  });
});
