import { describe, expect, it } from 'vitest';
import { importIndicateurDefinitionSchema } from './import-indicateur-definition.dto';

describe('Import de définitions avec le stockage annuel', () => {
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
    expect(importIndicateurDefinitionSchema.parse(definition)).toEqual(
      definition
    );
  });

  it('accepte une périodicité annuelle explicite', () => {
    const input = { ...definition, periodicite: 'annuelle' };
    expect(importIndicateurDefinitionSchema.parse(input)).toEqual(input);
  });

  it.each(['semestrielle', 'trimestrielle', 'mensuelle', 'hebdomadaire', null])(
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
