import { makeReferentielActionUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { CellContext } from '@tanstack/react-table';
import { Action, ActionTypeEnum } from '@tet/domain/referentiels';
import { Button, cn, Icon, TableCell, Tooltip } from '@tet/ui';
import { getActionInfoPanelSearchParams } from 'app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/side-panel/informations.config';
import { MouseEvent } from 'react';
import { ActionListItem } from '../actions/use-list-actions';
import { getTableMeta } from './utils';

type Props = {
  info: CellContext<ActionListItem, string>;
};

export const ReferentielTableTitleCell = ({ info }: Props) => {
  const row = info.row;
  const { actionType, identifiant, childrenIds } = row.original;

  const haveChildren = childrenIds.length > 0;

  const isAxeOrSousAxe =
    actionType === ActionTypeEnum.AXE || actionType === ActionTypeEnum.SOUS_AXE;

  return (
    <TableCell
      pinnedLeft
      tabIndex={-1}
      data-cell-id={info.cell.id}
      className={cn(haveChildren ? 'cursor-pointer' : '')}
      onClick={haveChildren ? row.getToggleExpandedHandler() : undefined}
    >
      <div
        className={cn('flex items-center gap-2')}
        style={{ paddingLeft: `${row.depth + (haveChildren ? 0 : -1) * 1}rem` }}
      >
        {haveChildren ? (
          <Icon
            icon={
              row.getIsExpanded() ? 'arrow-down-s-line' : 'arrow-right-s-line'
            }
            className={cn({
              'text-white': isAxeOrSousAxe,
              'text-primary-9': !isAxeOrSousAxe,
            })}
          />
        ) : (
          <span className="w-5 h-5 shrink-0" />
        )}

        <div className="flex flex-col items-left gap-2">
          <span className="flex-1 line-clamp-1">
            <span
              className={cn('tabular-nums', {
                'text-grey-8': !isAxeOrSousAxe,
              })}
            >
              {`${identifiant} - `}
            </span>
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
  cell: CellContext<ActionListItem, string>;
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
