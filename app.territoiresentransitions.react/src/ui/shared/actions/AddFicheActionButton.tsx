import {Link} from 'react-router-dom';
import {useEpciId} from 'core-logic/hooks';

export const AddFicheActionButton = (props: {actionId: string}) => {
  const epciId = useEpciId();

  return (
    <Link
      className="fr-btn fr-btn--secondary fr-btn--sm fr-fi-file-fill fr-btn--icon-left"
      to={`/collectivite/${epciId}/nouvelle_fiche?action_id=${props.actionId}`}
    >
      Ajouter une fiche action
    </Link>
  );
};
