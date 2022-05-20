import {useCallback, useMemo, useState} from 'react';
import {useQuery} from 'react-query';
import {TableOptions} from 'react-table';
import {useCollectiviteId, useReferentielId} from 'core-logic/hooks/params';
import {fetchActionStatutsList, TacheDetail} from './queries';

export type UseTableData = () => TableData;

export type TableData = {
  /** données à passer à useTable */
  table: Pick<
    TableOptions<TacheDetail>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  /** filtres actifs */
  filters: string[];
  /** pour remettre à jour les filtres */
  setFilters: (filters: string[]) => void;
};

/**
 * Memoïze et renvoi les données et paramètres de la table
 */
export const useTableData: UseTableData = () => {
  const collectivite_id = useCollectiviteId();
  const referentiel = useReferentielId();

  // filtre initial
  const [filters, setFilters] = useState(['non_renseigne']);

  // chargement des données
  const {data: rows} = useQuery(
    ['action_statuts', collectivite_id, referentiel, ...filters],
    () => fetchActionStatutsList(collectivite_id, referentiel, filters)
  );

  // extrait les lignes de 1er niveau
  const firstLevel = useMemo(
    () => rows?.filter(({depth}) => depth === 1) || [],
    [rows]
  );

  // renvoi l'id d'une ligne
  const getRowId = useCallback((row: TacheDetail) => row.identifiant, []);

  // renvoi les sous-lignes d'une ligne
  const getSubRows = useCallback(
    (parentRow: TacheDetail) =>
      rows && parentRow.have_children
        ? rows?.filter(
            ({identifiant, depth}) =>
              depth === parentRow.depth + 1 &&
              identifiant.startsWith(parentRow.identifiant)
          )
        : [],
    [rows]
  );

  return {
    table: {
      data: firstLevel,
      getRowId,
      getSubRows,
    },
    filters,
    setFilters,
  };
};
