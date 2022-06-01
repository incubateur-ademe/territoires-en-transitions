import {useCallback} from 'react';
import {TableInstance} from 'react-table';
import {makeRowRenderer} from './Row';
import './styles.css';

type Table = <T extends Record<string, unknown>>(props: {
  isLoading: boolean;
  table: TableInstance<T>;
  customHeaderProps: Record<string, unknown>;
  customCellProps: Record<string, unknown>;
}) => JSX.Element;

const ReferentielTable: Table = props => {
  const {isLoading, table, customHeaderProps, customCellProps} = props;
  const {getTableProps, getTableBodyProps, headerGroups, rows, prepareRow} =
    table;

  // rendu d'une ligne
  const renderRow = useCallback(makeRowRenderer(prepareRow, customCellProps), [
    prepareRow,
    customCellProps,
  ]);

  return (
    <div {...getTableProps()} className="referentiel-table">
      <div className="header">
        {headerGroups.map(headerGroup => (
          <div className="row" {...headerGroup.getHeaderGroupProps()}>
            {headerGroup.headers.map(column => (
              <div className="cell" {...column.getHeaderProps()}>
                {column.render('Header', customHeaderProps)}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div className="body" {...getTableBodyProps()}>
        {isLoading ? (
          <div className="message">Chargement en cours...</div>
        ) : rows.length ? (
          rows.map(renderRow)
        ) : (
          <div className="message">Aucun résultat</div>
        )}
      </div>
    </div>
  );
};

export default ReferentielTable;
