import {useQuery} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {TableOptions} from 'react-table';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {useReferentiel} from '../../../ReferentielTable/useReferentiel';
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
 */

const fetchRows = async (
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

export type UseTableData = (referentiel: string) => TableData;

export type TableData = {
  /** données à passer à useTable */
  table: Pick<
    TableOptions<ProgressionRow>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  /** Indique que le chargement des données est en cours */
  isLoading: boolean;
};

/**
 * Memoïze et renvoie les données et paramètres de la table
 * de progression pour un référentiel donné et sans filtres
 */

export const useProgressionReferentiel: UseTableData = (
  referentiel: string
) => {
  const collectiviteId = useCollectiviteId();

  // Chargement des données
  const {data: actionsStatut, isLoading} = useQuery(
    ['progression_referentiel', collectiviteId, referentiel],
    () => fetchRows(collectiviteId, referentiel)
  );

  // Chargement du référentiel
  const {table, isLoading: isLoadingReferentiel} = useReferentiel(
    referentiel,
    collectiviteId,
    actionsStatut
  );

  return {
    table,
    isLoading: isLoading || isLoadingReferentiel,
  };
};
