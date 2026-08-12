import { useListDiscussions } from '@/app/referentiels/actions/comments/hooks/use-list-discussions';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { SidePanelButton } from '../side-panel/buttons';

type Props = {
  subAction: ActionListItem;
};

export const SubactionCommentsButton = ({ subAction }: Props) => {
  const { data } = useListDiscussions(subAction.referentielId, {
    actionId: subAction.actionId,
  });

  return (
    <SidePanelButton
      panelId="comments"
      count={data?.count ?? 0}
      targetActionId={subAction.actionId}
    />
  );
};
