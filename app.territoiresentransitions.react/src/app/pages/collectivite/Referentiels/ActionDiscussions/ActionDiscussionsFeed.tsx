import noCommentIllustration from 'app/static/img/no-comment-illustration.svg';
import ActionDiscussion from './ActionDiscussion';
import { TActionDiscussion, TActionDiscussionStatut } from './data/types';
import Image from 'next/image';

type Props = {
  vue: TActionDiscussionStatut;
  discussions: TActionDiscussion[];
};

/** Affiche les discussions celon leur statut dans une action */
const ActionDiscussionsFeed = ({ vue, discussions }: Props) => {
  const messageFeedVide = `Aucun commentaire ${
    (vue === 'ouvert' && 'ouvert') || (vue === 'ferme' && 'fermé')
  } pour l’instant`;

  return (
    <div data-test="ActionDiscussionsFeed" className="grow overflow-y-auto">
      {discussions.length === 0 ? (
        <ActionDiscussionsFeedVide message={messageFeedVide} />
      ) : (
        <div>
          {discussions.map(
            (d) =>
              d.commentaires && <ActionDiscussion key={d.id} discussion={d} />
          )}
        </div>
      )}
    </div>
  );
};

export default ActionDiscussionsFeed;

const ActionDiscussionsFeedVide = ({ message }: { message: string }) => (
  <div className="mt-32 text-sm text-center text-gray-400 p-10">
    <Image
      src={noCommentIllustration}
      alt="illustration commentaire vide"
      className="mx-auto mb-4"
    />
    {message}
  </div>
);
