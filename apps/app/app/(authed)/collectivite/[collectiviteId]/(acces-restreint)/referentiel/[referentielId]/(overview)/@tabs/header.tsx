'use client';

import { referentielToName } from '@/app/app/labels';
import DownloadScoreButton from '@/app/app/pages/collectivite/Referentiels/DownloadScore/download-score.button';
import SaveScoreButton from '@/app/app/pages/collectivite/Referentiels/SaveScore/save-score.button';
import { useGetAction } from '@/app/referentiels/actions/use-get-action';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import { ScoreRatioBadge } from '@/app/referentiels/scores/score.ratio-badge';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';

export const Header = ({ referentielId }: { referentielId: ReferentielId }) => {
  const { collectiviteId, hasCollectivitePermission } =
    useCurrentCollectivite();

  const haveEditionAccess = hasCollectivitePermission('referentiels.mutate');

  const action = useGetAction({
    actionId: referentielId,
  });

  return (
    <>
      <div className="flex max-md:flex-col md:items-center md:justify-between gap-4 mb-6">
        <h1 className="mb-0">Référentiel {referentielToName[referentielId]}</h1>
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
      </div>

      <div className="flex max-sm:flex-col sm:items-center gap-4 pb-4 mb-4 border-b border-primary-3">
        <ScoreProgressBar className="grow" action={action} />
        <ScoreRatioBadge action={action} className="sm:ml-auto" />
      </div>
    </>
  );
};
