import {useEffect, useRef} from 'react';
import {
  Column,
  CellProps,
  useTable,
  useExpanded,
  useFlexLayout,
} from 'react-table';
import {Referentiel} from 'types/litterals';
import {TableData} from './useTableData';
import {CellAction} from '../ReferentielTable/CellAction';
import ReferentielTable from '../ReferentielTable';
import {ActionReferentiel} from '../ReferentielTable/useReferentiel';

export type TPreuvesTableProps = {
  tableData: TableData;
  referentiel: Referentiel;
};

export type TCellProps = CellProps<ActionReferentiel>;
export type TColumn = Column<ActionReferentiel>;

// défini les colonnes de la table
const COLUMNS: TColumn[] = [
  {
    accessor: 'nom', // la clé pour accéder à la valeur,
    Cell: CellAction, // rendu d'une cellule
    width: '100%',
  },
];

const getMaxDepth = (referentiel: string | null) =>
  referentiel === 'cae' ? 3 : 2;

/**
 * Affiche la table "Preuves" d'un référentiel
 */
export const PreuvesTable = (props: TPreuvesTableProps) => {
  const {tableData, referentiel} = props;
  const maxDepth = getMaxDepth(referentiel);
  const {table, isLoading} = tableData;

  // crée l'instance de la table
  const tableInstance = useTable(
    {...table, columns: COLUMNS},
    useExpanded,
    useFlexLayout
  );
  const {toggleRowExpanded, flatRows} = tableInstance;

  // initialement
  const isInitialLoading = useRef(true);
  useEffect(() => {
    if (table?.data?.length && isInitialLoading.current) {
      isInitialLoading.current = false;
      flatRows
        // filtre les lignes à déplier
        .filter(row => row.original.depth < maxDepth)
        // déplie les lignes voulues
        // NOTE: on utilise `as unknown as string[]` pour contourner une erreur
        // de typage dans react-table : `toggleRowExpanded` attend bien un id
        // unique en 1er argument et non un tableau comme l'indique son typage
        .forEach(row => toggleRowExpanded(row.id as unknown as string[]));
    }
  }, [table?.data?.length, flatRows, toggleRowExpanded, isInitialLoading]);

  // rendu de la table
  return (
    <ReferentielTable
      className="no-d3-border-top"
      isLoading={isLoading}
      table={tableInstance}
      referentiel={referentiel}
      noHeader
    />
  );
};
