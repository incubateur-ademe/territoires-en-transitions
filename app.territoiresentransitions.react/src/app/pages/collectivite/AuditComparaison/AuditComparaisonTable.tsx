import {useMemo} from 'react';
import {
  Column,
  CellProps,
  HeaderProps,
  useTable,
  useExpanded,
  useFlexLayout,
} from 'react-table';
import {TComparaisonScoreAudit, TScoreAudit, TScoreAuditRowData} from './types';
import {TableData} from './useTableData';
import {CellAction} from '../ReferentielTable/CellAction';
import ReferentielTable from '../ReferentielTable';
import {CellPercent, CellPoints} from '../AidePriorisation/Cells';
import {toFixed} from 'utils/toFixed';
import './styles.css';

export type TDetailTacheTableProps = {
  tableData: TableData;
};
export type THeaderProps = HeaderProps<TScoreAuditRowData> & {
  headerData?: TComparaisonScoreAudit;
};
export type TCellProps = CellProps<TScoreAuditRowData>;
export type TColumn = Column<TScoreAuditRowData>;

/** Vérifie si la valeur courante d'un champ diffère de sa valeur avant audit */
const getDifference = (
  field: keyof TScoreAudit,
  pre_audit?: TScoreAudit,
  courant?: TScoreAudit
): 'up' | 'down' | undefined => {
  if (!pre_audit && courant) {
    return 'up';
  }
  if (!courant || !pre_audit) {
    return undefined;
  }

  const previous = toFixed(pre_audit[field] as number);
  const current = toFixed(courant[field] as number);

  if (previous === current) {
    return undefined;
  }

  return previous < current ? 'up' : 'down';
};

/** Vérifie si la valeur courante d'un champ d'une ligne donnée diffère de sa valeur avant audit */
const getDifferenceOnRow = (
  field: keyof TScoreAudit,
  row: TCellProps['row']
) => {
  const {pre_audit, courant} = row.original;
  return getDifference(field, pre_audit, courant);
};

/** Affiche une cellule d'en-tête avec un libellé et une valeur */
const Header = (props: {
  field: keyof TScoreAudit;
  value?: TScoreAudit;
  previous?: TScoreAudit;
  label: string;
  Cell: typeof CellPoints | typeof CellPercent;
}) => {
  const {field, value, previous, label, Cell} = props;
  return (
    <>
      {label}
      {value ? (
        <Cell
          value={value[field]}
          difference={
            previous ? getDifference(field, previous, value) : undefined
          }
        />
      ) : null}
    </>
  );
};

/** Renvoie les définitions de colonnes de la table */
const getColumns = (headerData?: TComparaisonScoreAudit): TColumn[] => {
  const {pre_audit, courant} = headerData || {};

  return [
    {
      accessor: 'nom', // la clé pour accéder à la valeur
      Header: 'TOTAL', // rendu dans la ligne d'en-tête
      Cell: CellAction, // rendu d'une cellule
      width: '100%',
    },
    {
      Header: '',
      id: 'total',
      columns: [
        {
          accessor: 'pre_audit.points_max_referentiel' as 'pre_audit',
          Header: () => (
            <Header
              Cell={CellPoints}
              field="points_max_referentiel"
              value={pre_audit}
              label="Potentiel max"
            />
          ),
          Cell: CellPoints,
          width: 77,
        },
      ],
    },
    {
      Header: 'Avant audit',
      columns: [
        {
          accessor: 'pre_audit.points_max_personnalises' as 'pre_audit',
          Header: () => (
            <Header
              Cell={CellPoints}
              field="points_max_personnalises"
              value={pre_audit}
              label="Potentiel adapté"
            />
          ),
          Cell: CellPoints,
          width: 77,
        },
        {
          accessor: 'pre_audit.points_realises' as 'pre_audit',
          Header: () => (
            <Header
              Cell={CellPoints}
              field="points_realises"
              value={pre_audit}
              label="Points réalisés"
            />
          ),
          Cell: CellPoints,
          width: 77,
        },
        {
          accessor: 'pre_audit.score_realise' as 'pre_audit',
          Header: () => (
            <Header
              Cell={CellPercent}
              field="score_realise"
              value={pre_audit}
              label="% réalisé"
            />
          ),
          Cell: CellPercent,
          width: 108,
        },
      ],
    },
    {
      Header: 'Après audit',
      columns: [
        {
          accessor: 'courant.points_max_personnalises' as 'courant',
          Header: () => (
            <Header
              Cell={CellPoints}
              field="points_max_personnalises"
              value={courant}
              previous={pre_audit}
              label="Potentiel adapté"
            />
          ),
          Cell: (props: TCellProps) => (
            <CellPoints
              {...props}
              difference={getDifferenceOnRow(
                'points_max_personnalises',
                props.row
              )}
            />
          ),
          width: 100,
        },
        {
          accessor: 'courant.points_realises' as 'courant',
          Header: () => (
            <Header
              Cell={CellPoints}
              field="points_realises"
              value={courant}
              previous={pre_audit}
              label="Points réalisés"
            />
          ),
          Cell: (props: TCellProps) => (
            <CellPoints
              {...props}
              difference={getDifferenceOnRow('points_realises', props.row)}
            />
          ),
          width: 100,
        },
        {
          accessor: 'courant.score_realise' as 'courant',
          Header: () => (
            <Header
              Cell={CellPercent}
              field="score_realise"
              value={courant}
              previous={pre_audit}
              label="% réalisé"
            />
          ),
          Cell: (props: TCellProps) => (
            <CellPercent
              {...props}
              difference={getDifferenceOnRow('score_realise', props.row)}
            />
          ),
          width: 110,
        },
      ],
    },
  ];
};

/**
 * Affiche la table "Cycles et comparaison"
 */
export const AuditComparaisonTable = (props: TDetailTacheTableProps) => {
  const {tableData} = props;
  const {table, isLoading, headerData} = tableData;

  // ajout aux props passées à chaque cellule de ligne et d'en-tête de colonne
  //  const customCellProps = useMemo(() => ({maxDepth}), [maxDepth]);
  const customHeaderProps = useMemo(() => ({headerData}), [headerData]);

  const columns = useMemo(() => getColumns(headerData), [headerData]);

  // crée l'instance de la table
  const tableInstance = useTable(
    {...table, columns},
    useExpanded,
    useFlexLayout
  );

  // rendu de la table
  return (
    <ReferentielTable
      className="no-d3-border-top comparaison-table"
      isLoading={isLoading}
      table={tableInstance}
      customCellProps={{}}
      customHeaderProps={customHeaderProps}
    />
  );
};
