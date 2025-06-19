import { useAddDiscussionToAction } from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/comments/data/useAddDiscussionToAction';
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
