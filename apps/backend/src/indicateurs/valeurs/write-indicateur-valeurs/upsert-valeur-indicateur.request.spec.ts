import { describe, expect, it } from 'vitest';
import { upsertValeurIndicateurSchema } from './upsert-valeur-indicateur.request';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';

describe.each([
  { collectiviteId: 1, indicateurId: 1, dateValeur: '2026-01-01', resultat: 0 },
  { collectiviteId: 1, indicateurId: 1, id: 1, objectif: null },
])('Déclaration périodique : %o', (valeur) => {
  it('conserve le contrat historique sans périodicité', () => {
    expect(upsertValeurIndicateurSchema.parse(valeur)).toEqual(valeur);
  });

  it.each([
    IndicateurPeriodiciteEnum.ANNUELLE,
    IndicateurPeriodiciteEnum.SEMESTRIELLE,
    IndicateurPeriodiciteEnum.TRIMESTRIELLE,
    IndicateurPeriodiciteEnum.MENSUELLE,
  ])('accepte une périodicité %s explicite', (periodicite) => {
    const input = { ...valeur, periodicite };
    expect(upsertValeurIndicateurSchema.parse(input)).toEqual(input);
  });

  it.each(['hebdomadaire', null])(
    'refuse une périodicité non prise en charge : %s',
    (periodicite) => {
      const result = upsertValeurIndicateurSchema.safeParse({
        ...valeur,
        periodicite,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        expect.objectContaining({ path: ['periodicite'] }),
      ]);
    }
  );
});
