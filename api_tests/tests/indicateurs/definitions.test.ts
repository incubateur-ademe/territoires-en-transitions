import { supabase } from '../../lib/supabase.ts';
import {
  assertEquals,
  assertExists,
  assertGreaterOrEqual,
  assertLessOrEqual,
} from 'https://deno.land/std@0.206.0/assert/mod.ts';
import { Database } from '../../lib/database.types.ts';
import { signIn, signOut } from '../../lib/auth.ts';
import { testReset } from '../../lib/rpcs/testReset.ts';

await new Promise((r) => setTimeout(r, 0));

type Pilote = Database['public']['Tables']['personne_tag']['Row'] & {
  personne?: Database['public']['CompositeTypes']['personne'];
};
type Service = Database['public']['Tables']['service_tag']['Row'];
type Thematique = Database['public']['Tables']['thematique']['Row'];
type Axe = Database['public']['Tables']['axe']['Row'];
type IndicateurPredefini =
  Database['public']['Tables']['indicateur_definition']['Row'];

type IndicateurDefinition =
  Database['public']['Views']['indicateur_definitions']['Row'] & {
    pilotes?: Pilote[];
    services?: Service[];
    thematiques?: Thematique[];
    axes?: Axe[];
    enfants?: IndicateurPredefini[];
    definition_referentiel?: IndicateurPredefini;
  };

Deno.test(
  'Indicateurs prédéfinis par programme et thématique md_id',
  async () => {
    await testReset();
    await signIn('yolododo');

    const query = supabase
      .from('indicateur_definitions')
      .select(
        'id:indicateur_id, nom, definition_referentiel!inner(), thematiques!inner(nom)'
      )
      .contains('definition_referentiel.programmes', ['cae'])
      .eq('thematiques.md_id', 'energie_et_climat')
      .eq('collectivite_id', 1)
      // filtre les indicateurs sydev
      .not('indicateur_id', 'like', 's_%');

    const { data } = await query.returns<IndicateurDefinition[]>();
    assertExists(data);
    assertGreaterOrEqual(data.length, 30);
    assertLessOrEqual(data.length, 40);
    assertExists(data[0].thematiques?.[0].nom);

    await signOut();
  }
);

Deno.test('Thématiques associées à un indicateur personnalisé', async () => {
  await testReset();
  await signIn('yolododo');

  await supabase.from('indicateur_personnalise_thematique').upsert([
    { indicateur_id: 0, thematique_id: 1 },
    { indicateur_id: 0, thematique_id: 2 },
  ]);

  const { data } = await supabase
    .from('indicateur_definitions')
    .select('nom, thematiques!inner(id,nom)')
    .eq('indicateur_perso_id', 0)
    .eq('collectivite_id', 1)
    .returns<IndicateurDefinition[]>();

  assertExists(data);
  assertEquals(data.length, 1);
  assertEquals(data[0].thematiques?.length, 2);
  assertExists(data[0].thematiques?.[0].nom);
  assertExists(data[0].thematiques?.[1].nom);

  await signOut();
});

Deno.test("Propriétés supplémentaires d'un indicateur prédéfini", async () => {
  await testReset();
  await signIn('yolododo');

  const query = supabase
    .from('indicateur_definitions')
    .select('*, definition_referentiel(titre_long,participation_score)')
    .eq('collectivite_id', 1)
    .eq('indicateur_id', 'cae_18');

  const { data } = await query.returns<IndicateurDefinition[]>();
  assertExists(data);
  assertEquals(data.length, 1);
  assertExists(data[0].definition_referentiel?.titre_long);
  assertExists(data[0].definition_referentiel?.participation_score);

  await signOut();
});

Deno.test(
  "Propagation des propriétés supplémentaires d'un indicateur prédéfini",
  async () => {
    await testReset();
    await signIn('yolododo');

    const query = supabase
      .from('indicateur_definitions')
      .select('*, ...definition_referentiel(titre_long,participation_score)')
      .eq('collectivite_id', 1)
      .eq('indicateur_id', 'cae_18');

    const { data } = await query.returns<
      Array<IndicateurDefinition & IndicateurPredefini>
    >();
    assertExists(data);
    assertEquals(data.length, 1);
    assertExists(data[0].titre_long);
    assertExists(data[0].participation_score);

    await signOut();
  }
);

Deno.test("Propriétés supplémentaires d'un indicateur prédéfini", async () => {
  await signIn('yolododo');

  const query = supabase
    .from('indicateur_definitions')
    .select('*, definition_referentiel(titre_long,participation_score)')
    .eq('collectivite_id', 1)
    .eq('indicateur_id', 'cae_18');

  const { data } = await query.returns<IndicateurDefinition[]>();
  assertExists(data);
  assertEquals(data.length, 1);
  assertExists(data[0].definition_referentiel?.titre_long);
  assertExists(data[0].definition_referentiel?.participation_score);

  await signOut();
});

Deno.test(
  "Propagation des propriétés supplémentaires d'un indicateur prédéfini",
  async () => {
    await signIn('yolododo');

    const query = supabase
      .from('indicateur_definitions')
      .select('*, ...definition_referentiel(titre_long,participation_score)')
      .eq('collectivite_id', 1)
      .eq('indicateur_id', 'cae_18');

    const { data } = await query.returns<
      Array<IndicateurDefinition & IndicateurPredefini>
    >();
    assertExists(data);
    assertEquals(data.length, 1);
    assertExists(data[0].titre_long);
    assertExists(data[0].participation_score);

    await signOut();
  }
);

Deno.test('Un indicateur prédéfini et ses enfants', async () => {
  await testReset();
  await signIn('yolododo');

  const query = supabase
    .from('indicateur_definitions')
    .select('id:indicateur_id, nom, enfants(indicateur_id)')
    .eq('indicateur_id', 'cae_1.a')
    .eq('collectivite_id', 1);

  const { data } = await query.returns<IndicateurDefinition[]>();
  assertExists(data);
  assertEquals(data[0].enfants?.length, 9);

  await signOut();
});

Deno.test('Personnes pilotes pour les indicateur prédéfinis.', async () => {
  await testReset();
  await signIn('yolododo');

  await supabase
    .from('indicateur_pilote')
    .upsert({
      collectivite_id: 1,
      indicateur_id: 'cae_8',
      user_id: '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561',
    })
    .select();

  const { data } = await supabase
    .from('indicateur_definitions')
    // Ajoute la relation pilotes
    .select('*, pilotes!inner(personne)')
    .eq('collectivite_id', 1)
    .eq('indicateur_id', 'cae_8')
    .returns<IndicateurDefinition[]>();
  assertExists(data);
  const pilotes = data[0].pilotes;
  assertExists(pilotes);
  assertEquals(pilotes[0]?.personne?.nom, 'Yala Dada');

  await signOut();
});

Deno.test('Personnes pilotes pour les indicateurs personnalisés.', async () => {
  await testReset();
  await signIn('yolododo');

  const upsert = await supabase
    .from('indicateur_pilote')
    .upsert({
      indicateur_perso_id: 0,
      user_id: '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561',
    })
    .select()
    .returns<IndicateurDefinition[]>();
  assertEquals(upsert.status, 201);

  const { data } = await supabase
    .from('indicateur_definitions')
    .select('*, pilotes(personne)')
    .eq('collectivite_id', 1)
    .eq('indicateur_perso_id', 0)
    .returns<IndicateurDefinition[]>();
  assertExists(data);
  const pilotes = data[0].pilotes;
  assertExists(pilotes);
  assertEquals(pilotes[0]?.personne?.nom, 'Yala Dada');

  await signOut();
});

Deno.test('Services pilotes pour les indicateurs prédéfinis.', async () => {
  await testReset();
  await signIn('yolododo');

  const upsert = await supabase
    .from('indicateur_service_tag')
    .upsert({
      collectivite_id: 1,
      indicateur_id: 'cae_8',
      service_tag_id: 1,
    })
    .select()
    .returns<IndicateurDefinition[]>();
  assertEquals(upsert.status, 201);

  const { data } = await supabase
    .from('indicateur_definitions')
    .select('*, services(...service_tag(nom))')
    .eq('collectivite_id', 1)
    .eq('indicateur_id', 'cae_8')
    .returns<IndicateurDefinition[]>();
  assertExists(data);
  const services = data[0].services;
  assertExists(services);
  assertEquals(services[0]?.nom, 'Super service');

  await signOut();
});

Deno.test('Services pilotes pour les indicateurs personnalisés.', async () => {
  await testReset();
  await signIn('yolododo');

  const upsert = await supabase.from('indicateur_service_tag').upsert({
    indicateur_perso_id: 0,
    service_tag_id: 2,
  });
  assertEquals(upsert.status, 201);

  const { data } = await supabase
    .from('indicateur_definitions')
    .select('*, services(...service_tag(nom))')
    .eq('collectivite_id', 1)
    .eq('indicateur_perso_id', 0)
    .returns<IndicateurDefinition[]>();
  assertExists(data);
  const services = data[0].services;
  assertExists(services);
  assertEquals(services[0]?.nom, 'Ultra service');

  await signOut();
});

const indicateursParPlan = (planId: number) =>
  supabase
    .from('indicateur_definitions')
    .select('indicateur_id, axes!inner()')
    .eq('collectivite_id', 1)
    .eq('axes.plan', planId)
    .returns<{ indicateur_id: string }[]>();

const indicateursParFichesNonClassees = () =>
  supabase
    .from('indicateur_definitions')
    .select('indicateur_id, fiches_non_classees!inner(fiche_id)')
    .eq('collectivite_id', 1)
    .returns<
      { indicateur_id: string; fiches_non_classees: { fiche_id: number }[] }[]
    >();

Deno.test("Indicateurs attachés à un plan d'action", async () => {
  await testReset();
  await signIn('yolododo');

  // aucun indicateurs liés au plan #1
  const { data: data1 } = await indicateursParPlan(1);
  assertEquals(data1?.length, 0);

  // ni aux fiches non classées
  const { data: fichesNonClassees } = await indicateursParFichesNonClassees();
  assertEquals(fichesNonClassees?.length, 0);

  // insère une relation entre l'indicateur 'cae_7' et la fiche 6 (du plan 1)
  const upsert = await supabase.from('fiche_action_indicateur').insert({
    indicateur_personnalise_id: null,
    indicateur_id: 'cae_7',
    fiche_id: 6,
  });
  assertEquals(upsert.status, 201);

  // 1 indicateur lié au plan #1
  const { data: data2 } = await indicateursParPlan(1);
  assertEquals(data2?.length, 1);
  assertEquals(data2?.[0].indicateur_id, 'cae_7');

  // et toujours aucun aux fiches non classées
  const { data: fichesNonClassees2 } = await indicateursParFichesNonClassees();
  assertEquals(fichesNonClassees2?.length, 0);

  await signOut();
});

Deno.test('Indicateurs attachés à une fiche action "non classée"', async () => {
  await testReset();
  await signIn('yolododo');

  // aucun indicateurs aux fiches non classées
  const { data: fichesNonClassees } = await indicateursParFichesNonClassees();
  assertEquals(fichesNonClassees?.length, 0);

  // insère une relation entre l'indicateur 'cae_7' et la fiche 13 (non classée)
  const upsert = await supabase.from('fiche_action_indicateur').insert({
    indicateur_personnalise_id: null,
    indicateur_id: 'cae_7',
    fiche_id: 13,
  });
  assertEquals(upsert.status, 201);

  // insère une relation entre l'indicateur 'cae_7' et la fiche 6 (du plan 1)
  const upsert2 = await supabase.from('fiche_action_indicateur').insert({
    indicateur_personnalise_id: null,
    indicateur_id: 'cae_7',
    fiche_id: 6,
  });
  assertEquals(upsert2.status, 201);

  // 1 indicateur lié aux fiches non classées
  const { data: data2 } = await indicateursParFichesNonClassees();
  assertEquals(data2?.length, 1);
  assertEquals(data2?.[0].indicateur_id, 'cae_7');
  assertEquals(data2?.[0].fiches_non_classees?.[0]?.fiche_id, 13);

  await signOut();
});
