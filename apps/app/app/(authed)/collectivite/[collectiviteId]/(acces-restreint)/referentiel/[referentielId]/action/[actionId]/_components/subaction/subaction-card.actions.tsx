import { ACTION_TYPE_LABELS } from '@/app/referentiels/actions/action-label.constants';
import { ActionDefinitionSummary } from '@/app/referentiels/referentiel-hooks';
import { useCurrentCollectivite } from '@tet/api/collectivites';
import { Alert, Button } from '@tet/ui';
import { useState } from 'react';
import { ScoreIndicatifModal } from '../score-indicatif/score-indicatif.modal';
import { useGetScoreIndicatif } from '../score-indicatif/use-get-score-indicatif';

type Props = {
  action: Pick<ActionDefinitionSummary, 'type' | 'id' | 'haveScoreIndicatif'>;
};

const SubactionCardActions = ({ action }: Props) => {
  const { id: actionId, type, haveScoreIndicatif } = action;
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  const { hasCollectivitePermission } = useCurrentCollectivite();

  const {
    data: scoreIndicatifParActionId,
    isLoading: isScoreIndicatifLoading,
  } = useGetScoreIndicatif(actionId);
  const scoreIndicatif = scoreIndicatifParActionId?.[actionId];
  const nbIndicateurs = scoreIndicatif?.indicateurs?.length || 0;

  if (!hasCollectivitePermission('referentiels.mutate') || !haveScoreIndicatif)
    return null;

  const hasValeursRenseignees =
    scoreIndicatif?.fait?.valeursUtilisees?.length &&
    scoreIndicatif?.programme?.valeursUtilisees?.length;

  return (
    <>
      <div className="flex flex-wrap mt-1 mb-2">
        {/* Score indicatif */}
        {haveScoreIndicatif &&
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
              title={`Cette ${ACTION_TYPE_LABELS[type]} nécessite des données ${
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
