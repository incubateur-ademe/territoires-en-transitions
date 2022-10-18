import noCommentIllustration from 'app/static/img/no-comment-illustration.svg';
import {TVue} from './ActionDiscussions';

const fakeDiscussionOuvertes = [];
const fakeDiscussionFermees = [];

type Props = {
  vue: TVue;
};

const ActionDiscussionsFeed = ({vue}: Props) => {
  return (
    <div>
      {vue === 'ouverts' && (
        <>
          {fakeDiscussionOuvertes.length === 0 ? (
            <ActionDiscussionsFeedVide message="Aucun commentaire ouvert pour l’instant" />
          ) : (
            <div>plein ouverts</div>
          )}
        </>
      )}
      {vue === 'fermer' && (
        <>
          {fakeDiscussionFermees.length === 0 ? (
            <ActionDiscussionsFeedVide message="Aucun commentaire fermé pour l'instant" />
          ) : (
            <div>FERMER</div>
          )}
        </>
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
