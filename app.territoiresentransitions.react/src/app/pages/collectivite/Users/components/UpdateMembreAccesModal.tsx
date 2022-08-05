import {Dispatch, SetStateAction} from 'react';

import Modal from 'ui/shared/floating-ui/Modal';
import {TAccesDropdownOption} from 'app/pages/collectivite/Users/components/MembreListTableRow';
import {
  TRemoveFromCollectivite,
  TUpdateMembre,
} from 'app/pages/collectivite/Users/types';

export type AccesModalProps = {
  isOpen: boolean;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  selectedOption: TAccesDropdownOption | undefined;
  membreId: string;
  isCurrentUser: boolean;
  removeFromCollectivite: TRemoveFromCollectivite;
  updateMembre: TUpdateMembre;
};

const UpdateMemberAccesModal = ({
  isOpen,
  setIsOpen,
  selectedOption,
  membreId,
  isCurrentUser,
  removeFromCollectivite,
  updateMembre,
}: AccesModalProps) => (
  <Modal
    size="lg"
    externalOpen={isOpen}
    setExternalOpen={setIsOpen}
    render={({labelId, descriptionId}) => {
      if (selectedOption === 'remove') {
        return (
          <>
            <h4 id={labelId} className="fr-h4">
              {isCurrentUser
                ? 'Retirer mon accès la collectivité'
                : 'Retirer ce membre de la collectivité'}
            </h4>
            <p id={descriptionId}>
              {isCurrentUser
                ? 'Souhaitez-vous vraiment ne plus avoir accès à un accès privilégié au profil de cette collectivité ?'
                : 'Cette personne ne pourra plus contribuer dans l’espace de la collectivité et son compte ne sera pas supprimé.'}
            </p>
            <div className="mt-2 fr-btns-group fr-btns-group--left fr-btns-group--inline-reverse fr-btns-group--inline-lg">
              <button
                onClick={() => {
                  removeFromCollectivite(membreId);
                  setIsOpen(false);
                }}
                aria-label="Confirmer"
                className="fr-btn"
              >
                Confirmer
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="fr-btn fr-btn--secondary"
                aria-label="Annuler"
              >
                Revenir à la page Gestion des membres
              </button>
            </div>
          </>
        );
      } else {
        // Ici cela ne concerne que le currentUser, car on n'affiche pas la modal si on change les droits d'accès d'un tierce.
        return (
          <>
            <h4 id={labelId} className="fr-h4">
              Modifier mes droits d’accès la collectivité
            </h4>
            <p id={descriptionId}>
              Souhaitez-vous vraiment modifier vos droits d’accès à cette
              collectivité ? Si possible, nommez une nouvelle personne avec
              l’accès admin.
            </p>
            <div className="mt-2 fr-btns-group fr-btns-group--left fr-btns-group--inline-reverse fr-btns-group--inline-lg">
              <button
                onClick={() => {
                  updateMembre({
                    membre_id: membreId,
                    name: 'niveau_acces',
                    value: selectedOption ?? 'lecture',
                  });
                  setIsOpen(false);
                }}
                aria-label="Confirmer"
                className="fr-btn"
              >
                Confirmer
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="fr-btn fr-btn--secondary"
                aria-label="Annuler"
              >
                Revenir à la page Gestion des membres
              </button>
            </div>
          </>
        );
      }
    }}
  />
);

export default UpdateMemberAccesModal;
