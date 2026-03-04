import ListWithTooltip from '@/app/ui/lists/ListWithTooltip';
import { TagWithCollectiviteId } from '@tet/domain/collectivites';
import { ActionType } from '@tet/domain/referentiels';
import { cn, TableCell } from '@tet/ui';
import { actionTypeToClassName } from './utils';

type Props = {
  services?: TagWithCollectiviteId[];
  actionType: ActionType;
};

export const ReferentielTableServicesPilotesCell = ({
  services,
  actionType,
}: Props) => {
  return (
    <TableCell className={cn(actionTypeToClassName[actionType])}>
      {services && services.length > 0 ? (
        <ListWithTooltip
          title={services[0].nom}
          list={services.map((s) => s.nom)}
          className="text-grey-8"
          renderFirstItem={(item) => (
            <span className="max-w-48 line-clamp-1 text-primary-9">{item}</span>
          )}
        />
      ) : null}
    </TableCell>
  );
};
