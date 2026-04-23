import { divisionOrZero } from '@tet/domain/utils';
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
import { useReferentielId } from '../referentiel-context';
import { ReferentielTable } from '../ReferentielTable';
import { CellAction } from '../ReferentielTable/CellAction';
import type { ActionDetailed } from '../use-snapshot';
import { CellPercent, CellPhase, CellPoints } from './Cells';
import { TFilters } from './filters';
import { FiltrePhase } from './FiltrePhase';
import { makeFiltrePourcentage } from './FiltrePourcentage';
import { getMaxDepth } from './queries';

export type TableData = {
  /** données à passer à useTable */
  table: Pick<
    TableOptions<ActionDetailed>,
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

export type THeaderProps = HeaderProps<ActionDetailed> & {
  setFilters: (filters: string[]) => void;
};
export type TCellProps = CellProps<ActionDetailed>;
export type TColumn = Column<ActionDetailed>;

// défini les colonnes de la table (snapshot format)
const COLUMNS: TColumn[] = [
  {
    accessor: 'nom',
    Header: 'Sous-actions',
    Cell: CellAction as any,
    width: '100%',
  },
  {
    id: 'points_restants',
    accessor: (row: ActionDetailed) =>
      (row.score?.pointPotentiel ?? 0) - (row.score?.pointFait ?? 0),
    Header: 'Points restants',
    Cell: CellPoints,
    width: 70,
  },
  {
    id: 'score_realise',
    accessor: (row: ActionDetailed) =>
      divisionOrZero(row.score?.pointFait ?? 0, row.score?.pointPotentiel ?? 0),
    Header: makeFiltrePourcentage('score_realise', '% Réalisé') as any,
    Cell: CellPercent,
    width: 150,
  },
  {
    id: 'score_programme',
    accessor: (row: ActionDetailed) =>
      divisionOrZero(
        row.score?.pointProgramme ?? 0,
        row.score?.pointPotentiel ?? 0
      ),
    Header: makeFiltrePourcentage('score_programme', '% Programmé') as any,
    Cell: CellPercent,
    width: 175,
  },
  {
    id: 'phase',
    accessor: (row: ActionDetailed) => row.categorie ?? null,
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
