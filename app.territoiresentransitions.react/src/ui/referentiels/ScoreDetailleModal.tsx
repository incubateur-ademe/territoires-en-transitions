import {avancementToLabel} from 'app/labels';
import {useTasksScoreRepartition} from 'app/pages/collectivite/EtatDesLieux/Referentiel/data/useTasksScores';
import {actionAvancementColors} from 'app/theme';
import classNames from 'classnames';
import {Dispatch, SetStateAction, useState} from 'react';
import ProgressBarWithTooltip from 'ui/score/ProgressBarWithTooltip';
import {DetailedScore} from 'ui/shared/DetailedScore/DetailedScore';
import {AvancementValues} from 'ui/shared/DetailedScore/DetailedScoreSlider';
import Modal from 'ui/shared/floating-ui/Modal';
import {AVANCEMENT_DETAILLE_PAR_STATUT, getStatusFromIndex} from './utils';

type ScoreDetailleModalProps = {
  actionId: string;
  actionType: string;
  avancementDetaille?: number[] | null;
  externalOpen: boolean;
  saveAtValidation?: boolean;
  isScorePerso?: boolean;
  setExternalOpen: Dispatch<SetStateAction<boolean>>;
  onSaveScore: (values: number[]) => void;
  onOpenScoreAuto?: () => void;
};

const ScoreDetailleModal = ({
  actionId,
  actionType,
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
  const scores = useTasksScoreRepartition(actionId);

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
              ${actionType === 'tache' ? 'tâche' : actionType}`}{' '}
              : {actionId.split('_')[1]}
            </h4>

            {/* Score automatique */}
            {isScorePerso &&
              scores &&
              scores.avancementDetaille &&
              scores.scoreMax && (
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
              )}

            <hr className="p-1" />

            <div className="w-full flex flex-col">
              {/* Slider du score et détails */}
              <DetailedScore
                avancement={currentAvancement}
                setCurrentAvancement={setCurrentAvancement}
              />

              {/* Message d'info pour les tâches */}
              {actionType === 'tache' && (
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

              {/* Boutons retour / enregistrement */}
              <div className="w-full flex justify-end gap-4 mb-4">
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
                  }}
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
