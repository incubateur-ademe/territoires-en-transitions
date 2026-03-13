import { CellContext } from '@tanstack/react-table';
import { StatutAvancementIncludingNonConcerne } from '@tet/domain/referentiels';
import { cn, TableCell } from '@tet/ui';
import ActionStatutBadge from '../actions/action-statut/action-statut.badge';
import { ChooseActionStatutSelect } from '../actions/action-statut/choose-action-statut.select';
import { useUpdateActionStatut } from '../actions/action-statut/use-update-action-statut';
import { ReferentielTableRow } from './types';
import { actionTypeToClassName } from './utils';

type Props = {
  info: CellContext<
    ReferentielTableRow,
    StatutAvancementIncludingNonConcerne | undefined
  >;
  updateActionStatut: ReturnType<typeof useUpdateActionStatut>['mutate'];
};

export const ReferentielTableStatutCell = ({
  info,
  updateActionStatut,
}: Props) => {
  const data = info.row.original;

  return (
    <TableCell
      className={cn(actionTypeToClassName[data.type])}
      canEdit={true}
      edit={{
        renderOnEdit: ({ openState }) => {
          return (
            <ChooseActionStatutSelect
              openState={openState}
              value={data.statut}
              onChange={(value) =>
                updateActionStatut({ actionId: data.id, statut: value })
              }
              badgeSize="xs"
            />
          );
        },
      }}
    >
      <ActionStatutBadge statut={data.statut} size="xs" className="m-auto" />
    </TableCell>
  );
};
