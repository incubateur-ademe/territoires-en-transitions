import { useCollectiviteId } from '@/api/collectivites';
import ActionCommentInput from './action-comments.input';
import { useAddDiscussion } from './hooks/use-add-discussion';

type Props = {
  actionId: string;
  disabledInput: boolean;
};

const ActionCommentNew = ({ actionId, disabledInput }: Props) => {
  const collectiviteId = useCollectiviteId();
  const { mutate: handleAddDiscussion } = useAddDiscussion();

  const onSave = (message: string) => {
    handleAddDiscussion({ message, actionId, collectiviteId });
  };

  return (
    <ActionCommentInput
      dataTest="ActionDiscussionsNouvelleDiscussion"
      placeholder="Écrire un nouveau commentaire..."
      onSave={onSave}
      disabled={disabledInput}
      onClose={() => {}}
    />
  );
};

export default ActionCommentNew;
