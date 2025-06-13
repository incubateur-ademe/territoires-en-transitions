import { useAddDiscussionToAction } from '@/app/referentiels/actions/action-discussion/data/useAddDiscussionToAction';
import ActionCommentInput from './action-comments.input';

type Props = {
  actionId: string;
};

const ActionCommentNew = ({ actionId }: Props) => {
  const { mutate: handleCreateDiscussion } = useAddDiscussionToAction(actionId);

  return (
    <ActionCommentInput
      dataTest="ActionDiscussionsNouvelleDiscussion"
      placeholder="Écrire un nouveau commentaire..."
      onSave={handleCreateDiscussion}
    />
  );
};

export default ActionCommentNew;
