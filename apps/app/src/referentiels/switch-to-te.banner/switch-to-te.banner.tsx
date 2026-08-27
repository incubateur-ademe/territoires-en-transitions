'use client';

import { useState } from 'react';
import { ReferentielModeReadonlyBanner } from '../referentiel-mode/referentiel-mode-readonly.banner';
import { SwitchToTeBlockedBanner } from './switch-to-te-blocked.banner';
import { SwitchToTeConfirmModal } from '../switch-to-te-confirm.modal/switch-to-te-confirm.modal';
import { SwitchToTeReadyBanner } from './switch-to-te-ready.banner';
import { SwitchToTeUnauthorizedBanner } from './switch-to-te-unauthorized.banner';
import { useSwitchToTeStatus } from './use-switch-to-te-status';

export const SwitchToTeBanner = () => {
  const { data: status } = useSwitchToTeStatus();

  // La modale est montée ici, hors du `switch` ci-dessous : si le statut de
  // bascule change pendant que la modale affiche la progression/le résultat
  // (ex. passage à ALREADY_SWITCHED juste après une bascule réussie), elle
  // ne doit pas se retrouver démontée avec l'ancien bandeau.
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [confirmModalKey, setConfirmModalKey] = useState(0);

  const openConfirmModal = () => {
    setConfirmModalKey((key) => key + 1);
    setIsConfirmOpen(true);
  };

  if (!status) {
    // statut pas encore chargé : pas de bandeau tant qu'on ne sait pas si
    // le CTA doit être proposé (évite un flash "bascule possible").
    return null;
  }

  return (
    <>
      {(() => {
        switch (status.value) {
          case 'CAN_SWITCH':
            return <SwitchToTeReadyBanner onSwitchClick={openConfirmModal} />;
          case 'UNAUTHORIZED':
            return <SwitchToTeUnauthorizedBanner />;
          case 'BLOCKED':
            return <SwitchToTeBlockedBanner blockers={status.blockers} />;
          case 'NOT_ELIGIBLE':
          case 'ALREADY_SWITCHED':
          default:
            // pas de bascule à proposer (aucun CAE/ECI engagé, ou déjà basculé —
            // ce dernier cas n'a normalement plus le mode `readonly`) : bandeau
            // générique, sans mention de la bascule.
            return <ReferentielModeReadonlyBanner />;
        }
      })()}
      <SwitchToTeConfirmModal
        key={confirmModalKey}
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
      />
    </>
  );
};
