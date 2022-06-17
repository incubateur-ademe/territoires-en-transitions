import {supabaseClient} from 'core-logic/api/supabase';
import {IActionStatutsRead} from 'generated/dataLayer/action_statuts_read';
import {ActionReferentiel} from 'app/pages/collectivite/ReferentielTable/useReferentiel';
import {boundariesToQueryFilter} from 'ui/shared/boundariesToQueryFilter';
import {filterToBoundaries, TFilters} from './filters';
import {percentBoundaries} from 'app/pages/collectivite/AidePriorisation/FiltrePourcentage';

// un sous-ensemble des champs pour alimenter notre table
export type ProgressionRow = ActionReferentiel &
  Pick<
    IActionStatutsRead,
    | 'action_id'
    | 'score_realise'
    | 'score_programme'
    | 'score_realise_plus_programme'
    | 'score_pas_fait'
    | 'score_non_renseigne'
    | 'points_realises'
    | 'points_programmes'
    | 'points_max_personnalises'
    | 'points_max_referentiel'
  >;

// croise la liste des colonnes affichées avec la liste des filtres
const getActiveFilters = (filters: TFilters, visibleColumns: string[]) => {
  return Object.keys(filters).reduce((acc: string[], filterName: string) => {
    const filter = visibleColumns.includes(filterName)
      ? getPercentFilter(filters, filterName as keyof TFilters)
      : null;
    return filter ? [...acc, filter as string] : acc;
  }, []);
};

export const getMaxDepth = (referentiel: string | null) =>
  referentiel === 'cae' ? 3 : 2;

// toutes les entrées d'un référentiel pour une collectivité et des filtres donnés
export const fetchRows = async (
  collectivite_id: number | null,
  referentiel: string | null,
  filters: TFilters,
  visibleColumns: string[]
) => {
  const maxDepth = getMaxDepth(referentiel);

  // la requête
  const query = supabaseClient
    .from<IActionStatutsRead>('action_statuts')
    .select(['action_id', ...visibleColumns].join(','))
    .match({collectivite_id, referentiel})
    .gte('depth', 0);

  // croise la liste des colonnes affichées avec la liste des filtres
  const activeFilters = getActiveFilters(filters, visibleColumns);

  // applique les filtres
  const and = [`depth.eq.${maxDepth}`, ...activeFilters];
  if (and.length > 1) {
    query.or([`depth.lt.${maxDepth}`, `and(${and.join(',')})`].join(','));
  } else {
    query.lte('depth', maxDepth);
  }

  // attends les données
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = data as ProgressionRow[];

  // décompte les sous-actions uniquement
  const count = rows.reduce(
    (sum, {depth}) => (depth === maxDepth ? sum : sum + 1),
    0
  );
  return {rows, count};
};

const getPercentFilter = (filters: TFilters, column: keyof TFilters) => {
  const qf = boundariesToQueryFilter(
    filterToBoundaries(filters[column], percentBoundaries),
    column
  );

  const or = qf.map(f => 'and(' + f?.map(g => `${g}`).join(',') + ')');
  return or.length ? 'or(' + or.join(',') + ')' : null;
};

//
const headerRowCols = [
  'depth',
  'nom',
  'score_realise',
  'score_programme',
  'score_realise_plus_programme',
  'score_pas_fait',
  'score_non_renseigne',
  'points_realises',
  'points_programmes',
  'points_max_personnalises',
  'points_max_referentiel',
].join(',');

export const fetchHeaderRow = async (
  collectivite_id: number | null,
  referentiel: string | null
) => {
  // la requête
  const query = supabaseClient
    .from<IActionStatutsRead>('action_statuts')
    .select(headerRowCols)
    .match({collectivite_id, referentiel, depth: 0});

  // attends les données
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = data as ProgressionRow[];
  return rows?.[0];
};
