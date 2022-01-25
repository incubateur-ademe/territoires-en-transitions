import {useHistory} from 'react-router-dom';

export const RetourButton = () => {
  const history = useHistory();
  return (
    <button
      className="fr-link fr-fi-arrow-left-line fr-link--icon-left"
      onClick={history.back}
    >
      Retour
    </button>
  );
};
