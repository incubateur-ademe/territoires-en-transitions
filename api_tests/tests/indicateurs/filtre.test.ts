import {supabase} from '../../lib/supabase.ts';
import {assertExists} from 'https://deno.land/std@0.196.0/assert/assert_exists.ts';
import {Database} from '../../lib/database.types.ts';
import {signIn, signOut} from '../../lib/auth.ts';
import {assertEquals} from 'https://deno.land/std@0.198.0/assert/assert_equals.ts';
import {equal} from 'https://deno.land/std@0.198.0/assert/equal.ts';

await new Promise(r => setTimeout(r, 0));

type Indicateur = Database['public']['Views']['indicateur_definitions']['Row'];
type Pilote = Database['public']['Tables']['personne_tag']['Row'];
type Service = Database['public']['Tables']['service_tag']['Row'];
type Thematique = Database['public']['Tables']['thematique']['Row'];

type IndicateurDetail = Indicateur & {
  pilotes: Pilote[];
  services: Service[];
  thematiques: Thematique[];
};

// Le filtre à passer au fetch.
type Filter = {
  collectivite_id: number;
  thematique_ids?: number[];
  plan_ids?: number[];
  pilote_user_ids?: string[];
  pilote_tag_ids?: number[];
  service_ids?: number[];
  type?: Database['public']['Enums']['indicateur_referentiel_type'];
  participation_score?: boolean;
  rempli?: boolean;
  indicateur_id?: string;
};

// Associe les parties requises aux champs sur lesquels on filtre.
const filterParts: {[key in keyof Filter]?: string} = {
  thematique_ids: 'thematiques!inner(id)',
  plan_ids: 'axes!inner(id)',
  pilote_user_ids: 'pilotes!inner(user_id, tag_id, personne)',
  pilote_tag_ids: 'pilotes!inner(user_id, tag_id, personne)',
  service_ids: 'services!inner(service_tag_id)',
  type: 'definition_referentiel!inner(type, participation_score)',
  participation_score:
    'definition_referentiel!inner(type, participation_score)',
  rempli: 'rempli',
};

/**
 * Récupère les indicateurs et des relations
 *
 * @param {Filter} filter - Le filtre à appliquer
 *
 * @returns {T} - Les indicateurs castés en T.
 */
function fetchIndicateurs<T>(filter: Filter) {
  const parts = new Set<string>();

  let key: keyof Filter;
  for (key in filter) {
    if (filter[key] !== undefined) {
      const part = filterParts[key];
      if (part) parts.add(part);
    }
  }

  let select = supabase
    // Depuis les définitions des indicateurs personnalisés et prédéfinis
    .from('indicateur_definitions')
    .select(
      // on ajoute les `parts` au select
      ['*'].concat([...parts]).join(',')
    )
    // on filtre toujours sur la collectivité
    .eq('collectivite_id', filter.collectivite_id);

  // On ajoute les filtres au select
  filter.thematique_ids?.forEach(id => {
    select = select.eq('thematiques.id', id);
  });

  filter.plan_ids?.forEach(id => {
    select = select.eq('axes.plan', id);
  });

  filter.service_ids?.forEach(id => {
    select = select.eq('services.service_tag_id', id);
  });

  if (filter.indicateur_id) {
    select = select.eq('indicateur_id', filter.indicateur_id);
  } else {
    // filtre les indicateurs sydev
    select.or('indicateur_id.not.like.s_*, indicateur_perso_id.not.is.null');
  }
  if (filter.type) {
    select = select.eq('definition_referentiel.type', filter.type);
  }

  if (filter.participation_score !== undefined) {
    select = select.eq(
      'definition_referentiel.participation_score',
      filter.participation_score
    );
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
      'pilotes.or',
      // que l'on fusionne dans un `or`
      `(${filterParams.join(',')})`
    );
  }

  return select.returns<T>();
}

const expectations: {
  filter: Filter;
  count?: number;
  examples?: any[];
}[] = [
  {
    filter: {
      collectivite_id: 1,
    },
    count: 202, // 201 indicateurs prédéfinis + 1 perso
    examples: [
      {
        collectivite_id: 1,
        indicateur_id: 'cae_1.i',
        indicateur_perso_id: null,
        nom: 'Emissions de gaz à effet de serre - industrie hors branche énergie',
        description: '',
        unite: 'teq CO2',
      },
    ],
  },
  {
    filter: {
      collectivite_id: 1,
      pilote_tag_ids: [1],
    },
    count: 1,
  },
  {
    filter: {
      collectivite_id: 1,
      pilote_user_ids: ['4ecc7d3a-7484-4a1c-8ac8-930cdacd2561'],
    },
    count: 1,
  },
  {
    filter: {
      collectivite_id: 1,
      pilote_tag_ids: [1],
      pilote_user_ids: ['4ecc7d3a-7484-4a1c-8ac8-930cdacd2561'],
    },
    count: 1,
  },
  {
    filter: {
      collectivite_id: 1,
      // pour s'assurer de ne pas dédoublonner les résultats
      pilote_tag_ids: [1],
      pilote_user_ids: ['4ecc7d3a-7484-4a1c-8ac8-930cdacd2561'],
    },
    count: 1,
  },
  {
    filter: {
      collectivite_id: 1,
      plan_ids: [1],
    },
    count: 1,
  },

  {
    filter: {
      collectivite_id: 1,
      service_ids: [1],
    },
    count: 1,
  },
  {
    filter: {
      collectivite_id: 1,
      thematique_ids: [8],
    },
    count: 3, // deux prédéfinis et un perso
  },
];

Deno.test('Filtres multicritère', async () => {
  // await testReset();
  await signIn('yolododo');

  // On upsert les indicateurs pilotes en plusieurs fois, plutôt qu'en une seule,
  // car les cléfs doivent être les mêmes pour envoyer une liste.
  let upsert = await supabase
    .from('indicateur_pilote')
    .upsert({
      collectivite_id: 1,
      indicateur_id: 'eci_24',
      user_id: '4ecc7d3a-7484-4a1c-8ac8-930cdacd2561',
    })
    .select();
  assertEquals(upsert.status, 201);
  upsert = await supabase
    .from('indicateur_pilote')
    .upsert({
      indicateur_id: 'eci_24',
      collectivite_id: 1,
      tag_id: 1,
    })
    .select();
  assertEquals(upsert.status, 201);
  upsert = await supabase
    .from('indicateur_pilote')
    .upsert({
      indicateur_id: 'eci_24',
      collectivite_id: 1,
      tag_id: 1,
    })
    .select();
  assertEquals(upsert.status, 201);
  upsert = await supabase
    .from('indicateur_service_tag')
    .upsert({
      indicateur_id: 'eci_24',
      collectivite_id: 1,
      service_tag_id: 1,
    })
    .select();
  assertEquals(upsert.status, 201);
  upsert = await supabase
    .from('fiche_action_indicateur')
    .upsert({
      indicateur_id: 'eci_24',
      fiche_id: 1,
    })
    .select();
  assertEquals(upsert.status, 201);

  upsert = await supabase
    .from('indicateur_personnalise_thematique')
    .upsert({
      indicateur_id: 0,
      thematique_id: 8,
    })
    .select();
  //assertEquals(upsert.status, 201);

  for (const expectation of expectations.reverse()) {
    const select = await fetchIndicateurs<IndicateurDetail[]>(
      expectation.filter
    );
    assertEquals(
      select.status,
      200,
      `Statut devrait être ok : ${JSON.stringify(select.error, null, 2)}`
    );
    const indicateurs = select.data;

    assertExists(
      indicateurs,
      "Le fetch devrait renvoyer une liste d'indicateurs"
    );

    if (expectation.count) {
      assertEquals(
        indicateurs.length,
        expectation.count,
        `Le fetch devrait renvoyer ${
          expectation.count
        } indicateurs pour le filtre \n ${JSON.stringify(
          expectation.filter,
          null,
          2
        )}`
      );
    }
    if (expectation.examples) {
      expectation.examples.forEach(ex => {
        const match = indicateurs.find(i => equal(i, ex));
        assertExists(
          match,
          `Pas d'indicateur correspondant à l'exemple\n ${JSON.stringify(
            ex,
            null,
            2
          )}`
        );
      });
    }
  }

  await signOut();
});
