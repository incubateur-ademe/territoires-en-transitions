import { useCurrentCollectivite } from '@/api/collectivites';
import { Divider } from '@/ui';
import { useState } from 'react';
import { ScoreIndicatifModal } from '../score-indicatif/score-indicatif.modal';
import { useGetScoreIndicatif } from '../score-indicatif/use-get-score-indicatif';

type Props = {
  actionId: string;
  haveScoreIndicatif?: boolean;
  isDetailled?: boolean;
  setOpenDetailledModal?: (state: boolean) => void;
};

const SubactionCardActions = ({
  actionId,
  haveScoreIndicatif = false,
  isDetailled = false,
  setOpenDetailledModal,
}: Props) => {
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  const collectivite = useCurrentCollectivite();

  const {
    data: scoreIndicatifParActionId,
    isLoading: isScoreIndicatifLoading,
  } = useGetScoreIndicatif(actionId);
  const scoreIndicatif = scoreIndicatifParActionId?.[actionId];
  const nbIndicateurs = scoreIndicatif?.indicateurs?.length || 0;

  if (collectivite.isReadOnly || (!isDetailled && !haveScoreIndicatif))
    return null;

  return (
    <>
      <div className="flex flex-col gap-2">
        <Divider color="light" className="-mb-6 mt-auto" />

        {/* Score indicatif */}
        <div className="flex flex-wrap gap-x-2 gap-y-0.5">
          {haveScoreIndicatif && !isScoreIndicatifLoading && scoreIndicatif && (
            <span
              className="text-xs text-primary-8 hover:text-primary-9 font-medium cursor-pointer"
              onClick={(evt) => {
                evt.stopPropagation();
                setIsScoreModalOpen(true);
              }}
            >
              {`${
                scoreIndicatif.fait?.valeursUtilisees?.length ||
                scoreIndicatif.programme?.valeursUtilisees?.length
                  ? 'Modifier'
                  : 'Renseigner'
              } les données ${
                nbIndicateurs > 1 ? 'des indicateurs' : "de l'indicateur"
              }`}
            </span>
          )}

          {haveScoreIndicatif &&
            scoreIndicatif &&
            isDetailled &&
            setOpenDetailledModal && (
              <div className="w-[0.5px] h-4 bg-grey-5" />
            )}

          {/* Statut détaillé */}
          {isDetailled && setOpenDetailledModal && (
            <span
              className="text-xs text-primary-8 hover:text-primary-9 font-medium cursor-pointer"
              onClick={(evt) => {
                evt.stopPropagation();
                setOpenDetailledModal(true);
              }}
            >
              Détailler l'avancement
            </span>
          )}
        </div>
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
