'use client';

import { referentielToName } from '@/app/app/labels';
import SaveScoreButton from '@/app/app/pages/collectivite/Referentiels/SaveScore/save-score.button';
import { useCurrentCollectivite } from '@/app/core-logic/hooks/useCurrentCollectivite';
import { ReferentielOfIndicateur } from '@/app/referentiels/litterals';
import { useReferentielDownToAction } from '@/app/referentiels/referentiel-hooks';
import ScoreProgressBar from '@/app/referentiels/scores/score.progress-bar';
import { ScoreRatioBadge } from '@/app/referentiels/scores/score.ratio-badge';
import { ReferentielId } from '@/domain/referentiels';

export const Header = ({ referentielId }: { referentielId: ReferentielId }) => {
  const actions = useReferentielDownToAction(referentielId);
  const referentiel = actions.find((a) => a.type === 'referentiel')!;

  const collectivite = useCurrentCollectivite();
  const collectiviteId = collectivite?.collectiviteId;
  const haveEditionAccess =
    collectivite?.niveauAcces == 'edition' ||
    collectivite?.niveauAcces == 'admin';

  return (
    <>
      <div className="flex items-center justify-between items-baseline">
        <h1>
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
          {collectiviteId && haveEditionAccess && (
            <SaveScoreButton
              referentielId={referentielId}
              collectiviteId={collectiviteId}
            />
          )}
        </div>
      </div>

      {referentiel && (
        <div className="flex items-center gap-4 pb-4 mb-4 border-b border-primary-3">
          <ScoreProgressBar
            className="grow"
            id={referentiel.id}
            identifiant={referentiel.identifiant}
            type={referentiel.type}
          />
          <ScoreRatioBadge actionId={referentiel.id} className="ml-auto" />
        </div>
      )}
    </>
  );
};
