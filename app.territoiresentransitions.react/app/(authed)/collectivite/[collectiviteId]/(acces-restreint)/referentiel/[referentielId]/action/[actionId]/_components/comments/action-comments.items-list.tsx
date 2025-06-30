import { Button } from '@/ui';
import classNames from 'classnames';
import { useState } from 'react';
import ActionCommentItem from './action-comments.item';
import { TActionDiscussion } from './action-comments.types';

type Props = {
  discussion: TActionDiscussion;
};

const ActionCommentsItemsList = ({ discussion }: Props) => {
  const { commentaires } = discussion;

  const [areCommentsExtended, setAreCommentsExtended] = useState(false);

  return (
    <div
      className={classNames('flex flex-col gap-4', {
        'bg-info-2 rounded-lg -m-2 p-2': discussion.status === 'ferme',
      })}
    >
      {/** Premier commentaire */}
      <ActionCommentItem
        comment={commentaires[0]}
        discussionId={discussion.id}
        discussionStatus={discussion.status}
      />

      {/** Commentaires collapsed si plus de 2 commentaires */}
      {commentaires.length > 2 &&
        (areCommentsExtended ? (
          commentaires
            .slice(1, commentaires.length - 1)
            .map((c) => (
              <ActionCommentItem
                key={c.id}
                comment={c}
                discussionStatus={discussion.status}
              />
            ))
        ) : (
          <Button
            icon="arrow-down-s-line"
            iconPosition="right"
            variant="underlined"
            size="sm"
            onClick={() => setAreCommentsExtended(true)}
            className="ml-10"
          >
            {commentaires.length - 2}
            {commentaires.length === 3 ? 'autre réponse' : 'autres réponses'}
          </Button>
        ))}

      {/** Suite des commentaires */}
      {commentaires.length > 1 && (
        <ActionCommentItem
          comment={commentaires[commentaires.length - 1]}
          discussionStatus={discussion.status}
        />
      )}
    </div>
  );
};

export default ActionCommentsItemsList;
