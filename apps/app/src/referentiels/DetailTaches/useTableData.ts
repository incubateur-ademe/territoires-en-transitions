import { useCollectiviteId } from '@/api/collectivites';
import { useSearchParams } from '@/app/core-logic/hooks/query';
import {
  flatMapActionsEnfants,
  reduceActions,
  StatutAvancement,
  StatutAvancementEnum,
} from '@/domain/referentiels';
import { TableOptions } from 'react-table';
import { useSaveActionStatut } from '../actions/action-statut/use-action-statut';
import { actionNewToDeprecated } from '../DEPRECATED_scores.types';
import { useReferentielId } from '../referentiel-context';
import { useTable } from '../ReferentielTable/useReferentiel';
import { initialFilters, nameToShortNames, TFilters } from './filters';
import { TacheDetail } from './queries';

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
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();

  // filtre initial
  const [filters, setFilters, filtersCount] = useSearchParams<TFilters>(
    'detail',
    initialFilters,
    nameToShortNames
  );

  const { table, total, sousActionsTotal, isLoading } = useTable({
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
      case 'action': {
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
        // Check for non-renseigné sous-actions
        if (statuts.includes(StatutAvancementEnum.NON_RENSEIGNE)) {
          const hasNonRenseigneSousAction = flatMapActionsEnfants(action).some(
            (act) => {
              const isSousAction = act.actionType === 'sous-action';
              const isConcerned = act.score.concerne === true;
              const isNotRenseigne = act.score.renseigne === false;
              const hasNoChildren = act.actionsEnfant.length === 0;
              const hasNonRenseigneChild = act.actionsEnfant.some(
                (a) => a.score.concerne === true && a.score.renseigne === false
              );

              return isSousAction && isConcerned && isNotRenseigne &&
                (hasNoChildren || hasNonRenseigneChild);
            }
          );

          if (hasNonRenseigneSousAction) {
            return true;
          }
        }
        // Axe / Sous-axe / Action qui contient
        // une sous-action ou une tâche détaillée
        // (une sous-action peut être considérée détaillée si
        // elle est non renseignée mais avec au moins une tâche renseignée)
        // Check for détaillé actions
        if (statuts.includes(StatutAvancementEnum.DETAILLE)) {
          const hasDetailleAction = flatMapActionsEnfants(action).some(
            (act) => {
              const isDetaille = act.score.avancement === StatutAvancementEnum.DETAILLE;
              const isSousAction = act.actionType === 'sous-action';
              const isConcerned = act.score.concerne === true;
              const isNotRenseigne = act.score.renseigne === false;
              const hasRenseigneChild = act.actionsEnfant.some(
                (a) => a.score.concerne === true && a.score.renseigne === true
              );

              return isDetaille || (isSousAction && isConcerned && isNotRenseigne && hasRenseigneChild);
            }
          );

          if (hasDetailleAction) {
            return true;
          }
        }
        // Axe / Sous-axe / Action qui contient une sous-action
        // ou une tâche de statut égal à un des filtres
        // (hors sous-actions / tâches non concernées non renseignées)
        if (
          flatMapActionsEnfants(action).some(
            (a) =>
              a.score.concerne === true &&
              a.score.renseigne === true &&
              a.score.avancement !== StatutAvancementEnum.NON_RENSEIGNE &&
              statuts.includes(a.score.avancement ?? '')
          )
        ) {
          return true;
        }
        return false;
      }
      case 'sous-action': {
        // Sous-action non concernée, ou contenant une tâche non concernée
        if (
          statuts.includes(StatutAvancementEnum.NON_CONCERNE) &&
          (action.score.concerne === false ||
            action.actionsEnfant.some((a) => a.score.concerne === false))
        ) {
          return true;
        }
        // Sous-action non renseignée, ou contenant une tâche non renseignée
        // (si au moins une tâche d'une sous-action est non
        // renseignée, alors la sous-action est non renseignée)
        if (
          statuts.includes(StatutAvancementEnum.NON_RENSEIGNE) &&
          action.score.concerne === true &&
          action.score.renseigne === false
        ) {
          return true;
        }
        // Sous action détaillée
        // - avec statut détaillé
        // - OU avec statut non renseigné, et des tâches renseignées
        // ou sous-action contenant une tâche au statut détaillé
        // Check for détaillé sous-action
        if (statuts.includes(StatutAvancementEnum.DETAILLE)) {
          const isDetaille = action.score.avancement === StatutAvancementEnum.DETAILLE;
          const hasDetailleChild = action.actionsEnfant.some(
            (a) => a.score.avancement === StatutAvancementEnum.DETAILLE
          );
          const isConcerned = action.score.concerne === true;
          const isNotRenseigne = action.score.renseigne === false;
          const hasRenseigneChild = action.actionsEnfant.some(
            (a) => a.score.concerne === true && a.score.renseigne === true
          );

          const isDetailleSousAction = isDetaille || hasDetailleChild ||
            (isConcerned && isNotRenseigne && hasRenseigneChild);

          if (isDetailleSousAction) {
            return true;
          }
        }
        // Sous action dont le statut est égal à un des filtres
        // ou contenant une tâche de statut égal à un des filtres
        // Check for sous-action with matching status
        const isConcerned = action.score.concerne === true;
        const isRenseigne = action.score.renseigne === true;
        const isNotNonRenseigne = action.score.avancement !== StatutAvancementEnum.NON_RENSEIGNE;
        const hasAvancement = !!action.score.avancement;
        const avancementMatches = hasAvancement && statuts.includes(action.score.avancement ?? '');
        const hasMatchingChild = !hasAvancement && action.actionsEnfant.some((a) =>
          statuts.includes(a.score.avancement ?? '')
        );

        if (isConcerned && isRenseigne && isNotNonRenseigne && (avancementMatches || hasMatchingChild)) {
          return true;
        }
        return false;
      }
      case 'tache':
        // Tâche non concernée
        if (
          statuts.includes(StatutAvancementEnum.NON_CONCERNE) &&
          action.score.concerne === false
        ) {
          return true;
        }
        if (
          statuts.includes(StatutAvancementEnum.NON_RENSEIGNE) &&
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
      action.score.avancement !== StatutAvancementEnum.NON_RENSEIGNE
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
          avancement === StatutAvancementEnum.NON_CONCERNE
            ? StatutAvancementEnum.NON_RENSEIGNE
            : (avancement as StatutAvancement),
        avancementDetaille:
          avancement === StatutAvancementEnum.DETAILLE ? [0.25, 0.5, 0.25] : undefined,
        concerne: avancement === StatutAvancementEnum.NON_CONCERNE ? false : true,
      });
    },
  };
};

function addPropertyIsExpanded(
  action: ReturnType<typeof actionNewToDeprecated>
) {
  if (
    action.type === 'sous-action' &&
    (action.avancement === StatutAvancementEnum.NON_RENSEIGNE || !action.avancement)
  ) {
    // Les sous-actions "non renseigné" avec des tâches renseignées
    // sont mises à jour avec un statut "détaillé"
    // isExpanded est mis à true
    // Si c'est un "vrai" non renseignée, alors isExpanded est à false
    if (
      action.avancement_descendants?.find(
        (av) => !!av && av !== StatutAvancementEnum.NON_RENSEIGNE
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
