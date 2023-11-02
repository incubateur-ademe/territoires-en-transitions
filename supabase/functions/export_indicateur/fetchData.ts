import { NonNullableFields, Tables, Views } from '../_shared/typeUtils.ts';
import { TSupabaseClient } from '../_shared/getSupabaseClient.ts';
import { groupBy } from '../_shared/groupBy.ts';
import {
  TIndicateurValeur,
  TIndicateurDefinition,
  TExportArgs,
} from './types.ts';

/**
 * Charge toutes les données nécessaires à l'export
 */
export const fetchData = async (
  supabaseClient: TSupabaseClient,
  args: TExportArgs
) => {
  const { collectivite_id, indicateur_ids } = args;

  const predefinis = indicateur_ids.filter(
    (id) => typeof id === 'string'
  ) as string[];
  const persos = indicateur_ids.filter(
    (id) => typeof id === 'number'
  ) as number[];

  // charge les thématiques
  const thematiqueDefinitions = await fetchThematiques(supabaseClient);

  // charge les définitions des indicateurs prédéfinis
  const definitions = await fetchDefinitionIndicateurs(
    supabaseClient,
    predefinis,
    thematiqueDefinitions
  );

  // détermine les id des sous-indicateurs car le cas d'indicateurs composés il
  // faut aussi charger leurs données
  const predefinisEtEnfants = predefinis.flatMap((id) => [
    id,
    ...(definitions?.find((d) => d.id === id)?.enfants?.map((e) => e.id) || []),
  ]);

  return {
    valeurs: await fetchValeursIndicateurs({
      supabaseClient,
      collectivite_id,
      indicateur_ids: predefinisEtEnfants,
      col: 'indicateur_id',
    }),
    valeursPersos: await fetchValeursIndicateurs({
      supabaseClient,
      collectivite_id,
      indicateur_ids: persos,
      col: 'indicateur_perso_id',
    }),
    definitions,
    definitionsPersos: await fetchDefinitionIndicateursPersos(
      supabaseClient,
      persos
    ),
  };
};

export type TExportData = Awaited<ReturnType<typeof fetchData>>;

/**
 * Charge les libellsés des thématiques
 */
const fetchThematiques = async (supabaseClient: TSupabaseClient) => {
  const { data, error } = await supabaseClient.from('thematique').select('*');

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Charge les définitions des indicateurs
 */
const fetchDefinitionIndicateurs = async (
  supabaseClient: TSupabaseClient,
  indicateur_ids: string[],
  thematiqueDefinitions: Tables<'thematique'>[] | undefined
) => {
  const { data, error } = await supabaseClient
    .from('indicateur_definition')
    .select('*')
    .or(
      `id.in.(${indicateur_ids.join(',')}),parent.in.(${indicateur_ids.join(
        ','
      )})`
    );

  if (error) {
    throw new Error(error.message);
  }

  return (
    data
      // enrichie la définition avec...
      .map((definition, _index, tous) => {
        const { id, thematiques } = definition;

        // - les liens sur les définitions enfants
        const enfants = tous
          ?.filter((d) => d.parent === id)
          .sort((a, b) => a.id.localeCompare(b.id));

        // - les libellés des thématiques
        const thematiqueNoms = thematiques
          ?.map(
            (tid) => thematiqueDefinitions?.find((t) => t.md_id === tid)?.nom
          )
          .filter(Boolean);

        return { ...definition, enfants, thematiqueNoms };
      }) as TIndicateurDefinition[]
  );
};

// type d'une définition (chargée depuis la vue `indicateur_definitions`)
type TIndicateurDef<Id extends 'indicateur_id' | 'indicateur_perso_id'> =
  NonNullableFields<
    Pick<Views<'indicateur_definitions'>, 'nom' | 'description' | 'unite'>
  > & {
    id: NonNullable<Views<'indicateur_definitions'>[Id]>;
    thematiques: Tables<'thematique'>[];
  };

const fetchDefinitionIndicateursPersos = async (
  supabaseClient: TSupabaseClient,
  indicateur_ids: number[]
) => {
  const { data, error } = await supabaseClient
    .from('indicateur_definitions')
    .select('id:indicateur_perso_id,nom,description,unite,thematiques')
    .in('indicateur_perso_id', indicateur_ids)
    .order('nom', { ascending: true })
    .returns<TIndicateurDef<'indicateur_perso_id'>[]>();

  if (error) {
    throw new Error(error.message);
  }

  return data;
};

/**
 * Charge les données des indicateurs
 */
const fetchValeursIndicateurs = async ({
  supabaseClient,
  collectivite_id,
  indicateur_ids,
  col,
}: {
  supabaseClient: TSupabaseClient;
  collectivite_id: number;
  indicateur_ids: string[] | number[];
  col: 'indicateur_id' | 'indicateur_perso_id';
}) => {
  if (!indicateur_ids?.length) return null;

  const { error, data } = await supabaseClient
    .from('indicateurs')
    .select(`id: ${col},type,annee,valeur`)
    .eq('collectivite_id', collectivite_id)
    .in(col, indicateur_ids)
    .not('valeur', 'is', null)
    .order('annee', { ascending: false })
    .returns<TIndicateurValeur[]>();

  if (error) {
    throw new Error(error.message);
  }

  if (!data?.length) {
    return null;
  }

  const rows = col === 'indicateur_id' ? filtreImportOuResultat(data) : data;

  return Object.fromEntries(
    Object.entries(groupBy(rows, 'id')).map(([id, valeurs]) => [
      id,
      transformValeursIndicateurs(valeurs),
    ])
  );
};

// filtre une liste de valeurs pour ne conserver que la valeur "resultat" quand
// il y a aussi une valeur "import" pour la même date
const filtreImportOuResultat = (valeurs: TIndicateurValeur[]) => {
  return valeurs.filter(
    (v) =>
      v.type !== 'import' ||
      valeurs.findIndex(
        (vv) => vv.annee === v.annee && vv.type === 'resultat'
      ) === -1
  );
};

// agrège les données d'un indicateur par année
const transformValeursIndicateurs = (valeurs: TIndicateurValeur[]) => {
  // regroupe les valeurs par année
  const parAnnee = groupBy(valeurs, 'annee');

  // puis transforme chaque sous-ensemble en un seul item
  return (
    Object.values(parAnnee)
      .map((valeursAnnee) => ({
        id: valeursAnnee[0].id,
        annee: valeursAnnee[0].annee,
        objectif: valeursAnnee.find((v) => v.type === 'objectif')?.valeur,
        resultat: valeursAnnee.find((v) => v.type !== 'objectif')?.valeur,
      }))
      // et tri les lignes résultantes par année (décroissante)
      .sort((a, b) => b.annee - a.annee)
  );
};
