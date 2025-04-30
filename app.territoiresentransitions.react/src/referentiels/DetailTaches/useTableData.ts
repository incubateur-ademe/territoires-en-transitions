import { useSupabase } from '@/api/utils/supabase/use-supabase';
import { useCollectiviteId } from '@/app/collectivites/collectivite-context';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import {
  flatMapActionsEnfants,
  reduceActions,
  StatutAvancement,
  StatutAvancementEnum,
} from '@/domain/referentiels';
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

    // Filtre tous les statuts
    if (statuts.includes('tous')) {
      return true;
    }

    switch (action.actionType) {
      case 'axe':
      case 'sous-axe':
      case 'action':
        // Axe / Sous-axe / Action qui contient
        // une sous-action ou une tâche non concernée
        if (
          statuts.includes('non_concerne') &&
          flatMapActionsEnfants(action).some((a) => a.score.concerne === false)
        ) {
          return true;
        }
        // Axe / Sous-axe / Action qui contient
        // une sous-action ou une tâche non renseignée
        // (si au moins une tâche d'une sous-action est non
        // renseignée, alors la sous-action est non renseignée)
        if (
          statuts.includes('non_renseigne') &&
          flatMapActionsEnfants(action).some(
            (act) =>
              act.actionType === 'sous-action' &&
              act.score.concerne === true &&
              act.score.renseigne === false &&
              act.actionsEnfant.some(
                (a) => a.score.concerne === true && a.score.renseigne === false
              )
          )
        ) {
          return true;
        }
        // Axe / Sous-axe / Action qui contient
        // une sous-action ou une tâche détaillée
        // (une sous-action peut être considérée détaillée si
        // elle est non renseignée mais avec au moins une tâche renseignée)
        if (
          statuts.includes('detaille') &&
          flatMapActionsEnfants(action).some(
            (act) =>
              act.score.avancement === 'detaille' ||
              (act.actionType === 'sous-action' &&
                act.score.concerne === true &&
                act.score.renseigne === false &&
                act.actionsEnfant.some(
                  (a) => a.score.concerne === true && a.score.renseigne === true
                ))
          )
        ) {
          return true;
        }
        // Axe / Sous-axe / Action qui contient une sous-action
        // ou une tâche de statut égal à un des filtres
        // (hors sous-actions / tâches non concernées non renseignées)
        if (
          flatMapActionsEnfants(action).some(
            (a) =>
              a.score.concerne === true &&
              a.score.renseigne === true &&
              a.score.avancement !== 'non_renseigne' &&
              statuts.includes(a.score.avancement ?? '')
          )
        ) {
          return true;
        }
        return false;
      case 'sous-action':
        // Sous-action non concernée, ou contenant une tâche non concernée
        if (
          statuts.includes('non_concerne') &&
          (action.score.concerne === false ||
            action.actionsEnfant.some((a) => a.score.concerne === false))
        ) {
          return true;
        }
        // Sous-action non renseignée, ou contenant une tâche non renseignée
        // (si au moins une tâche d'une sous-action est non
        // renseignée, alors la sous-action est non renseignée)
        if (
          statuts.includes('non_renseigne') &&
          action.score.concerne === true &&
          action.score.renseigne === false
        ) {
          return true;
        }
        // Sous action détaillée
        // - avec statut détaillé
        // - OU avec statut non renseigné, et des tâches renseignées
        // ou sous-action contenant une tâche au statut détaillé
        if (
          statuts.includes('detaille') &&
          (action.score.avancement === 'detaille' ||
            action.actionsEnfant.some(
              (a) => a.score.avancement === 'detaille'
            ) ||
            (action.score.concerne === true &&
              action.score.renseigne === false &&
              action.actionsEnfant.some(
                (a) => a.score.concerne === true && a.score.renseigne === true
              )))
        ) {
          return true;
        }
        // Sous action dont le statut est égal à un des filtres
        // ou contenant une tâche de statut égal à un des filtres
        if (
          action.score.concerne === true &&
          action.score.renseigne === true &&
          action.score.avancement !== 'non_renseigne' &&
          (statuts.includes(action.score.avancement ?? '') ||
            action.actionsEnfant.some((a) =>
              statuts.includes(a.score.avancement ?? '')
            ))
        ) {
          return true;
        }
        return false;
      case 'tache':
        // Tâche non concernée
        if (
          statuts.includes('non_concerne') &&
          action.score.concerne === false
        ) {
          return true;
        }
        if (
          statuts.includes('non_renseigne') &&
          action.score.concerne === true &&
          action.score.renseigne === false
        ) {
          return true;
        }
        // Tâche concernée, de statut égal à un des filtres
        if (
          statuts.includes(action.score.avancement ?? '') &&
          action.score.concerne === true &&
          action.score.renseigne === true
        ) {
          return true;
        }
        return false;
      default:
        return false;
    }
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
      saveActionStatut({
        collectiviteId,
        actionId,
        // TODO: Move this logic to the backend
        avancement:
          avancement === 'non_concerne'
            ? 'non_renseigne'
            : (avancement as StatutAvancement),
        avancementDetaille:
          avancement === 'detaille' ? [0.25, 0.5, 0.25] : undefined,
        concerne: avancement === 'non_concerne' ? false : true,
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
