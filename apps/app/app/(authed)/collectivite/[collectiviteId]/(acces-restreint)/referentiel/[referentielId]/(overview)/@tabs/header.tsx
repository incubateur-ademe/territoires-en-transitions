'use client';

import { referentielToName } from '@/app/app/labels';
import DownloadScoreButton from '@/app/app/pages/collectivite/Referentiels/DownloadScore/download-score.button';
import SaveScoreButton from '@/app/app/pages/collectivite/Referentiels/SaveScore/save-score.button';
import { useGetAction } from '@/app/referentiels/actions/use-get-action';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import { ScoreRatioBadge } from '@/app/referentiels/scores/score.ratio-badge';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { PageHeader } from '@tet/ui';

export const Header = ({ referentielId }: { referentielId: ReferentielId }) => {
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();

  const haveEditionAccess = hasCollectivitePermission('referentiels.mutate');

  const action = useGetAction({
    actionId: referentielId,
  });

  return (
    <PageHeader>
      <PageHeader.Title>
        Référentiel {referentielToName[referentielId]}
      </PageHeader.Title>
      <PageHeader.Actions>
        <div className="flex gap-x-4">
          <DownloadScoreButton
            referentielId={referentielId}
            collectiviteId={collectiviteId}
          />
          {haveEditionAccess && (
            <SaveScoreButton
              referentielId={referentielId}
              collectiviteId={collectiviteId}
            />
          )}
        </div>
      </PageHeader.Actions>
      <PageHeader.Metadata>
        <div className="flex max-sm:flex-col sm:items-center gap-4">
          <ScoreProgressBar className="grow" action={action} />
          <ScoreRatioBadge action={action} className="sm:ml-auto" />
        </div>
      </PageHeader.Metadata>
    </PageHeader>
  );
};
