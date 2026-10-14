import { describe, expect, it } from 'vitest';
import { importIndicateurDefinitionSchema } from './import-indicateur-definition.dto';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';

describe('Import de définitions périodiques', () => {
  const definition = {
    version: '1.0.0',
    identifiantReferentiel: 'test_annuel',
    titre: 'Indicateur annuel',
    titreLong: null,
    titreCourt: null,
    description: null,
    unite: 'kWh',
    precision: 2,
    borneMin: null,
    borneMax: null,
    participationScore: false,
    sansValeurUtilisateur: false,
    valeurCalcule: null,
    exprCible: null,
    exprSeuil: null,
    libelleCibleSeuil: null,
  };

  it('conserve le contrat historique sans périodicité', () => {
    expect(importIndicateurDefinitionSchema.parse(definition)).toEqual({
      ...definition,
      periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
    });
  });

  it('écarte les anciennes règles d’agrégation temporelle', () => {
    const input = {
      ...definition,
      periodicite: IndicateurPeriodiciteEnum.MENSUELLE,
    };
    expect(
      importIndicateurDefinitionSchema.parse({
        ...input,
        aggregationResultat: 'somme',
        aggregationObjectif: 'moyenne',
      })
    ).toEqual(input);
  });

  it.each([
    IndicateurPeriodiciteEnum.ANNUELLE,
    IndicateurPeriodiciteEnum.SEMESTRIELLE,
    IndicateurPeriodiciteEnum.TRIMESTRIELLE,
    IndicateurPeriodiciteEnum.MENSUELLE,
  ])('accepte la périodicité %s', (periodicite) => {
    const input = { ...definition, periodicite };
    expect(importIndicateurDefinitionSchema.parse(input)).toEqual(input);
  });

  it.each(['hebdomadaire', null])(
    'refuse une périodicité non prise en charge : %s',
    (periodicite) => {
      const result = importIndicateurDefinitionSchema.safeParse({
        ...definition,
        periodicite,
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues).toEqual([
        expect.objectContaining({ path: ['periodicite'] }),
      ]);
    }
  );
});
