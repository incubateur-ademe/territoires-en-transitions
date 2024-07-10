import {
  selectIndicateurValeur,
  selectIndicateurValeurs,
  selectIndicateurPilotes,
  selectIndicateurServicesId,
  selectIndicateurThematiquesId,
  selectIndicateurFiches,
  selectIndicateurActions,
  selectIndicateurListItems,
  selectIndicateurDefinition,
  selectIndicateurComplet,
  selectIndicateurChartInfo,
  selectIndicateurCategoriesUtilisateur,
  getValeursComparaison,
  selectIndicateurSources,
} from './indicateur.fetch';
import {beforeAll, expect, test} from 'vitest';
import {signIn, signOut} from '../../tests/auth';
import {dbAdmin, supabase} from '../../tests/supabase';
import {testReset} from '../../tests/testReset';

beforeAll(async () => {
  await signIn('yolododo');
  await testReset();
  // Groupement
  const gp = await dbAdmin
    .from('groupement')
    .insert({nom: 'test'})
    .select('id');
  await dbAdmin
    .from('groupement_collectivite')
    .insert({collectivite_id: 1, groupement_id: gp.data![0].id});
  const gp2 = await dbAdmin
    .from('groupement')
    .insert({nom: 'test2'})
    .select('id');
  await dbAdmin
    .from('groupement_collectivite')
    .insert({collectivite_id: 2, groupement_id: gp2.data![0].id});

  // Indicateur privé
  const indi = await dbAdmin.from('indicateur_definition').insert({
    titre: 'testGroupement',
    unite: '%',
    groupement_id: gp.data![0].id,
  });

  // Categories
  const cat = await dbAdmin
    .from('categorie_tag')
    .upsert({collectivite_id: 1, nom: 'test'})
    .select('id');
  await dbAdmin
    .from('indicateur_categorie_tag')
    .insert({categorie_tag_id: cat.data![0].id, indicateur_id: 1});
  const cat2 = await dbAdmin
    .from('categorie_tag')
    .upsert({groupement_id: gp.data![0].id, nom: 'testGP'})
    .select('id');
  await dbAdmin
    .from('indicateur_categorie_tag')
    .insert({categorie_tag_id: cat2.data![0].id, indicateur_id: 1});
  const cat3 = await dbAdmin
    .from('categorie_tag')
    .upsert({groupement_id: gp2.data![0].id, nom: 'testGP2'})
    .select('id');
  await dbAdmin
    .from('indicateur_categorie_tag')
    .insert({categorie_tag_id: cat3.data![0].id, indicateur_id: 1});
  const cat4 = await dbAdmin
    .from('categorie_tag')
    .upsert({collectivite_id: 2, nom: 'test2'})
    .select('id');
  await dbAdmin
    .from('indicateur_categorie_tag')
    .insert({categorie_tag_id: cat4.data![0].id, indicateur_id: 1});
  // Pilotes
  await dbAdmin
    .from('indicateur_pilote')
    .insert({collectivite_id: 1, user_id: null, tag_id: 1, indicateur_id: 1});
  // Services
  await dbAdmin
    .from('indicateur_service_tag')
    .insert({collectivite_id: 1, service_tag_id: 1, indicateur_id: 1});
  // Thématiques
  await dbAdmin
    .from('indicateur_thematique')
    .insert({thematique_id: 1, indicateur_id: 123});
  // Fiches
  await dbAdmin
    .from('fiche_action_indicateur')
    .insert({fiche_id: 1, indicateur_id: 123});
  // Actions
  await dbAdmin
    .from('indicateur_action')
    .insert({action_id: 'eci_4', indicateur_id: 123});
  // Commentaire
  await dbAdmin
    .from('indicateur_collectivite')
    .insert({indicateur_id: 1, collectivite_id: 1, commentaire: 'test1'});
  await dbAdmin
    .from('indicateur_collectivite')
    .insert({indicateur_id: 1, collectivite_id: 2, commentaire: 'test2'});
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
  const meta3 = await dbAdmin
    .from('indicateur_source_metadonnee')
    .insert({
      source_id: 'orcae',
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
    metadonnee_id: meta.data![0].id,
  });
  await dbAdmin.from('indicateur_valeur').insert({
    indicateur_id: 1,
    date_valeur: '2020-01-01',
    collectivite_id: 1,
    resultat: 1.9,
    metadonnee_id: meta2.data![0].id,
  });
  await dbAdmin.from('indicateur_valeur').insert({
    indicateur_id: 1,
    date_valeur: '2020-01-01',
    collectivite_id: 2,
    resultat: 1.5,
    metadonnee_id: meta.data![0].id,
  });

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

test('Test selectIndicateurListItems', async () => {
    // Récupère la liste des indicateurs prédéfinis et personnalisés
    const data =
        await selectIndicateurListItems(supabase, 1, true, true);
    expect(data).not.toBeNull();
    expect(data).toHaveLength(124);
    // Récupère la liste des indicateurs personnalisés
    const perso =
        await selectIndicateurListItems(supabase, 1, true, false);
    expect(perso).not.toBeNull();
    expect(perso).toHaveLength(1);
    // Récupère la liste des indicateurs prédéfinis et privé
    const predef =
        await selectIndicateurListItems(supabase, 1, false, true);
    expect(predef).not.toBeNull();
    expect(predef).toHaveLength(123);
    // Récupère la liste des indicateurs prédéfinis et non privé
    const predef2 =
        await selectIndicateurListItems(supabase, 2, false, true);
    expect(predef2).not.toBeNull();
    expect(predef2).toHaveLength(122);
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
    expect(data!.resultat).eq(20);
});

test('Test selectIndicateurDefinition', async () => {
    const data = await selectIndicateurDefinition(supabase, 1, 1);
    expect(data).not.toBeNull();
    expect(data!.identifiant).eq('crte_4.1');
});

test('Test selectIndicateurComplet', async () => {
    const data = await selectIndicateurComplet(supabase, 1, 1);
    expect(data).not.toBeNull();
    expect(data!.identifiant).eq('crte_4.1');
    expect(data!.pilotes).toHaveLength(1);
});

test('Test selectIndicateurChartInfo', async () => {
    // Test retour indicateur
    const data = await selectIndicateurChartInfo(supabase, 1, 1);
    expect(data).not.toBeNull();
    // Test retour indicateur composé cae_2.a non rempli
    const data2 = await selectIndicateurChartInfo(supabase, 48, 1);
    expect(data2).not.toBeNull();
    expect(data2!.enfants).toHaveLength(5);
    expect(data2!.enfants!.filter(e=> e.id=8)![0].rempli).toBe(true);
    expect(data2!.valeurs).toHaveLength(0);
    // Test retour indicateur composé cae_2.a non rempli car sans_valeur = false
    await dbAdmin.from('indicateur_valeur').insert({
        indicateur_id : 64, date_valeur : '2020-01-01', collectivite_id : 1, resultat : 1.2});
    await dbAdmin.from('indicateur_valeur').insert({
        indicateur_id : 94, date_valeur : '2021-01-01', collectivite_id : 1, resultat : 1.2});
    await dbAdmin.from('indicateur_valeur').insert({
        indicateur_id : 95, date_valeur : '2020-01-01', collectivite_id : 1, resultat : 1.2});
    await dbAdmin.from('indicateur_valeur').insert({
        indicateur_id : 118, date_valeur : '2020-01-01', collectivite_id : 1, resultat : 1.2});
    const data3 = await selectIndicateurChartInfo(supabase, 48, 1);
    expect(data3).not.toBeNull();
    expect(data3!.enfants).toHaveLength(5);
    expect(data3!.valeurs).toHaveLength(0);
    // Test retour indicateur composé cae_2.a non rempli car sans_valeur = true
    await dbAdmin.from('indicateur_definition')
        .update({sans_valeur_utilisateur : true}).eq('id', 48);
    const data4 = await selectIndicateurChartInfo(supabase, 48, 1);
    expect(data4).not.toBeNull();
    expect(data4!.enfants).toHaveLength(5);
    expect(data4!.valeurs).toHaveLength(1);
    // Test retour indicateur cae_9 non rempli
    await dbAdmin.from('indicateur_groupe').insert({parent : 114, enfant : 3});
    const data5 = await selectIndicateurChartInfo(supabase, 114, 1);
    expect(data5).not.toBeNull();
    expect(data5!.enfants).toHaveLength(1);
    expect(data5!.valeurs).toHaveLength(0);
    // Test retour indicateur cae_9 rempli
    await dbAdmin.from('indicateur_groupe').insert({parent : 114, enfant : 1});
    const data6 = await selectIndicateurChartInfo(supabase, 114, 1);
    expect(data6).not.toBeNull();
    expect(data6!.enfants).toHaveLength(2);
    expect(data6!.valeurs).toHaveLength(1);
});

test('Test getValeursComparaison', async () => {
    const data =
        await getValeursComparaison(supabase, 1, 1, 'citepa');
    expect(data).not.toBeNull();
    expect(data!.resultats.lignes).toHaveLength(1);
});

