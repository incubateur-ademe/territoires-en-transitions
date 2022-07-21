import {Link} from 'react-router-dom';

import {allCollectivitesPath} from 'app/paths';
import {getReferentContacts} from 'core-logic/api/procedures/collectiviteProcedures';
import {AssocierCollectiviteDialog} from 'ui/collectivites/AssocierCollectiviteDialog';

const MonParcours = () => {
  return (
    <div className="fr-container mt-16 flex justify-center">
      <section className="fr-btns-group sm:w-96">
        {/* <button className="fr-btn">
          Associer une collectivité à mon compte
        </button> */}
        <AssocierCollectiviteDialog getReferentContacts={getReferentContacts} />
        <Link className="fr-btn fr-btn--secondary" to={allCollectivitesPath}>
          Toutes les collectivités
        </Link>
      </section>
    </div>
  );
};

export default MonParcours;
