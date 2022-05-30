import './DetailTacheTable.css';
import {Fragment, useCallback, useEffect, useMemo} from 'react';
import {
  useTable,
  useExpanded,
  Column,
  CellProps,
  HeaderProps,
} from 'react-table';
import {makeCollectiviteTacheUrl, ReferentielParamOption} from 'app/paths';
import {TacheDetail} from './queries';
import {TableData} from './useTableData';
import {FiltreStatut} from './FiltreStatut';
import {SelectStatut} from './SelectStatut';
import {useCollectiviteId, useReferentielId} from 'core-logic/hooks/params';
import {Link} from 'react-router-dom';

export type TDetailTacheTableProps = {
  tableData: TableData;
};

type TCellProps = CellProps<TacheDetail>;

type THeaderProps = HeaderProps<TacheDetail> & {
  setFilters: (filters: string[]) => void;
};

type TColumn = Column<TacheDetail>;

const Expand = ({row}: TCellProps) => {
  const {isExpanded, original} = row;
  const {depth} = original;
  const className = [
    'fr-mr-1w',
    isExpanded ? 'arrow-down' : 'arrow-right',
    depth < 3 ? 'before:bg-white' : 'before:bg-black',
  ].join(' ');
  return <span className={className} {...row.getToggleRowExpandedProps()} />;
};

const CellTache = (props: TCellProps) => {
  const {row, value} = props;
  const {depth, have_children, identifiant} = row.original;
  const style = {
    paddingLeft: (depth - 1) * (depth > 2 && have_children ? 8 : 24),
  };
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId() as ReferentielParamOption;

  return collectiviteId && referentielId ? (
    <>
      {depth > 2 ? <span className="identifiant">{identifiant}</span> : null}
      <span style={style}>
        {have_children ? <Expand {...props} /> : null}
        <span className={depth === 3 ? 'pill' : undefined}>
          <Link
            className="hover:underline"
            to={makeCollectiviteTacheUrl({
              collectiviteId,
              actionId: row.original.action_id,
              referentielId,
            })}
          >
            {value}
          </Link>
        </span>
      </span>
    </>
  ) : null;
};

const CellStatut = ({row, value, updateStatut, isSaving}: TCellProps) => {
  const {have_children, non_concerne, action_id} = row.original;

  const handleChange = useCallback(
    (value: string) => {
      updateStatut(action_id, value);
    },
    [action_id]
  );

  const currentValue = non_concerne ? 'non_concerne' : value || 'non_renseigne';

  return have_children ? null : (
    <SelectStatut
      value={currentValue}
      onChange={handleChange}
      disabled={isSaving}
    />
  );
};

const HeaderStatut = ({filters, setFilters}: THeaderProps) => (
  <FiltreStatut
    className="float-right"
    values={filters}
    onChange={setFilters}
  />
);

const COLUMNS: TColumn[] = [
  {
    accessor: 'nom', // la clé pour accéder à la valeur
    Header: 'Tâches', // rendu dans la ligne d'en-tête
    Cell: CellTache, // rendu d'une cellule
  },
  {
    accessor: 'avancement',
    Header: HeaderStatut,
    Cell: CellStatut,
  },
];

/**
 * Affiche la table "Détail des tâches"
 */
export const DetailTacheTable = (props: TDetailTacheTableProps) => {
  const {tableData} = props;
  const {table, isLoading, isSaving, filters, setFilters, updateStatut} =
    tableData;

  // la définition des colonnes
  const columns: TColumn[] = useMemo(() => COLUMNS, []);

  // ajout aux props passées à chaque cellule
  const customHeaderProps = useMemo(() => ({filters, setFilters}), [filters]);

  // crée l'instance de la table et extrait les props nécessaires au rendu
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    toggleAllRowsExpanded,
  } = useTable(
    {
      ...table,
      columns,
    },
    useExpanded
  );

  // initialement tout est déplié
  useEffect(() => {
    toggleAllRowsExpanded(true);
  }, [table?.data]);

  // rendu d'une ligne
  const renderRow = useCallback(
    (row, index) => {
      prepareRow(row);
      const {original, isExpanded} = row;
      const {depth, nom} = original;
      const rowProps = {
        ...row.getRowProps(),
        className: `d${depth} ${isExpanded ? 'open' : 'close'}`,
        title: nom,
      };
      return (
        <Fragment key={rowProps.key}>
          {row.depth === 0 && index > 0 ? <tr className="separator" /> : null}
          <tr {...rowProps}>
            {row.original.have_children ? (
              <td {...row.cells[0].getCellProps()} colSpan={row.cells.length}>
                {row.cells[0].render('Cell')}
              </td>
            ) : (
              row.cells.map((cell: TCellProps) => {
                return (
                  <td {...cell.getCellProps()}>
                    {cell.render('Cell', {updateStatut, isSaving})}
                  </td>
                );
              })
            )}
          </tr>
        </Fragment>
      );
    },
    [prepareRow, isSaving]
  );

  // rendu de la table
  return (
    <div className="detail-tache-table">
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>
                  {column.render('Header', customHeaderProps)}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {isLoading ? (
            <tr>
              <td colSpan={COLUMNS.length} className="text-center">
                Chargement en cours...
              </td>
            </tr>
          ) : rows.length ? (
            rows.map(renderRow)
          ) : (
            <tr>
              <td colSpan={COLUMNS.length} className="text-center">
                Aucun résultat
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
