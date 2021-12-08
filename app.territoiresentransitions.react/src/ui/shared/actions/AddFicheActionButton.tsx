import {Link} from 'react-router-dom';
import {useCollectiviteId} from 'core-logic/hooks';

export const AddFicheActionButton = (props: {actionId?: string}) => {
  const collectiviteId = useCollectiviteId();
  const linkTo = props.actionId
    ? `/collectivite/${collectiviteId}/nouvelle_fiche?action_id=${props.actionId}`
    : `/collectivite/${collectiviteId}/nouvelle_fiche`;
  return (
    <Link
      className="fr-btn fr-btn--secondary fr-btn--sm fr-fi-file-fill fr-btn--icon-left"
      to={linkTo}
    >
      Ajouter une fiche action
    </Link>
  );
};
