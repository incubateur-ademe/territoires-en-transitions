import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { PersonneTagOrUser } from '@tet/domain/collectivites';
import { ActionType } from '@tet/domain/referentiels';
import { cn, TableCell } from '@tet/ui';
import { actionTypeToClassName } from './utils';

type Props = {
  pilotes?: PersonneTagOrUser[];
  actionType: ActionType;
};

export const ReferentielTablePersonnesPilotesCell = ({
  pilotes,
  actionType,
}: Props) => {
  return (
    <TableCell className={cn(actionTypeToClassName[actionType])}>
      {pilotes && pilotes.length > 0 ? (
        <ListWithTooltip
          title={pilotes[0].nom}
          list={pilotes.map((p) => p.nom)}
          className="text-grey-8"
          renderFirstItem={(item) => (
            <span className="max-w-48 line-clamp-1 text-primary-9">{item}</span>
          )}
        />
      ) : null}
    </TableCell>
  );
};
