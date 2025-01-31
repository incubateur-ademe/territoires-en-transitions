import { DBClient } from '@/api';
import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import {
  NEW_useTable,
  useReferentiel,
} from '@/app/referentiels/ReferentielTable/useReferentiel';
import { phaseToLabel } from '@/app/referentiels/utils';
import { reduceActions } from '@/domain/referentiels';
import { useQuery } from 'react-query';
import { TableOptions } from 'react-table';
import { ProgressionRow } from '../DEPRECATED_scores.types';
import {
  ActionDetailed,
  useAction,
  useSnapshotFlagEnabled,
} from '../use-snapshot';

/**
 * Récupère les entrées d'un référentiel pour une collectivité donnée
 */

const DEPRECATED_fetchRows = async (
  supabase: DBClient,
  collectivite_id: number
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
  const FLAG_isSnapshotEnabled = useSnapshotFlagEnabled();

  // Chargement des données
  const { data: DEPRECATED_actionsStatut, isLoading } = useQuery(
    ['progression_referentiel', collectiviteId],
    () => DEPRECATED_fetchRows(supabase, collectiviteId)
  );

  // Chargement du référentiel
  const { table: DEPRECATED_caeTable, isLoading: DEPRECATED_isLoadingCae } =
    useReferentiel('cae', collectiviteId, DEPRECATED_actionsStatut);

  const { table: DEPRECTAED_eciTable, isLoading: DEPRECATED_isLoadingEci } =
    useReferentiel('eci', collectiviteId, DEPRECATED_actionsStatut);

  const NEW_caeResult = useAction('cae');
  const NEW_eciResult = useAction('eci');

  const { table: NEW_caeTable, isLoading: NEW_isLoadingCaeTable } =
    NEW_useTable({
      referentielId: 'cae',
    });
  const { table: NEW_eciTable, isLoading: NEW_isLoadingEciTable } =
    NEW_useTable({
      referentielId: 'eci',
    });

  // Répartition par phase
  const caePhases = { bases: 0, 'mise en œuvre': 0, effets: 0 };
  const eciPhases = { bases: 0, 'mise en œuvre': 0, effets: 0 };

  if (FLAG_isSnapshotEnabled) {
    const { data: cae, isLoading: isLoadingCae } = NEW_caeResult;
    const { data: eci, isLoading: isLoadingEci } = NEW_eciResult;

    const groupPointsParCategorie = (
      pointsParCategorie: typeof caePhases,
      action: ActionDetailed
    ) => {
      if (!action.categorie) {
        return pointsParCategorie;
      }

      return {
        ...pointsParCategorie,
        [action.categorie]:
          pointsParCategorie[action.categorie] + action.score.pointFait,
      };
    };

    const caePointsParCategorie = reduceActions(
      cae ? [cae] : [],
      caePhases,
      groupPointsParCategorie
    );

    const eciPointsParCategorie = reduceActions(
      eci ? [eci] : [],
      eciPhases,
      groupPointsParCategorie
    );

    const caeRepartitionPhases = [
      { id: phaseToLabel['bases'], value: caePointsParCategorie['bases'] },
      {
        id: phaseToLabel['mise en œuvre'],
        value: caePointsParCategorie['mise en œuvre'],
      },
      { id: phaseToLabel['effets'], value: caePointsParCategorie['effets'] },
    ];

    const eciRepartitionPhases = [
      { id: phaseToLabel['bases'], value: eciPointsParCategorie['bases'] },
      {
        id: phaseToLabel['mise en œuvre'],
        value: eciPointsParCategorie['mise en œuvre'],
      },
      { id: phaseToLabel['effets'], value: eciPointsParCategorie['effets'] },
    ];

    return {
      caeTable: NEW_caeTable,
      eciTable: NEW_eciTable,
      caeRepartitionPhases,
      eciRepartitionPhases,
      caePotentiel: cae?.score.pointPotentiel,
      eciPotentiel: eci?.score.pointPotentiel,
      isLoading:
        isLoadingCae ||
        isLoadingEci ||
        NEW_isLoadingCaeTable ||
        NEW_isLoadingEciTable,
    };
  }

  const caeActionsStatut: ProgressionRow[] | undefined = [];
  const eciActionsStatut: ProgressionRow[] | undefined = [];

  DEPRECATED_actionsStatut?.forEach((a) => {
    if (a.action_id.split('_')[0] === 'cae') {
      caeActionsStatut.push(a);
    } else if (a.action_id.split('_')[0] === 'eci') {
      eciActionsStatut.push(a);
    }
  });

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
    caeTable: DEPRECATED_caeTable,
    eciTable: DEPRECTAED_eciTable,
    caeRepartitionPhases,
    eciRepartitionPhases,
    caePotentiel: caeActionsStatut.filter((a) => a.action_id === 'cae')[0]
      ?.points_max_personnalises,
    eciPotentiel: eciActionsStatut.filter((a) => a.action_id === 'eci')[0]
      ?.points_max_personnalises,
    isLoading: isLoading || DEPRECATED_isLoadingCae || DEPRECATED_isLoadingEci,
  };
};
