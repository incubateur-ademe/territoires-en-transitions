import { beforeAll, expect, test } from 'vitest';
import { Database } from '../../database.types';
import { signIn, signOut } from '../../tests/auth';
import { dbAdmin, supabase } from '../../tests/supabase';
import { testReset } from '../../tests/testReset';
import { FetchFiltre } from '../domain';
import { fetchFilteredIndicateurs } from './fetchFilteredIndicateurs';

type TableName = keyof Database['public']['Tables'];

const yaladadaUUid = '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561';

const FIXTURE = {
  indicateur_action: [
    {
      indicateur_identifiant_referentiel: 'eci_29',
      action_id: 'eci_1.2',
    },
  ],
  indicateur_pilote: [
    {
      collectivite_id: 1,
      indicateur_identifiant_referentiel: 'eci_29',
      user_id: '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561',
    },
    {
      indicateur_identifiant_referentiel: 'eci_29',
      collectivite_id: 1,
      tag_id: 1,
    },
    {
      indicateur_identifiant_referentiel: 'eci_24',
      collectivite_id: 1,
      tag_id: 1,
    },
  ],
  indicateur_service_tag: [
    {
      indicateur_identifiant_referentiel: 'eci_29',
      collectivite_id: 1,
      service_tag_id: 1,
    },
  ],
  fiche_action_indicateur: [
    {
      indicateur_identifiant_referentiel: 'cae_1.a',
      fiche_id: 1,
    },
  ],
  indicateur_thematique: [
    {
      indicateur_identifiant_referentiel: 'cae_1.a',
      thematique_id: 8,
    },
    {
      indicateur_identifiant_referentiel: 'eci_29',
      thematique_id: 5,
    },
    {
      indicateur_identifiant_referentiel: 'eci_36',
      thematique_id: 4,
    },
  ],
  indicateur_collectivite: [
    {
      indicateur_identifiant_referentiel: 'cae_1.a',
      collectivite_id: 1,
      confidentiel: true,
    },
    {
      indicateur_identifiant_referentiel: 'cae_2.a',
      collectivite_id: 1,
      confidentiel: true,
    },
    {
      indicateur_identifiant_referentiel: 'cae_4.c',
      collectivite_id: 1,
      confidentiel: false,
    },
    {
      indicateur_identifiant_referentiel: 'cae_44',
      collectivite_id: 1,
      confidentiel: true,
    },
  ],
} as Partial<
  Record<TableName, Database['public']['Tables'][TableName]['Insert']>
>;

// wrap la fonction à tester pour ne pas avoir à repréciser toujours les mêmes paramètres
const fetchIndicateurs = (filters: FetchFiltre) =>
  fetchFilteredIndicateurs(supabase, 1, { filtre: filters });

beforeAll(async () => {
  await testReset();

  // Résoud les identifiants de référentiel
  const identifiantReferentielPromises = Object.entries(FIXTURE).map(
    ([tableName, entries]) => {
      if (Array.isArray(entries)) {
        return entries?.map((entry) => {
          if (entry.indicateur_identifiant_referentiel) {
            return dbAdmin
              .from('indicateur_definition')
              .select('id')
              .eq(
                'identifiant_referentiel',
                entry.indicateur_identifiant_referentiel
              )
              .single()
              .then((result) => {
                if (!result.data?.id) {
                  throw new Error(
                    `Indicateur ${entry.indicateur_identifiant_referentiel} not found`
                  );
                }
                entry.indicateur_id = result.data.id;
                delete entry.indicateur_identifiant_referentiel;
              });
          } else {
            return Promise.resolve();
          }
        });
      } else {
        return Promise.resolve();
      }
    }
  );
  await Promise.all(identifiantReferentielPromises.flat());

  // insère les données de test
  const upsertPromises = await Promise.all(
    Object.entries(FIXTURE).map(async ([tableName, entries]) => {
      return dbAdmin.from(tableName as TableName).upsert(entries);
    })
  );
  upsertPromises.forEach((upsert) => {
    expect(upsert.status).toEqual(201);
  });

  await signIn('yolododo');

  return async () => {
    await signOut();
  };
});

test('Confidentialité - Devrait pouvoir voir des résultats insérés en confidentiel', async () => {
  await supabase.from('indicateur_valeur').upsert([
    {
      indicateur_id: 60, //'cae_8',
      collectivite_id: 1,
      date_valeur: new Date(2023, 0, 1).toLocaleDateString('sv-SE'),
      resultat: 999,
    },
    {
      indicateur_id: 60, //'cae_8',
      collectivite_id: 1,
      date_valeur: new Date(2024, 0, 1).toLocaleDateString('sv-SE'),
      resultat: 666,
    },
  ]);

  await supabase
    .from('indicateur_collectivite')
    .upsert([{ indicateur_id: 60, collectivite_id: 1, confidentiel: true }]); // 'cae_8'

  const { data } = await supabase
    .from('indicateur_valeur')
    .select('*')
    .eq('collectivite_id', 1)
    .eq('indicateur_id', 60); // 'cae_8'

  expect(data).toHaveLength(2);
});

test("Confidentialité - Devrait ne pas pouvoir lire des valeurs des collectivités sur lesquelles je n'ai pas de droits", async () => {
  await supabase.from('indicateur_valeur').upsert([
    {
      indicateur_id: 60, //'eci_8',
      collectivite_id: 1,
      date_valeur: new Date(2023, 0, 1).toLocaleDateString('sv-SE'),
      resultat: 999,
    },
    {
      indicateur_id: 60, //'eci_8',
      collectivite_id: 1,
      date_valeur: new Date(2024, 0, 1).toLocaleDateString('sv-SE'),
      resultat: 666,
    },
  ]);

  await supabase
    .from('indicateur_collectivite')
    .upsert([{ indicateur_id: 60, collectivite_id: 1, confidentiel: true }]); // 'cae_8'

  await signOut();
  await signIn('yulududu');

  const { data } = await supabase
    .from('indicateur_valeur')
    .select('*')
    .eq('collectivite_id', 1)
    .eq('indicateur_id', 60); // 'cae_8'

  expect(data).toHaveLength(0);
});

test('Filtrer les indicateurs - par catégorie', async () => {
  const { data: eciIndicateurs } = await fetchIndicateurs({
    categorieNoms: ['eci'],
  });

  if (!eciIndicateurs) {
    expect.fail();
  }

  expect(eciIndicateurs.length).toBeGreaterThan(0);

  const { data: caeIndicateurs } = await fetchIndicateurs({
    categorieNoms: ['cae'],
  });

  if (!caeIndicateurs) {
    expect.fail();
  }

  expect(eciIndicateurs.length).toBeGreaterThan(0);

  const { data: allIndicateurs } = await fetchIndicateurs({});
  if (!allIndicateurs) {
    expect.fail();
  }

  expect(allIndicateurs.length).toBeGreaterThanOrEqual(
    caeIndicateurs.length + eciIndicateurs.length
  );
});

test('Filtrer les indicateurs - par le sous-ensemble ECi et par texte (dans le titre ou la description)', async () => {
  const { status, data } = await fetchIndicateurs({
    text: 'activité',
    categorieNoms: ['eci'],
  });

  expect(status).toEqual(200);
  expect(data.length).toBeGreaterThan(1);
});

test('Filtrer les indicateurs - par le sous-ensemble ECi et par identifiant', async () => {
  const { data } = await fetchIndicateurs({
    text: '#29',
    categorieNoms: ['eci'],
  });

  expect(data).toHaveLength(1);
  expect(data[0].identifiant).toEqual('eci_29');
});

test('Filtrer les indicateurs - par une thématique', async () => {
  const { status, data } = await fetchIndicateurs({
    thematiqueIds: [5],
  });
  expect(status).toEqual(200);
  expect(data.length).toBeGreaterThan(1); // 'ind. ECi dans la thématique'
  const identifiants = data.map((i) => i.identifiant);
  expect(identifiants).toContain('eci_29');
});

test('Filtrer les indicateurs - par plusieurs thématiques', async () => {
  const { status, data } = await fetchIndicateurs({
    thematiqueIds: [5, 4],
  });
  expect(status).toEqual(200);
  expect(data.length).toBeGreaterThan(2);
  const identifiants = data.map((i) => i.identifiant);
  expect(identifiants).toContain('eci_29');
  expect(identifiants).toContain('eci_36');
});

test('Filtrer les indicateurs - par personne et utilisateur pilote', async () => {
  const { data: withUser } = await fetchIndicateurs({
    utilisateurPiloteIds: [yaladadaUUid],
  });

  expect(withUser.length).toBeGreaterThan(0);

  const { data: withPersonne } = await fetchIndicateurs({
    personnePiloteIds: [1],
  });

  expect(withPersonne.length).toBeGreaterThan(0);

  const { data: withUserAndPersonne } = await fetchIndicateurs({
    utilisateurPiloteIds: [yaladadaUUid],
    personnePiloteIds: [1],
  });

  for (const indicateur of [...withPersonne, ...withUser]) {
    expect(withUserAndPersonne.some((i) => i.id === indicateur.id)).toBe(true);
  }
});

test('Filtrer les indicateurs - par action du référentiel', async () => {
  const { data } = await fetchIndicateurs({
    actionId: 'eci_1.2',
  });

  expect(data.length).toBeGreaterThan(1);
  const identifiants = data.map((i) => i.identifiant);
  expect(identifiants).toContain('eci_29');
});

test("Filtrer les indicateurs - par id de plan d'actions", async () => {
  const { data } = await fetchIndicateurs({
    planActionIds: [1],
  });

  expect(data).toHaveLength(1);

  const { data: empty } = await fetchIndicateurs({
    planActionIds: [12],
  });

  expect(empty).toHaveLength(0);
});

test('Filtrer les indicateurs - par id de service', async () => {
  const { data } = await fetchIndicateurs({
    servicePiloteIds: [1],
  });

  expect(data).toHaveLength(1);
});

test('Filtrer les indicateurs - par le sous-ensemble CAE', async () => {
  const { data } = await fetchIndicateurs({
    categorieNoms: ['cae'],
  });
  const { data: allIndicateurs } = await fetchIndicateurs({});

  expect(allIndicateurs.length).toBeGreaterThan(data.length);
});

test('Filtrer les indicateurs - par le sous-ensemble CAE et par le flag "participation au score"', async () => {
  const { data } = await fetchIndicateurs({
    participationScore: true,
    categorieNoms: ['cae'],
  });

  const { data: allIndicateurs } = await fetchIndicateurs({
    categorieNoms: ['cae'],
  });

  if (!data) {
    expect.fail();
  }

  expect(allIndicateurs.length).toBeGreaterThan(data.length);
});

test('Filtrer les indicateurs - par le sous-ensemble CAE et l\'état "complété"', async () => {
  const { status, data } = await fetchIndicateurs({
    estComplet: true,
    categorieNoms: ['cae'],
  });
  expect(status).toEqual(200);
  expect(data).toHaveLength(1);
});

test('Filtrer les indicateurs - par le sous-ensemble CAE et l\'état non "complété"', async () => {
  const { data } = await fetchIndicateurs({
    estComplet: false,
    categorieNoms: ['cae'],
  });

  expect(data.length).toBeGreaterThan(1);
});

test('Filtrer les indicateurs - par le sous-ensemble CAE et l\'état "confidentiel"', async () => {
  const { data: confidentielIndicateurs } = await fetchIndicateurs({
    estConfidentiel: true,
    categorieNoms: ['cae'],
  });

  const { data: allIndicateurs } = await fetchIndicateurs({
    categorieNoms: ['cae'],
  });

  if (!confidentielIndicateurs || !allIndicateurs) {
    expect.fail();
  }

  expect(allIndicateurs.length).toBeGreaterThan(confidentielIndicateurs.length);
});

test('Filtrer les indicateurs - par le sous-ensemble CAE et l\'état non "confidentiel"', async () => {
  const { status, data } = await fetchIndicateurs({
    estConfidentiel: false,
    categorieNoms: ['cae'],
  });

  expect(status).toEqual(200);
  expect(data.length).toBeGreaterThan(0);

  for (const indicateur of data) {
    expect(indicateur.identifiant).toMatch(
      /^plans_de_deplacement|modes_de_deplacement|emission_polluants_atmo|cae_.*|s_*/
    );
  }
});

test('Filtrer les indicateurs - par indicateur perso', async () => {
  const { status, data } = await fetchIndicateurs({
    estPerso: true,
  });
  expect(status).toEqual(200);
  expect(data).toHaveLength(1);
});

test('Filtrer les indicateurs - par indicateur perso et confidentiel', async () => {
  const { data } = await fetchIndicateurs({
    estPerso: true,
    estConfidentiel: false,
  });

  if (!data) {
    expect.fail();
  }

  expect(data).toHaveLength(1);

  // Change la confidentialité
  await signOut();

  await dbAdmin
    .from('indicateur_collectivite')
    .update({ confidentiel: true })
    .eq('indicateur_id', data?.[0].id);

  await signIn('yolododo');

  const data2 = await fetchIndicateurs({
    estPerso: true,
    estConfidentiel: false,
  });

  expect(data2.status).toEqual(200);
  expect(data2.data).toHaveLength(0);
});

test('Filtrer les indicateurs - tous les indicateurs', async () => {
  const { status, data } = await fetchIndicateurs({});
  expect(status).toEqual(200);
  expect(data.length).toBeGreaterThan(0);
});

test('Filtrer les indicateurs - par fiche action', async () => {
  const { data } = await fetchIndicateurs({
    ficheActionIds: [1],
  });

  expect(data).toHaveLength(1);
  expect(data[0].identifiant).toEqual('cae_1.a');

  const { data: empty } = await fetchIndicateurs({
    ficheActionIds: [2],
  });

  expect(empty).toHaveLength(0);
});

test('Filtrer les indicateurs - par existence de données open-data', async () => {
  // Ajoute 3 valeurs open-data :
  // - 2 pour l'indicateur 48 (indicateur enfant)
  // - 1 pour l'indicateur 17 (ni enfant ni parent)
  await signOut();

  const { data: metadonnee } = await dbAdmin
    .from('indicateur_source_metadonnee')
    .upsert({
      source_id: 'citepa',
      date_version: new Date().toLocaleDateString('sv-SE'),
    })
    .select('id')
    .single();

  if (!metadonnee) {
    expect.fail();
  }

  // cae_15.a_dom has a parent, cae_1.a not
  const resultIndicateurDefinitions = await dbAdmin
    .from('indicateur_definition')
    .select('*')
    .in('identifiant_referentiel', ['cae_1.a', 'cae_15.a_dom']);
  const cae1aIndicateur = resultIndicateurDefinitions.data?.find(
    (i) => i.identifiant_referentiel === 'cae_1.a'
  );
  expect(cae1aIndicateur).toBeDefined();
  const cae15aDomIndicateur = resultIndicateurDefinitions.data?.find(
    (i) => i.identifiant_referentiel === 'cae_15.a_dom'
  );
  expect(cae15aDomIndicateur).toBeDefined();

  await dbAdmin.from('indicateur_valeur').insert({
    indicateur_id: cae1aIndicateur!.id,
    date_valeur: '2025-01-01',
    collectivite_id: 1,
    resultat: 1.8,
    metadonnee_id: metadonnee.id,
  });

  await dbAdmin.from('indicateur_valeur').insert({
    indicateur_id: cae1aIndicateur!.id,
    date_valeur: '2024-01-01',
    collectivite_id: 1,
    resultat: 1.5,
    metadonnee_id: metadonnee.id,
  });

  await dbAdmin.from('indicateur_valeur').insert({
    indicateur_id: cae15aDomIndicateur!.id,
    date_valeur: '2024-01-01',
    collectivite_id: 1,
    objectif: 16,
    metadonnee_id: metadonnee.id,
  });

  await signIn('yolododo');

  const { status, data } = await fetchIndicateurs({
    hasOpenData: true,
  });

  expect(status).toEqual(200);

  // L'indicateur enfant ne doit pas remonter !
  // donc un seul indicateur attendu (le 17)
  expect(data).toHaveLength(1);

  for (const indicateur of data) {
    expect(indicateur.id).toEqual(cae1aIndicateur!.id);
    expect(indicateur.hasOpenData).toBe(true);
  }
});
