'use client';

import { ReferentielModeReadonlyBanner } from './referentiel-mode-readonly.banner';
import { SwitchToTeBlockedBanner } from './switch-to-te-blocked.banner';
import { SwitchToTeReadyBanner } from './switch-to-te-ready.banner';
import { SwitchToTeUnauthorizedBanner } from './switch-to-te-unauthorized.banner';
import { useSwitchToTeStatus } from './use-switch-to-te-status';

export const SwitchToTeBanner = () => {
  const { data: status } = useSwitchToTeStatus();

  if (!status) {
    // statut pas encore chargé : pas de bandeau tant qu'on ne sait pas si
    // le CTA doit être proposé (évite un flash "bascule possible").
    return null;
  }

  switch (status.value) {
    case 'CAN_SWITCH':
      return <SwitchToTeReadyBanner />;
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
};
