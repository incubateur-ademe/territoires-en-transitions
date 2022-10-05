import {useEffect, useRef} from 'react';
import {
  Column,
  CellProps,
  useTable,
  useExpanded,
  useFlexLayout,
  Row,
} from 'react-table';
import {Referentiel} from 'types/litterals';
import {TableData} from './useTableData';
import {CellAction} from '../ReferentielTable/CellAction';
import {ActionReferentiel} from '../ReferentielTable/useReferentiel';
import {useCollectiviteId} from 'core-logic/hooks/params';
import '../ReferentielTable/styles.css';
import ActionPreuvePanel from 'ui/shared/actions/ActionPreuvePanel/ActionPreuvePanel';

export type TPreuvesTableProps = {
  tableData: TableData;
  referentielId: Referentiel;
};

export type TCellProps = CellProps<ActionReferentiel>;
export type TColumn = Column<ActionReferentiel>;

// défini les colonnes de la table
const COLUMNS: TColumn[] = [
  {
    accessor: 'nom', // la clé pour accéder à la valeur,
    Cell: CellAction, // rendu d'une cellule
    width: '100%',
  },
];

const subActionLevel = {
  cae: 4,
  eci: 3,
};

/**
 * Affiche la table "Preuves" d'un référentiel
 */
export const PreuvesTable = (props: TPreuvesTableProps) => {
  const collectiviteId = useCollectiviteId();
  const {tableData, referentielId} = props;
  const maxDepth = subActionLevel[referentielId];
  const {table, isLoading} = tableData;

  // crée l'instance de la table
  const tableInstance = useTable(
    {...table, columns: COLUMNS},
    useExpanded,
    useFlexLayout
  );
  const {
    toggleRowExpanded,
    flatRows,
    getTableProps,
    getTableBodyProps,
    rows,
    prepareRow,
  } = tableInstance;

  // initialement
  const isInitialLoading = useRef(true);
  useEffect(() => {
    if (table?.data?.length && isInitialLoading.current) {
      isInitialLoading.current = false;
      flatRows
        // filtre les lignes à déplier
        .filter(row => row.original.depth < maxDepth)
        // déplie les lignes voulues
        // NOTE: on utilise `as unknown as string[]` pour contourner une erreur
        // de typage dans react-table : `toggleRowExpanded` attend bien un id
        // unique en 1er argument et non un tableau comme l'indique son typage
        .forEach(row => toggleRowExpanded(row.id as unknown as string[]));
    }
  }, [table?.data?.length, flatRows, toggleRowExpanded, isInitialLoading]);

  // rendu de la table
  return (
    <div
      {...getTableProps()}
      className={`referentiel-table no-d3-border-top ${referentielId}`}
    >
      <div className="body" {...getTableBodyProps()}>
        {isLoading ? (
          <div className="message">Chargement en cours...</div>
        ) : rows.length ? (
          rows.map(
            (
              row: Row<ActionReferentiel>,
              index: number,
              rows: Row<ActionReferentiel>[]
            ) => {
              prepareRow(row);
              const {original, isExpanded} = row;
              const {depth, nom, identifiant, action_id} = original;
              // dernière ligne avant une nouvelle section
              const isLast =
                (!rows[index + 1] || rows[index + 1].depth === 0) &&
                row.depth > 0;

              const className = `row d${depth} ${
                isExpanded ? 'open' : 'close'
              } ${isLast ? 'last' : ''}`;

              const {key, ...rowProps} = row.getRowProps();

              const action = {
                id: action_id,
                identifiant,
                referentiel: referentielId,
              };

              return (
                <div key={key}>
                  {depth <= maxDepth ? (
                    <div
                      className={className}
                      title={(nom as string) || ''}
                      {...rowProps}
                    >
                      {row.cells.map(cell => {
                        return (
                          <div className="cell" {...cell.getCellProps()}>
                            {cell.render('Cell', {
                              collectiviteId,
                              referentielId,
                              alwaysShowExpand: true,
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                  {isExpanded && depth === maxDepth ? (
                    <div className="row py-5 pl-32">
                      <ActionPreuvePanel action={action} noIdentifiant />
                    </div>
                  ) : null}
                </div>
              );
            }
          )
        ) : (
          <div className="message">Aucun résultat</div>
        )}
      </div>
    </div>
  );
};
