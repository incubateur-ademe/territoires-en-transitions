import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { cn } from '@tet/ui';
import { ActionType } from '@tet/domain/referentiels';
import { JSX, useMemo } from 'react';
import { TableInstance } from 'react-table';
import {
  useGetReferentielDefinitionFromContext,
  useReferentielId,
} from '../referentiel-context';
import { makeRowRenderer } from './Row';
import './styles.css';

const EMPTY_HIERARCHIE: ActionType[] = [];

type Table = <T extends Record<string, unknown>>(props: {
  className?: string;
  isLoading: boolean;
  table: TableInstance<T>;
  customHeaderProps: Record<string, unknown>;
  customCellProps?: Record<string, unknown>;
  dataTest?: string;
}) => JSX.Element;

/**
 * @deprecated
 */
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
  const referentielId = useReferentielId();
  const hierarchie =
    useGetReferentielDefinitionFromContext()?.hierarchie ?? EMPTY_HIERARCHIE;
  const cellProps = useMemo(
    () => ({
      collectiviteId,
      referentielId,
      hierarchie,
      ...(customCellProps || {}),
    }),
    [collectiviteId, referentielId, hierarchie, customCellProps]
  );

  // rendu d'une ligne
  const renderRow = makeRowRenderer(prepareRow, cellProps);

  return (
    <div
      {...getTableProps()}
      className={cn(
        'referentiel-table bg-grey-4 border-grey-4',
        referentielId,
        className
      )}
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
          <div className="message">{appLabels.chargementEnCours}</div>
        ) : rows.length ? (
          rows.map(renderRow)
        ) : (
          <div className="message">{appLabels.resultat({ count: 0 })}</div>
        )}
      </div>
    </div>
  );
};
