import {Link} from 'react-router-dom';
import Alerte from 'ui/shared/Alerte';

import {makeCollectiviteTableauBordUrl} from 'app/paths';
import {AllCollectiviteRead} from 'generated/dataLayer';

type Props = {
  collectivite: AllCollectiviteRead;
  handleResetForm: () => void;
};

const Success = ({collectivite, handleResetForm}: Props) => {
  return (
    <div>
      <Alerte
        state="success"
        description={`Vous êtes désormais membre de la collectivité ${collectivite.nom} avec un accès admin.`}
      />
      <div className="fr-btns-group fr-btns-group--icon-right mt-6">
        <button className="fr-btn fr-btn--secondary" onClick={handleResetForm}>
          Rejoindre une autre collectivité
        </button>
        <Link
          className="fr-btn fr-btn--icon-right fr-fi-arrow-right-line"
          to={makeCollectiviteTableauBordUrl({
            collectiviteId: collectivite.collectivite_id,
          })}
        >
          Aller sur le tableau de bord
        </Link>
      </div>
    </div>
  );
};

export default Success;
