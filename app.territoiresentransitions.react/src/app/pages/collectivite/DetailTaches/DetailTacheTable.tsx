import {
  ChangeEvent,
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {useTable, useExpanded, Column, CellProps} from 'react-table';
import {TacheDetail} from './useDetailTache';
import './DetailTacheTable.css';

export type TDetailTacheTableProps = {
  taches: TacheDetail[];
  updateActionStatut: TUpdateActionStatut;
  fetchChildren: TFetchChildren;
};
type TUpdateActionStatut = (action_id: string, value: string) => void;
type TFetchChildren = (
  action_id: string,
  depth: number
) => Promise<TacheDetail[]>;

type TCellProps = CellProps<TacheDetail> & {
  updateActionStatut: TUpdateActionStatut;
};

type TColumn = Column<TacheDetail>;

const CellTache = ({row, value}: TCellProps) => {
  const {have_children, depth} = row.original;
  const style = {paddingLeft: (depth - 1) * 18};

  if (!have_children) {
    return (
      <span style={style} title={value}>
        {value}
      </span>
    );
  }

  return (
    <span title={value} style={style}>
      {row.isExpanded ? '▼' : '►'}&nbsp;&nbsp;{value}
    </span>
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

const COLUMNS: TColumn[] = [
  {
    accessor: 'nom', // la clé pour accéder à la valeur
    Header: 'Tâches', // rendu dans la ligne d'en-tête
    Cell: CellTache, // rendu d'une cellule
  },
  {
    accessor: 'avancement',
    Header: 'Statuts',
    Cell: CellStatut,
  },
];

/**
 * Affiche la table "Détail des tâches"
 */
export const DetailTacheTable = (props: TDetailTacheTableProps) => {
  const {taches, updateActionStatut, fetchChildren} = props;

  // le jeu de données initial
  const data = useMemo(() => taches, []);

  // les sous-lignes chargées au fur et à mesure que les lignes sont dépliées
  const [subRows, setSubRows] = useState<Record<string, TacheDetail[]>>({});

  // les lignes indexées par id
  const rowById: Record<string, TacheDetail> = useMemo(
    () => data.reduce((dict, row) => ({...dict, [row.action_id]: row}), {}),
    []
  );

  // la définition des colonnes
  const columns: TColumn[] = useMemo(() => COLUMNS, []);

  // renvoi l'id d'une ligne
  const getRowId = useCallback((row: TacheDetail) => row.action_id, []);

  // renvoi les sous-lignes d'une ligne (ou tableau vide si données non disponibles)
  const getSubRows = useCallback(
    (row: TacheDetail): TacheDetail[] => {
      return subRows[row.action_id] || [];
    },
    [subRows]
  );

  // ajout aux props passées à chaque cellule
  const customCellProps = {updateActionStatut};

  // crée l'instance de la table et extrait les éléments passés au rendu
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
  } = useTable(
    {
      columns,
      data,
      getRowId,
      getSubRows,
    },
    useExpanded
  );

  // extrait les entrées déplies de l'état interne de la table
  const {expanded} = state;

  // quand les entrées dépliées changent
  useEffect(() => {
    // cherche dans les entrées dépliées
    const toFetch = Object.entries(expanded).find(([id]) => {
      const row = rowById[id] || subRows[id];
      // celle qui a des sous-items non chargées
      if (row) {
        const {have_children} = row;
        if (have_children && !getSubRows(row).length) {
          return true;
        }
      }
      return false;
    });

    if (toFetch) {
      const action_id = toFetch[0];
      const row = rowById[action_id];
      const {depth} = row;
      fetchChildren(action_id, depth + 1).then(children => {
        setSubRows({...subRows, [action_id]: children});
      });
    }
  }, [expanded]);

  return (
    <div className="detail-tache-table">
      <table {...getTableProps()}>
        <thead>
          {headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {headerGroup.headers.map(column => (
                <th {...column.getHeaderProps()}>{column.render('Header')}</th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {rows.map((row, index) => {
            prepareRow(row);
            const rowProps = row.getRowProps({
              className: `d${row.original.depth}`,
            });
            return (
              <Fragment key={rowProps.key}>
                <tr {...row.getToggleRowExpandedProps()} {...rowProps}>
                  {row.cells.map(cell => {
                    return (
                      <td {...cell.getCellProps()}>
                        {cell.render('Cell', customCellProps)}
                      </td>
                    );
                  })}
                </tr>
                {row.depth === 0 &&
                index < rows.length - 1 &&
                !row.isExpanded ? (
                  <tr className="separator" />
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
