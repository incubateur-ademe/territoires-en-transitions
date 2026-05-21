import { describe, expect, it } from 'vitest';
import { buildArchivePath, sanitizeSegment } from './build-archive-path';

describe('sanitizeSegment', () => {
  it('laisse passer un nom de fichier normal', () => {
    expect(sanitizeSegment('rapport annuel.pdf')).toBe('rapport annuel.pdf');
  });

  it('neutralise un segment de traversée « .. »', () => {
    expect(sanitizeSegment('..')).toBe('_');
  });

  it('neutralise un segment « . »', () => {
    expect(sanitizeSegment('.')).toBe('_');
  });

  it('neutralise un segment vide', () => {
    expect(sanitizeSegment('')).toBe('_');
    expect(sanitizeSegment('   ')).toBe('_');
  });

  it('remplace les séparateurs de chemin par un underscore', () => {
    expect(sanitizeSegment('a/b')).toBe('a_b');
    expect(sanitizeSegment('a\\b')).toBe('a_b');
  });

  it('supprime les caractères NUL et de contrôle', () => {
    expect(sanitizeSegment('a\x00b')).toBe('ab');
    expect(sanitizeSegment('a\tb\rc\nd')).toBe('abcd');
  });

  it('retire les points et espaces en fin de segment (Windows)', () => {
    expect(sanitizeSegment('dossier.')).toBe('dossier');
    expect(sanitizeSegment('dossier ')).toBe('dossier');
    expect(sanitizeSegment('dossier. . ')).toBe('dossier');
  });

  it('préfixe les noms réservés Windows', () => {
    expect(sanitizeSegment('CON')).toBe('_CON');
    expect(sanitizeSegment('nul')).toBe('_nul');
    expect(sanitizeSegment('COM1')).toBe('_COM1');
    expect(sanitizeSegment('LPT9.txt')).toBe('_LPT9.txt');
  });

  it('normalise en forme NFC', () => {
    // « é » décomposé (e + accent combinant U+0301) → « é » composé U+00E9
    expect(sanitizeSegment('éte.pdf')).toBe('éte.pdf');
  });

  it('tronque à 255 octets en préservant l’extension', () => {
    const longName = 'a'.repeat(300) + '.pdf';
    const result = sanitizeSegment(longName);
    expect(Buffer.byteLength(result, 'utf8')).toBeLessThanOrEqual(255);
    expect(result.endsWith('.pdf')).toBe(true);
  });

  it('tronque en comptant les octets, pas les caractères', () => {
    const longName = 'é'.repeat(200) + '.pdf'; // « é » = 2 octets en UTF-8
    const result = sanitizeSegment(longName);
    expect(Buffer.byteLength(result, 'utf8')).toBeLessThanOrEqual(255);
    expect(result.endsWith('.pdf')).toBe(true);
  });
});

describe('buildArchivePath', () => {
  it('joint les segments assainis par des « / »', () => {
    expect(buildArchivePath(['mesures', 'axe 1', 'preuve.pdf'])).toBe(
      'mesures/axe 1/preuve.pdf'
    );
  });

  it('assainit chaque segment, y compris les répertoires', () => {
    expect(buildArchivePath(['mesures', '..', 'preuve.pdf'])).toBe(
      'mesures/_/preuve.pdf'
    );
    expect(buildArchivePath(['a/b', 'c'])).toBe('a_b/c');
  });

  it('ne produit jamais de chemin absolu', () => {
    expect(buildArchivePath(['/etc', 'passwd']).startsWith('/')).toBe(false);
  });

  it('neutralise une tentative de Zip Slip complète', () => {
    const path = buildArchivePath(['..', '..', 'etc', 'passwd']);
    expect(path).toBe('_/_/etc/passwd');
    expect(path.includes('..')).toBe(false);
  });

  it('neutralise un segment vide au lieu de produire « // »', () => {
    expect(buildArchivePath(['mesures', '', 'preuve.pdf'])).toBe(
      'mesures/_/preuve.pdf'
    );
  });

  it('rejette une liste de segments vide', () => {
    expect(() => buildArchivePath([])).toThrow();
  });
});
