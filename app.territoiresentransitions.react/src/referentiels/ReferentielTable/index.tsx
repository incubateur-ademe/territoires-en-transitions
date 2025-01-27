import { ReferentielParamOption } from '@/app/app/paths';
import {
  useCollectiviteId,
  useReferentielId,
} from '@/app/core-logic/hooks/params';
import { useCallback, useMemo } from 'react';
import { TableInstance } from 'react-table';
import { makeRowRenderer } from './Row';
import './styles.css';

type Table = <T extends Record<string, unknown>>(props: {
  className?: string;
  isLoading: boolean;
  table: TableInstance<T>;
  customHeaderProps: Record<string, unknown>;
  customCellProps?: Record<string, unknown>;
  dataTest?: string;
}) => JSX.Element;

export const ReferentielTable: Table = (props) => {
  const {
    className,
    isLoading,
    table,
    customHeaderProps,
    customCellProps,
    dataTest,
  } = props;
  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    table;

  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId() as ReferentielParamOption;
  const cellProps = useMemo(
    () => ({ collectiviteId, referentielId, ...(customCellProps || {}) }),
    [collectiviteId, referentielId, customCellProps]
  );

  // rendu d'une ligne
  const renderRow = useCallback(makeRowRenderer(prepareRow, cellProps), [
    prepareRow,
    cellProps,
  ]);

  return (
    <div
      {...getTableProps()}
      className={`referentiel-table ${referentielId} ${className || ''}`}
      data-test={dataTest}
    >
      <div className="header">
        {headerGroups.map((headerGroup) => {
          const { key, ...headerGroupProps } =
            headerGroup.getHeaderGroupProps();
          return (
            <div className="row" key={key} {...headerGroupProps}>
              {headerGroup.headers.map((column) => {
                const { key, ...headerProps } = column.getHeaderProps();
                return (
                  <div className="cell" key={key} {...headerProps}>
                    {column.render('Header', customHeaderProps)}
                  </div>
                );
              })}
            </div>
          );
        })}
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
