import { IndicateurPeriods } from '@tet/domain/indicateurs';
import { describe, expect, it } from 'vitest';
import {
  dehydrateIndicateurPeriod,
  hydrateIndicateurPeriod,
} from './indicateur-period.adapter';

describe('indicateur period persistence adapter', () => {
  it('hydrate puis déshydrate une période sans perdre sa cadence', () => {
    const period = hydrateIndicateurPeriod({
      periodicite: 'mensuelle',
      dateValeur: '2026-02-01',
    });

    expect(IndicateurPeriods.key(period)).toBe('mensuelle:2026-02');
    expect(dehydrateIndicateurPeriod(period)).toBe('2026-02-01');
  });

  it('refuse une date de stockage non canonique', () => {
    expect(() =>
      hydrateIndicateurPeriod({
        periodicite: 'annuelle',
        dateValeur: '2026-02-01',
      })
    ).toThrow(/non canonique/);
  });
});
