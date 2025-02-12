import { DBClient } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCollectiviteId } from '@/app/core-logic/hooks/params';
import {
  ActionReferentiel,
  useReferentiel,
} from '@/app/referentiels/ReferentielTable/useReferentiel';
import { phaseToLabel } from '@/app/referentiels/utils';
import { TActionStatutsRow } from '@/app/types/alias';
import { useQuery } from 'react-query';
import { TableOptions } from 'react-table';

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
    | 'phase'
  >;

/**
 * Récupère les entrées d'un référentiel pour une collectivité donnée
 */

const fetchRows = async (
  supabase: DBClient,
  collectivite_id: number | null
) => {
  const { error, data } = await supabase
    .from('action_statuts')
    .select(
      'action_id,score_realise,score_programme,score_pas_fait,score_non_renseigne,points_realises,points_programmes,points_max_personnalises,phase'
    )
    .match({ collectivite_id })
    .gte('depth', 0);

  if (error) throw new Error(error.message);

  return data as ProgressionRow[];
};

export type UseTableData = () => TableData;

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
 * @deprecated
 */

export const useProgressionReferentiel = () => {
  const collectiviteId = useCollectiviteId();
  const supabase = useSupabase();

  // Chargement des données
  const { data: actionsStatut, isLoading } = useQuery(
    ['progression_referentiel', collectiviteId],
    () => fetchRows(supabase, collectiviteId)
  );

  const caeActionsStatut: ProgressionRow[] | undefined = [];
  const eciActionsStatut: ProgressionRow[] | undefined = [];

  actionsStatut?.forEach((a) => {
    if (a.action_id.split('_')[0] === 'cae') {
      caeActionsStatut.push(a);
    } else if (a.action_id.split('_')[0] === 'eci') {
      eciActionsStatut.push(a);
    }
  });

  // Chargement du référentiel
  const { table: caeTable, isLoading: isLoadingCae } = useReferentiel(
    'cae',
    collectiviteId,
    actionsStatut
  );

  const { table: eciTable, isLoading: isLoadingEci } = useReferentiel(
    'eci',
    collectiviteId,
    actionsStatut
  );

  // Répartition par phase
  const caePhases = { bases: 0, 'mise en œuvre': 0, effets: 0 };
  const eciPhases = { bases: 0, 'mise en œuvre': 0, effets: 0 };

  caeActionsStatut?.forEach((action) => {
    if (action.phase) caePhases[action.phase] += action.points_realises;
  });

  eciActionsStatut?.forEach((action) => {
    if (action.phase) eciPhases[action.phase] += action.points_realises;
  });

  const caeRepartitionPhases = [
    { id: phaseToLabel['bases'], value: caePhases['bases'] },
    { id: phaseToLabel['mise en œuvre'], value: caePhases['mise en œuvre'] },
    { id: phaseToLabel['effets'], value: caePhases['effets'] },
  ];

  const eciRepartitionPhases = [
    { id: phaseToLabel['bases'], value: eciPhases['bases'] },
    { id: phaseToLabel['mise en œuvre'], value: eciPhases['mise en œuvre'] },
    { id: phaseToLabel['effets'], value: eciPhases['effets'] },
  ];

  return {
    caeTable,
    eciTable,
    caeRepartitionPhases,
    eciRepartitionPhases,
    caePotentiel: caeActionsStatut.filter((a) => a.action_id === 'cae')[0]
      ?.points_max_personnalises,
    eciPotentiel: eciActionsStatut.filter((a) => a.action_id === 'eci')[0]
      ?.points_max_personnalises,
    isLoading: isLoading || isLoadingCae || isLoadingEci,
  };
};
