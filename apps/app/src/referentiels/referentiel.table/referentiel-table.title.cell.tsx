import { makeReferentielActionUrl } from '@/app/app/paths';
import { CellContext } from '@tanstack/react-table';
import { ActionTypeEnum } from '@tet/domain/referentiels';
import { Button, cn, Icon, TableCell, Tooltip } from '@tet/ui';
import { ReferentielTableRow } from './types';
import { actionTypeToClassName, getCommonPinningStyles } from './utils';

type Props = {
  info: CellContext<ReferentielTableRow, string>;
};

export const ReferentielTableTitleCell = ({ info }: Props) => {
  const row = info.row;
  const action = row.original;
  const haveChildren = action.children && action.children.length > 0;

  // const paddingLeft = depth * 8;
  const paddingLeft = 0;

  const isAxeOrSousAxe =
    action.type === ActionTypeEnum.AXE ||
    action.type === ActionTypeEnum.SOUS_AXE;

  return (
    <TableCell
      className={cn('group relative', actionTypeToClassName[action.type])}
      style={{ ...getCommonPinningStyles(info.column) }}
    >
      {action.type === ActionTypeEnum.ACTION && (
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
            href={makeReferentielActionUrl({
              collectiviteId: action.collectiviteId,
              referentielId: action.referentielId,
              actionId: action.id,
            })}
          >
            Ouvrir la mesure
          </Button>
        </div>
      )}
      <div
        className={cn(
          'flex items-center gap-2',
          haveChildren ? 'cursor-pointer' : ''
        )}
        onClick={haveChildren ? row.getToggleExpandedHandler() : undefined}
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
          <Icon icon="transparent" />
        )}
        <span className="flex-1 line-clamp-1">
          <span
            className={cn({
              'text-grey-8': !isAxeOrSousAxe,
            })}
          >
            {action.identifiant} -{' '}
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
