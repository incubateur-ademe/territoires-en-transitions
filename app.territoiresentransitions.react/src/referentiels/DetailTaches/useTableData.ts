import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import {
  flatMapActionsEnfants,
  reduceActions,
  StatutAvancement,
  StatutAvancementEnum,
} from '@/domain/referentiels';
import { intersection } from 'es-toolkit';
import { useMutation, useQuery, useQueryClient } from 'react-query';
import { TableOptions } from 'react-table';
import { useSaveActionStatut } from '../actions/action-statut/use-action-statut';
import {
  actionNewToDeprecated,
  ProgressionRow,
} from '../DEPRECATED_scores.types';
import { useReferentielId } from '../referentiel-context';
import {
  NEW_useTable,
  useReferentiel,
} from '../ReferentielTable/useReferentiel';
import { useSnapshotFlagEnabled } from '../use-snapshot';
import { initialFilters, nameToShortNames, TFilters } from './filters';
import {
  fetchActionStatutsList,
  TacheDetail,
  updateTacheStatut,
} from './queries';

export type UseTableData = () => TableData;

export type TableData = {
  /** données à passer à useTable */
  table: Pick<
    TableOptions<TacheDetail>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  /** Indique que le chargement des données est en cours */
  isLoading: boolean;
  /** Indique que le changement de statut est en cours */
  isSaving: boolean;
  /** filtres actifs */
  filters: TFilters;
  /** Nombre de filtres actifs */
  filtersCount: number;
  /** Nombre de lignes après filtrage */
  count: number;
  sousActionsCount: number;
  /** Nombre total de lignes */
  total: number;
  sousActionsTotal: number;
  /** pour remettre à jour les filtres */
  setFilters: (filters: TFilters) => void;
  /** pour changer le statut d'une tâche */
  updateStatut: (action_id: string, value: string) => void;
};

/**
 * Renvoie les données et paramètres de la table
 */
export const useTableData: UseTableData = () => {
  const FLAG_isSnapshotEnabled = useSnapshotFlagEnabled();

  const DEPRECATED_table = DEPRECATED_useTableData();
  const NEW_table = NEW_useTableData();

  if (FLAG_isSnapshotEnabled) {
    return NEW_table;
  }

  return DEPRECATED_table;
};

export const NEW_useTableData: UseTableData = () => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();

  // filtre initial
  const [filters, setFilters, filtersCount] = useSearchParams<TFilters>(
    'detail',
    initialFilters,
    nameToShortNames
  );

  const { table, total, sousActionsTotal, isLoading } = NEW_useTable({
    referentielId,
  });

  const { saveActionStatut, isLoading: isSaving } = useSaveActionStatut();

  const actionMatchingFilter = (
    actionOld: ReturnType<typeof actionNewToDeprecated>
  ) => {
    const action = (actionOld as ReturnType<typeof actionNewToDeprecated>)
      .sourceAction;

    const { statut: statuts } = filters;

    if (statuts.includes('tous')) {
      return true;
    }

    if (statuts.includes('non_renseigne') && !action.score.renseigne) {
      return true;
    }

    if (statuts.includes('detaille')) {
      if (
        action.actionType === 'tache' &&
        action.score.avancement === 'detaille'
      ) {
        return true;
      }

      if (
        action.actionType === 'sous-action' &&
        action.score.avancement === 'non_renseigne' &&
        intersection(
          action.actionsEnfant.map((a) => a.score.avancement),
          ['fait', 'programme', 'pas_fait', 'detaille']
        ).length > 0
      ) {
        return true;
      }

      if (
        ['axe', 'sous-axe', 'action'].includes(action.actionType) &&
        intersection(
          action.actionsEnfant.map((a) => a.score.avancement),
          ['fait', 'programme', 'pas_fait', 'detaille']
        ).length > 0 &&
        intersection(
          action.actionsEnfant.map((a) => a.score.avancement),
          ['non_renseigne']
        ).length > 0
      ) {
        return true;
      }
    }

    // On affiche les sous-actions/tâches avec un statut qui correspond aux filtres
    if (
      ['sous-action', 'tache'].includes(action.actionType) &&
      statuts.includes(action.score.avancement ?? '')
    ) {
      return true;
    }

    // On affiche aussi la sous-action si jamais elle a un statut 'non_renseigné'
    // mais que des tâches ont un statut qui correspond aux filtres
    if (
      action.actionType === 'sous-action' &&
      action.score.avancement === 'non_renseigne' &&
      intersection(
        flatMapActionsEnfants(action).map((a) => a.score.avancement),
        statuts
      ).length > 0
    ) {
      return true;
    }

    // On affiche les axes/sous-axes/actions seulement si elles ont
    // des sous-actions ou tâches renseignées avec un statut qui correspond aux filtres
    if (
      ['axe', 'sous-axe', 'action'].includes(action.actionType) &&
      intersection(
        flatMapActionsEnfants(action).map((a) => a.score.avancement),
        statuts
      ).length > 0
    ) {
      return true;
    }

    return false;
  };

  const getSubRows = (row: any) => {
    const action = (row as ReturnType<typeof actionNewToDeprecated>)
      .sourceAction;

    // On n'affiche pas les tâches si la sous-action a un statut existant autre que 'non_renseigné'
    if (
      action.actionType === 'sous-action' &&
      action.score.avancement &&
      action.score.avancement !== 'non_renseigne'
    ) {
      return [];
    }

    return action.actionsEnfant
      .map(actionNewToDeprecated)
      .map(addPropertyIsExpanded)
      .filter(actionMatchingFilter);
  };

  const [taskCount, sousActionsCount] = reduceActions(
    table.data.map((a) => a.sourceAction),
    [0, 0],
    ([taskCount, sousActionsCount], action) => {
      if (!actionMatchingFilter(actionNewToDeprecated(action))) {
        return [taskCount, sousActionsCount];
      }

      if (action.actionType === 'tache') {
        return [taskCount + 1, sousActionsCount];
      }
      if (action.actionType === 'sous-action') {
        return [taskCount, sousActionsCount + 1];
      }

      return [taskCount, sousActionsCount];
    }
  );

  return {
    table: {
      ...table,
      data: table.data.map(addPropertyIsExpanded).filter(actionMatchingFilter),
      getSubRows,
    },
    filters,
    setFilters,
    filtersCount,
    isLoading: isLoading,
    isSaving,
    count: taskCount,
    sousActionsCount,
    total,
    sousActionsTotal,
    updateStatut: (actionId: string, avancement: string) => {
      console.log('updateStatut', actionId, avancement);
      saveActionStatut({
        collectiviteId,
        actionId,
        avancement: avancement as StatutAvancement,
        avancementDetaille:
          avancement === 'detaille' ? [0.25, 0.5, 0.25] : undefined,
        concerne: true,
      });
    },
  };
};

function addPropertyIsExpanded(
  action: ReturnType<typeof actionNewToDeprecated>
) {
  if (
    action.type === 'sous-action' &&
    (action.avancement === 'non_renseigne' || !action.avancement)
  ) {
    // Les sous-actions "non renseigné" avec des tâches renseignées
    // sont mises à jour avec un statut "détaillé"
    // isExpanded est mis à true
    // Si c'est un "vrai" non renseignée, alors isExpanded est à false
    if (
      action.avancement_descendants?.find(
        (av) => !!av && av !== 'non_renseigne'
      )
    ) {
      return {
        ...action,
        avancement: StatutAvancementEnum.DETAILLE,
        isExpanded: true,
      };
    } else {
      return { ...action, isExpanded: false };
    }
  } else if (action.type === 'sous-action') {
    // Les autres sous-actions ne sont pas dépliées

    return { ...action, isExpanded: false };
  } else if (action.type === 'tache') {
    // Les tâches ne sont pas dépliées
    return { ...action, isExpanded: false };
  } else {
    // Les axes / sous-axes / actions sont dépliés
    return { ...action, isExpanded: true };
  }
}

export const DEPRECATED_useTableData: UseTableData = () => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();
  const queryClient = useQueryClient();
  const supabase = useSupabase();

  // filtre initial
  const [filters, setFilters, filtersCount] = useSearchParams<TFilters>(
    'detail',
    initialFilters,
    nameToShortNames
  );

  // chargement des données en fonction des filtres
  const { data, isLoading } = useQuery(
    ['detail_taches', collectiviteId, referentielId, filters],
    () =>
      fetchActionStatutsList(supabase, collectiviteId, referentielId, filters)
  );
  const { rows: actionsStatut } = data || {};

  const sousActions: string[] = [];
  const sousActionsWithStatut: string[] = [];

  const processedData: TacheDetail[] = (actionsStatut ?? []).map(
    (actionStatut) =>
      processData(actionStatut, sousActions, sousActionsWithStatut)
  );

  const filteredData = filterData(
    processedData,
    sousActions,
    sousActionsWithStatut
  );

  // chargement du référentiel
  const {
    table,
    total,
    sousActionsTotal,
    count,
    sousActionsCount,
    isLoading: isLoadingReferentiel,
  } = useReferentiel(referentielId, collectiviteId, filteredData);

  // met à jour un statut
  const { mutate, isLoading: isSaving } = useMutation(updateTacheStatut);
  const updateStatut = (action_id: string, avancement: string) => {
    if (collectiviteId && !isSaving) {
      mutate(
        {
          dbClient: supabase,
          collectivite_id: collectiviteId,
          action_id,
          avancement,
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries('detail_taches');
          },
        }
      );
    }
  };

  return {
    table,
    filters,
    setFilters,
    filtersCount,
    isLoading: isLoading || isLoadingReferentiel,
    isSaving,
    count,
    sousActionsCount,
    total,
    sousActionsTotal,
    updateStatut,
  };
};

function processData<A extends ProgressionRow>(
  action: A,
  sousActions: string[],
  sousActionsWithStatut: string[]
) {
  if (
    action.type === 'sous-action' &&
    (action.avancement === 'non_renseigne' || !action.avancement)
  ) {
    sousActions.push(action.action_id);
    // Les sous-actions "non renseigné" avec des tâches renseignées
    // sont mises à jour avec un statut "détaillé"
    // isExpanded est mis à true
    // Si c'est un "vrai" non renseignée, alors isExpanded est à false
    if (
      action.avancement_descendants?.find(
        (av) => !!av && av !== 'non_renseigne'
      )
    ) {
      return {
        ...action,
        avancement: StatutAvancementEnum.DETAILLE,
        isExpanded: true,
      };
    } else return { ...action, isExpanded: false };
  } else if (action.type === 'sous-action') {
    // Les autres sous-actions ne sont pas dépliées
    sousActions.push(action.action_id);
    sousActionsWithStatut.push(action.action_id);
    return { ...action, isExpanded: false };
  } else if (action.type === 'tache') {
    // Les tâches ne sont pas dépliées
    // Les axes / sous-axes / actions sont dépliés
    return { ...action, isExpanded: false };
  } else {
    return { ...action, isExpanded: true };
  }
}

function filterData(
  processedData: TacheDetail[] | undefined,
  sousActions: string[],
  sousActionsWithStatut: string[]
) {
  return processedData?.filter(
    (data) =>
      // Affichage des axes / sous-axes / actions dont
      // la sous-action a été récupérée
      (data.type !== 'tache' &&
        data.type !== 'sous-action' &&
        sousActions.filter(
          (ssAc) => ssAc.includes(data.action_id) && ssAc !== data.action_id
        ).length > 0) ||
      // Affichage des sous-actions
      data.type === 'sous-action' ||
      // Affichage des tâches dont la sous-action a été récupérée
      // et n'a pas de statut ou a un statut détaillé (non renseigné en base)
      (data.type === 'tache' &&
        sousActions.includes(
          data.action_id
            .split('.')
            .slice(0, data.action_id.split('.').length - 1)
            .join('.')
        ) &&
        !sousActionsWithStatut.includes(
          data.action_id
            .split('.')
            .slice(0, data.action_id.split('.').length - 1)
            .join('.')
        ))
  );
}
