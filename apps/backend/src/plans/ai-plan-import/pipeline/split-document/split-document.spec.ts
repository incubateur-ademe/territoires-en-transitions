import { estimateTokenCount } from '@tet/backend/utils/llm/estimate-token-count';
import { describe, expect, it } from 'vitest';
import { splitDocument } from './split-document';

const lines = (count: number): string[] =>
  Array.from({ length: count }, (_, index) => `Ligne ${index} du plan`);

describe('splitDocument', () => {
  it('rend le texte tel quel quand il tient dans une tranche', () => {
    const text = lines(3).join('\n');

    expect(splitDocument(text, { maxTokens: 1000, overlapTokens: 10 })).toEqual(
      [text]
    );
  });

  it('coupe entre deux lignes, sans dépasser la taille maximale', () => {
    const text = lines(200).join('\n');

    const chunks = splitDocument(text, { maxTokens: 200, overlapTokens: 20 });

    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(estimateTokenCount(chunk)).toBeLessThanOrEqual(200);
    }
    // Aucune ligne n'est coupée ni perdue.
    const seen = new Set(chunks.flatMap((chunk) => chunk.split('\n')));
    expect(seen).toEqual(new Set(lines(200)));
  });

  it('reprend la fin de la tranche précédente en tête de la suivante', () => {
    const chunks = splitDocument(lines(200).join('\n'), {
      maxTokens: 200,
      overlapTokens: 20,
    });

    const lastLineOfFirst = chunks[0].split('\n').at(-1);
    expect(chunks[1].split('\n')).toContain(lastLineOfFirst);
  });

  it("répète l'en-tête d'un tableau en tête de chaque tranche", () => {
    const header = 'axe\ttitre';
    const text = [header, ...lines(200)].join('\n');

    const chunks = splitDocument(text, {
      maxTokens: 200,
      overlapTokens: 20,
      header,
    });

    for (const chunk of chunks) {
      expect(chunk.split('\n')[0]).toBe(header);
      expect(chunk.split('\n').filter((line) => line === header)).toHaveLength(
        1
      );
    }
  });

  it('ne répète pas un en-tête qui ne laisserait pas de place au contenu', () => {
    const header = 'colonne\t'.repeat(200);
    const text = [header, ...lines(200)].join('\n');

    const chunks = splitDocument(text, {
      maxTokens: 200,
      overlapTokens: 20,
      header,
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.slice(1).some((chunk) => chunk.startsWith(header))).toBe(
      false
    );
    expect(chunks.join('\n')).toContain(lines(200).at(-1));
  });

  it('coupe une ligne plus longue que la tranche', () => {
    const chunks = splitDocument('x'.repeat(5000), {
      maxTokens: 200,
      overlapTokens: 0,
    });

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join('')).toBe('x'.repeat(5000));
  });
});
