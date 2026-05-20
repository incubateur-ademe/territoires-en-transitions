'use client';

import { makeCollectiviteDemarchePcaetUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { Alert, InlineLink } from '@tet/ui';

export const DemarchePcaetBanner = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) => (
  <Alert
    state="info"
    title={
      <div className="flex items-center gap-4">
        <span>{appLabels.demarchePcaetAccesDescription}</span>
        <InlineLink href={makeCollectiviteDemarchePcaetUrl({ collectiviteId })}>
          {appLabels.demarchePcaetAcceder}
        </InlineLink>
      </div>
    }
  />
);
