import {test} from 'node:test';
import assert from 'node:assert/strict';
import {signIn, signOut} from '../tests/auth';
import {testReset} from '../tests/testReset';
import {supabase} from '../tests/supabase';
import {
  Filters,
  Subset,
  fetchFilteredIndicateurs,
} from './fetchFilteredIndicateurs';

const FIXTURE = {
  indicateur_pilote: [
    {
      collectivite_id: 1,
      indicateur_id: 'eci_24',
      user_id: '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561',
    },
    {
      indicateur_id: 'eci_24',
      collectivite_id: 1,
      tag_id: 1,
    },
    {
      indicateur_id: 'eci_24',
      collectivite_id: 1,
      tag_id: 1,
    },
  ],
  indicateur_service_tag: [
    {
      indicateur_id: 'eci_24',
      collectivite_id: 1,
      service_tag_id: 1,
    },
  ],
  fiche_action_indicateur: [
    {
      indicateur_id: 'eci_24',
      fiche_id: 1,
    },
  ],
  indicateur_personnalise_thematique: [
    {
      indicateur_id: 0,
      thematique_id: 8,
    },
  ],
};

test('Filtrer les indicateurs', async context => {
  await testReset();
  await signIn('yolododo');

  // insère les données de test
  await Promise.all(
    Object.entries(FIXTURE).map(async ([tableName, entries]) => {
      console.log(`insert fixture into ${tableName}`);
      const upsert = await supabase.from(tableName).upsert(entries);
      assert.equal(upsert.status, 201);
    })
  );

  // wrap la fonction à tester pour ne pas avoir à repréciser toujours les mêmes paramètres
  const fetchIndicateurs = (subset: Subset, filters: Filters) =>
    fetchFilteredIndicateurs(supabase, 1, subset, filters);

  await context.test('par le sous-ensemble ECi', async () => {
    const {status, data} = await fetchIndicateurs('eci', {});
    assert.equal(status, 200);
    assert.equal(data.length, 35);
  });

  await context.test(
    'par le sous-ensemble ECi et la thématique "énergie et climat"',
    async () => {
      const {status, data} = await fetchIndicateurs('eci', {
        thematique_ids: [5],
      });
      assert.equal(status, 200);
      assert.equal(data.length, 4);
    }
  );

  await context.test(
    'par le sous-ensemble ECi et les thématiques "énergie et climat" et "éco. circulaire et déchets"',
    async () => {
      const {status, data} = await fetchIndicateurs('eci', {
        thematique_ids: [5, 4],
      });
      assert.equal(status, 200);
      assert.equal(data.length, 17);
    }
  );

  await context.test(
    'par le sous-ensemble ECi et par personne pilote',
    async () => {
      const {status, data} = await fetchIndicateurs('eci', {
        pilote_user_ids: ['4ecc7d3a-7484-4a1c-8ac8-930cdacd2561'],
      });
      assert.equal(status, 200);
      assert.equal(data.length, 1);
    }
  );

  await context.test(
    'par le sous-ensemble ECi et par tag de personne pilote',
    async () => {
      const {status, data} = await fetchIndicateurs('eci', {
        pilote_tag_ids: [1],
      });
      assert.equal(status, 200);
      assert.equal(data.length, 1);
    }
  );

  await signOut();
});
