import {testReset} from '../../tests/testReset';
import {dbAdmin, supabase} from '../../tests/supabase';
import {fetchFilteredIndicateurs} from './fetchFilteredIndicateurs';
import {beforeAll, expect, test} from 'vitest';
import {signIn, signOut} from '../../tests/auth';
import {Database} from '../../database.types';
import {FetchFiltre} from '../domain';

type TableName = keyof Database['public']['Tables'];

const FIXTURE = {
  indicateur_action: [
    {
      indicateur_id: 17, // eci_29
      action_id: 'eci_1.2',
    },
  ],
  indicateur_pilote: [
    {
      collectivite_id: 1,
      indicateur_id: 17, //'eci_29',
      user_id: '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561',
    },
    {
      indicateur_id: 17, //'eci_29',
      collectivite_id: 1,
      tag_id: 1,
    },
    {
      indicateur_id: 3, //'eci_24',
      collectivite_id: 1,
      tag_id: 1,
    },
  ],
  indicateur_service_tag: [
    {
      indicateur_id: 17, //'eci_29',
      collectivite_id: 1,
      service_tag_id: 1,
    },
  ],
  fiche_action_indicateur: [
    {
      indicateur_id: 17, //'eci_29',
      fiche_id: 1,
    },
  ],
  indicateur_thematique: [
    {
      indicateur_id: 123,
      thematique_id: 8,
    },
    {
      indicateur_id: 17, // eci_29
      thematique_id: 5,
    },
    {
      indicateur_id: 10, // eci_36
      thematique_id: 4,
    },
  ],
  indicateur_collectivite: [
    {
      indicateur_id: 98, //'cae_1.a',
      collectivite_id: 1,
      confidentiel: true,
    },
    {
      indicateur_id: 48, // 'cae_2.a'
      collectivite_id: 1,
      confidentiel: true,
    },
    {
      indicateur_id: 113,
      collectivite_id: 1,
      confidentiel: false,
    },
    {
      indicateur_id: 123,
      collectivite_id: 1,
      confidentiel: true,
    },
  ],
} as Partial<
  Record<TableName, Database['public']['Tables'][TableName]['Insert']>
>;

// wrap la fonction à tester pour ne pas avoir à repréciser toujours les mêmes paramètres
const fetchIndicateurs = (filters: FetchFiltre) =>
  fetchFilteredIndicateurs(supabase, 1, {filtre: filters});

beforeAll(async () => {
  await signIn('yolododo');
  await testReset();

  // insère les données de test
  await Promise.all(
    Object.entries(FIXTURE).map(async ([tableName, entries]) => {
      const upsert = await dbAdmin.from(tableName as TableName).upsert(entries);
      expect(upsert.status).toEqual(201);
    })
  );

  return async () => {
    await signOut();
  };
});

test('Confidentialité - Devrait pouvoir insérer des résultats', async () => {
  await supabase.from('indicateur_valeur').upsert([
    {
      indicateur_id: 38, //'eci_8',
      collectivite_id: 1,
      date_valeur: new Date(2023, 0, 1).toLocaleDateString('sv-SE'),
      resultat: 999,
    },
    {
      indicateur_id: 38, //'eci_8',
      collectivite_id: 1,
      date_valeur: new Date(2024, 0, 1).toLocaleDateString('sv-SE'),
      resultat: 666,
    },
  ]);

  await supabase
    .from('indicateur_collectivite')
    .upsert([{indicateur_id: 60, collectivite_id: 1, confidentiel: true}]); // 'cae_8'

  const {data} = await supabase
    .from('indicateur_valeur')
    .select('*')
    .eq('collectivite_id', 1)
    .eq('indicateur_id', 60); // 'cae_8'

  expect(data).toHaveLength(2);
});

test("Confidentialité - Devrait ne pas pouvoir lire des valeurs des collectivités sur lesquelles je n'ai pas de droits", async () => {
  await signOut();
  await signIn('yulududu');
  const {data} = await supabase
    .from('indicateur_valeur')
    .select('*')
    .eq('collectivite_id', 1)
    .eq('indicateur_id', 60); // 'cae_8'

  expect(data).toHaveLength(0);
  await signOut();
  await signIn('yolododo');
});

test('Filtrer les indicateurs - par le sous-ensemble ECi', async () => {
  const {status, data} = await fetchIndicateurs({
    categorieNoms: ['eci'],
  });
  expect(status).toEqual(200);
  expect(data.length).toEqual(3);
});

test('Filtrer les indicateurs - par le sous-ensemble ECi et par texte (dans le titre ou la description)', async () => {
  const {status, data} = await fetchIndicateurs({
    text: 'activité',
    categorieNoms: ['eci'],
  });
  expect(status).toEqual(200);
  expect(data).toHaveLength(1);
});

test('Filtrer les indicateurs - par le sous-ensemble ECi et par identifiant', async () => {
  const {status, data} = await fetchIndicateurs({
    text: '#29',
    categorieNoms: ['eci'],
  });
  expect(status).toEqual(200);
  expect(data).toHaveLength(1);
  expect(data[0].id).toEqual(17); // eci_29
});

test('Filtrer les indicateurs - par le sous-ensemble ECi et par une thématique', async () => {
  const {status, data} = await fetchIndicateurs({
    thematiqueIds: [5],
    categorieNoms: ['eci'],
  });
  expect(status).toEqual(200);
  expect(data).toHaveLength(1); // 'ind. ECi dans la thématique'
});

test('Filtrer les indicateurs - par le sous-ensemble ECi et par plusieurs thématiques', async () => {
  const {status, data} = await fetchIndicateurs({
    thematiqueIds: [5, 4],
    categorieNoms: ['eci'],
  });
  expect(status).toEqual(200);
  expect(data).toHaveLength(2);
});

test('Filtrer les indicateurs - par le sous-ensemble ECi et par personne pilote', async () => {
  const {status, data} = await fetchIndicateurs({
    utilisateurPiloteIds: ['4ecc7d3a-7484-4a1c-8ac8-930cdacd2561'],
    categorieNoms: ['eci'],
  });
  expect(status).toEqual(200);
  expect(data).toHaveLength(1);
});

test('Filtrer les indicateurs - par le sous-ensemble ECi et par tag de personne pilote', async () => {
  const {status, data} = await fetchIndicateurs({
    personnePiloteIds: [1],
    categorieNoms: ['eci'],
  });
  expect(status).toEqual(200);
  expect(data).toHaveLength(1);
});

test('Filtrer les indicateurs - par le sous-ensemble ECi et par personne et tag pilote', async () => {
  const {status, data} = await fetchIndicateurs({
    utilisateurPiloteIds: ['4ecc7d3a-7484-4a1c-8ac8-930cdacd2561'],
    personnePiloteIds: [1],
    categorieNoms: ['eci'],
  });
  expect(status).toEqual(200);
  expect(data).toHaveLength(1);
});

test('Filtrer les indicateurs - par le sous-ensemble ECi et par action du référentiel', async () => {
  const {status, data} = await fetchIndicateurs({
    actionId: 'eci_1.2',
    categorieNoms: ['eci'],
  });
  expect(status).toEqual(200);
  expect(data).toHaveLength(1);
});

test("Filtrer les indicateurs - par le sous-ensemble ECi et par id de plan d'actions", async () => {
  const {status, data} = await fetchIndicateurs({
    planActionIds: [1],
    categorieNoms: ['eci'],
  });
  expect(status).toEqual(200);
  expect(data).toHaveLength(1);
});

test('Filtrer les indicateurs - par le sous-ensemble ECi et par id de service', async () => {
  const {status, data} = await fetchIndicateurs({
    servicePiloteIds: [1],
    categorieNoms: ['eci'],
  });
  expect(status).toEqual(200);
  expect(data).toHaveLength(1);
});

test('Filtrer les indicateurs - par le sous-ensemble CAE', async () => {
  const {status, data} = await fetchIndicateurs({
    categorieNoms: ['cae'],
  });
  expect(status).toEqual(200);
  expect(data.length).toBeCloseTo(66, 3);
});

test('Filtrer les indicateurs - par le sous-ensemble CAE et par le flag "participation au score"', async () => {
  const {status, data} = await fetchIndicateurs({
    participationScore: true,
    categorieNoms: ['cae'],
  });
  expect(status).toEqual(200);
  expect(data.length).toBeCloseTo(31, 3);
});

test('Filtrer les indicateurs - par le sous-ensemble CAE et l\'état "complété"', async () => {
  const {status, data} = await fetchIndicateurs({
    estComplet: true,
    categorieNoms: ['cae'],
  });
  expect(status).toEqual(200);
  expect(data).toHaveLength(1);
});

test('Filtrer les indicateurs - par le sous-ensemble CAE et l\'état non "complété"', async () => {
  const {status, data} = await fetchIndicateurs({
    estComplet: false,
    categorieNoms: ['cae'],
  });
  expect(status).toEqual(200);
  expect(data).toHaveLength(65);
});

test('Filtrer les indicateurs - par le sous-ensemble CAE et l\'état "confidentiel"', async () => {
  const {status, data} = await fetchIndicateurs({
    estConfidentiel: true,
    categorieNoms: ['cae'],
  });
  expect(status).toEqual(200);
  // Varie de 1 selon si on lance ce test unitairement ou tout le fichier
  expect(data.length).toBeGreaterThanOrEqual(2);
  expect(data.length).toBeLessThanOrEqual(3);
});

test('Filtrer les indicateurs - par le sous-ensemble CAE et l\'état non "confidentiel"', async () => {
  const {status, data} = await fetchIndicateurs({
    estConfidentiel: false,
    categorieNoms: ['cae'],
  });
  expect(status).toEqual(200);
  // Varie de 1 selon si on lance ce test unitairement ou tout le fichier
  expect(data.length).toBeGreaterThanOrEqual(63);
  expect(data.length).toBeLessThanOrEqual(64);
});

test('Filtrer les indicateurs - par indicateur perso', async () => {
  const {status, data} = await fetchIndicateurs({
    estPerso: true,
  });
  expect(status).toEqual(200);
  expect(data).toHaveLength(1);
});

test('Filtrer les indicateurs - par indicateur perso et confidentiel', async () => {
  const {status, data} = await fetchIndicateurs({
    estPerso: true,
    estConfidentiel: true,
  });
  expect(status).toEqual(200);
  expect(data).toHaveLength(1);
  const data2 = await fetchIndicateurs({
    estPerso: true,
    estConfidentiel: false,
  });
  expect(data2.status).toEqual(200);
  expect(data2.data).toHaveLength(0);
});

test('Filtrer les indicateurs - tous les indicateurs', async () => {
  const {status, data} = await fetchIndicateurs({});
  expect(status).toEqual(200);
  expect(data).toHaveLength(123);
});

test('Filtrer les indicateurs - par existence de données open-data', async () => {
  // Ajoute 3 valeurs open-data :
  // - 2 pour l'indicateur 48
  // - 1 pour l'indicateur 17

  const {data: metadonnee} = await dbAdmin
    .from('indicateur_source_metadonnee')
    .insert({
      source_id: 'citepa',
      date_version: new Date().toLocaleDateString('sv-SE'),
    })
    .select('id');

  await dbAdmin.from('indicateur_valeur').insert({
    indicateur_id: 48,
    date_valeur: '2025-01-01',
    collectivite_id: 1,
    resultat: 1.8,
    metadonnee_id: metadonnee![0].id,
  });

  await dbAdmin.from('indicateur_valeur').insert({
    indicateur_id: 48,
    date_valeur: '2024-01-01',
    collectivite_id: 1,
    resultat: 1.5,
    metadonnee_id: metadonnee![0].id,
  });

  await dbAdmin.from('indicateur_valeur').insert({
    indicateur_id: 17,
    date_valeur: '2024-01-01',
    collectivite_id: 1,
    objectif: 16,
    metadonnee_id: metadonnee![0].id,
  });

  const {status, data} = await fetchIndicateurs({
    hasOpenData: true,
  });

  expect(status).toEqual(200);
  expect(data).toHaveLength(2);
});
