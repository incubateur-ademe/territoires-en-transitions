import {useEffect, useState} from 'react';
import {useHistory, useLocation} from 'react-router-dom';
import {useMutation, useQuery, useQueryClient} from 'react-query';
import {TableOptions} from 'react-table';
import {useQuery as useQueryString} from 'core-logic/hooks/query';
import {
  useCollectiviteId,
  useReferentielId,
  useReferentielVue,
} from 'core-logic/hooks/params';
import {
  fetchActionStatutsList,
  TacheDetail,
  updateTacheStatut,
} from './queries';
import {useReferentiel} from '../ReferentielTable/useReferentiel';

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
  filters: string[];
  /** Nombre de lignes après filtrage */
  count: number;
  /** Nombre total de lignes */
  total: number;
  /** pour remettre à jour les filtres */
  setFilters: (filters: string[]) => void;
  /** pour changer le statut d'une tâche */
  updateStatut: (action_id: string, value: string) => void;
};

const DEFAULT_FILTER = ['non_renseigne'];

/**
 * Memoïze et renvoi les données et paramètres de la table
 */
export const useTableData: UseTableData = () => {
  const collectivite_id = useCollectiviteId();
  const referentiel = useReferentielId();
  const queryClient = useQueryClient();

  // filtre initial
  const [filters, setFilters] = useURLParams(DEFAULT_FILTER);

  // chargement des données en fonction des filtres
  const {data, isLoading} = useQuery(
    ['action_statuts', collectivite_id, referentiel, ...filters],
    () => fetchActionStatutsList(collectivite_id, referentiel, filters)
  );
  const {rows: actionsStatut} = data || {};

  // chargement du référentiel
  const {
    table,
    total,
    count,
    isLoading: isLoadingReferentiel,
  } = useReferentiel(referentiel, collectivite_id, actionsStatut);

  // met à jour un statut
  const {mutate, isLoading: isSaving} = useMutation(updateTacheStatut);
  const updateStatut = (action_id: string, avancement: string) => {
    if (collectivite_id && !isSaving) {
      mutate(
        {collectivite_id, action_id, avancement},
        {
          onSuccess: () => {
            queryClient.invalidateQueries('action_statuts');
          },
        }
      );
    }
  };

  return {
    table,
    filters,
    setFilters,
    isLoading: isLoading || isLoadingReferentiel,
    isSaving,
    count,
    total,
    updateStatut,
  };
};

const useURLParams = (
  initialValue: string[]
): [filters: string[], setFilters: (newFilters: string[]) => void] => {
  const history = useHistory();
  const location = useLocation();
  const referentielVue = useReferentielVue();

  // extrait les paramètres de l'url si ils sont disponibles
  const querystring = useQueryString();
  const filtersFromQueryString =
    querystring.get('f')?.split(',') || initialValue;

  // état interne
  const [filters, setFilters] = useState(filtersFromQueryString);

  // synchronise l'url à partir de l'état interne
  useEffect(() => {
    const f = filters.join(',');
    if (referentielVue === 'detail' && querystring.get('f') !== f) {
      history.replace({...location, search: `?f=${filters.join(',')}`});
    }
  }, [filters, location]);

  return [filters, setFilters];
};
