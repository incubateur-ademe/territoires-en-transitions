import { beforeAll, expect, test } from 'vitest';
import { signIn, signOut } from '../../tests/auth';
import { dbAdmin, supabase } from '../../tests/supabase';
import { testReset } from '../../tests/testReset';
import {
  getValeursComparaison,
  selectIndicateurActions,
  selectIndicateurCategoriesUtilisateur,
  selectIndicateurChartInfo,
  selectIndicateurDefinition,
  selectIndicateurFiches,
  selectIndicateurPilotes,
  selectIndicateurServicesId,
  selectIndicateurSources,
  selectIndicateurThematiquesId,
  selectIndicateurValeur,
  selectIndicateurValeurs,
} from './indicateur.fetch';

beforeAll(async () => {
  await testReset();
  // Groupement
  const { data: gp } = await dbAdmin
    .from('groupement')
    .insert({ nom: 'test' })
    .select('id')
    .single();

  if (!gp) {
    expect.fail();
  }

  await dbAdmin
    .from('groupement_collectivite')
    .insert({ collectivite_id: 1, groupement_id: gp.id });

  const { data: gp2 } = await dbAdmin
    .from('groupement')
    .insert({ nom: 'test2' })
    .select('id')
    .single();

  if (!gp2) {
    expect.fail();
  }

  await dbAdmin
    .from('groupement_collectivite')
    .insert({ collectivite_id: 2, groupement_id: gp2.id });

  // Indicateur privé
  await dbAdmin.from('indicateur_definition').insert({
    titre: 'testGroupement',
    unite: '%',
    groupement_id: gp.id,
  });

  // Categories
  const { data: cat } = await dbAdmin
    .from('categorie_tag')
    .upsert({ collectivite_id: 1, nom: 'test' })
    .select('id')
    .single();

  if (!cat) {
    expect.fail();
  }

  await dbAdmin
    .from('indicateur_categorie_tag')
    .insert({ categorie_tag_id: cat.id, indicateur_id: 1 });

  const { data: cat2 } = await dbAdmin
    .from('categorie_tag')
    .upsert({ groupement_id: gp.id, nom: 'testGP' })
    .select('id')
    .single();

  if (!cat2) {
    expect.fail();
  }

  await dbAdmin
    .from('indicateur_categorie_tag')
    .insert({ categorie_tag_id: cat2.id, indicateur_id: 1 });

  const { data: cat3 } = await dbAdmin
    .from('categorie_tag')
    .upsert({ groupement_id: gp2.id, nom: 'testGP2' })
    .select('id')
    .single();

  if (!cat3) {
    expect.fail();
  }

  await dbAdmin
    .from('indicateur_categorie_tag')
    .insert({ categorie_tag_id: cat3.id, indicateur_id: 1 });

  const { data: cat4 } = await dbAdmin
    .from('categorie_tag')
    .upsert({ collectivite_id: 2, nom: 'test2' })
    .select('id')
    .single();

  if (!cat4) {
    expect.fail();
  }

  await dbAdmin
    .from('indicateur_categorie_tag')
    .insert({ categorie_tag_id: cat4.id, indicateur_id: 1 });

  // Pilotes
  await dbAdmin
    .from('indicateur_pilote')
    .insert({ collectivite_id: 1, user_id: null, tag_id: 1, indicateur_id: 1 });

  // Services
  await dbAdmin
    .from('indicateur_service_tag')
    .insert({ collectivite_id: 1, service_tag_id: 1, indicateur_id: 1 });

  // Thématiques
  await dbAdmin
    .from('indicateur_thematique')
    .insert({ thematique_id: 1, indicateur_id: 123 });

  // Fiches
  await dbAdmin
    .from('fiche_action_indicateur')
    .insert({ fiche_id: 1, indicateur_id: 123 });

  // Actions
  await dbAdmin
    .from('indicateur_action')
    .insert({ action_id: 'eci_4', indicateur_id: 123 });

  // Commentaire
  await dbAdmin
    .from('indicateur_collectivite')
    .insert({ indicateur_id: 1, collectivite_id: 1, commentaire: 'test1' });

  await dbAdmin
    .from('indicateur_collectivite')
    .insert({ indicateur_id: 1, collectivite_id: 2, commentaire: 'test2' });

  // Metadonnées
  const meta = await dbAdmin
    .from('indicateur_source_metadonnee')
    .insert({
      source_id: 'citepa',
      date_version: new Date().toLocaleDateString('sv-SE'),
    })
    .select('id');

  const meta2 = await dbAdmin
    .from('indicateur_source_metadonnee')
    .insert({
      source_id: 'citepa',
      producteur: 'test',
      date_version: new Date().toLocaleDateString('sv-SE'),
    })
    .select('id');

  // Valeurs
  await dbAdmin.from('indicateur_valeur').insert({
    indicateur_id: 1,
    date_valeur: '2020-01-01',
    collectivite_id: 1,
    resultat: 1.2,
  });
  await dbAdmin.from('indicateur_valeur').insert({
    indicateur_id: 8,
    date_valeur: '2020-01-01',
    collectivite_id: 1,
    resultat: 1.2,
  });
  await dbAdmin.from('indicateur_valeur').insert({
    indicateur_id: 1,
    date_valeur: '2020-01-01',
    collectivite_id: 1,
    resultat: 1.5,
    metadonnee_id: meta.data?.[0].id,
  });
  await dbAdmin.from('indicateur_valeur').insert({
    indicateur_id: 1,
    date_valeur: '2020-01-01',
    collectivite_id: 1,
    resultat: 1.9,
    metadonnee_id: meta2.data?.[0].id,
  });
  await dbAdmin.from('indicateur_valeur').insert({
    indicateur_id: 1,
    date_valeur: '2020-01-01',
    collectivite_id: 2,
    resultat: 1.5,
    metadonnee_id: meta.data?.[0].id,
  });

  await signIn('yolododo');

  return async () => {
    await signOut();
  };
});

test('Test selectIndicateurSources', async () => {
  const data = await selectIndicateurSources(supabase, 1, 1);
  expect(data).not.toBeNull();
  expect(data).toHaveLength(1);
});

test('Test selectIndicateurCategoriesUtilisateur', async () => {
  const data = await selectIndicateurCategoriesUtilisateur(supabase, 1, 1);
  expect(data).not.toBeNull();
  expect(data).toHaveLength(1);
});

test('Test selectIndicateurPilote', async () => {
  const data = await selectIndicateurPilotes(supabase, 1, 1);
  expect(data).not.toBeNull();
  expect(data).toHaveLength(1);
  expect(data[0].nom).eq('Lou Piote');
});

test('Test selectIndicateurServices', async () => {
  const data = await selectIndicateurServicesId(supabase, 1, 1);
  expect(data).not.toBeNull();
  expect(data).toHaveLength(1);
});

test('Test selectIndicateurThematiques', async () => {
  const data = await selectIndicateurThematiquesId(supabase, 123);
  expect(data).not.toBeNull();
  expect(data).toHaveLength(1);
});

test('Test selectIndicateurFiches', async () => {
  const data = await selectIndicateurFiches(supabase, 123, 1);
  expect(data).not.toBeNull();
  expect(data).toHaveLength(1);
  expect(data[0].id).eq(1);
});

test('Test selectIndicateurActions', async () => {
  const data = await selectIndicateurActions(supabase, 123);
  expect(data).not.toBeNull();
  expect(data).toHaveLength(1);
  expect(data[0].id).eq('eci_4');
});

test('Test selectIndicateurValeurs', async () => {
  // Récupère les valeurs utilisateurs
  const data = await selectIndicateurValeurs(supabase, 1, 1, null);
  expect(data).not.toBeNull();
  expect(data).toHaveLength(1);
  // Récupère les valeurs citepa
  const dataSource = await selectIndicateurValeurs(supabase, 1, 1, 'citepa');
  expect(dataSource).not.toBeNull();
  expect(dataSource).toHaveLength(1);
});

test('Test selectIndicateurValeur', async () => {
  const data = await selectIndicateurValeur(supabase, 1);
  expect(data).not.toBeNull();
  expect(data?.resultat).eq(20);
});

test('Test selectIndicateurDefinition', async () => {
  const data = await selectIndicateurDefinition(supabase, 1, 1);
  expect(data).not.toBeNull();
  expect(data?.identifiant).eq('cae_1.a');
});

test('Test selectIndicateurChartInfo', async () => {
  // Test retour indicateur
  const data = await selectIndicateurChartInfo(supabase, 1, 1);
  expect(data).not.toBeNull();

  // Test retour indicateur composé cae_2.a non rempli
  const { data: indicateurWithEnfants } = await supabase
    .from('indicateur_definition')
    .select('id')
    .eq('identifiant_referentiel', 'cae_2.a')
    .single();

  if (!indicateurWithEnfants) {
    expect.fail();
  }

  const data2 = await selectIndicateurChartInfo(
    supabase,
    indicateurWithEnfants.id,
    1
  );
  if (!data2) {
    expect.fail();
  }

  expect(data2.enfants?.length).toBeGreaterThan(5);
  expect(data2.valeurs).toHaveLength(0);

  // Test retour indicateur composé cae_2.a non rempli car sans_valeur = false
  await dbAdmin.from('indicateur_valeur').insert({
    indicateur_id: 64,
    date_valeur: '2020-01-01',
    collectivite_id: 1,
    resultat: 1.2,
  });

  await dbAdmin.from('indicateur_valeur').insert({
    indicateur_id: 94,
    date_valeur: '2021-01-01',
    collectivite_id: 1,
    resultat: 1.2,
  });

  await dbAdmin.from('indicateur_valeur').insert({
    indicateur_id: 95,
    date_valeur: '2020-01-01',
    collectivite_id: 1,
    resultat: 1.2,
  });

  await dbAdmin.from('indicateur_valeur').insert({
    indicateur_id: 118,
    date_valeur: '2020-01-01',
    collectivite_id: 1,
    resultat: 1.2,
  });

  const data3 = await selectIndicateurChartInfo(
    supabase,
    indicateurWithEnfants.id,
    1
  );
  expect(data3).not.toBeNull();
  expect(data3?.enfants?.length).toBeGreaterThan(5);
  expect(data3?.valeurs).toHaveLength(0);

  // Test retour indicateur composé cae_2.a non rempli car sans_valeur = true
  await signOut();
  await dbAdmin
    .from('indicateur_definition')
    .update({ sans_valeur_utilisateur: true })
    .eq('id', indicateurWithEnfants.id);
  await signIn('yolododo');

  const data4 = await selectIndicateurChartInfo(
    supabase,
    indicateurWithEnfants.id,
    1
  );

  expect(data4).not.toBeNull();
  expect(data4?.enfants?.length).toBeGreaterThan(5);
  expect(data4?.sansValeur).toBe(true);

  // Test retour indicateur cae_9 non rempli
  await signOut();
  await dbAdmin.from('indicateur_groupe').insert({ parent: 114, enfant: 3 });
  await signIn('yolododo');

  const data5 = await selectIndicateurChartInfo(supabase, 114, 1);
  expect(data5).not.toBeNull();
  expect(data5?.enfants).toHaveLength(1);
  expect(data5?.valeurs).toHaveLength(0);

  // Test retour indicateur cae_9 rempli
  await signOut();
  await dbAdmin.from('indicateur_groupe').insert({ parent: 114, enfant: 1 });
  await signIn('yolododo');

  const data6 = await selectIndicateurChartInfo(supabase, 114, 1);
  expect(data6).not.toBeNull();
  expect(data6?.enfants).toHaveLength(2);
});

test('Test getValeursComparaison', async () => {
  const data = await getValeursComparaison(supabase, 1, 1, 'citepa');
  expect(data).not.toBeNull();
  expect(data?.resultats.lignes).toHaveLength(1);
});
