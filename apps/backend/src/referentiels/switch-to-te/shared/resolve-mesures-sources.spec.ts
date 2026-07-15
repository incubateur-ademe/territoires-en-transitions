import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { hierarchiesByReferentielIdForTests } from './referentiel-hierarchies.test-fixture';
import {
  collectMesureSourceIdsFromOrigines,
  resolveMesureActionIdFromOrigine,
} from './resolve-mesures-sources';

const hierarchies = hierarchiesByReferentielIdForTests;

describe('resolveMesureActionIdFromOrigine', () => {
  it('remonte une tâche CAE vers la mesure source', () => {
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

  it('remonte une tâche ECI vers la mesure source', () => {
    expect(
      resolveMesureActionIdFromOrigine(
        {
          referentielId: ReferentielIdEnum.ECI,
          actionId: 'eci_3.3.1.3',
        },
        hierarchies
      )
    ).toBe('eci_3.3');
  });

  it('remonte une sous-action ECI vers la mesure source', () => {
    expect(
      resolveMesureActionIdFromOrigine(
        {
          referentielId: ReferentielIdEnum.ECI,
          actionId: 'eci_3.3.1',
        },
        hierarchies
      )
    ).toBe('eci_3.3');
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

    expect([...ids].sort()).toEqual(['cae_6.1.3', 'eci_3.3']);
  });
});
