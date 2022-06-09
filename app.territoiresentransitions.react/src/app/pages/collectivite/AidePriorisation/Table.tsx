import {useEffect, useMemo, useRef} from 'react';
import {
  Column,
  CellProps,
  HeaderProps,
  useTable,
  useExpanded,
  useFlexLayout,
} from 'react-table';
import {getMaxDepth, PriorisationRow} from './queries';
import {TableData} from './useTableData';
import {CellAction} from '../ReferentielTable/CellAction';
import ReferentielTable from '../ReferentielTable';
import {CellPercent, CellPoints, CellPhase} from './Cells';
import {useReferentielId} from 'core-logic/hooks/params';
import {FiltreScoreRealise} from './FiltreScoreRealise';
import {FiltreScoreProgramme} from './FiltreScoreProgramme';
import {FiltrePhase} from './FiltrePhase';

export type TDetailTacheTableProps = {
  tableData: TableData;
};
export type THeaderProps = HeaderProps<PriorisationRow> & {
  setFilters: (filters: string[]) => void;
};
export type TCellProps = CellProps<PriorisationRow>;
export type TColumn = Column<PriorisationRow>;

// défini les colonnes de la table
const COLUMNS: TColumn[] = [
  {
    accessor: 'nom', // la clé pour accéder à la valeur
    Header: 'Sous-actions', // rendu dans la ligne d'en-tête
    Cell: CellAction, // rendu d'une cellule
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
    Header: FiltreScoreRealise,
    Cell: CellPercent,
    width: 120,
  },
  {
    accessor: 'score_programme',
    Header: FiltreScoreProgramme,
    Cell: CellPercent,
    width: 125,
  },
  {
    accessor: 'phase',
    Header: FiltrePhase,
    Cell: CellPhase,
    width: 120,
  },
];

/**
 * Affiche la table "Aide à la priorisation"
 */
export const Table = (props: TDetailTacheTableProps) => {
  const {tableData} = props;
  const {table, isLoading, filters, setFilters} = tableData;

  const referentiel = useReferentielId();
  const maxDepth = getMaxDepth(referentiel);

  // ajout aux props passées à chaque cellule de ligne et d'en-tête de colonne
  const customCellProps = useMemo(() => ({maxDepth}), [maxDepth]);
  const customHeaderProps = useMemo(() => ({filters, setFilters}), [filters]);

  // crée l'instance de la table
  const tableInstance = useTable(
    {...table, columns: COLUMNS},
    useExpanded,
    useFlexLayout
  );
  const {toggleAllRowsExpanded} = tableInstance;

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
