'use client';

import { appLabels } from '@/app/labels/catalog';
import { useUpdateUserPreferences } from '@/app/users/use-user-preferences';
import { Button, Event, useEventTracker } from '@tet/ui';
import { usePathname } from 'next/navigation';
import { useLinkOidcIdentity } from './use-link-oidc-identity';

/**
 * Bannière d'annonce in-app invitant à lier MonCompteAdeme. Per-utilisateur,
 * masquable (préférence `oidc.isBannerVisible`) — distincte de la bannière
 * support globale (`banner_info`). Ne s'affiche que si le feature flag est
 * actif, MCA activé, compte non lié et bannière non masquée (cf.
 * `useLinkOidcIdentity`).
 */
export const LinkOidcIdentityBanner = () => {
  const { showBanner, lierUrl, statut } = useLinkOidcIdentity();
  const pathname = usePathname();
  const { mutate: updatePreferences } = useUpdateUserPreferences();
  const trackEvent = useEventTracker();

  if (!showBanner) {
    return null;
  }

  const provider = statut?.targetProvider ?? undefined;

  return (
    <div
      role="status"
      data-test="oidc.banner"
      className="flex items-center gap-4 border border-primary-3 border-l-4 border-l-primary-9 bg-primary-1 rounded-lg px-5 py-4 m-4"
    >
      <div className="flex-1">
        <div className="font-bold text-primary-9">
          {appLabels.oidcAnnonceTitre}
        </div>
        <div className="text-sm text-primary-10 mt-0.5">
          {appLabels.oidcAnnonceMessage}
        </div>
      </div>
      <Button
        size="sm"
        href={lierUrl(pathname)}
        onClick={() =>
          trackEvent(Event.auth.oidc.linkClick, {
            provider,
            origine: 'banniere',
          })
        }
      >
        {appLabels.oidcAnnonceLier}
      </Button>
      <Button
        size="sm"
        variant="outlined"
        icon="close-line"
        title={appLabels.fermer}
        aria-label={appLabels.fermer}
        dataTest="oidc.banner.fermer"
        onClick={() => {
          trackEvent(Event.auth.oidc.incentiveDismissed, {
            provider,
            origine: 'banniere',
            definitif: true,
          });
          updatePreferences({ 'oidc.isBannerVisible': false });
        }}
      />
    </div>
  );
};
