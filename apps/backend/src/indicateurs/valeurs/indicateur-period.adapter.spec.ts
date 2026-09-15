import {
  IndicateurPeriodErrorEnum,
  IndicateurPeriods,
} from '@tet/domain/indicateurs';
import { describe, expect, it } from 'vitest';
import {
  dehydrateIndicateurPeriod,
  hydrateIndicateurPeriod,
  hydrateLegacyIndicateurPeriod,
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
    ).toThrow(IndicateurPeriodErrorEnum.INDICATEUR_PERIOD_DATE_NON_CANONICAL);
  });

  it('préserve les dates du contrat annuel historique en les rattachant à leur année', () => {
    const period = hydrateLegacyIndicateurPeriod({
      periodicite: 'annuelle',
      dateValeur: '2026-12-31',
    });
    expect(dehydrateIndicateurPeriod(period)).toBe('2026-01-01');
  });

  it('ne normalise pas une date mensuelle explicite non canonique', () => {
    expect(() =>
      hydrateLegacyIndicateurPeriod({
        periodicite: 'mensuelle',
        dateValeur: '2026-02-02',
      })
    ).toThrow(IndicateurPeriodErrorEnum.INDICATEUR_PERIOD_DATE_NON_CANONICAL);
  });

  it('refuse une date annuelle impossible au lieu de changer son année', () => {
    expect(() =>
      hydrateLegacyIndicateurPeriod({
        periodicite: 'annuelle',
        dateValeur: '2026-02-30',
      })
    ).toThrow();
  });
});
