import { avancementToLabel } from '@/app/app/labels';
import { actionAvancementColors } from '@/app/app/theme';
import { ActionDefinitionSummary } from '@/app/referentiels/ActionDefinitionSummaryReadEndpoint';
import {
  useActionJustification,
  useSaveActionJustification,
} from '@/app/referentiels/actions/sub-action/use-justification';
import { useTasksScoreRepartition } from '@/app/referentiels/actions/use-task-scores';
import ProgressBarWithTooltip from '@/app/referentiels/scores/progress-bar-with-tooltip';
import Modal from '@/app/ui/shared/floating-ui/Modal';
import { Button, Icon } from '@/ui';
import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import {
  AVANCEMENT_DETAILLE_PAR_STATUT,
  getStatusFromIndex,
} from '../../utils';
import ActionJustification from '../sub-action/sub-action-justification';
import AvancementDetailleSlider, {
  AvancementValues,
} from './avancement-detaille.slider';

type ScoreDetailleModalProps = {
  actionDefinition: ActionDefinitionSummary;
  avancementDetaille?: number[] | null;
  externalOpen: boolean;
  saveAtValidation?: boolean;
  isScorePerso?: boolean;
  setExternalOpen: Dispatch<SetStateAction<boolean>>;
  onSaveScore: (values: number[]) => void;
  onOpenScoreAuto?: () => void;
};

const ScoreDetailleModal = ({
  actionDefinition,
  avancementDetaille,
  externalOpen,
  saveAtValidation = true,
  isScorePerso = false,
  setExternalOpen,
  onSaveScore,
  onOpenScoreAuto,
}: ScoreDetailleModalProps): JSX.Element => {
  const [currentAvancement, setCurrentAvancement] = useState<AvancementValues>(
    (avancementDetaille?.length === 3 &&
    !avancementDetaille.find((av) => av === 1)
      ? avancementDetaille
      : AVANCEMENT_DETAILLE_PAR_STATUT.detaille) as AvancementValues
  );
  const [justificationPayload, setJustificationPayload] = useState<
    | {
        collectivite_id: number;
        action_id: string;
        texte: string;
        modified_at: string;
      }
    | undefined
  >();

  const [justification, setJustification] = useState<string>('');

  const scores = useTasksScoreRepartition(actionDefinition.id);
  const { actionJustification } = useActionJustification(actionDefinition.id);
  const { saveActionJustification } = useSaveActionJustification();

  useEffect(() => {
    if (actionJustification) {
      setJustificationPayload(actionJustification);
      setJustification(actionJustification.texte);
    }
  }, [actionJustification]);

  return (
    <Modal
      size="lg"
      externalOpen={externalOpen}
      setExternalOpen={setExternalOpen}
      render={() => {
        return (
          <>
            {/* Titre de la modale */}
            <h4>
              {isScorePerso
                ? 'Personnaliser le score'
                : `Détailler l'avancement de cette
              ${
                actionDefinition.type === 'tache'
                  ? 'tâche'
                  : actionDefinition.type
              }`}{' '}
              : {actionDefinition.id.split('_')[1]}
            </h4>

            {/* Score automatique */}
            {isScorePerso &&
            scores &&
            scores.tasksScores.filter((task) => task.concerne).length &&
            scores.avancementDetaille &&
            scores.scoreMax ? (
              <div className="flex items-start mt-2 mb-6">
                <p className="mb-0 text-sm mr-4">Score automatique</p>
                <ProgressBarWithTooltip
                  score={
                    scores.avancementDetaille?.map((a, idx) => ({
                      value: a,
                      label: avancementToLabel[getStatusFromIndex(idx)],
                      color: actionAvancementColors[getStatusFromIndex(idx)],
                    })) ?? []
                  }
                  total={scores.scoreMax ?? 0}
                  defaultScore={{
                    label: avancementToLabel.non_renseigne,
                    color: actionAvancementColors.non_renseigne,
                  }}
                  valueToDisplay={avancementToLabel.fait}
                />
              </div>
            ) : null}

            <hr className="p-1" />

            <div className="w-full flex flex-col">
              {/* Slider du statut avancé*/}
              <AvancementDetailleSlider
                className="my-8"
                avancement={currentAvancement}
                onChange={setCurrentAvancement}
              />

              {/* Message d'info pour les tâches */}
              {actionDefinition.type === 'tache' && (
                <p className="mb-0">
                  Pour faciliter la relecture, vous pouvez préciser les raisons
                  de cette répartition en cliquant sur le bouton{' '}
                  <Icon
                    icon="pencil-line"
                    size="lg"
                    className="text-primary-9"
                  />{' '}
                  situé sous l&apos;intitulé de la tâche.
                </p>
              )}

              {/* Champ de justification pour les scores personnalisés */}
              {isScorePerso && (
                <ActionJustification
                  action={actionDefinition}
                  title="Justification de l’ajustement manuel (obligatoire)"
                  subtitle="Précisez les raisons de cette répartition, dont les initiatives complémentaires à valoriser, pour faciliter la relecture et l’audit"
                  onSave={setJustificationPayload}
                  onChange={setJustification}
                />
              )}

              {/* Boutons retour / enregistrement */}
              <div className="w-full flex justify-end gap-4 mt-12 mb-4">
                {isScorePerso && (
                  <Button
                    icon="arrow-left-line"
                    size="sm"
                    variant="outlined"
                    onClick={() => {
                      if (onOpenScoreAuto) onOpenScoreAuto();
                      setExternalOpen(false);
                    }}
                  >
                    Revenir au score automatique
                  </Button>
                )}
                <Button
                  icon={saveAtValidation ? 'save-line' : undefined}
                  size="sm"
                  onClick={() => {
                    onSaveScore(currentAvancement);
                    setExternalOpen(false);
                    saveAtValidation &&
                      isScorePerso &&
                      justificationPayload &&
                      saveActionJustification(justificationPayload);
                  }}
                  disabled={isScorePerso && !justification?.length}
                >
                  {saveAtValidation
                    ? isScorePerso
                      ? 'Enregistrer le score personnalisé'
                      : 'Enregistrer la répartition'
                    : 'Valider la répartition'}
                </Button>
              </div>
            </div>
          </>
        );
      }}
    />
  );
};

export default ScoreDetailleModal;
