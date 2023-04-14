import {supabaseClient} from 'core-logic/api/supabase';
import {ActionReferentiel} from 'app/pages/collectivite/ReferentielTable/useReferentiel';
import {TActionStatutsRow} from 'types/alias';

// Sous-ensemble des champs pour alimenter la table
export type ProgressionRow = ActionReferentiel &
  Pick<
    TActionStatutsRow,
    | 'action_id'
    | 'score_realise'
    | 'score_programme'
    | 'score_pas_fait'
    | 'score_non_renseigne'
    | 'points_realises'
    | 'points_programmes'
    | 'points_max_personnalises'
  >;

/**
 * Récupère les entrées d'un référentiel pour une collectivité donnée
 *
 * @param collectivite_id (number | null)
 * @param referentiel (string | null)
 */

export const fetchRows = async (
  collectivite_id: number | null,
  referentiel: string | null
) => {
  const {error, data} = await supabaseClient
    .from('action_statuts')
    .select(
      'action_id,score_realise,score_programme,score_pas_fait,score_non_renseigne,points_realises,points_programmes,points_max_personnalises'
    )
    .match({collectivite_id, referentiel})
    .gt('depth', 0);

  if (error) throw new Error(error.message);

  return data as ProgressionRow[];
};

export type PhasesRow = ActionReferentiel &
  Pick<IActionStatutsRead, 'points_realises' | 'phase'>;

/**
 * Récupère les points faits par phase pour un référentiel donné
 *
 * @param collectivite_id
 * @param referentiel
 */

export const fetchPhases = async (
  collectivite_id: number | null,
  referentiel: string | null
) => {
  const {error, data} = await supabaseClient
    .from('action_statuts')
    .select('points_realises,phase')
    .not('phase', 'is', null)
    .match({collectivite_id, referentiel, concerne: true, desactive: false})
    .gt('depth', 0);

  if (error) throw new Error(error.message);

  return data as PhasesRow[];
};
