'use client';

import { makeCollectiviteRootUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import {
  useUpdateUserPreferences,
  useUserPreferences,
} from '@/app/users/use-user-preferences';
import { useUser } from '@tet/api/users';
import { isServiceDeconcentre } from '@tet/domain/collectivites';
import {
  isTypeInstructeur,
  peutDeposerAvisInstructeur,
} from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { Button, Modal, ModalFooter } from '@tet/ui';
import { useState } from 'react';

/**
 * L'accueil d'un agent que son fournisseur d'identité vient de rattacher à sa
 * collectivité ou à son service. Une seule fois : le backend inscrit le service dans une préférence
 * au rattachement, la fermeture la remet à `null`.
 */
export const AutoAttachmentWelcomeModal = () => {
  const user = useUser();
  const { data: preferences } = useUserPreferences();
  const { mutate: updatePreferences } = useUpdateUserPreferences();
  const [refermee, setRefermee] = useState(false);

  const collectiviteId = preferences?.oidc.autoAttachedCollectiviteId ?? null;

  // Absent si le droit a été retiré entre-temps : ne rien annoncer plutôt
  // qu'un espace fermé.
  const service = user.collectivites.find(
    (acces) => acces.collectiviteId === collectiviteId
  );

  // Les CGU passent devant : leur modale est bloquante, et à z-index égal
  // c'est la dernière **ouverte** qui gagne — l'accueil, qui attend une requête.
  const cguAcceptees = Boolean(user.cguAccepteesLe);

  // `refermee` couvre l'instant entre le clic et la fin de l'écriture, où la
  // préférence vaut encore l'ancien service.
  const isOpen = Boolean(service) && cguAcceptees && !refermee;

  if (!isOpen || !service) {
    return null;
  }

  const refermer = () => {
    setRefermee(true);
    updatePreferences({ 'oidc.autoAttachedCollectiviteId': null });
  };

  // Comme l'atterrissage : seul un service déconcentré n'a que l'instruction.
  // Une région est une collectivité qui instruit aussi.
  const serviceDeconcentre = isServiceDeconcentre(service.collectiviteType);
  const instructeur = isTypeInstructeur(service.collectiviteType);
  const deposeAvis = peutDeposerAvisInstructeur(service.collectiviteType);
  const admin = service.role === CollectiviteRole.ADMIN;

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
      title={appLabels.accueilRattachementTitre}
      subTitle={appLabels.accueilRattachementService({
        nom: service.collectiviteNom,
      })}
      // Sous `modal` (1000) et `dropdown` (999) : rien d'une autre surface ne
      // doit se retrouver dessous.
      zIndex={998}
      render={() => (
        <div>
          {/* Tailwind neutralise le `list-style` des `ul`. */}
          {serviceDeconcentre ? (
            <>
              <p className="mb-3">{appLabels.accueilRattachementIntro}</p>
              <ul className="mb-0 list-disc pl-4">
                <li>{appLabels.accueilRattachementConsulter}</li>
                <li>{appLabels.accueilRattachementSuivre({ deposeAvis })}</li>
                <li>{appLabels.accueilRattachementVueEnsemble}</li>
              </ul>
            </>
          ) : (
            <>
              <p className="mb-3">
                {appLabels.accueilRattachementCollectiviteIntro}
              </p>
              <ul className="mb-0 list-disc pl-4">
                <li>{appLabels.accueilRattachementCollectivitePlans}</li>
                <li>{appLabels.accueilRattachementCollectiviteIndicateurs}</li>
                <li>{appLabels.accueilRattachementCollectiviteReferentiels}</li>
                {instructeur && (
                  <li>{appLabels.accueilRattachementConsulter}</li>
                )}
              </ul>
            </>
          )}
          {admin && (
            <p className="mt-3 mb-0">{appLabels.accueilRattachementAdmin}</p>
          )}
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
