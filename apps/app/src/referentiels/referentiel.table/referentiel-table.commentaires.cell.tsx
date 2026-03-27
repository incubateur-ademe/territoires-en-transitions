import { useCommentPanel } from '@/app/referentiels/actions/comments/hooks/use-comment-panel';
import { CellContext } from '@tanstack/react-table';
import { ActionTypeEnum } from '@tet/domain/referentiels';
import { TableCell } from '@tet/ui';
import { ActionProvider } from '../actions/action-context';
import { ActionListItem } from '../actions/use-list-actions';
import { ReferentielTableNotificationCell } from './referentiel-table.notification.cell';

type Props = {
  info: CellContext<ActionListItem, number | undefined>;
};

const ReferentielTableCommentairesCellContent = ({ info }: Props) => {
  const action = info.row.original;
  // const { referentielId, comments } = getTableMeta(info.table);

  const { openCommentPanel } = useCommentPanel();

  const actionComments = [];

  // const actionComments = comments.find(
  //   (comment) => comment.actionId === action.actionId
  // );

  return (
    <ReferentielTableNotificationCell
      onClick={() => {
        openCommentPanel({ action });
      }}
      count={actionComments.length}
    />
  );
};

export const ReferentielTableCommentairesCell = ({ info }: Props) => {
  const data = info.row.original;

  if (data.actionType === ActionTypeEnum.ACTION) {
    return (
      <ActionProvider actionId={data.actionId}>
        <ReferentielTableCommentairesCellContent info={info} />
      </ActionProvider>
    );
  }

  return <TableCell />;
};
