'use client';

import { useCurrentCollectivite } from '@/api/collectivites';
import { referentielToName } from '@/app/app/labels';
import SaveScoreButton from '@/app/app/pages/collectivite/Referentiels/SaveScore/save-score.button';
import { ReferentielOfIndicateur } from '@/app/referentiels/litterals';
import { useReferentielDownToAction } from '@/app/referentiels/referentiel-hooks';
import { ScoreProgressBar } from '@/app/referentiels/scores/score.progress-bar';
import { ScoreRatioBadge } from '@/app/referentiels/scores/score.ratio-badge';
import { ReferentielId } from '@/domain/referentiels';

export const Header = ({ referentielId }: { referentielId: ReferentielId }) => {
  const { collectiviteId, niveauAcces } = useCurrentCollectivite();

  const haveEditionAccess = niveauAcces == 'edition' || niveauAcces == 'admin';

  const actions = useReferentielDownToAction(referentielId);

  const referentiel = actions.find((a) => a.type === 'referentiel');

  return (
    <>
      <div className="flex max-md:flex-col md:items-center md:justify-between gap-4 mb-6">
        <h1 className="mb-0">
          Référentiel{' '}
          {referentielToName[referentielId as ReferentielOfIndicateur]}
        </h1>
        <div className="flex gap-x-4">
          {/**********************************************/}
          {/*                                            */}
          {/*       For future use: start                */}
          {/*   (Récupérer une version du référentiel)   */}
          {/*                                            */}
          {/**********************************************/}
          {/*<Select
                  options={[]}
                  onChange={() => {}}
                  values={[]}
                  customItem={(v) => <span className="text-grey-8">{v.label}</span>}
                  small
                />*/}
          {/**********************************************/}
          {/*                                            */}
          {/*     For future use: end                    */}
          {/*                                            */}
          {/**********************************************/}
          {haveEditionAccess && (
            <SaveScoreButton
              referentielId={referentielId}
              collectiviteId={collectiviteId}
            />
          )}
        </div>
      </div>

      {referentiel && (
        <div className="flex max-sm:flex-col sm:items-center gap-4 pb-4 mb-4 border-b border-primary-3">
          <ScoreProgressBar
            className="grow"
            id={referentiel.id}
            identifiant={referentiel.identifiant}
            type={referentiel.type}
          />
          <ScoreRatioBadge actionId={referentiel.id} className="sm:ml-auto" />
        </div>
      )}
    </>
  );
};
