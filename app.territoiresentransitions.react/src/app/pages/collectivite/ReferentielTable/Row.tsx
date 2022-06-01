import {Row} from 'react-table';

type RowRendererFactory = <T extends Record<string, unknown>>(
  /** prépare la ligne (fonction fournie par useTable)  */
  prepareRow: (row: Row<T>) => void,
  /** props affectées à chaque cellule */
  customCellProps: Record<string, unknown>
) => (row: Row<T>, index: number, rows: Row<T>[]) => JSX.Element;

// renvoi un composant qui affiche une ligne du tableau
export const makeRowRenderer: RowRendererFactory =
  (prepareRow, customCellProps) => (row, index, rows) => {
    prepareRow(row);
    const {original, isExpanded} = row;
    const {depth, nom} = original;
    // dernière ligne avant une nouvelle section
    const isLast =
      (!rows[index + 1] || rows[index + 1].depth === 0) && row.depth > 0;

    const className = `row d${depth} ${isExpanded ? 'open' : 'close'} ${
      isLast ? 'last' : ''
    }`;

    return (
      <div
        {...row.getRowProps()}
        className={className}
        title={(nom as string) || ''}
      >
        {row.original.have_children ? (
          <div className="cell" {...row.cells[0].getCellProps()}>
            {row.cells[0].render('Cell')}
          </div>
        ) : (
          row.cells.map(cell => {
            return (
              <div className="cell" {...cell.getCellProps()}>
                {cell.render('Cell', customCellProps)}
              </div>
            );
          })
        )}
      </div>
    );
  };
