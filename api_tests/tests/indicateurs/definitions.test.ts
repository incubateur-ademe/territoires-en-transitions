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
type IndicateurPredefini =
  Database['public']['Tables']['indicateur_definition']['Row'];

type IndicateurDefinition =
  Database['public']['Views']['indicateur_definitions']['Row'] & {
    pilote?: Pilote[];
    service?: Service[];
    thematique?: Thematique[];
    enfants?: IndicateurPredefini[];
    definition_referentiel?: IndicateurPredefini;
  };

Deno.test(
  'Indicateurs prédéfinis par programme et thématique md_id',
  async () => {
    await signIn('yolododo');

    const query = supabase
      .from('indicateur_definitions')
      .select(
        'id:indicateur_id, nom, definition_referentiel!inner(), thematique!inner(nom)'
      )
      .contains('definition_referentiel.programmes', ['cae'])
      .eq('thematique.md_id', 'energie_et_climat')
      .eq('collectivite_id', 1);

    const { data } = await query.returns<IndicateurDefinition[]>();
    assertExists(data);
    assertGreaterOrEqual(data.length, 30);
    assertLessOrEqual(data.length, 40);
    assertExists(data[0].thematique?.[0].nom);

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
  await signIn('yolododo');

  const query = supabase
    .from('indicateur_definitions')
    .select('id:indicateur_id, nom, enfants(id)')
    .eq('indicateur_id', 'cae_1.a')
    .eq('collectivite_id', 1);

  const { data } = await query.returns<IndicateurDefinition[]>();
  assertExists(data);
  assertEquals(data[0].enfants?.length, 9);

  await signOut();
});

Deno.test('Personne pilotes pour les indicateur prédéfinis.', async () => {
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
    .select('*, pilote!inner(personne)')
    .eq('collectivite_id', 1)
    .eq('indicateur_id', 'cae_8')
    .returns<IndicateurDefinition[]>();
  assertExists(data);
  const pilotes = data[0].pilote;
  assertExists(pilotes);
  assertEquals(pilotes[0]?.personne?.nom, 'Yala Dada');

  await signOut();
});

Deno.test('Personne pilotes pour les indicateurs personnalisés.', async () => {
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
    .select('*, pilote(personne)')
    .eq('collectivite_id', 1)
    .eq('indicateur_perso_id', 0)
    .returns<IndicateurDefinition[]>();
  assertExists(data);
  const pilotes = data[0].pilote;
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
    .select('*, service(...service_tag(nom))')
    .eq('collectivite_id', 1)
    .eq('indicateur_id', 'cae_8')
    .returns<IndicateurDefinition[]>();
  assertExists(data);
  const services = data[0].service;
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
    .select('*, service(...service_tag(nom))')
    .eq('collectivite_id', 1)
    .eq('indicateur_perso_id', 0)
    .returns<IndicateurDefinition[]>();
  assertExists(data);
  const services = data[0].service;
  assertExists(services);
  assertEquals(services[0]?.nom, 'Ultra service');

  await signOut();
});
