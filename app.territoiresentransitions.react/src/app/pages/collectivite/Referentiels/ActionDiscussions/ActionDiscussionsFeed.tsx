import noCommentIllustration from 'app/static/img/no-comment-illustration.svg';
import ActionDiscussion from './ActionDiscussion';
import {TActionDiscussion, TActionDiscussionStatut} from './data/types';

type Props = {
  vue: TActionDiscussionStatut;
  discussions: TActionDiscussion[];
};

/** Affiche les discussions celon leur statut dans une action */
const ActionDiscussionsFeed = ({vue, discussions}: Props) => {
  const messageFeedVide = `Aucun commentaire ${
    (vue === 'ouvert' && 'ouvert') || (vue === 'ferme' && 'fermé')
  } pour l’instant`;

  return (
    <div data-test="ActionDiscussionsFeed">
      {discussions.length === 0 ? (
        <ActionDiscussionsFeedVide message={messageFeedVide} />
      ) : (
        discussions.map(
          d => d.commentaires && <ActionDiscussion key={d.id} discussion={d} />
        )
      )}
    </div>
  );
};

export default ActionDiscussionsFeed;

const ActionDiscussionsFeedVide = ({message}: {message: string}) => (
  <div className="mt-32 text-sm text-center text-gray-400">
    <img
      src={noCommentIllustration}
      alt="illustration commentaire vide"
      className="mx-auto mb-4"
    />
    {message}
  </div>
);
