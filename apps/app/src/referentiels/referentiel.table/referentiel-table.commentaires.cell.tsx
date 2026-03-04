import { ActionTypeEnum } from '@tet/domain/referentiels';
import { cn, TableCell } from '@tet/ui';
import { useCommentPanel } from 'app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/comments/hooks/use-comment-panel';
import { ActionProvider } from '../actions/action-context';
import { ReferentielTableNotificationCell } from './referentiel-table.notification.cell';
import { ReferentielTableRow } from './types';
import { actionTypeToClassName } from './utils';

type Props = {
  info: ReferentielTableRow;
};

export const ReferentielTableCommentairesCellContent = ({ info }: Props) => {
  const { openPanel } = useCommentPanel(info.referentielId, info.id);

  return (
    <ReferentielTableNotificationCell
      actionType={info.type}
      onClick={() => {
        openPanel(info.id);
      }}
      count={info.countComments}
    />
  );
};

export const ReferentielTableCommentairesCell = ({ info }: Props) => {
  if (info.type === ActionTypeEnum.ACTION) {
    return (
      <ActionProvider actionId={info.id}>
        <ReferentielTableCommentairesCellContent info={info} />
      </ActionProvider>
    );
  }

  return <TableCell className={cn(actionTypeToClassName[info.type])} />;
};
