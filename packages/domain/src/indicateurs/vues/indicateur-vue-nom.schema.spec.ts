import { describe, expect, it } from 'vitest';
import { indicateurVueNomSchema } from './indicateur-vue-nom.schema';

describe('indicateur vue nom', () => {
  it('trims surrounding whitespace and preserves the title', () => {
    expect(indicateurVueNomSchema.parse('  Mes indicateurs énergie  ')).toBe(
      'Mes indicateurs énergie'
    );
  });

  it.each(['', '   '])('rejects an empty title %j', (nom) => {
    expect(indicateurVueNomSchema.safeParse(nom).success).toBe(false);
  });

  it('limits the trimmed title to 100 characters', () => {
    expect(indicateurVueNomSchema.parse(`  ${'a'.repeat(100)}  `)).toBe(
      'a'.repeat(100)
    );
    expect(indicateurVueNomSchema.safeParse('a'.repeat(101)).success).toBe(
      false
    );
  });
});
