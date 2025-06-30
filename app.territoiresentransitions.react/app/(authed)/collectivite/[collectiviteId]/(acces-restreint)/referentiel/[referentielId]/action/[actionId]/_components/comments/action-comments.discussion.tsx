import { useAddCommentaireToDiscussion } from 'app.territoiresentransitions.react/app/(authed)/collectivite/[collectiviteId]/(acces-restreint)/referentiel/[referentielId]/action/[actionId]/_components/comments/data/useAddCommentaireToDiscussion';
import ActionCommentInput from './action-comments.input';
import ActionCommentsItemsList from './action-comments.items-list';
import { TActionDiscussion } from './action-comments.types';

export type Props = {
  discussion: TActionDiscussion;
};

const ActionCommentDiscussion = ({ discussion }: Props) => {
  const { mutate: handleAddCommentaireToDiscussion } =
    useAddCommentaireToDiscussion(discussion.id);

  return (
    <div className="flex flex-col gap-6">
      <ActionCommentsItemsList discussion={discussion} />
      {discussion.status === 'ouvert' && (
        <ActionCommentInput
          placeholder="Répondre"
          onSave={handleAddCommentaireToDiscussion}
        />
      )}
    </div>
  );
};

export default ActionCommentDiscussion;
