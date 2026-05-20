'use client';

import { ReferentielId } from '@tet/domain/referentiels';
import { redirect, usePathname } from 'next/navigation';
import { isAuditLabellisationReferentiel } from './audit-labellisation/referentiel';
import { useIsNewReferentielLayoutEnabled } from './use-is-new-referentiel-layout-enabled';

/**
 * Quand le flag `is-new-referentiel-layout-enabled` est actif, redirige
 * l'ancienne route `/referentiel/<id>/...` vers le nouveau layout
 * `/referentiel/new/<id>/...`. Le nouveau layout ne couvre que les
 * référentiels audit-labellisation (`notFound` sinon) : on s'abstient de
 * rediriger pour les autres.
 */
export const RedirectToNewReferentielLayout = ({
  referentielId,
}: {
  referentielId: ReferentielId;
}): null => {
  const isNewLayoutEnabled = useIsNewReferentielLayoutEnabled();
  const pathname = usePathname();

  if (isNewLayoutEnabled && isAuditLabellisationReferentiel(referentielId)) {
    redirect(
      pathname.replace(
        `/referentiel/${referentielId}`,
        `/referentiel/new/${referentielId}`
      )
    );
  }

  return null;
};
