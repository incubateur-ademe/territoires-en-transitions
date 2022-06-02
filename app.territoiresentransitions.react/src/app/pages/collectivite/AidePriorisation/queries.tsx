import {supabaseClient} from 'core-logic/api/supabase';
import {IActionStatutsRead} from 'generated/dataLayer/action_statuts_read';
import {ActionReferentiel} from '../ReferentielTable/useReferentiel';

// un sous-ensemble des champs pour alimenter notre table
export type PriorisationRow = ActionReferentiel &
  Pick<
    IActionStatutsRead,
    | 'action_id'
    | 'phase'
    | 'score_realise'
    | 'score_programme'
    | 'points_restants'
  >;

export const getMaxDepth = (referentiel: string | null) =>
  referentiel === 'cae' ? 4 : 3;

// toutes les entrées d'un référentiel pour une collectivité et des filtres donnés
export const fetchRows = async (
  collectivite_id: number | null,
  referentiel: string | null,
  filters: string[]
) => {
  const maxDepth = getMaxDepth(referentiel);

  // la requête
  const query = supabaseClient
    .from<IActionStatutsRead>('action_statuts')
    .select('action_id,phase,score_realise,score_programme,points_restants')
    .match({collectivite_id, referentiel})
    .gt('depth', 0)
    .lte('depth', maxDepth);

  // applique les filtres

  // attends les données
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = data as PriorisationRow[];

  // décompte les tâches uniquement
  const count = rows.reduce(
    (sum, {have_children}) => (have_children ? sum : sum + 1),
    0
  );
  return {rows, count};
};

export const fetch = async (
  collectivite_id: number | null,
  referentiel: string | null,
  filters: string[]
) => {
  const maxDepth = referentiel === 'cae' ? 4 : 3;

  // la requête
  const query = supabaseClient
    .from<IActionStatutsRead>('action_statuts')
    .select('action_id,phase,score_realise,score_programme,points_restants')
    .match({collectivite_id, referentiel})
    .gt('depth', 0)
    .lte('depth', maxDepth);

  // applique les filtres

  // attends les données
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = data as PriorisationRow[];

  // décompte les tâches uniquement
  const count = rows.reduce(
    (sum, {have_children}) => (have_children ? sum : sum + 1),
    0
  );
  return {rows, count};
};
