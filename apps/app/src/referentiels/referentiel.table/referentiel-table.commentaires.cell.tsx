import { CellContext } from '@tanstack/react-table';
import { ActionTypeEnum } from '@tet/domain/referentiels';
import { cn, TableCell } from '@tet/ui';
import { useCommentPanel } from 'app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/comments/hooks/use-comment-panel';
import { ActionProvider } from '../actions/action-context';
import { ReferentielTableNotificationCell } from './referentiel-table.notification.cell';
import { ReferentielTableRow } from './types';
import { actionTypeToClassName } from './utils';

type Props = {
  info: CellContext<ReferentielTableRow, number | undefined>;
};

const ReferentielTableCommentairesCellContent = ({ info }: Props) => {
  const data = info.row.original;

  const { openPanel } = useCommentPanel(data.referentielId, data.id);

  return (
    <ReferentielTableNotificationCell
      actionType={data.type}
      onClick={() => {
        openPanel(data.id);
      }}
      count={data.countComments}
    />
  );
};

export const ReferentielTableCommentairesCell = ({ info }: Props) => {
  const data = info.row.original;

  if (data.type === ActionTypeEnum.ACTION) {
    return (
      <ActionProvider actionId={data.id}>
        <ReferentielTableCommentairesCellContent info={info} />
      </ActionProvider>
    );
  }

  return <TableCell className={cn(actionTypeToClassName[data.type])} />;
};
