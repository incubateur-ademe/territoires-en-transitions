import { useEffect, useMemo, useRef } from 'react';
import {
  CellProps,
  Column,
  HeaderProps,
  TableOptions,
  useExpanded,
  useFlexLayout,
  useTable,
} from 'react-table';
import { ProgressionRow } from '../DEPRECATED_scores.types';
import { useReferentielId } from '../referentiel-context';
import { ReferentielTable } from '../ReferentielTable';
import { CellAction } from '../ReferentielTable/CellAction';
import { CellPercent, CellPhase, CellPoints } from './Cells';
import { TFilters } from './filters';
import { FiltrePhase } from './FiltrePhase';
import { makeFiltrePourcentage } from './FiltrePourcentage';
import { getMaxDepth } from './queries';

export type TableData = {
  /** données à passer à useTable */
  table: Pick<
    TableOptions<ProgressionRow>,
    'data' | 'getRowId' | 'getSubRows' | 'autoResetExpanded'
  >;
  /** Indique que le chargement des données est en cours */
  isLoading: boolean;
  /** filtres actifs */
  filters: TFilters;
  /** Nombre de filtres actifs */
  filtersCount: number;
  /** Nombre de lignes après filtrage */
  count: number;
  /** Nombre total de lignes */
  total: number;
  /** pour remettre à jour les filtres */
  setFilters: (newFilter: TFilters) => void;
};

export type THeaderProps = HeaderProps<ProgressionRow> & {
  setFilters: (filters: string[]) => void;
};
export type TCellProps = CellProps<ProgressionRow>;
export type TColumn = Column<ProgressionRow>;

// défini les colonnes de la table
const COLUMNS: TColumn[] = [
  {
    accessor: 'nom', // la clé pour accéder à la valeur
    Header: 'Sous-actions', // rendu dans la ligne d'en-tête
    Cell: CellAction as any, // rendu d'une cellule
    width: '100%',
  },
  {
    accessor: 'points_restants',
    Header: 'Points restants',
    Cell: CellPoints,
    width: 70,
  },
  {
    accessor: 'score_realise',
    Header: makeFiltrePourcentage('score_realise', '% Réalisé') as any,
    Cell: CellPercent,
    width: 150,
  },
  {
    accessor: 'score_programme',
    Header: makeFiltrePourcentage('score_programme', '% Programmé') as any,
    Cell: CellPercent,
    width: 175,
  },
  {
    accessor: 'phase',
    Header: FiltrePhase as any,
    Cell: CellPhase as any,
    width: 120,
  },
];

/**
 * Affiche la table "Aide à la priorisation"
 */
export const Table = (props: { tableData: TableData }) => {
  const { tableData } = props;
  const { table, isLoading, filters, setFilters } = tableData;

  const referentiel = useReferentielId();
  const maxDepth = getMaxDepth(referentiel);

  // ajout aux props passées à chaque cellule de ligne et d'en-tête de colonne
  const customCellProps = useMemo(() => ({ maxDepth }), [maxDepth]);
  const customHeaderProps = useMemo(() => ({ filters, setFilters }), [filters]);

  // crée l'instance de la table
  const tableInstance = useTable(
    { ...table, columns: COLUMNS },
    useExpanded,
    useFlexLayout
  );
  const { toggleAllRowsExpanded } = tableInstance;

  // initialement tout est déplié
  const isInitialLoading = useRef(true);
  useEffect(() => {
    if (table?.data?.length && isInitialLoading.current) {
      isInitialLoading.current = false;
      toggleAllRowsExpanded(true);
    }
  }, [table?.data?.length, toggleAllRowsExpanded, isInitialLoading]);

  // rendu de la table
  return (
    <ReferentielTable
      className="no-d3-border-top"
      isLoading={isLoading}
      table={tableInstance}
      customCellProps={customCellProps}
      customHeaderProps={customHeaderProps}
    />
  );
};
