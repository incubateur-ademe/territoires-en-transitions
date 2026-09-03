import { levierEnumValues } from '@tet/domain/shared';
import { describe, expect, it } from 'vitest';
import { TRAJECTOIRE_LEVIERS_CONFIGURATION } from './trajectoire-leviers.config';

describe('TRAJECTOIRE_LEVIERS_CONFIGURATION', () => {
  it('couvre exactement le référentiel partagé, sans doublon ni manquant', () => {
    const configuredLeviers = TRAJECTOIRE_LEVIERS_CONFIGURATION.secteurs.flatMap(
      (secteur) => secteur.leviers.map((levier) => levier.nom)
    );

    expect(configuredLeviers.sort()).toEqual([...levierEnumValues].sort());
  });
});
