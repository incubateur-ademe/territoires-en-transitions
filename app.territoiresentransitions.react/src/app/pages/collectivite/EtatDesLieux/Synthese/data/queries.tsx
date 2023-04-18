import {supabaseClient} from '../../../../../../core-logic/api/supabase';
import {IActionStatutsRead} from '../../../../../../generated/dataLayer/action_statuts_read';
import {ActionReferentiel} from '../../../../../../app/pages/collectivite/ReferentielTable/useReferentiel';

// Sous-ensemble des champs pour alimenter la table
export type ProgressionRow = ActionReferentiel &
  Pick<
    IActionStatutsRead,
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
