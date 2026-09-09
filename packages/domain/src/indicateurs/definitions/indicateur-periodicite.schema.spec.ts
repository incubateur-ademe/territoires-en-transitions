import { describe, expect, it } from 'vitest';
import {
  indicateurPeriodiciteSchema,
  indicateurPeriodiciteValues,
} from './indicateur-periodicite.schema';

describe('périodicité des définitions indicateur', () => {
  it('accepte uniquement les périodicités enregistrées', () => {
    expect(indicateurPeriodiciteValues).toEqual(['annuelle', 'mensuelle']);
    expect(indicateurPeriodiciteSchema.parse('annuelle')).toBe('annuelle');
    expect(indicateurPeriodiciteSchema.parse('mensuelle')).toBe('mensuelle');
    expect(indicateurPeriodiciteSchema.safeParse('trimestrielle').success).toBe(
      false
    );
  });
});
