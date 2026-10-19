import {
  CollectiviteReferentielPreferences,
  defaultCollectivitePreferences,
} from '@tet/domain/collectivites';
import { describe, expect, test } from 'vitest';
import {
  listDisplayedReferentielIds,
  resolveMesuresReferentielIds,
} from './mesures-referentiels.filtre';

const avantBascule = defaultCollectivitePreferences.referentiels;

const apresBascule: CollectiviteReferentielPreferences = {
  cae: { display: true, mode: 'archived' },
  eci: { display: false, mode: 'archived' },
  te: { display: true, mode: 'write' },
};

describe('listDisplayedReferentielIds', () => {
  test('ne garde que les référentiels affichés', () => {
    expect(
      listDisplayedReferentielIds({
        referentiels: apresBascule,
        referentielTeEnabled: true,
      })
    ).toEqual(['cae', 'te']);
  });

  test('exclut TE quand le feature flag est désactivé', () => {
    expect(
      listDisplayedReferentielIds({
        referentiels: avantBascule,
        referentielTeEnabled: false,
      })
    ).toEqual(['cae', 'eci']);
  });
});

describe('resolveMesuresReferentielIds', () => {
  test('sans sélection, affiche CAE et ECI avant la bascule', () => {
    expect(
      resolveMesuresReferentielIds(undefined, {
        referentiels: avantBascule,
        referentielTeEnabled: true,
      })
    ).toEqual(['cae', 'eci']);
  });

  test('sans sélection, affiche seulement TE après la bascule', () => {
    expect(
      resolveMesuresReferentielIds([], {
        referentiels: apresBascule,
        referentielTeEnabled: true,
      })
    ).toEqual(['te']);
  });

  test('garde la sélection limitée aux référentiels affichés', () => {
    expect(
      resolveMesuresReferentielIds(['cae', 'eci'], {
        referentiels: apresBascule,
        referentielTeEnabled: true,
      })
    ).toEqual(['cae']);
  });

  test('revient au défaut quand toute la sélection est masquée', () => {
    expect(
      resolveMesuresReferentielIds(['eci'], {
        referentiels: apresBascule,
        referentielTeEnabled: true,
      })
    ).toEqual(['te']);
  });

  test('affiche les référentiels visibles quand aucun n’est modifiable', () => {
    expect(
      resolveMesuresReferentielIds(undefined, {
        referentiels: { ...apresBascule, te: { display: true, mode: 'write' } },
        referentielTeEnabled: false,
      })
    ).toEqual(['cae']);
  });
});
