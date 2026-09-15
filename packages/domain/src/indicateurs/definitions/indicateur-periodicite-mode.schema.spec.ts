import { describe, expect, it } from 'vitest';
import {
  canCustomizeIndicateurPeriodicite,
  getEffectiveIndicateurPeriodicite,
  indicateurPeriodiciteModeSchema,
} from './indicateur-periodicite-mode.schema';

describe('collectivité periodicity', () => {
  it('uses the recommendation until the collectivité customizes it', () => {
    const definition = {
      periodicite: 'annuelle',
      periodiciteMode: 'recommandee',
    } as const;
    expect(getEffectiveIndicateurPeriodicite(definition)).toBe('annuelle');
    expect(getEffectiveIndicateurPeriodicite(definition, 'mensuelle')).toBe(
      'mensuelle'
    );
    expect(getEffectiveIndicateurPeriodicite(definition, null)).toBe(
      'annuelle'
    );
    expect(definition.periodicite).toBe('annuelle');
  });

  it('keeps the imposed cadence even if stale local settings exist', () => {
    expect(
      getEffectiveIndicateurPeriodicite(
        { periodicite: 'annuelle', periodiciteMode: 'imposee' },
        'mensuelle'
      )
    ).toBe('annuelle');
    expect(canCustomizeIndicateurPeriodicite('imposee')).toBe(false);
    expect(canCustomizeIndicateurPeriodicite('recommandee')).toBe(true);
  });

  it('rejects unknown policies', () => {
    expect(indicateurPeriodiciteModeSchema.safeParse('optional').success).toBe(
      false
    );
  });
});
