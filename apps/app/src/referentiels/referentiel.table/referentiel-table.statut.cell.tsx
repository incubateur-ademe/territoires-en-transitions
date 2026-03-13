import { CellContext } from '@tanstack/react-table';
import {
  ActionTypeEnum,
  StatutAvancementIncludingNonConcerne,
} from '@tet/domain/referentiels';
import { cn, TableCell } from '@tet/ui';
import ActionStatutBadge from '../actions/action-statut/action-statut.badge';
import { SelectActionStatut } from '../actions/action-statut/action-statut.select';
import { ReferentielTableRow } from './types';
import { actionTypeToClassName } from './utils';

type Props = {
  info: CellContext<
    ReferentielTableRow,
    StatutAvancementIncludingNonConcerne | undefined
  >;
};

export const ReferentielTableStatutCell = ({ info }: Props) => {
  const data = info.row.original;

  const canDisplayStatut =
    data.type === ActionTypeEnum.SOUS_ACTION ||
    data.type === ActionTypeEnum.TACHE;

  return (
    <TableCell
      className={cn(actionTypeToClassName[data.type])}
      canEdit={true}
      edit={{
        renderOnEdit: ({ openState }) => {
          return (
            <SelectActionStatut
              openState={openState}
              value={data.statut}
              onChange={(statut) => {}}
            />
          );
        },
      }}
    >
      <>
        {canDisplayStatut && (
          <>
            {data.statut ? (
              <ActionStatutBadge
                statut={data.statut}
                size="xs"
                className="m-auto"
              />
            ) : (
              <ActionStatutBadge
                statut="non_renseigne"
                size="xs"
                className="m-auto"
              />
            )}
          </>
        )}
      </>
    </TableCell>
  );
};
