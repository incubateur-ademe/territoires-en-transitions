import { describe, expect, it } from 'vitest';
import {
  indicateurPeriodiciteSchema,
  indicateurPeriodiciteValues,
} from './indicateur-periodicite.schema';

describe('périodicité des définitions indicateur', () => {
  it('publie les quatre périodicités de déclaration', () => {
    expect(indicateurPeriodiciteValues).toEqual([
      'annuelle',
      'semestrielle',
      'trimestrielle',
      'mensuelle',
    ]);
  });

  it.each(['annuelle', 'semestrielle', 'trimestrielle', 'mensuelle'])(
    'accepte la périodicité %s',
    (periodicite) => {
      expect(indicateurPeriodiciteSchema.parse(periodicite)).toBe(periodicite);
    }
  );

  it.each(['hebdomadaire', '', null, undefined])(
    'refuse une périodicité inconnue ou absente : %s',
    (periodicite) => {
      expect(indicateurPeriodiciteSchema.safeParse(periodicite).success).toBe(
        false
      );
    }
  );
});
