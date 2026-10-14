import { createLiveQueryCollection } from '@tanstack/react-db';
import {
  createActionDefinitionsCollection,
  replaceReferentielDefinitions,
} from './action-definitions.collection';
import {
  queryJoinedActions,
  queryStoredReferentielVersion,
} from './action-live-queries';
import {
  buildDefinition,
  buildState,
  createLocalStatesCollection,
  toStateRows,
} from './test-fixtures';

const definitionsOutput = (
  definitions: ReturnType<typeof buildDefinition>[],
  referentielVersion = '1.0.0'
) => ({
  referentielVersion,
  definitionsById: Object.fromEntries(definitions.map((d) => [d.actionId, d])),
});

const run = async <T extends object>(live: {
  preload: () => Promise<void>;
  toArray: T[];
}) => {
  await live.preload();
  return live.toArray;
};

describe('requêtes live des actions', () => {
  test('la jointure ne garde que les actions des deux côtés, dans l’ordre de l’état', async () => {
    const definitions = createActionDefinitionsCollection(null);
    await replaceReferentielDefinitions(
      definitions,
      'cae',
      definitionsOutput([
        buildDefinition('cae_1'),
        buildDefinition('cae_1.2'),
        buildDefinition('cae_1.10'),
        buildDefinition('cae_2'),
      ])
    );
    const states = createLocalStatesCollection(
      toStateRows([
        buildState('cae_1'),
        buildState('cae_1.10'),
        buildState('cae_1.2'),
        buildState('cae_1.3'),
      ])
    );

    const rows = await run(
      createLiveQueryCollection((q) =>
        queryJoinedActions(q, definitions, states)
      )
    );

    expect(rows.map((r) => r.definition.actionId)).toEqual([
      'cae_1',
      'cae_1.10',
      'cae_1.2',
    ]);
  });

  test('donne la version stockée d’un référentiel, aucune ligne s’il est absent', async () => {
    const definitions = createActionDefinitionsCollection(null);
    await replaceReferentielDefinitions(
      definitions,
      'cae',
      definitionsOutput([
        buildDefinition('cae_1', { referentielVersion: '2.0.0' }),
      ])
    );

    const cae = await run(
      createLiveQueryCollection((q) =>
        queryStoredReferentielVersion(q, definitions, 'cae')
      )
    );
    expect(cae.map((row) => row.referentielVersion)).toEqual(['2.0.0']);
    expect(
      await run(
        createLiveQueryCollection((q) =>
          queryStoredReferentielVersion(q, definitions, 'eci')
        )
      )
    ).toEqual([]);
  });
});

describe('replaceReferentielDefinitions', () => {
  test('ajoute, met à jour et supprime les définitions du seul référentiel concerné', async () => {
    const definitions = createActionDefinitionsCollection(null);
    await replaceReferentielDefinitions(
      definitions,
      'cae',
      definitionsOutput([buildDefinition('cae_1'), buildDefinition('cae_2')])
    );
    await replaceReferentielDefinitions(
      definitions,
      'eci',
      definitionsOutput([buildDefinition('eci_1')])
    );

    await replaceReferentielDefinitions(
      definitions,
      'cae',
      definitionsOutput(
        [
          buildDefinition('cae_1', { referentielVersion: '2.0.0' }),
          buildDefinition('cae_3', { referentielVersion: '2.0.0' }),
        ],
        '2.0.0'
      )
    );

    expect(
      definitions.toArray
        .map((d) => `${d.actionId}@${d.referentielVersion}`)
        .sort()
    ).toEqual(['cae_1@2.0.0', 'cae_3@2.0.0', 'eci_1@1.0.0']);
  });
});
