'use client';

import { useQuery } from '@tanstack/react-query';
import { useTRPC } from '@tet/api';
import { useUserPreferences } from '@/app/users/use-user-preferences';
import { buildLinkIdentityUrl } from '@/app/users/authentications/oidc/link-oidc-identity/link-oidc-identity.profile-urls';

/** Nombre max de rappels d'incitation « Plus tard » avant d'arrêter de proposer. */
export const OIDC_MODAL_MAX_DISPLAY_COUNT = 3;

/**
 * État de la migration « connexion unifiée » MonCompteAdeme pour l'app
 * authentifiée : combine le statut serveur (`getUserStatus`) et
 * les préférences per-utilisateur (bannière masquée, compteur d'incitation).
 * Pilote la bannière d'annonce et la modale d'incitation.
 *
 * MCA inactif (provider non configuré) ⇒ tous les indicateurs d'affichage
 * sont `false`.
 */
export function useLinkOidcIdentity() {
  const trpc = useTRPC();

  const { data: statut } = useQuery(
    trpc.users.authentications.oidc.getUserStatus.queryOptions()
  );
  const { data: preferences } = useUserPreferences();

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL as string;
  const prefs = preferences?.oidc;

  const isActive = !!backendUrl && !!statut?.enabled;
  const activeSansLiaison = isActive && !statut?.hasLinkedIdentity;

  // `isActive` garantit un provider ciblé ; le `??` ne sert qu'au typage.
  const lierUrl = (next: string) =>
    buildLinkIdentityUrl({
      backendUrl,
      provider: statut?.targetProvider ?? 'moncompteademe',
      next,
    });

  return {
    statut,
    prefs,
    lierUrl,
    /** Socle actif : FF ON + backend + MCA activé (préalable à tout affichage). */
    isActive,
    /** Bannière d'annonce (MCA activé, non liée, non masquée). */
    showBanner: activeSansLiaison && prefs?.isBannerVisible === true,
    /** Éligibilité de la modale d'incitation (MCA activé, non liée, sous le quota). */
    canShowIncentive:
      activeSansLiaison &&
      (prefs?.modalDisplayCount ?? 0) < OIDC_MODAL_MAX_DISPLAY_COUNT,
  };
}
