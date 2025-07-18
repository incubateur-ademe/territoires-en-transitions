import classNames from 'classnames';
import { Row } from 'react-table';

type RowRendererFactory = <T extends Record<string, unknown>>(
  /** prépare la ligne (fonction fournie par useTable)  */
  prepareRow: (row: Row<T>) => void,
  /** props affectées à chaque cellule */
  customCellProps?: Record<string, unknown>
) => (row: Row<T>, index: number, rows: Row<T>[]) => JSX.Element;

// renvoi un composant qui affiche une ligne du tableau
export const makeRowRenderer: RowRendererFactory = (
  prepareRow,
  customCellProps
) =>
  function Row(row, index, rows) {
    prepareRow(row);
    const { original, isExpanded, canExpand } = row;
    const { depth, nom } = original;
    // dernière ligne avant une nouvelle section
    const isLast =
      (!rows[index + 1] || rows[index + 1].depth === 0) && row.depth > 0;

    const className = `row d${depth} ${isExpanded ? 'open' : 'close'} ${
      isLast ? 'last' : ''
    }`;

    const { key, ...rowProps } = row.getRowProps();

    return (
      <div
        {...rowProps}
        key={key}
        onClick={() => row.toggleRowExpanded()}
        className={classNames(className, { 'cursor-pointer': canExpand })}
        title={(nom as string) || ''}
      >
        {row.cells.map((cell) => {
          const { key, ...cellProps } = cell.getCellProps();
          return (
            <div className="cell" key={key} {...cellProps}>
              {cell.render('Cell', customCellProps)}
            </div>
          );
        })}
      </div>
    );
  };
