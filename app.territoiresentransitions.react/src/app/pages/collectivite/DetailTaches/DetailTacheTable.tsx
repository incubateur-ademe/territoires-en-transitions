import './DetailTacheTable.css';
import {ChangeEvent, Fragment, useEffect, useMemo} from 'react';
import {
  useTable,
  useExpanded,
  Column,
  CellProps,
  HeaderProps,
} from 'react-table';
import {TacheDetail} from './queries';
import {TableData} from './useTableData';
import {FiltreStatut} from './FiltreStatut';
import {useOpenAction} from 'ui/shared/useOpenAction';

export type TDetailTacheTableProps = {
  tableData: TableData;
  updateActionStatut: TUpdateActionStatut;
};
type TUpdateActionStatut = (action_id: string, value: string) => void;

type TCellProps = CellProps<TacheDetail> & {
  updateActionStatut: TUpdateActionStatut;
};

type THeaderProps = HeaderProps<TacheDetail> & {
  setFilters: (filters: string[]) => void;
};

type TColumn = Column<TacheDetail>;

const Identifiant = ({row}: TCellProps) => {
  const {identifiant} = row.original;
  return <span className="identifiant">{identifiant}</span>;
};

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
  const {depth, have_children} = row.original;
  const style = {paddingLeft: (depth - 1) * 18};
  const onClickRow = useOpenAction();

  return (
    <>
      {depth > 2 ? <Identifiant {...props} /> : null}
      <span style={style}>
        {have_children ? <Expand {...props} /> : null}
        <span
          className={depth === 3 ? 'pill' : undefined}
          onClick={() => onClickRow(row.original)}
        >
          {value}
        </span>
      </span>
    </>
  );
};

const CellStatut = ({row, value, updateActionStatut}: TCellProps) => {
  const {have_children, action_id} = row.original;

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    updateActionStatut(action_id, event.target.value);
  };

  return have_children ? null : (
    <select value={value || 'non_renseigne'} onChange={handleChange}>
      <option value="non_concerne">Non concerné</option>
      <option value="non_renseigne">Non renseigné</option>
      <option value="pas_fait">Pas fait</option>
      <option value="programme">Programmé</option>
      <option value="detaille">Détaillé</option>
      <option value="fait">Fait</option>
    </select>
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
  const {tableData, updateActionStatut} = props;
  const {table, filters, setFilters} = tableData;

  // la définition des colonnes
  const columns: TColumn[] = useMemo(() => COLUMNS, []);

  // ajout aux props passées à chaque cellule
  const customCellProps = useMemo(() => ({updateActionStatut}), []);
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
          {rows.map((row, index) => {
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
                {row.depth === 0 && index > 0 ? (
                  <tr className="separator" />
                ) : null}
                <tr {...rowProps}>
                  {row.original.have_children ? (
                    <td
                      {...row.cells[0].getCellProps()}
                      colSpan={row.cells.length}
                    >
                      {row.cells[0].render('Cell', customCellProps)}
                    </td>
                  ) : (
                    row.cells.map(cell => {
                      return (
                        <td {...cell.getCellProps()}>
                          {cell.render('Cell', customCellProps)}
                        </td>
                      );
                    })
                  )}
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
