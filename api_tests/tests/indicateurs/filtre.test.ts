import {supabase} from '../../lib/supabase.ts';
import {
  assertExists,
} from 'https://deno.land/std@0.196.0/assert/assert_exists.ts';
import {Database} from '../../lib/database.types.ts';
import {signIn, signOut} from '../../lib/auth.ts';
import {
  assertEquals,
} from 'https://deno.land/std@0.198.0/assert/assert_equals.ts';
import {
  assertNotEquals,
} from 'https://deno.land/std@0.198.0/assert/assert_not_equals.ts';
import {testReset} from '../../lib/rpcs/testReset.ts';

await new Promise((r) => setTimeout(r, 0));

type pilotes = Database['public']['Tables']['personne_tag']['Row'];
type services = Database['public']['Tables']['service_tag']['Row'];
type thematiques = Database['public']['Tables']['thematique']['Row'];

type IndicateurDetail =
  & Database['public']['Views']['indicateur_definitions']['Row']
  & {
  pilotes: pilotes[];
  services: services[];
  thematiques: thematiques[];
};

type Filter = {
  collectivite_id: number,
  thematique_ids?: number[],
  plan_ids?: number[],
  pilote_user_ids?: string[],
  pilote_tag_ids?: number[],
  service_ids?: number[],
  type?: Database['public']['Enums']['indicateur_referentiel_type']
  participation_score?: boolean,
  rempli?: boolean,
}

type Relation = 'thematiques' | 'pilotes';

/**
 * Récupère les indicateurs et des relations
 *
 * @param {Filter} filter - Le filtre à appliquer
 * @param {Relation[] | null} relations -
 * Les relations additionnelles à ajouter aux résultats
 *
 * @returns {T} - Les indicateurs castés en T.
 */
function fetchIndicateurs<T>(filter: Filter, relations: Relation[] | null) {

  let select = supabase
    // Depuis les définitions des indicateurs personnalisés et prédéfinis
    .from('indicateur_definitions').select(
      // on sélectionne la définition
      '*, '
      // et les relations nécessaires au filtrage {relation}!inner({colonne})
      + (filter.thematique_ids ? 'thematique!inner(id), ' : '')
      + (filter.plan_ids ? 'axe!inner(plan), ' : '')
      + ((filter.pilote_user_ids ?? filter.pilote_tag_ids) ?
        'pilote!inner(user_id, tag_id), ' :
        '')
      + (filter.service_ids ? 'service!inner(service_tag_id), ' : '')
      + ((filter.type || filter.participation_score !== undefined) ?
        'definition_referentiel!inner(type, participation_score), ' :
        '')
      + (filter.rempli !== undefined ? 'rempli,' : '')
      // et les relations additionnelles
      + (relations ? relations.join(', ') : ''),
    )
    // on filtre toujours sur la collectivité
    .eq('collectivite_id', filter.collectivite_id);

  // On ajoute les filtres au select
  filter.thematique_ids?.forEach(id => {
    select = select.eq('thematique.id', id);
  });

  filter.plan_ids?.forEach(id => {
    select = select.eq('axe.plan', id);
  });

  filter.service_ids?.forEach(id => {
    select = select.eq('service.service_tag_id', id);
  });

  if (filter.type) {
    select = select.eq('definition_referentiel.type', filter.type);
  }

  if (filter.participation_score !== undefined) {
    select = select.eq('definition_referentiel.participation_score', filter.participation_score);
  }

  if (filter.rempli !== undefined) {
    select = select.eq('rempli', filter.rempli);
  }

  // Si on doit filtrer par pilote
  if (filter.pilote_user_ids || filter.pilote_tag_ids) {
    // alors, on cumule les paramètres
    const filterParams: string[] = [];

    filter.pilote_user_ids?.forEach(user_id => {
      // pour les user_ids
      filterParams.push(`user_id.eq.${user_id}`);
    });

    filter.pilote_tag_ids?.forEach(tag_id => {
      // et les tag_ids
      filterParams.push(`tag_id.eq.${tag_id}`);
    });

    // @ts-ignore: la lib Supabase ne permet pas de filtrer sur une relation
    select.url.searchParams.append(
      'pilote.or',
      // que l'on fusionne dans un `or`
      `(${filterParams.join(',')})`,
    );
  }

  return select.returns<T>();
}

Deno.test('Filtres multicritère', async () => {
  await signIn('yolododo');

  const select = await fetchIndicateurs<IndicateurDetail[]>(
    {
      collectivite_id: 1,
      // pilote_user_ids: ['298235a0-60e7-4ceb-9172-0a991cce0386'],
      // pilote_tag_ids: [1],
      // plan_ids: [1],
      // service_ids: [1],
      // type: 'impact',
      // participation_score: true,
      rempli: true
    },
    ['thematiques', 'pilotes'],
  );
  console.log(select);
  assertEquals(select.status, 200);
  const indicateurs = select.data;
  assertExists(indicateurs,
    'Le filtre devait renvoyer une liste d\'indicateurs');

  await signOut();
});

Deno.test('Filtres sur plusieurs pilotes.', {ignore: true}, async () => {
  await signIn('yolododo');

  const select = await fetchIndicateurs<IndicateurDetail[]>(
    {
      collectivite_id: 1,
      pilote_user_ids: ['298235a0-60e7-4ceb-9172-0a991cce0386'],
      pilote_tag_ids: [1],
    },
    ['thematiques', 'pilotes'],
  );
  assertEquals(select.status, 200);
  const indicateurs = select.data;
  assertExists(indicateurs,
    'Le filtre devait renvoyer une liste d\'indicateurs');
  assertNotEquals(indicateurs.length, 0, 'La liste ne devrait pas être vide');

  await signOut();
});

Deno.test('Filtres sur une thématique.', {ignore: true}, async () => {
  await signIn('yolododo');

  const select = await supabase
    // Depuis les définitions des indicateurs personnalisés et prédéfinis
    .from('indicateur_definitions')
    // on sélectionne 3 items :
    // - la définition '*'
    // - l'id de la thématique sur laquelle filtrer
    // - la liste des thématiques pour les afficher
    .select('*, thematique!inner(id), thematiques')
    // on filtre sur la collectivité
    .eq('collectivite_id', 1)
    // l'id de la thématique
    .eq('thematique.id', 8)
    // un cast
    .returns<IndicateurDetail[]>();
  assertEquals(select.status, 200);
  const indicateurs = select.data;
  assertExists(indicateurs,
    'Le filtre devait renvoyer une liste d\'indicateurs');
  assertNotEquals(indicateurs.length, 0, 'La liste ne devrait pas être vide');

  await signOut();
});

Deno.test('Filtres sur 2 thématiques.', {ignore: true}, async () => {
  await signIn('yolododo');

  const select = await supabase
    // Depuis les définitions des indicateurs personnalisés et prédéfinis
    .from('indicateur_definitions')
    // on sélectionne 3 items :
    // - la définition '*'
    // - l'id de la thématique sur laquelle filtrer
    // - la liste des thématiques pour les afficher
    .select('*, thematique!inner(id), thematiques')
    // on filtre sur la collectivité
    .eq('collectivite_id', 1)
    // les ids des thématiques
    .eq('thematique.id', 8).eq('thematique.id', 5)
    // un cast
    .returns<IndicateurDetail[]>();
  assertEquals(select.status, 200);
  const indicateurs = select.data;
  assertExists(indicateurs,
    'Le filtre devait renvoyer une liste d\'indicateurs');
  assertEquals(indicateurs.length, 0, 'La liste devrait être vide');

  await signOut();
});
Deno.test('Filtre par plan.', {ignore: true}, async () => {
  await testReset();
  await signIn('yolododo');

  const insert = await supabase
    // on associe une fiche à un indicateur
    .from('fiche_action_indicateur')
    // en insérant une relation
    .upsert({
      fiche_id: 1,
      indicateur_id: 'eci_24',
    });
  assertEquals(insert.status, 201);

  const select = await supabase
    // Depuis les définitions des indicateurs personnalisés et prédéfinis
    .from('indicateur_definitions')
    // on sélectionne 3 items :
    // - la définition '*'
    // - l'id du plan sur lequel filtrer
    // - la liste des thématiques pour les afficher
    .select('*, axe!inner(plan), thematiques')
    // on filtre sur la collectivité
    .eq('collectivite_id', 1)
    // l'id du plan
    .eq('axe.plan', 1)
    // un cast
    .returns<IndicateurDetail[]>();
  assertEquals(select.status, 200);
  const indicateurs = select.data;
  assertExists(indicateurs,
    'Le filtre devait renvoyer une liste d\'indicateurs');
  assertEquals(indicateurs.length, 1,
    'La liste devrait comporter un indicateur');
  assertEquals(
    indicateurs[0].indicateur_id,
    'eci_24',
    'L\'indicateur devrait être le même que celui de la relation',
  );

  await signOut();
});
