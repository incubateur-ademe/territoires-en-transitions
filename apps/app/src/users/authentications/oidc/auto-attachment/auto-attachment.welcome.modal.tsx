'use client';

import { makeCollectiviteRootUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import {
  useUpdateUserPreferences,
  useUserPreferences,
} from '@/app/users/use-user-preferences';
import { useUser } from '@tet/api/users';
import { peutDeposerAvisInstructeur } from '@tet/domain/demarches';
import { Button, Modal, ModalFooter } from '@tet/ui';
import { useState } from 'react';

/**
 * L'accueil d'un agent rattaché automatiquement à son service.
 *
 * Personne ne l'a invité et il n'a rien choisi : l'organisation qu'il a
 * désignée chez son fournisseur d'identité lui a ouvert un espace. La modale est
 * ce qui le lui dit, et explique ce qu'il y trouvera.
 *
 * Une seule fois, et par une préférence serveur plutôt qu'un paramètre d'URL :
 * un écran qui explique tout un parcours doit survivre à un onglet fermé en
 * cours de route. Le backend y inscrit le service au moment du rattachement, et
 * la fermeture la remet à `null` — c'est tout le mécanisme.
 */
export const AutoAttachmentWelcomeModal = () => {
  const user = useUser();
  const { data: preferences } = useUserPreferences();
  const { mutate: updatePreferences } = useUpdateUserPreferences();
  const [refermee, setRefermee] = useState(false);

  const collectiviteId = preferences?.oidc.autoAttachedCollectiviteId ?? null;

  // Le service tel que l'agent y a accès. Absent si le droit a été retiré
  // entre-temps : mieux vaut ne rien annoncer que d'annoncer un espace fermé.
  const service = user.collectivites.find(
    (acces) => acces.collectiviteId === collectiviteId
  );

  // Les CGU passent devant. Leur modale est bloquante, et deux modales
  // ouvertes ensemble se départagent mal : à z-index égal c'est la dernière
  // **ouverte** qui passe devant, et l'accueil l'est forcément — il attend une
  // requête, là où les CGU se décident depuis l'utilisateur déjà chargé.
  // Attendre leur acceptation règle l'ordre par la logique plutôt que par
  // l'empilement, et accueillir quelqu'un qui n'a pas encore accepté n'aurait
  // de toute façon pas de sens.
  const cguAcceptees = Boolean(user.cguAccepteesLe);

  // Ouverture **dérivée**, sans effet : la préférence dit à elle seule s'il y a
  // quelque chose à annoncer, et `refermee` couvre l'instant entre le clic et
  // la fin de l'écriture, où la préférence vaut encore l'ancien service.
  const isOpen = Boolean(service) && cguAcceptees && !refermee;

  if (!isOpen || !service) {
    return null;
  }

  /** Oublier le service, c'est tout le « une seule fois ». */
  const refermer = () => {
    setRefermee(true);
    updatePreferences({ 'oidc.autoAttachedCollectiviteId': null });
  };

  const deposeAvis = peutDeposerAvisInstructeur(service.collectiviteType);

  return (
    <Modal
      openState={{
        isOpen,
        setIsOpen: (ouvert) => {
          if (!ouvert) {
            refermer();
          }
        },
      }}
      dataTest="oidc.rattachement.accueil"
      // Le titre et le sous-titre passent par le design system plutôt que par le
      // corps : c'est lui qui donne le grand titre `primary-9`, la ligne grise
      // en dessous et le séparateur qui les détache du reste.
      title={appLabels.accueilRattachementTitre}
      subTitle={appLabels.accueilRattachementService({
        nom: service.collectiviteNom,
      })}
      // Sous la modale des CGU (`zIndex.modal`, 1000), qui est bloquante : leur
      // acceptation passe d'abord, l'accueil attend derrière. Sous `dropdown`
      // (999) aussi, pour ne pas passer par-dessus la liste déroulante d'une
      // autre surface.
      zIndex={998}
      render={() => (
        <div>
          <p className="mb-3">{appLabels.accueilRattachementIntro}</p>
          {/* Tailwind neutralise le `list-style` des `ul` : sans `list-disc`,
              les trois lignes se lisent comme un paragraphe haché. */}
          <ul className="mb-0 list-disc pl-4">
            <li>{appLabels.accueilRattachementConsulter}</li>
            <li>{appLabels.accueilRattachementSuivre({ deposeAvis })}</li>
            <li>{appLabels.accueilRattachementVueEnsemble}</li>
          </ul>
        </div>
      )}
      renderFooter={() => (
        <ModalFooter>
          <Button
            dataTest="oidc.rattachement.accueil.decouvrir"
            href={makeCollectiviteRootUrl({
              user,
              collectiviteId: service.collectiviteId,
              collectiviteType: service.collectiviteType,
            })}
            onClick={refermer}
          >
            {appLabels.accueilRattachementAction}
          </Button>
        </ModalFooter>
      )}
    />
  );
};
