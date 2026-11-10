import { describe, expect, it } from 'vitest';
import {
  CONSOMMATIONS_FINALES_PROPERTIES,
  CONSOMMATIONS_FINALES_PROPERTIES_SNBC3,
} from './consommations-finales-properties';
import {
  EMISSIONS_GES_PROPERTIES,
  EMISSIONS_GES_PROPERTIES_SNBC3,
} from './ges-emissions-properties';
import { TrajectoirePropertiesType } from './types';

const sousSecteursIndustrie = (properties: TrajectoirePropertiesType) =>
  properties.secteurs
    .find((s) => s.nom === 'Industrie')
    ?.sousSecteurs?.map((s) => s.identifiant);

describe('Sous-secteur « Construction » de la SNBC 3', () => {
  it.each([
    [
      'GES',
      EMISSIONS_GES_PROPERTIES,
      EMISSIONS_GES_PROPERTIES_SNBC3,
      'cae_1.ih',
    ],
    [
      'consommations',
      CONSOMMATIONS_FINALES_PROPERTIES,
      CONSOMMATIONS_FINALES_PROPERTIES_SNBC3,
      'cae_2.kh',
    ],
  ])(
    '%s : ajouté en fin de l’industrie pour la SNBC 3 seulement',
    (_nom, snbc2, snbc3, construction) => {
      expect(sousSecteursIndustrie(snbc3)).toEqual([
        ...(sousSecteursIndustrie(snbc2) ?? []),
        construction,
      ]);
      expect(sousSecteursIndustrie(snbc2)).not.toContain(construction);
      expect(snbc3.secteurs.map((s) => s.identifiant)).toEqual(
        snbc2.secteurs.map((s) => s.identifiant)
      );
    }
  );
});
