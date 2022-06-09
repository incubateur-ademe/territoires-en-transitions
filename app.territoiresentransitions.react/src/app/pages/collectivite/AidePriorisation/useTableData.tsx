import {useQuery} from 'react-query';
import {TableOptions} from 'react-table';
import {useCollectiviteId, useReferentielId} from 'core-logic/hooks/params';
import {fetchRows, PriorisationRow} from './queries';
import {useReferentiel} from '../ReferentielTable/useReferentiel';
import {ITEM_ALL} from 'ui/shared/MultiSelectFilter';
import {useSearchParams} from 'core-logic/hooks/query';

export type UseTableData = () => TableData;

export type TableData = {
  /** données à passer à useTable */
  table: Pick<
    TableOptions<PriorisationRow>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  /** Indique que le chargement des données est en cours */
  isLoading: boolean;
  /** filtres actifs */
  filters: TFilters;
  /** Nombre de lignes après filtrage */
  count: number;
  /** Nombre total de lignes */
  total: number;
  /** pour remettre à jour les filtres */
  setFilters: (newFilter: TFilters) => void;
};

type TFilters = {
  score_realise: string[];
  score_programme: string[];
  phase: string[];
};

export const initialFilters: TFilters = {
  score_realise: [ITEM_ALL],
  score_programme: [ITEM_ALL],
  phase: [ITEM_ALL],
};

const nameToShortNames = {
  score_realise: 'r',
  score_programme: 'p',
  phase: 'v',
};

/**
 * Memoïze et renvoi les données et paramètres de la table
 */
export const useTableData: UseTableData = () => {
  const collectivite_id = useCollectiviteId();
  const referentiel = useReferentielId();

  // filtre initial
  const [filters, setFilters] = useSearchParams<TFilters>(
    'priorisation',
    initialFilters,
    nameToShortNames
  );

  // chargement des données en fonction des filtres
  const {data, isLoading} = useQuery(
    ['priorisation', collectivite_id, referentiel, filters],
    () => fetchRows(collectivite_id, referentiel, filters)
  );
  const {rows: actionsStatut} = data || {};

  // chargement du référentiel
  const {
    table,
    total,
    count,
    isLoading: isLoadingReferentiel,
  } = useReferentiel(referentiel, collectivite_id, actionsStatut);

  return {
    table,
    filters,
    setFilters,
    isLoading: isLoading || isLoadingReferentiel,
    count,
    total,
  };
};
