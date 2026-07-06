'use client';

import { makeReferentielNewUrl } from '@/app/app/paths';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useCollectiviteId } from '@tet/api/collectivites';
import { isAuditLabellisationReferentiel } from '@tet/domain/referentiels';
import { redirect } from 'next/navigation';
import { useActiveFeatureFlags, useFeatureFlagEnabled } from 'posthog-js/react';
import { PropsWithChildren } from 'react';

/**
 * Sur une route d'audit/labellisation, aiguille l'affichage selon le flag
 * `is-new-referentiel-layout-enabled` :
 * - flag actif -> redirige vers le nouveau layout (`/referentiel/new/...`) ;
 * - flags PostHog pas encore resolus -> ne rend rien, pour eviter de peindre
 *   l'ancienne page avant de savoir (sinon flash ancienne -> nouvelle au
 *   chargement a froid) ;
 * - flag resolu et inactif -> rend l'ancienne page.
 */
export const NewReferentielLayoutGate = ({ children }: PropsWithChildren) => {
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();

  const isNewLayoutEnabled =
    useFeatureFlagEnabled('is-new-referentiel-layout-enabled') ?? false;
  const areFeatureFlagsResolved = useActiveFeatureFlags() !== undefined;

  const isAuditLabellisationRoute =
    isAuditLabellisationReferentiel(referentielId);

  if (isAuditLabellisationRoute && isNewLayoutEnabled) {
    redirect(makeReferentielNewUrl({ collectiviteId, referentielId }));
  }

  if (isAuditLabellisationRoute && !areFeatureFlagsResolved) {
    return null;
  }

  return children;
};
