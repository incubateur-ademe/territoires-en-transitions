import {AssocierCollectiviteDialog} from 'ui/collectivites/AssocierCollectiviteDialog';
import {getReferentContacts} from 'core-logic/api/procedures/collectiviteProcedures';

const AssocierCollectiviteBandeau = () => {
  return (
    <div className="bg-bf925">
      <div className="fr-container py-4">
        <div className="flex mb-4 text-tDefaultInfo">
          <span className="fr-fi-information-fill mr-4 mt-0.5" />
          <span className="font-bold text-tDefaultInfo">
            Pour accéder à plus de détails sur chacune des collectivités
            engagées dans le programme, vous devez être membre d’au moins une
            collectivité.
          </span>
        </div>
        <div className="flex justify-center sm:justify-start sm:ml-10">
          <AssocierCollectiviteDialog
            getReferentContacts={getReferentContacts}
          />
        </div>
      </div>
    </div>
  );
};

export default AssocierCollectiviteBandeau;
