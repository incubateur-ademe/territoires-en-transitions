import { ACTION_TYPE_LABELS } from '@/app/referentiels/actions/action-label.constants';
import { ActionListItem } from '@/app/referentiels/actions/use-list-actions';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Alert, Button } from '@tet/ui';
import { useState } from 'react';
import { ScoreIndicatifModal } from '../score-indicatif/score-indicatif.modal';
import { useGetScoreIndicatif } from '../score-indicatif/use-get-score-indicatif';

type Props = {
  action: Pick<ActionListItem, 'actionType' | 'actionId' | 'scoreIndicatif'>;
};

const SubactionCardActions = ({ action }: Props) => {
  const {
    actionId,
    actionType,
    scoreIndicatif: scoreIndicatifInAction,
  } = action;
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  const { hasCollectivitePermission } = useCurrentCollectivite();

  const {
    data: scoreIndicatifParActionId,
    isLoading: isScoreIndicatifLoading,
  } = useGetScoreIndicatif(actionId);

  const scoreIndicatif = scoreIndicatifParActionId?.[actionId];
  const nbIndicateurs = scoreIndicatif?.indicateurs?.length || 0;

  if (
    !hasCollectivitePermission('referentiels.mutate') ||
    !scoreIndicatifInAction
  )
    return null;

  const hasValeursRenseignees =
    scoreIndicatif?.fait?.valeursUtilisees?.length &&
    scoreIndicatif?.programme?.valeursUtilisees?.length;

  return (
    <>
      <div
        className="flex flex-wrap mt-1 mb-2"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Score indicatif */}
        {scoreIndicatifInAction &&
          !isScoreIndicatifLoading &&
          scoreIndicatif &&
          (hasValeursRenseignees ? (
            <Button
              size="xs"
              variant="outlined"
              onClick={() => {
                setIsScoreModalOpen(true);
              }}
            >
              {`Modifier les données ${
                nbIndicateurs > 1 ? 'des indicateurs' : "de l'indicateur"
              }`}
            </Button>
          ) : (
            <Alert
              className="w-full"
              title={`Cette ${
                ACTION_TYPE_LABELS[actionType]
              } nécessite des données ${
                nbIndicateurs > 1 ? "d'indicateurs" : "d'un indicateur"
              } pour le calcul du score.`}
              state="info"
              footer={
                <Button
                  size="xs"
                  variant="outlined"
                  onClick={() => {
                    setIsScoreModalOpen(true);
                  }}
                >
                  {`Renseigner les données ${
                    nbIndicateurs > 1 ? 'des indicateurs' : "de l'indicateur"
                  }`}
                </Button>
              }
            />
          ))}
      </div>

      {scoreIndicatif && isScoreModalOpen && (
        <ScoreIndicatifModal
          scoreIndicatif={scoreIndicatif}
          openState={{
            isOpen: isScoreModalOpen,
            setIsOpen: setIsScoreModalOpen,
          }}
        />
      )}
    </>
  );
};

export default SubactionCardActions;
