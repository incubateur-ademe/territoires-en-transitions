import './DetailTacheTable.css';
import {ChangeEvent, Fragment, useCallback, useMemo} from 'react';
import {
  useTable,
  useExpanded,
  Column,
  CellProps,
  HeaderProps,
} from 'react-table';
import {TacheDetail} from './useDetailTache';
import {TFetchChildren, useTableData} from './useTableData';
import {FiltreStatut} from './FiltreStatut';

export type TDetailTacheTableProps = {
  taches: TacheDetail[];
  updateActionStatut: TUpdateActionStatut;
  fetchChildren: TFetchChildren;
};
type TUpdateActionStatut = (action_id: string, value: string) => void;

type TCellProps = CellProps<TacheDetail> & {
  updateActionStatut: TUpdateActionStatut;
};

type THeaderProps = HeaderProps<TacheDetail>;

type TColumn = Column<TacheDetail>;

const Identifiant = ({row}: TCellProps) => {
  const {identifiant} = row.original;
  return <span className="identifiant">{identifiant}</span>;
};

const ArrowExpand = ({row}: TCellProps) => {
  const {isExpanded, original} = row;
  const {depth} = original;
  const classNames = [
    'fr-mr-1w',
    isExpanded ? 'arrow-down' : 'arrow-right',
    depth < 3 ? 'before:bg-white' : 'before:bg-black',
  ];
  return <i className={classNames.join(' ')} />;
};

const CellTache = (props: TCellProps) => {
  const {row, value} = props;
  const {have_children, depth} = row.original;
  const style = {paddingLeft: (depth - 1) * 18};

  return (
    <>
      {depth > 2 ? <Identifiant {...props} /> : null}
      <span style={style}>
        {have_children ? <ArrowExpand {...props} /> : null}
        {depth === 3 ? <span className="pill">{value}</span> : value}
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

const HeaderStatut = (props: THeaderProps) => (
  <FiltreStatut
    className="float-right"
    values={['tous']}
    onChange={({value}) => console.log(value, props)}
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
  const {taches, updateActionStatut, fetchChildren} = props;

  // les données
  const {table, fetchSubrows} = useTableData(taches, fetchChildren);

  // la définition des colonnes
  const columns: TColumn[] = useMemo(() => COLUMNS, []);

  // renvoi l'id d'une ligne
  const getRowId = useCallback((row: TacheDetail) => row.identifiant, []);

  // ajout aux props passées à chaque cellule
  const customCellProps = {updateActionStatut};

  // crée l'instance de la table et extrait les éléments passés au rendu
  const {getTableProps, getTableBodyProps, headerGroups, rows, prepareRow} =
    useTable(
      {
        ...table,
        columns,
        getRowId,
      },
      useExpanded
    );

  return (
    <div className="detail-tache-table">
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()} className="text-right">
                  {column.render('Header')}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, index) => {
            prepareRow(row);
            const rowProps = {
              ...row.getRowProps(),
              ...row.getToggleRowExpandedProps(),
              className: `d${row.original.depth} ${
                row.isExpanded ? 'open' : 'close'
              }`,
            };
            return (
              <Fragment key={rowProps.key}>
                {row.depth === 0 && index > 0 ? (
                  <tr className="separator" />
                ) : null}
                <tr
                  {...rowProps}
                  title={row.original.nom}
                  onClick={evt => {
                    evt.preventDefault();
                    row.toggleRowExpanded();
                    fetchSubrows(row.original);
                  }}
                >
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
