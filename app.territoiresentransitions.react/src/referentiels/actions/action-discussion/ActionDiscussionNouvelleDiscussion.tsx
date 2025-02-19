import Textarea from '@/app/ui/shared/form/Textarea';
import { Button } from '@/ui';
import { useState } from 'react';
import { useAddDiscussionToAction } from './data/useAddDiscussionToAction';

type Props = {
  actionId: string;
};

/** Input permettant de créer une nouvelle discussion dans une action */
const ActionDiscussionNouvelleDiscussion = ({ actionId }: Props) => {
  const [commentaire, setCommentaire] = useState<string>('');

  const { mutate: handleCreateDiscussion } = useAddDiscussionToAction(actionId);

  return (
    <div
      data-test="ActionDiscussionsNouvelleDiscussion"
      className="pt-4 pb-2 px-4 bg-grey-3"
    >
      <Textarea
        className="bg-white"
        value={commentaire}
        onInputChange={setCommentaire}
        placeholder="Écrire un nouveau commentaire..."
      />

      {commentaire.trim().length > 0 && (
        <Button
          className="mt-4 ml-2"
          size="xs"
          onClick={() => {
            setCommentaire('');
            handleCreateDiscussion(commentaire);
          }}
        >
          Publier
        </Button>
      )}
    </div>
  );
};

export default ActionDiscussionNouvelleDiscussion;
