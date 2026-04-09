import { makeReferentielActionUrl } from '@/app/app/paths';
import { CellContext } from '@tanstack/react-table';
import { ActionTypeEnum, ReferentielId } from '@tet/domain/referentiels';
import { Button, cn, Icon, TableCell, Tooltip } from '@tet/ui';
import { MouseEvent } from 'react';
import { ActionListItem } from '../actions/use-list-actions';
import { useReferentielTableCellFocus } from './referentiel-table.keyboard';
import { getColumnPinningStyles } from './utils';

type Props = {
  info: CellContext<ActionListItem, string>;
};

export const ReferentielTableTitleCell = ({ info }: Props) => {
  const { referentielCellProps } = useReferentielTableCellFocus(info.cell);
  const row = info.row;
  const { actionId, actionType, identifiant, childrenIds } = row.original;

  const haveChildren = childrenIds.length > 0;

  const isAxeOrSousAxe =
    actionType === ActionTypeEnum.AXE || actionType === ActionTypeEnum.SOUS_AXE;

  const pinning = getColumnPinningStyles(info.column, actionType);

  return (
    <TableCell
      {...referentielCellProps}
      className={cn(
        'group relative',
        haveChildren ? 'cursor-pointer' : '',
        pinning.className,
        referentielCellProps.className
      )}
      style={pinning.style}
      onClick={haveChildren ? row.getToggleExpandedHandler() : undefined}
    >
      {actionType === ActionTypeEnum.ACTION && (
        <div className="absolute right-4 inset-y-0 hidden group-hover:flex group-focus-within:flex">
          <Button
            type="button"
            variant="grey"
            size="xs"
            className="m-auto p-1"
            aria-expanded={row.getIsExpanded()}
            aria-label={
              row.getIsExpanded() ? 'Réduire la ligne' : 'Développer la ligne'
            }
            onClick={(event: MouseEvent<HTMLButtonElement>) =>
              event.stopPropagation()
            }
            href={makeReferentielActionUrl({
              collectiviteId: info.table.options.meta?.collectiviteId as number,
              referentielId: info.table.options.meta
                ?.referentielId as ReferentielId,
              actionId,
            })}
          >
            Ouvrir la mesure
          </Button>
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
          <Icon icon="transparent" />
        )}
        <span className="flex-1 line-clamp-1">
          <span
            className={cn({
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
      </div>
    </TableCell>
  );
};
