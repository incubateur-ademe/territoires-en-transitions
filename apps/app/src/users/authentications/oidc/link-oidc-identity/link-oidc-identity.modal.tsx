'use client';

import { appLabels } from '@/app/labels/catalog';
import { useUpdateUserPreferences } from '@/app/users/use-user-preferences';
import { Button, Modal, ModalFooter } from '@tet/ui';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useLinkOidcIdentity } from './use-link-oidc-identity';

/** Ne re-propose pas l'incitation plusieurs fois dans la même session. */
const SESSION_KEY = 'oidc-modal-seen';

const memeJour = (isoA: string, dateB: Date) =>
  new Date(isoA).toDateString() === dateB.toDateString();

/**
 * Modale d'incitation post-connexion (Phase 1, non bloquante) : propose de lier
 * MonCompteAdeme, ou « Plus tard ». Affichée au plus `OIDC_MODAL_MAX_DISPLAY_COUNT` fois
 * (compteur en préférences), au plus une fois par session et par jour. Reportée
 * (« Plus tard » ou fermeture) ⇒ incrémente le compteur.
 */
export const LinkOidcIdentityModal = () => {
  const { canShowIncentive, statut, prefs, lierUrl } = useLinkOidcIdentity();
  const pathname = usePathname();
  const { mutate: updatePreferences } = useUpdateUserPreferences();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!canShowIncentive || !prefs) return;
    if (sessionStorage.getItem(SESSION_KEY)) return;
    if (prefs.modalLastSeenAt && memeJour(prefs.modalLastSeenAt, new Date())) {
      return;
    }
    sessionStorage.setItem(SESSION_KEY, '1');
    setIsOpen(true);
  }, [canShowIncentive, prefs]);

  if (!isOpen || !statut || !prefs) {
    return null;
  }

  // « Plus tard » / fermeture : on enregistre le report (compteur + date).
  const reporter = () => {
    updatePreferences({
      'oidc.modalDisplayCount': prefs.modalDisplayCount + 1,
      'oidc.modalLastSeenAt': new Date().toISOString(),
    });
    setIsOpen(false);
  };

  return (
    <Modal
      openState={{ isOpen, setIsOpen }}
      onClose={reporter}
      dataTest="oidc.modal"
      render={() => (
        <div className="text-center">
          <h4 className="mb-2">{appLabels.oidcIncitationTitre}</h4>
          <p className="mb-3">{appLabels.oidcIncitationMessage}</p>
          <p className="text-sm text-grey-7 mb-0">
            {appLabels.oidcIncitationRappel({ n: prefs.modalDisplayCount + 1 })}
          </p>
        </div>
      )}
      renderFooter={() => (
        <ModalFooter>
          <Button variant="outlined" onClick={reporter}>
            {appLabels.oidcIncitationPlusTard}
          </Button>
          <Button href={lierUrl(pathname)} dataTest="oidc.modal.lier">
            {appLabels.oidcIncitationLier}
          </Button>
        </ModalFooter>
      )}
    />
  );
};
