import {Dispatch, SetStateAction} from 'react';
import {DetailedScore} from 'ui/shared/DetailedScore/DetailedScore';
import {AvancementValues} from 'ui/shared/DetailedScore/DetailedScoreSlider';
import Modal from 'ui/shared/floating-ui/Modal';
import {AVANCEMENT_DETAILLE_PAR_STATUT} from './utils';

type ScorePersoModalProps = {
  actionId: string;
  actionType: string;
  avancementDetaille?: number[] | null;
  externalOpen: boolean;
  saveAtValidation?: boolean;
  setExternalOpen: Dispatch<SetStateAction<boolean>>;
  onSaveScore: (values: number[]) => void;
};

const ScorePersoModal = ({
  actionId,
  actionType,
  avancementDetaille,
  externalOpen,
  saveAtValidation = true,
  setExternalOpen,
  onSaveScore,
}: ScorePersoModalProps): JSX.Element => {
  return (
    <Modal
      size="lg"
      externalOpen={externalOpen}
      setExternalOpen={setExternalOpen}
      render={() => {
        return (
          <>
            <h4>
              Détailler l'avancement de cette{' '}
              {actionType === 'tache' ? 'tâche' : actionType} :{' '}
              {actionId.split('_')[1]}
            </h4>
            <hr className="p-1" />
            <div className="w-full">
              <DetailedScore
                actionType={actionType}
                avancement={
                  (avancementDetaille?.length === 3 &&
                  !avancementDetaille.find(av => av === 1)
                    ? avancementDetaille
                    : AVANCEMENT_DETAILLE_PAR_STATUT.detaille) as AvancementValues
                }
                saveAtValidation={saveAtValidation}
                onSave={onSaveScore}
              />
            </div>
          </>
        );
      }}
    />
  );
};

export default ScorePersoModal;
