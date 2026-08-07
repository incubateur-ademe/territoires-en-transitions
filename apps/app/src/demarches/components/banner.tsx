'use client';

import { makeCollectiviteDemarchePcaetUrl } from '@/app/app/paths';
import { DemarcheTypeEnum } from '@tet/domain/demarches';
import { appLabels } from '@/app/labels/catalog';
import { Alert, InlineLink } from '@tet/ui';

/** Ces écrans sont propres au PCAET : le type est connu. */
const PCAET_TYPE = {
  type: appLabels.demarcheTypeLabels[DemarcheTypeEnum.PCAET],
};

export const DemarcheBanner = ({
  collectiviteId,
}: {
  collectiviteId: number;
}) => (
  <Alert
    state="info"
    title={
      <div className="flex items-center gap-4">
        <span>{appLabels.demarcheAccesDescription(PCAET_TYPE)}</span>
        <InlineLink href={makeCollectiviteDemarchePcaetUrl({ collectiviteId })}>
          {appLabels.demarcheAcceder(PCAET_TYPE)}
        </InlineLink>
      </div>
    }
  />
);
