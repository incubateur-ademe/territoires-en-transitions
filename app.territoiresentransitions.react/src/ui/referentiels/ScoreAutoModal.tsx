import SubActionTasksList from 'app/pages/collectivite/EtatDesLieux/Referentiel/SuiviAction/SubActionTasksList';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {useActionSummaryChildren} from 'core-logic/hooks/referentiel';
import {Dispatch, SetStateAction, useState} from 'react';
import {TActionAvancementExt} from 'types/alias';
import Modal from 'ui/shared/floating-ui/Modal';

type ScoreAutoModalProps = {
  action: ActionDefinitionSummary;
  externalOpen: boolean;
  setExternalOpen: Dispatch<SetStateAction<boolean>>;
  onSaveScore: (
    newStatus: {
      actionId: string;
      status: TActionAvancementExt;
      avancementDetaille: number[] | undefined;
    }[]
  ) => void;
};

const ScoreAutoModal = ({
  action,
  externalOpen,
  setExternalOpen,
  onSaveScore,
}: ScoreAutoModalProps): JSX.Element => {
  const tasks = useActionSummaryChildren(action);
  const [localStatus, setLocalStatus] = useState<{
    [key: string]: {
      status: TActionAvancementExt;
      avancementDetaille: number[] | undefined;
    };
  }>({});

  const handleChangeStatus = (
    actionId: string,
    status: TActionAvancementExt,
    avancementDetaille?: number[]
  ) => {
    setLocalStatus(prevState => ({
      ...prevState,
      [actionId]: {status, avancementDetaille},
    }));
  };

  const handleSaveScoreAuto = () => {
    let newStatus = [];

    for (const actionId in localStatus) {
      newStatus.push({
        actionId,
        status: localStatus[actionId].status,
        avancementDetaille: localStatus[actionId].avancementDetaille,
      });
    }

    onSaveScore(newStatus);
  };

  return (
    <Modal
      size="xl"
      externalOpen={externalOpen}
      setExternalOpen={setExternalOpen}
      render={() => {
        return (
          <>
            <h4>Détailler l'avancement : {action.id.split('_')[1]}</h4>

            <div className="w-full py-6">
              <SubActionTasksList
                tasks={tasks}
                onSaveStatus={handleChangeStatus}
              />
              <hr />
              <div className="w-full flex justify-end">
                <button
                  className="fr-btn fr-btn--icon-left fr-fi-save-line"
                  onClick={handleSaveScoreAuto}
                >
                  Enregistrer le score automatique
                </button>
              </div>
            </div>
          </>
        );
      }}
    />
  );
};

export default ScoreAutoModal;
