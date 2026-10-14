import { getDefinitionsSyncKey } from './sync-referentiel-definitions';

describe('getDefinitionsSyncKey', () => {
  test('charge les définitions absentes sans attendre la version publiée', () => {
    expect(
      getDefinitionsSyncKey({
        referentielId: 'te',
        storedVersion: undefined,
        publishedVersion: undefined,
      })
    ).toBe('te:vide');
  });

  test('ne recharge pas des définitions à jour, ni tant que la version publiée est inconnue', () => {
    expect(
      getDefinitionsSyncKey({
        referentielId: 'te',
        storedVersion: '1.0.0',
        publishedVersion: '1.0.0',
      })
    ).toBeNull();
    expect(
      getDefinitionsSyncKey({
        referentielId: 'te',
        storedVersion: '1.0.0',
        publishedVersion: undefined,
      })
    ).toBeNull();
  });

  test('recharge quand une nouvelle version a été publiée, une clé par écart', () => {
    expect(
      getDefinitionsSyncKey({
        referentielId: 'te',
        storedVersion: '1.0.0',
        publishedVersion: '1.1.0',
      })
    ).toBe('te:1.0.0:1.1.0');
  });
});
