import Alerte from 'ui/shared/Alerte';

import {ReferentContact} from 'core-logic/api/procedures/collectiviteProcedures';
import {Link} from 'react-router-dom';
import {makeCollectiviteTableauBordUrl} from 'app/paths';

type Props = {
  selectedCollectiviteId: number;
  referentContacts: ReferentContact[];
  submitForm: (() => Promise<void>) & (() => Promise<unknown>);
  isSubmitting: boolean;
};

const CollectiviteSelectionee = ({
  selectedCollectiviteId,
  referentContacts,
  submitForm,
  isSubmitting,
}: Props) => (
  <div className="mt-6">
    {referentContacts.length === 0 ? (
      <>
        <Alerte
          state="information"
          titre="Accès admin"
          description="Vous pourrez configurer les paramètres et éditer l’ensemble du contenu de cette collectivité."
        />
        <button
          type="button"
          onClick={submitForm}
          className="fr-btn mt-6"
          disabled={isSubmitting}
        >
          Rejoindre en tant qu'admin
        </button>
      </>
    ) : (
      <>
        <Alerte
          state="information"
          titre="Collectivité déjà activée"
          description={generateReferentContactsDescription(referentContacts)}
        />
        <Link
          className="fr-btn fr-btn--icon-right fr-fi-arrow-right-line mt-6"
          to={makeCollectiviteTableauBordUrl({
            collectiviteId: selectedCollectiviteId,
          })}
        >
          Consulter le profil de cette collectivité en mode visiteur
        </Link>
      </>
    )}
  </div>
);

export default CollectiviteSelectionee;

/**
 * Utilitaires
 */

const generateReferentContactsDescription = (
  referentContacts: ReferentContact[]
) => {
  if (referentContacts.length === 1) {
    return `Contactez l’admin ${referentContacts[0].prenom} ${referentContacts[0].nom} à l’adresse ${referentContacts[0].email} pour recevoir un lien d’invitation.`;
  } else {
    return `Contactez l'une des personnes admin par mail pour recevoir un lien d’invitation: ${referentContacts.map(
      contact => `${contact.prenom} ${contact.nom} à ${contact.email}`
    )}`;
  }
};
