import {avancementToLabel} from 'app/labels';
import {
  useActionJustification,
  useSaveActionJustification,
} from 'app/pages/collectivite/EtatDesLieux/Referentiel/data/useActionJustification';
import {useTasksScoreRepartition} from 'app/pages/collectivite/EtatDesLieux/Referentiel/data/useTasksScores';
import {actionAvancementColors} from 'app/theme';
import classNames from 'classnames';
import {ActionDefinitionSummary} from 'core-logic/api/endpoints/ActionDefinitionSummaryReadEndpoint';
import {Dispatch, SetStateAction, useEffect, useState} from 'react';
import ProgressBarWithTooltip from 'ui/score/ProgressBarWithTooltip';
import {DetailedScore} from 'ui/shared/DetailedScore/DetailedScore';
import {AvancementValues} from 'ui/shared/DetailedScore/DetailedScoreSlider';
import Modal from 'ui/shared/floating-ui/Modal';
import ActionJustification from '../../app/pages/collectivite/EtatDesLieux/Referentiel/SuiviAction/ActionJustification';
import {AVANCEMENT_DETAILLE_PAR_STATUT, getStatusFromIndex} from './utils';

type ScoreDetailleModalProps = {
  action: ActionDefinitionSummary;
  avancementDetaille?: number[] | null;
  externalOpen: boolean;
  saveAtValidation?: boolean;
  isScorePerso?: boolean;
  setExternalOpen: Dispatch<SetStateAction<boolean>>;
  onSaveScore: (values: number[]) => void;
  onOpenScoreAuto?: () => void;
};

const ScoreDetailleModal = ({
  action,
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
    !avancementDetaille.find(av => av === 1)
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

  const scores = useTasksScoreRepartition(action.id);
  const {actionJustification} = useActionJustification(action.id);
  const {saveActionJustification} = useSaveActionJustification();

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
              ${action.type === 'tache' ? 'tâche' : action.type}`}{' '}
              : {action.id.split('_')[1]}
            </h4>

            {/* Score automatique */}
            {isScorePerso &&
            scores &&
            scores.tasksScores.filter(task => task.concerne).length &&
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
              {/* Slider du score et détails */}
              <DetailedScore
                avancement={currentAvancement}
                setCurrentAvancement={setCurrentAvancement}
              />

              {/* Message d'info pour les tâches */}
              {action.type === 'tache' && (
                <p className="mb-16">
                  Pour faciliter la relecture, vous pouvez préciser les raisons
                  de cette répartition en cliquant sur le bouton{' '}
                  <span
                    className="fr-icon-pencil-line text-bf500"
                    aria-hidden="true"
                  />{' '}
                  situé sous l'intitulé de la tâche.
                </p>
              )}

              {/* Champ de justification pour les scores personnalisés */}
              {isScorePerso && (
                <ActionJustification
                  action={action}
                  title="Justification de l’ajustement manuel (obligatoire)"
                  subtitle="Précisez les raisons de cette répartition, dont les initiatives complémentaires à valoriser, pour faciliter la relecture et l’audit"
                  onSave={setJustificationPayload}
                  onChange={setJustification}
                />
              )}

              {/* Boutons retour / enregistrement */}
              <div className="w-full flex justify-end gap-4 mt-12 mb-4">
                {isScorePerso && (
                  <button
                    onClick={() => {
                      if (onOpenScoreAuto) onOpenScoreAuto();
                      setExternalOpen(false);
                    }}
                    className="fr-btn fr-btn--secondary fr-btn--icon-left fr-icon-arrow-left-line"
                  >
                    Revenir au score automatique
                  </button>
                )}
                <button
                  className={classNames('fr-btn', {
                    'fr-btn--icon-left fr-fi-save-line': saveAtValidation,
                  })}
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
                </button>
              </div>
            </div>
          </>
        );
      }}
    />
  );
};

export default ScoreDetailleModal;
