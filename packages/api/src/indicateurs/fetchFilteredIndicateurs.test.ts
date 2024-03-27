import {assert} from 'chai';
import {signIn, signOut} from '../tests/auth';
import {testReset} from '../tests/testReset';
import {supabase} from '../tests/supabase';
import {fetchFilteredIndicateurs, Filters, Subset,} from './fetchFilteredIndicateurs';
import {Database} from '../database.types';

type TableName = keyof Database['public']['Tables'];

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
  indicateur_confidentiel: [
    {
      indicateur_id: 'cae_1.a',
      collectivite_id: 1,
    },
    {
      indicateur_id: 'cae_2.b',
      collectivite_id: 1,
    },
    {
      indicateur_perso_id: 0,
    },
  ],
} as Partial<
  Record<TableName, Database['public']['Tables'][TableName]['Insert']>
>;


// wrap la fonction à tester pour ne pas avoir à repréciser toujours les mêmes paramètres
const fetchIndicateurs = (subset: Subset, filters: Filters) =>
  fetchFilteredIndicateurs(supabase, 1, subset, filters);

describe('Confidentialité', async () => {
  before(async () => {
    await testReset();
  });

  it('Devrait pouvoir insérer des résultats', async () => {
    await signIn('yolododo');
    await supabase.from('indicateur_resultat').upsert([{
      indicateur_id: 'eci_8',
      collectivite_id: 1,
      annee: 2023,
      valeur: 999,
    }, {
      indicateur_id: 'eci_8',
      collectivite_id: 1,
      annee: 2024,
      valeur: 666,
    }])

    await supabase.from('indicateur_confidentiel').upsert(
      [{indicateur_id: 'cae_8', collectivite_id: 1}]
    );

    const {data} = await supabase
      .from('indicateur_resultat')
      .select('*')
      .eq('collectivite_id', 1)
      .eq('indicateur_id', 'cae_8');

    assert.equal(data.length, 2)
    await signOut();

  })

  it('Devrait ne pas pouvoir lire des valeurs des collectivités sur lesquelles je n\'ai pas de droits', async () => {
    await signIn('yulududu');
    const {data} = await supabase
      .from('indicateur_resultat')
      .select('*')
      .eq('collectivite_id', 1)
      .eq('indicateur_id', 'cae_8');

    assert.equal(data.length, 1)
    await signOut();
  });
})

describe('Filtrer les indicateurs', async () => {
  before(async function () {
    await testReset();
    await signIn('yolododo');

    // insère les données de test
    await Promise.all(
      Object.entries(FIXTURE).map(async ([tableName, entries]) => {
        console.log(`insert fixture into ${tableName}`);
        const upsert = await supabase
          .from(tableName as TableName)
          .upsert(entries);
        assert.equal(
          upsert.status,
          201,
          `insertion de ${JSON.stringify(entries)} dans ${tableName}`
        );
      })
    );
  });

  it('par le sous-ensemble ECi', async () => {
    const {status, data} = await fetchIndicateurs('eci', {});
    assert.equal(status, 200);
    assert.closeTo(data.length, 35, 3, 'plus ou moins 35 ind. ECi');
  });

  it('par le sous-ensemble ECi et par texte (dans le titre ou la description)', async () => {
    const {status, data} = await fetchIndicateurs('eci', {
      text: 'activité',
    });
    assert.equal(status, 200);

    const total = data.length;
    const count = data.filter(d => d.nom.includes('Activité')).length;

    assert.isAbove(
      total,
      count,
      "nb. d'occurences dans le nom ou la description > nb. dans le nom seulement"
    );
    assert.closeTo(
      total,
      5,
      2,
      'plus ou moins 5 ind. ECi contiennent le texte recherché dans leur nom ou leur description'
    );
    assert.closeTo(
      count,
      4,
      2,
      'plus ou moins 4 ind. ECi contiennent le texte recherché dans leur nom'
    );
  });

  it('par le sous-ensemble ECi et par identifiant', async () => {
    const {status, data} = await fetchIndicateurs('eci', {
      text: '#10',
    });
    assert.equal(status, 200);
    assert.equal(data.length, 1);
    assert.equal(data[0].id, 'eci_10');
  });

  it('par le sous-ensemble ECi et par une thématique', async () => {
    const {status, data} = await fetchIndicateurs('eci', {
      thematique_ids: [5],
    });
    assert.equal(status, 200);
    assert.equal(data.length, 4, 'ind. ECi dans la thématique');
  });

  it('par le sous-ensemble ECi et par plusieurs thématiques', async () => {
    const {status, data} = await fetchIndicateurs('eci', {
      thematique_ids: [5, 4],
    });
    assert.equal(status, 200);
    assert.closeTo(
      data.length,
      17,
      3,
      'plus ou moins 17 ind. ECi dans les thématiques'
    );
  });

  it('par le sous-ensemble ECi et par personne pilote', async () => {
    const {status, data} = await fetchIndicateurs('eci', {
      pilote_user_ids: ['4ecc7d3a-7484-4a1c-8ac8-930cdacd2561'],
    });
    assert.equal(status, 200);
    assert.equal(data.length, 1);
  });

  it('par le sous-ensemble ECi et par tag de personne pilote', async () => {
    const {status, data} = await fetchIndicateurs('eci', {
      pilote_tag_ids: [1],
    });
    assert.equal(status, 200);
    assert.equal(data.length, 1);
  });

  it('par le sous-ensemble ECi et par personne et tag pilote', async () => {
    const {status, data} = await fetchIndicateurs('eci', {
      pilote_user_ids: ['4ecc7d3a-7484-4a1c-8ac8-930cdacd2561'],
      pilote_tag_ids: [1],
    });
    assert.equal(status, 200);
    assert.equal(data.length, 1);
  });

  it('par le sous-ensemble ECi et par action du référentiel', async () => {
    const {status, data} = await fetchIndicateurs('eci', {
      action_id: 'eci_1.2',
    });
    assert.equal(status, 200);
    assert.equal(data.length, 2);
  });

  it("par le sous-ensemble ECi et par id de plan d'actions", async () => {
    const {status, data} = await fetchIndicateurs('eci', {
      plan_ids: [1],
    });
    assert.equal(status, 200);
    assert.equal(data.length, 1);
  });

  it('par le sous-ensemble ECi et par id de service', async () => {
    const {status, data} = await fetchIndicateurs('eci', {
      service_ids: [1],
    });
    assert.equal(status, 200);
    assert.equal(data.length, 1);
  });

  it('par le sous-ensemble CAE', async () => {
    const {status, data} = await fetchIndicateurs('cae', {});
    assert.equal(status, 200);
    assert.closeTo(data.length, 65, 3);
  });

  it('par le sous-ensemble CAE et par le flag "participation au score"', async () => {
    const {status, data} = await fetchIndicateurs('cae', {
      participation_score: true,
    });
    assert.equal(status, 200);
    assert.closeTo(data.length, 44, 3);
  });

  it('par le sous-ensemble CAE et l\'état "complété"', async () => {
    const {status, data} = await fetchIndicateurs('cae', {rempli: true});
    assert.equal(status, 200);
    assert.closeTo(data.length, 2, 1);
  });

  it('par le sous-ensemble CAE et l\'état "confidentiel"', async () => {
    const {status, data} = await fetchIndicateurs('cae', {
      confidentiel: true,
    });
    assert.equal(status, 200);
    assert.equal(data.length, 2);
  });

  it('par indicateur perso et confidentiel', async () => {
    const {status, data} = await fetchIndicateurs('perso', {
      confidentiel: true,
    });
    assert.equal(status, 200);
    assert.equal(data.length, 1);
  });

  after(async function () {
    // runs once after the last test in this block
    await signOut();
  });
});
