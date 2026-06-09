'use client';

import { makeCollectiviteDemarchePcaetUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { Alert, Button } from '@tet/ui';

export const DemarchePcaetBanner = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) => (
  <Alert
    state="info"
    title={appLabels.demarchePcaetAccesTitre}
    description={appLabels.demarchePcaetAccesDescription}
    footer={
      <Button
        size="sm"
        href={makeCollectiviteDemarchePcaetUrl({ collectiviteId })}
      >
        {appLabels.demarchePcaetAcceder}
      </Button>
    }
  />
);
