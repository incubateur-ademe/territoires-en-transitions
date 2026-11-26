import { FEATURE_FLAGS } from '@tet/domain/utils';
import { describe, expect, test } from 'vitest';
import {
  buildUniformFeatureFlags,
  toFeatureFlags,
} from './list-feature-flags.rules';

describe('toFeatureFlags', () => {
  test('renvoie chaque flag connu, inactif par défaut', () => {
    const flags = toFeatureFlags(undefined);

    expect(Object.keys(flags).sort()).toEqual([...FEATURE_FLAGS].sort());
    expect(Object.values(flags).every((value) => value === false)).toBe(true);
  });

  test('un booléen est repris tel quel, un variant vaut actif', () => {
    const flags = toFeatureFlags({
      'is-share-fiche-enabled': true,
      'is-priorisation-enabled': false,
      'is-plan-suivi-enabled': 'test',
    });

    expect(flags['is-share-fiche-enabled']).toBe(true);
    expect(flags['is-priorisation-enabled']).toBe(false);
    expect(flags['is-plan-suivi-enabled']).toBe(true);
  });

  test('ignore les flags inconnus de l’application', () => {
    const flags = toFeatureFlags({ 'flag-inconnu': true });

    expect(flags).not.toHaveProperty('flag-inconnu');
  });
});

describe('buildUniformFeatureFlags', () => {
  test('met tous les flags connus à la valeur donnée', () => {
    const flags = buildUniformFeatureFlags(true);

    expect(Object.keys(flags)).toHaveLength(FEATURE_FLAGS.length);
    expect(Object.values(flags).every((value) => value === true)).toBe(true);
  });
});
