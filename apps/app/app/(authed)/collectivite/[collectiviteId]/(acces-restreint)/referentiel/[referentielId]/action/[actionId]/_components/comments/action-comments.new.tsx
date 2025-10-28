import { useCollectiviteId } from '@/api/collectivites';
import { ReferentielId } from '@/domain/referentiels';
import ActionCommentInput from './action-comments.input';
import { useAddDiscussionToAction } from './data/useAddDiscussionToAction';

type Props = {
  actionId: string;
  referentielId: ReferentielId;
};

const ActionCommentNew = ({ actionId, referentielId }: Props) => {
  const collectiviteId = useCollectiviteId();
  const { mutate: handleCreateDiscussion } = useAddDiscussionToAction(
    actionId,
    referentielId
  );

  const onSave = (message: string) => {
    handleCreateDiscussion({ message, collectiviteId, actionId });
  };

  return (
    <ActionCommentInput
      dataTest="ActionDiscussionsNouvelleDiscussion"
      placeholder="Écrire un nouveau commentaire..."
      onSave={onSave}
    />
  );
};

export default ActionCommentNew;
