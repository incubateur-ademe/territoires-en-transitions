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
import { ReferentielTable } from '../DEPRECATED_ReferentielTable';
import { CellAction } from '../DEPRECATED_ReferentielTable/CellAction';
import { useReferentielId } from '../referentiel-context';
import { ActionDetailed } from '../use-snapshot';
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

// défini les colonnes de la table
const COLUMNS: TColumn[] = [
  {
    accessor: 'nom', // la clé pour accéder à la valeur
    Header: 'Sous-actions', // rendu dans la ligne d'en-tête
    Cell: CellAction as any, // rendu d'une cellule
    width: '100%',
  },
  {
    accessor: (row) => row.score.pointPotentiel - row.score.pointFait,
    Header: 'Points restants',
    Cell: CellPoints,
    width: 70,
  },
  {
    accessor: (row) =>
      divisionOrZero(row.score.pointFait, row.score.pointPotentiel),
    Header: makeFiltrePourcentage('score_realise', '% Réalisé') as any,
    Cell: CellPercent,
    width: 150,
  },
  {
    accessor: (row) =>
      divisionOrZero(row.score.pointProgramme, row.score.pointPotentiel),
    Header: makeFiltrePourcentage('score_programme', '% Programmé') as any,
    Cell: CellPercent,
    width: 175,
  },
  {
    accessor: 'categorie',
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
