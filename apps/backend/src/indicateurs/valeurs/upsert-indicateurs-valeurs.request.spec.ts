import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import { upsertIndicateursValeursRequestSchema } from './upsert-indicateurs-valeurs.request';

const valeur = {
  collectiviteId: 42,
  indicateurId: 456,
  dateValeur: '2025-06-15',
  resultat: 0,
};

describe('bulk indicateur valeurs input', () => {
  it('preserves legacy dates and values when periodicite is omitted', () => {
    expect(
      upsertIndicateursValeursRequestSchema.parse({ valeurs: [valeur] })
    ).toEqual({ valeurs: [valeur] });
  });

  it('accepts an explicit annual periodicite', () => {
    const annualValeur = {
      ...valeur,
      periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
    };
    expect(
      upsertIndicateursValeursRequestSchema.parse({ valeurs: [annualValeur] })
    ).toEqual({ valeurs: [annualValeur] });
  });

  it('rejects mixed annual and monthly batches until activation', () => {
    const monthlyValeur = {
      ...valeur,
      periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
      dateValeur: '2025-06-01',
    };
    expect(
      upsertIndicateursValeursRequestSchema.safeParse({
        valeurs: [valeur, monthlyValeur],
      }).success
    ).toBe(false);
  });

  it('rejects the entire batch if it contains an unknown periodicite', () => {
    const result = upsertIndicateursValeursRequestSchema.safeParse({
      valeurs: [valeur, { ...valeur, periodicite: 'hebdomadaire' }],
    });

    expect(result.success).toBe(false);
    if (result.success) throw new Error('Unknown periodicite must be rejected');
    expect(result.error.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: ['valeurs', 1, 'periodicite'] }),
      ])
    );
  });
});
