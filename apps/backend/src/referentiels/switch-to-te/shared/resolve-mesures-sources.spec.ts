import { ActionTypeEnum, ReferentielIdEnum } from '@tet/domain/referentiels';
import {
  collectMesureSourceIdsFromOrigines,
  resolveMesureActionIdFromOrigine,
} from './resolve-mesures-sources';

const hierarchieCaeEci = [
  ActionTypeEnum.REFERENTIEL,
  ActionTypeEnum.AXE,
  ActionTypeEnum.SOUS_AXE,
  ActionTypeEnum.ACTION,
  ActionTypeEnum.SOUS_ACTION,
  ActionTypeEnum.TACHE,
] as const;

const hierarchies = new Map([
  [ReferentielIdEnum.CAE, [...hierarchieCaeEci]],
  [ReferentielIdEnum.ECI, [...hierarchieCaeEci]],
]);

describe('resolveMesureActionIdFromOrigine', () => {
  it('remonte une tâche vers la mesure source', () => {
    expect(
      resolveMesureActionIdFromOrigine(
        {
          referentielId: ReferentielIdEnum.CAE,
          actionId: 'cae_6.1.3.4.3',
        },
        hierarchies
      )
    ).toBe('cae_6.1.3');
  });

  it('remonte une sous-action vers la mesure source', () => {
    expect(
      resolveMesureActionIdFromOrigine(
        {
          referentielId: ReferentielIdEnum.ECI,
          actionId: 'eci_3.3.1.3',
        },
        hierarchies
      )
    ).toBe('eci_3.3.1');
  });

  it('laisse inchangé une origine déjà au niveau mesure', () => {
    expect(
      resolveMesureActionIdFromOrigine(
        {
          referentielId: ReferentielIdEnum.CAE,
          actionId: 'cae_6.1.3',
        },
        hierarchies
      )
    ).toBe('cae_6.1.3');
  });

  it('retourne actionId inchangé si hiérarchie absente', () => {
    expect(
      resolveMesureActionIdFromOrigine(
        {
          referentielId: ReferentielIdEnum.CAE,
          actionId: 'cae_6.1.3.4.3',
        },
        new Map()
      )
    ).toBe('cae_6.1.3.4.3');
  });
});

describe('collectMesureSourceIdsFromOrigines', () => {
  it('agrège les mesures sources dédupliquées', () => {
    const ids = collectMesureSourceIdsFromOrigines(
      [
        {
          referentielId: ReferentielIdEnum.CAE,
          actionId: 'cae_6.1.3.4.3',
        },
        {
          referentielId: ReferentielIdEnum.CAE,
          actionId: 'cae_6.1.3.4.1',
        },
        {
          referentielId: ReferentielIdEnum.ECI,
          actionId: 'eci_3.3.1.3',
        },
      ],
      hierarchies
    );

    expect([...ids].sort()).toEqual(['cae_6.1.3', 'eci_3.3.1']);
  });
});
