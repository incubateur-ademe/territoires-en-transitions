import {
  canMutateReferentielData,
  listWritableReferentielIds,
} from './can-mutate-referentiel.rules';
import { defaultCollectivitePreferences } from './collectivite-preferences.schema';

describe('canMutateReferentielData', () => {
  it('autorise la mutation en mode write', () => {
    expect(canMutateReferentielData('write')).toBe(true);
  });

  it('refuse la mutation en mode readonly', () => {
    expect(canMutateReferentielData('readonly')).toBe(false);
  });

  it('refuse la mutation en mode archived', () => {
    expect(canMutateReferentielData('archived')).toBe(false);
  });
});

describe('listWritableReferentielIds', () => {
  it('ne garde que les référentiels en mode write', () => {
    expect(
      listWritableReferentielIds(defaultCollectivitePreferences.referentiels)
    ).toEqual(['cae', 'eci']);

    expect(
      listWritableReferentielIds({
        cae: { display: true, mode: 'archived' },
        eci: { display: false, mode: 'archived' },
        te: { display: true, mode: 'write' },
      })
    ).toEqual(['te']);
  });
});
