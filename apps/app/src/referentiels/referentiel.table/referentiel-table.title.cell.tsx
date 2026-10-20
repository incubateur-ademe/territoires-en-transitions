import { makeReferentielActionUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { CellContext } from '@tanstack/react-table';
import {
  Action,
  ActionTypeEnum,
  isNewReferentiel as isNewReferentielUtils,
} from '@tet/domain/referentiels';
import { Button, cn, Icon, TableCell, Tooltip } from '@tet/ui';
import { MouseEvent } from 'react';
import { getActionInfoPanelSearchParams } from '../../../app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/side-panel/informations.config';
import { ActionListItem } from '../actions/use-list-actions';
import { useReferentielThematiqueView } from './use-referentiel-thematique-view';
import { ExpandShortcutsTooltipLabel } from './expand-shortcuts.tooltip-label';
import {
  getExpandedStateByLevel,
  listExpandableRows,
} from './toggle-rows-expanded-by-level';
import {
  canExpandReferentielTableRow,
  getTableMeta,
  ReferentielTableFeatures,
} from './utils';

type Props = {
  info: CellContext<ReferentielTableFeatures, ActionListItem, string>;
};

export const ReferentielTableTitleCell = ({ info }: Props) => {
  const row = info.row;
  const { actionType, identifiant } = row.original;
  const table = info.table;

  const referentielId = table.options.meta?.referentielId;

  const isNewReferentiel =
    referentielId && isNewReferentielUtils(referentielId);

  const { view } = useReferentielThematiqueView();

  const haveDisplayableChildren = canExpandReferentielTableRow(
    row.original,
    referentielId
  );

  // Shift + clic : plie/déplie les lignes de même niveau de l'axe
  // Alt + clic : déplie aussi les lignes de même niveau des autres axes
  const toggleExpanded = (event: MouseEvent<HTMLTableCellElement>) => {
    if (!event.shiftKey && !event.altKey) {
      row.toggleExpanded();
      return;
    }
    const { data, getSubRows } = table.options;
    const rows = listExpandableRows({
      roots: data,
      getId: (action) => action.actionId,
      getChildren: (action) => getSubRows?.(action, 0) ?? [],
      canExpand: (action) =>
        canExpandReferentielTableRow(action, referentielId),
    });
    table.setExpanded((expanded) =>
      getExpandedStateByLevel({
        rows,
        expanded,
        clickedId: row.id,
        scope: event.shiftKey ? 'axe' : 'all',
      })
    );
  };

  const isAxeOrSousAxe =
    actionType === ActionTypeEnum.AXE || actionType === ActionTypeEnum.SOUS_AXE;

  return (
    <TableCell
      pinnedLeft
      tabIndex={-1}
      data-cell-id={info.cell.id}
      className={cn(haveDisplayableChildren ? 'cursor-pointer' : '')}
      onClick={haveDisplayableChildren ? toggleExpanded : undefined}
      // évite la sélection de texte provoquée par Shift + clic
      onMouseDown={(event) => {
        if (haveDisplayableChildren && event.shiftKey) event.preventDefault();
      }}
    >
      <div
        className={cn('flex items-center gap-2')}
        style={{
          paddingLeft: `${
            row.depth + (haveDisplayableChildren ? 0 : -1) * 1
          }rem`,
        }}
      >
        {haveDisplayableChildren ? (
          <Tooltip
            label={
              <ExpandShortcutsTooltipLabel isExpanded={row.getIsExpanded()} />
            }
          >
            <span className="flex">
              <Icon
                icon={
                  row.getIsExpanded()
                    ? 'arrow-down-s-line'
                    : 'arrow-right-s-line'
                }
                className={cn({
                  'text-white': isAxeOrSousAxe,
                  'text-primary-9': !isAxeOrSousAxe,
                })}
              />
            </span>
          </Tooltip>
        ) : (
          <span className="w-5 h-5 shrink-0" />
        )}

        <div className="flex flex-col items-left gap-2">
          <span className="flex-1 line-clamp-1">
            {!(isNewReferentiel && view === 'sgpe' && isAxeOrSousAxe) && (
              <span
                className={cn('tabular-nums', {
                  'text-grey-8': !isAxeOrSousAxe,
                })}
              >
                {`${identifiant} - `}
              </span>
            )}
            <Tooltip label={info.getValue()}>
              <span
                className={cn({
                  'text-primary-9': !isAxeOrSousAxe,
                })}
              >
                {info.getValue()}
              </span>
            </Tooltip>
          </span>
        </div>
      </div>

      {actionType === ActionTypeEnum.ACTION && (
        <div className="absolute right-4 inset-y-0 hidden group-hover:flex group-focus-within:flex">
          <OpenActionPageButton action={row.original} cell={info} />
        </div>
      )}
    </TableCell>
  );
};

function OpenActionPageButton({
  action,
  cell,
}: {
  action: Action;
  cell: CellContext<ReferentielTableFeatures, ActionListItem, string>;
}) {
  const { referentielId, collectiviteId } = getTableMeta(cell.table);

  return (
    <Button
      type="button"
      variant="grey"
      size="xs"
      className="m-auto p-1"
      aria-expanded={cell.row.getIsExpanded()}
      aria-label={
        cell.row.getIsExpanded() ? 'Réduire la ligne' : 'Développer la ligne'
      }
      data-test={`open-action-page-button-${action.identifiant}`}
      onClick={(event: MouseEvent<HTMLButtonElement>) =>
        event.stopPropagation()
      }
      href={makeReferentielActionUrl({
        collectiviteId,
        referentielId,
        actionId: action.actionId,
        searchParams: getActionInfoPanelSearchParams(action),
      })}
    >
      {appLabels.ouvrirLaMesure}
    </Button>
  );
}
