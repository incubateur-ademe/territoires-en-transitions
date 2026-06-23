'use client';

import { appLabels } from '@/app/labels/catalog';
import { useReferentielId } from '@/app/referentiels/referentiel-context';
import { useIsNewReferentielLayoutEnabled } from '@/app/referentiels/use-is-new-referentiel-layout-enabled';
import { useCollectiviteId } from '@tet/api/collectivites';
import { isAuditLabellisationReferentiel } from '@tet/domain/referentiels';
import { Alert, Button } from '@tet/ui';

export const NewReferentielLayoutBanner = () => {
  const isNewLayoutEnabled = useIsNewReferentielLayoutEnabled();
  const collectiviteId = useCollectiviteId();
  const referentielId = useReferentielId();

  if (!isNewLayoutEnabled || !isAuditLabellisationReferentiel(referentielId)) {
    return null;
  }

  return (
    <Alert
      className="mb-8"
      title={appLabels.nouvelleVueChecklistTitre}
      description={appLabels.nouvelleVueChecklistDescription}
      footer={
        <Button
          size="sm"
          variant="primary"
          href={`/collectivite/${collectiviteId}/referentiel/new/${referentielId}/progression`}
        >
          {appLabels.nouvelleVueChecklistCta}
        </Button>
      }
    />
  );
};
