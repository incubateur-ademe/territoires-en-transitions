import {useCallback, useMemo} from 'react';
import {TableInstance} from 'react-table';
import {useCollectiviteId, useReferentielId} from 'core-logic/hooks/params';
import {ReferentielParamOption} from 'app/paths';
import {makeRowRenderer} from './Row';
import './styles.css';

type Table = <T extends Record<string, unknown>>(props: {
  className?: string;
  isLoading: boolean;
  table: TableInstance<T>;
  referentiel?: ReferentielParamOption;
  noHeader?: boolean;
  customHeaderProps?: Record<string, unknown>;
  customCellProps?: Record<string, unknown>;
}) => JSX.Element;

const ReferentielTable: Table = props => {
  const {
    className,
    isLoading,
    table,
    referentiel,
    noHeader,
    customHeaderProps,
    customCellProps,
  } = props;
  const {getTableProps, getTableBodyProps, headerGroups, rows, prepareRow} =
    table;

  const collectiviteId = useCollectiviteId();

  // si le nom du référentiel n'est pas passé en prop on l'obtient de l'url
  const referentielIdFromUrl = useReferentielId() as ReferentielParamOption;
  const referentielId = referentiel || referentielIdFromUrl;

  const cellProps = useMemo(
    () => ({collectiviteId, referentielId, ...(customCellProps || {})}),
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
    >
      {noHeader ? null : (
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
      )}
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
