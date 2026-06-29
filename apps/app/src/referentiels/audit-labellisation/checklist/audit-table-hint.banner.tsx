'use client';

import { makeReferentielNewUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { ReferentielId } from '@tet/domain/referentiels';
import { Alert, Button } from '@tet/ui';
import { ReactElement } from 'react';

export const AuditTableHintBanner = ({
  collectiviteId,
  referentielId,
}: {
  collectiviteId: number;
  referentielId: ReferentielId;
}): ReactElement => (
  <Alert
    title={appLabels.decouvrirInfosAuditTableauTitre}
    description={appLabels.decouvrirInfosAuditTableauDescription}
    footer={
      <Button
        size="xs"
        variant="primary"
        href={makeReferentielNewUrl({ collectiviteId, referentielId })}
      >
        {appLabels.decouvrirVueTabulaire}
      </Button>
    }
  />
);
