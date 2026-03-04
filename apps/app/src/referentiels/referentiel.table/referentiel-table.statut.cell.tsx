import {
  ActionType,
  ActionTypeEnum,
  StatutAvancementIncludingNonConcerne,
} from '@tet/domain/referentiels';
import { cn, TableCell } from '@tet/ui';
import ActionStatutBadge from '../actions/action-statut/action-statut.badge';
import { actionTypeToClassName } from './utils';

type Props = {
  actionType: ActionType;
  statut?: StatutAvancementIncludingNonConcerne | null;
};

export const ReferentielTableStatutCell = ({ actionType, statut }: Props) => {
  const canDisplayStatut =
    actionType === ActionTypeEnum.SOUS_ACTION ||
    actionType === ActionTypeEnum.TACHE;

  return (
    <TableCell className={cn(actionTypeToClassName[actionType])}>
      <>
        {canDisplayStatut && (
          <>
            {statut ? (
              <ActionStatutBadge statut={statut} size="xs" className="m-auto" />
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
