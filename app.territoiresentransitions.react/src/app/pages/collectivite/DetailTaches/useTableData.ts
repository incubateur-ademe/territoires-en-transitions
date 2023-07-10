import {useMutation, useQuery, useQueryClient} from 'react-query';
import {TableOptions} from 'react-table';
import {useSearchParams} from 'core-logic/hooks/query';
import {useCollectiviteId, useReferentielId} from 'core-logic/hooks/params';
import {
  fetchActionStatutsList,
  TacheDetail,
  updateTacheStatut,
} from './queries';
import {useReferentiel} from '../ReferentielTable/useReferentiel';
import {initialFilters, nameToShortNames, TFilters} from './filters';

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
 * Memoïze et renvoi les données et paramètres de la table
 */
export const useTableData: UseTableData = () => {
  const collectivite_id = useCollectiviteId();
  const referentiel = useReferentielId();
  const queryClient = useQueryClient();

  // filtre initial
  const [filters, setFilters, filtersCount] = useSearchParams<TFilters>(
    'detail',
    initialFilters,
    nameToShortNames
  );

  // chargement des données en fonction des filtres
  const {data, isLoading} = useQuery(
    ['detail_taches', collectivite_id, referentiel, filters],
    () => fetchActionStatutsList(collectivite_id, referentiel, filters)
  );
  const {rows: actionsStatut} = data || {};

  const sousActions: string[] = [];
  const sousActionsWithStatut: string[] = [];

  const processedData: TacheDetail[] | undefined = actionsStatut
    ? actionsStatut.map(action => {
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
              av => !!av && av !== 'non_renseigne'
            )
          ) {
            return {...action, avancement: 'detaille', isExpanded: true};
          } else return {...action, isExpanded: false};
        } else if (action.type === 'sous-action') {
          // Les autres sous-actions ne sont pas dépliées
          sousActions.push(action.action_id);
          sousActionsWithStatut.push(action.action_id);
          return {...action, isExpanded: false};
        } else if (action.type === 'tache') {
          // Les tâches ne sont pas dépliées
          // Les axes / sous-axes / actions sont dépliés
          return {...action, isExpanded: false};
        } else return {...action, isExpanded: true};
      })
    : undefined;

  const filteredData = processedData?.filter(
    data =>
      // Affichage des axes / sous-axes / actions dont
      // la sous-action a été récupérée
      (data.type !== 'tache' &&
        data.type !== 'sous-action' &&
        sousActions.filter(
          ssAc => ssAc.includes(data.action_id) && ssAc !== data.action_id
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

  // chargement du référentiel
  const {
    table,
    total,
    sousActionsTotal,
    count,
    sousActionsCount,
    isLoading: isLoadingReferentiel,
  } = useReferentiel(referentiel, collectivite_id, filteredData);

  // met à jour un statut
  const {mutate, isLoading: isSaving} = useMutation(updateTacheStatut);
  const updateStatut = (action_id: string, avancement: string) => {
    if (collectivite_id && !isSaving) {
      mutate(
        {collectivite_id, action_id, avancement},
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
