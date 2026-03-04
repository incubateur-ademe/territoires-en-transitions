import { makeReferentielActionUrl } from '@/app/app/paths';
import { CellContext } from '@tanstack/react-table';
import { Button, cn, Icon, TableCell, Tooltip } from '@tet/ui';
import { ReferentielTableRow } from './types';
import { actionTypeToClassName, getCommonPinningStyles } from './utils';

type Props = {
  info: CellContext<ReferentielTableRow, string>;
};

export const ReferentielTableTitleCell = ({ info }: Props) => {
  const row = info.row;
  const depth = row.original.depth;
  const haveChildren =
    row.original.children && row.original.children.length > 0;

  const paddingLeft = depth * 16;

  const isAxeOrSousAxe =
    row.original.type === 'axe' || row.original.type === 'sous-axe';

  return (
    <TableCell
      className={cn('group relative', actionTypeToClassName[row.original.type])}
      style={{ ...getCommonPinningStyles(info.column) }}
    >
      {row.original.type === 'action' && (
        <div className="absolute right-4 inset-y-0 hidden group-hover:flex">
          <Button
            variant="grey"
            size="xs"
            className="m-auto p-1"
            href={makeReferentielActionUrl({
              collectiviteId: row.original.collectiviteId,
              referentielId: row.original.referentielId,
              actionId: row.original.id,
            })}
          >
            Ouvrir la mesure
          </Button>
        </div>
      )}
      <div
        className="flex items-center gap-2"
        style={{
          paddingLeft: haveChildren
            ? `${paddingLeft}px`
            : `${paddingLeft + 16}px`,
        }}
      >
        {haveChildren && (
          <button
            onClick={row.getToggleExpandedHandler()}
            className="flex p-0.5"
          >
            <Icon
              icon={
                row.getIsExpanded() ? 'arrow-down-s-line' : 'arrow-right-s-line'
              }
              className={cn({
                'text-white': isAxeOrSousAxe,
                'text-primary-9': !isAxeOrSousAxe,
              })}
            />
          </button>
        )}
        <span className="flex-1 line-clamp-1">
          <span
            className={cn({
              'text-grey-8': !isAxeOrSousAxe,
            })}
          >
            {info.row.original.identifiant} -{' '}
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
