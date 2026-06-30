import { useState } from 'react';

import { useIndicateurReference } from '@/app/app/pages/collectivite/Indicateurs/data/use-indicateur-reference';
import { appLabels } from '@/app/labels/catalog';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { toLocaleFixed } from '@/app/utils/to-locale-fixed';
import { useCollectiviteId } from '@tet/api/collectivites';
import { Badge } from '@tet/ui';
import { useGetScoreIndicatif } from '../../score-indicatif/use-get-score-indicatif';
import { prepareScoreIndicatifData } from '../../score-indicatif/utils';
import { SubactionIndicateurModal } from './subaction.indicateur-modal';

export const SubactionIndicateur = ({ action }: { action: ActionListItem }) => {
  const collectiviteId = useCollectiviteId();

  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  const haveScoreIndicatif = Boolean(
    action.exprScore && action.exprScore.trim() !== ''
  );

  const { data, isLoading } = useGetScoreIndicatif({
    actionIds: [action.actionId],
    enabled: haveScoreIndicatif,
  });

  const scoreIndicatif = data?.[action.actionId];

  const indicateurId = scoreIndicatif?.indicateurs[0].indicateurId;
  const indicateurTitre = scoreIndicatif?.indicateurs[0].titre;
  const unite = scoreIndicatif?.indicateurs[0].unite;

  const { data: reference } = useIndicateurReference({
    collectiviteId,
    indicateurId: indicateurId ?? 0,
    enabled: indicateurId !== undefined,
  });

  if (!scoreIndicatif || isLoading || !reference) {
    return null;
  }

  const valeurFait = prepareScoreIndicatifData('fait', scoreIndicatif);

  const hasValeurFait = Boolean(valeurFait?.valeurPrincipale?.valeur);

  const pointsPotentiels =
    action.score.pointPotentielPerso ??
    action.score.pointPotentiel ??
    action.score.pointReferentiel;

  return (
    <>
      <button
        className="flex flex-col gap-2 pt-2 pb-3 px-4 text-left font-normal border border-grey-3 hover:border-primary-4 rounded-md"
        onClick={() => {
          setIsScoreModalOpen(true);
        }}
      >
        <p className="mb-auto font-bold text-sm text-primary-9">
          {indicateurTitre}
        </p>
        <div className="flex justify-between items-baseline text-xs text-grey-9">
          {hasValeurFait ? (
            <div className="flex gap-1.5">
              <div className="text-4xl leading-none font-medium">
                {valeurFait?.valeurPrincipale?.valeur}
              </div>
              <div className="flex flex-col">
                <span>{unite}</span>
                <span>
                  {appLabels.sourceCibleMin}
                  {' : '}
                  <span className="font-bold">
                    {reference?.cible ?? '-'}
                  </span>{' '}
                  {' | '}
                  {appLabels.sourceSeuilMin}
                  {' : '}
                  <span className="font-bold">{reference?.seuil ?? '-'}</span>
                </span>
              </div>
            </div>
          ) : (
            <Badge
              title={appLabels.placeholderARenseigner}
              variant="grey"
              size="xs"
            />
          )}
          <span>
            {toLocaleFixed(scoreIndicatif.fait?.score ?? 0, 2)}
            {'/'}
            {appLabels.scorePotentielPointCount({
              count: toLocaleFixed(pointsPotentiels, 2),
            })}
          </span>
        </div>
      </button>
      {isScoreModalOpen && (
        <SubactionIndicateurModal
          action={action}
          titre={indicateurTitre ?? ''}
          unite={unite ?? ''}
          reference={reference}
          openState={{
            isOpen: isScoreModalOpen,
            setIsOpen: setIsScoreModalOpen,
          }}
        />
      )}
    </>
  );
};
