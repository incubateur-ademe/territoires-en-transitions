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
      })
    ).toEqual(['cae', 'te']);
  });
});

describe('resolveMesuresReferentielIds', () => {
  test('sans sélection, affiche CAE et ECI avant la bascule', () => {
    expect(
      resolveMesuresReferentielIds(undefined, {
        referentiels: avantBascule,
      })
    ).toEqual(['cae', 'eci']);
  });

  test('sans sélection, affiche seulement TE après la bascule', () => {
    expect(
      resolveMesuresReferentielIds([], {
        referentiels: apresBascule,
      })
    ).toEqual(['te']);
  });

  test('garde la sélection limitée aux référentiels affichés', () => {
    expect(
      resolveMesuresReferentielIds(['cae', 'eci'], {
        referentiels: apresBascule,
      })
    ).toEqual(['cae']);
  });

  test('revient au défaut quand toute la sélection est masquée', () => {
    expect(
      resolveMesuresReferentielIds(['eci'], {
        referentiels: apresBascule,
      })
    ).toEqual(['te']);
  });

  test('affiche les référentiels visibles quand aucun n’est modifiable', () => {
    expect(
      resolveMesuresReferentielIds(undefined, {
        referentiels: {
          ...apresBascule,
          te: { display: false, mode: 'write' },
        },
      })
    ).toEqual(['cae']);
  });
});
