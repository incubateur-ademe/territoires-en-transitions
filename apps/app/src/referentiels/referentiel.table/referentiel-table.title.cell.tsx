import { makeReferentielActionUrl } from '@/app/app/paths';
import { CellContext } from '@tanstack/react-table';
import { ActionId, ActionTypeEnum } from '@tet/domain/referentiels';
import { Button, cn, Icon, TableCell, Tooltip } from '@tet/ui';
import { MouseEvent } from 'react';
import { ActionListItem } from '../actions/use-list-actions';
import { ProgressionBadgeAndBar } from './progression-badge-and-bar';
import { getTableMeta } from './utils';

type Props = {
  info: CellContext<ActionListItem, string>;
};

export const ReferentielTableTitleCell = ({ info }: Props) => {
  const row = info.row;
  const { actionId, actionType, identifiant, childrenIds } = row.original;

  const haveChildren = childrenIds.length > 0;

  const isAxeOrSousAxe =
    actionType === ActionTypeEnum.AXE || actionType === ActionTypeEnum.SOUS_AXE;

  return (
    <TableCell
      tabIndex={-1}
      data-cell-id={info.cell.id}
      className={cn('group relative', haveChildren ? 'cursor-pointer' : '')}
      onClick={haveChildren ? row.getToggleExpandedHandler() : undefined}
    >
      {actionType === ActionTypeEnum.ACTION && (
        <div className="absolute right-4 inset-y-0 hidden group-hover:flex group-focus-within:flex">
          <OpenActionPageButton actionId={actionId} cell={info} />
        </div>
      )}

      <div className={cn('flex items-center gap-2')}>
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
              {identifiant} -{' '}
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

          <ProgressionBadgeAndBar action={row.original} className="w-full" />
        </div>
      </div>
    </TableCell>
  );
};

function OpenActionPageButton({
  actionId,
  cell,
}: {
  actionId: ActionId;
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
        actionId,
      })}
    >
      Ouvrir la mesure
    </Button>
  );
}
