'use client';

import { makeReferentielAuditLabellisationUrl } from '@/app/app/paths';
import { appLabels } from '@/app/labels/catalog';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Button } from '@tet/ui';
import { ModeBannerAlert } from './mode-banner-alert';
import type { SwitchToTeStatus } from './use-switch-to-te-status';

type SwitchToTeBlocker = Extract<
  SwitchToTeStatus,
  { value: 'BLOCKED' }
>['blockers'][number];

const blockerTypeToDescription: Record<SwitchToTeBlocker['type'], string> = {
  COT_ACTIVE: appLabels.referentielTeModeBlockedCotDescription,
  AUDIT_IN_PROGRESS: appLabels.referentielTeModeBlockedAuditEnCoursDescription,
  AUDIT_REQUEST_IN_PROGRESS:
    appLabels.referentielTeModeBlockedAuditDemandeDescription,
  COLLECTIVITE_IS_SYNDICAT:
    appLabels.referentielTeModeBlockedSyndicatDescription,
};

export const SwitchToTeBlockedBanner = ({
  blockers,
}: {
  blockers: SwitchToTeBlocker[];
}) => {
  const collectiviteId = useCollectiviteId();
  const blocker = blockers[0];

  return (
    <ModeBannerAlert
      mode="readonly"
      title={appLabels.referentielTeModeBlockedTitle}
      description={blockerTypeToDescription[blocker.type]}
      state="warning"
    >
      <p className="mb-0">{appLabels.referentielTeModeBlockedLabel}</p>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="grey" disabled={true}>
          {appLabels.switchToTe}
        </Button>
        {blocker.type === 'AUDIT_IN_PROGRESS' && (
          <Button
            size="sm"
            variant="outlined"
            href={makeReferentielAuditLabellisationUrl({
              collectiviteId,
              referentielId: blocker.referentiel,
            })}
          >
            {appLabels.voirPageLabellisation}
          </Button>
        )}
      </div>
    </ModeBannerAlert>
  );
};
