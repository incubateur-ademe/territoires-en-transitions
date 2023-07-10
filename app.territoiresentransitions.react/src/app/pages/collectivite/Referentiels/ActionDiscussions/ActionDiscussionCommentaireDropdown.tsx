import ThreeDotMenu from 'ui/shared/select/ThreeDotMenu';
import {useDeleteCommentaireFromDiscussion} from './data/useDeleteCommentaireFromDiscussion';

type Props = {
  commentaire_id: number;
};

const OPTIONS = [
  {
    value: 'delete',
    label: 'Supprimer mon commentaire',
    icon: 'fr-icon-delete-line',
  },
];

/** Menu et options pour un commentaire dans une discussion */
const ActionDiscussionCommentaireDropdown = ({commentaire_id}: Props) => {
  const {mutate: deleteCommentaire} = useDeleteCommentaireFromDiscussion();

  return (
    <ThreeDotMenu
      options={OPTIONS}
      onSelect={value => {
        if (value === 'delete') {
          deleteCommentaire(commentaire_id);
        }
      }}
      dataTest="ActionDiscussionCommentaireMenu"
      dataTestButton="ActionDiscussionCommentaireMenuButton"
    />
  );
};

export default ActionDiscussionCommentaireDropdown;
