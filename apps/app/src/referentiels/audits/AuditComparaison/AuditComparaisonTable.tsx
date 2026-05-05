import { divisionOrZero, roundTo } from '@tet/domain/utils';
import { useMemo } from 'react';
import {
  CellProps,
  Column,
  HeaderProps,
  useExpanded,
  useFlexLayout,
  useTable,
} from 'react-table';
import { CellPercent, CellPoints } from '../../AidePriorisation/Cells';
import { ReferentielTable } from '../../DEPRECATED_ReferentielTable';
import { CellAction } from '../../DEPRECATED_ReferentielTable/CellAction';
import { ActionDetailed } from '../../use-snapshot';
import './styles.css';
import { TScoreAuditRowData } from './types';
import { TableData } from './useTableData';

export type TDetailTacheTableProps = {
  tableData: TableData;
};
export type THeaderProps = HeaderProps<TScoreAuditRowData> & {
  headerData?: TScoreAuditRowData;
};
export type TCellProps = CellProps<TScoreAuditRowData>;
export type TColumn = Column<TScoreAuditRowData>;

/** Vérifie si la valeur courante d'un champ diffère de sa valeur avant audit */
const getDifference = (
  field: keyof ActionDetailed['score'] | 'scoreRealise',
  pre_audit: ActionDetailed['score'],
  courant: ActionDetailed['score']
): 'up' | 'down' | undefined => {
  if (!pre_audit && courant) {
    return 'up';
  }
  if (!courant || !pre_audit) {
    return undefined;
  }

  const preAuditValue =
    field === 'scoreRealise'
      ? divisionOrZero(pre_audit.pointFait, pre_audit.pointPotentiel)
      : pre_audit[field];
  const currentValue =
    field === 'scoreRealise'
      ? divisionOrZero(courant.pointFait, courant.pointPotentiel)
      : courant[field];

  const previous = roundTo(preAuditValue as number, 3);
  const current = roundTo(currentValue as number, 3);

  if (previous === current) {
    return undefined;
  }

  return previous < current ? 'up' : 'down';
};

/** Vérifie si la valeur courante d'un champ d'une ligne donnée diffère de sa valeur avant audit */
const getDifferenceOnRow = (
  field: keyof ActionDetailed['score'] | 'scoreRealise',
  row: TCellProps['row']
) => {
  const { preAudit: pre_audit, courant } = row.original;
  return getDifference(field, pre_audit.score, courant.score);
};

/** Affiche une cellule d'en-tête avec un libellé et une valeur */
const Header = (props: {
  field: keyof ActionDetailed['score'] | 'scoreRealise';
  value?: ActionDetailed['score'];
  previous?: ActionDetailed['score'];
  label: string;
  Cell: typeof CellPoints | typeof CellPercent;
}) => {
  const { field, value, previous, label, Cell } = props;

  return (
    <>
      {label}
      {value ? (
        <Cell
          value={
            field === 'scoreRealise'
              ? divisionOrZero(value.pointFait, value.pointPotentiel)
              : value[field]
          }
          difference={
            previous ? getDifference(field, previous, value) : undefined
          }
        />
      ) : null}
    </>
  );
};

/** Renvoie les définitions de colonnes de la table */
const getColumns = (headerData?: TScoreAuditRowData): TColumn[] => {
  const { preAudit: pre_audit, courant } = headerData || {};

  return [
    {
      accessor: 'nom', // la clé pour accéder à la valeur
      Header: 'TOTAL', // rendu dans la ligne d'en-tête
      Cell: CellAction as any, // rendu d'une cellule
      width: '100%',
    },
    {
      Header: '',
      id: 'total',
      columns: [
        {
          accessor: 'preAudit.score.pointReferentiel' as 'preAudit',
          Header: () => (
            <Header
              Cell={CellPoints}
              field="pointReferentiel"
              value={pre_audit?.score}
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
          accessor: 'preAudit.score.pointPotentiel' as 'preAudit',
          Header: () => (
            <Header
              Cell={CellPoints}
              field="pointPotentiel"
              value={pre_audit?.score}
              label="Potentiel adapté"
            />
          ),
          Cell: CellPoints,
          width: 77,
        },
        {
          accessor: 'preAudit.score.pointFait' as 'preAudit',
          Header: () => (
            <Header
              Cell={CellPoints}
              field="pointFait"
              value={pre_audit?.score}
              label="Points faits"
            />
          ),
          Cell: CellPoints,
          width: 77,
        },
        {
          accessor: 'preAudit.score.scoreRealise' as 'preAudit',
          Header: () => (
            <Header
              Cell={CellPercent}
              field="scoreRealise"
              value={pre_audit?.score}
              label="% fait"
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
          accessor: 'courant.score.pointPotentiel' as 'courant',
          Header: () => (
            <Header
              Cell={CellPoints}
              field="pointPotentiel"
              value={courant?.score}
              previous={pre_audit?.score}
              label="Potentiel adapté"
            />
          ),
          Cell: (props: TCellProps) => (
            <CellPoints
              {...props}
              difference={getDifferenceOnRow('pointPotentiel', props.row)}
            />
          ),
          width: 100,
        },
        {
          accessor: 'courant.score.pointFait' as 'courant',
          Header: () => (
            <Header
              Cell={CellPoints}
              field="pointFait"
              value={courant?.score}
              previous={pre_audit?.score}
              label="Points faits"
            />
          ),
          Cell: (props: TCellProps) => (
            <CellPoints
              {...props}
              difference={getDifferenceOnRow('pointFait', props.row)}
            />
          ),
          width: 100,
        },
        {
          accessor: 'courant.score.scoreRealise' as 'courant',
          Header: () => (
            <Header
              Cell={CellPercent}
              field="scoreRealise"
              value={courant?.score}
              previous={pre_audit?.score}
              label="% fait"
            />
          ),
          Cell: (props: TCellProps) => (
            <CellPercent
              {...props}
              difference={getDifferenceOnRow('scoreRealise', props.row)}
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
  const { tableData } = props;
  const { table, isLoading, headerData } = tableData;

  // ajout aux props passées à chaque cellule de ligne et d'en-tête de colonne
  //  const customCellProps = useMemo(() => ({maxDepth}), [maxDepth]);
  const customHeaderProps = useMemo(() => ({ headerData }), [headerData]);

  const columns = useMemo(() => getColumns(headerData), [headerData]);

  // crée l'instance de la table
  const tableInstance = useTable(
    { ...table, columns },
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
