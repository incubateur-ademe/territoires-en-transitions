import { referentielId } from '@/app/referentiels/actions.utils';
import { useScores } from '@/app/referentiels/DEPRECATED_score-hooks';
import { useAction, useSnapshotFlagEnabled } from '../use-snapshot';

export const useTasksScoreRepartition = (actionId: string) => {
  const DEPRECATED_scores = useScores();
  const FLAG_isSnapshotEnabled = useSnapshotFlagEnabled();
  const NEW_subAction = useAction(actionId);

  if (FLAG_isSnapshotEnabled && NEW_subAction) {
    const NEW_subActionScore = NEW_subAction.score;
    const tasksScores = NEW_subAction.actionsEnfant.map(
      (action) => action.score
    );

    let scoreFait = 0;
    let scoreProgramme = 0;
    let scorePasFait = 0;

    tasksScores.forEach((score) => {
      scoreFait += score.pointFait;
      scoreProgramme += score.pointProgramme;
      scorePasFait += score.pointPasFait;
    });

    return {
      tasksScores,
      avancementDetaille: [scoreFait, scoreProgramme, scorePasFait],
      scoreMax: NEW_subActionScore.pointPotentiel,
    };
  } else if (DEPRECATED_scores[referentielId(actionId)]) {
    // Modification nécessaire côté back sur "action_statuts" pour éviter l'appel de useScores
    const tasksScores = DEPRECATED_scores[referentielId(actionId)].filter(
      (act) => act.action_id.includes(actionId) && act.action_id !== actionId
    );
    const subActionScore = DEPRECATED_scores[referentielId(actionId)].filter(
      (act) => act.action_id === actionId
    );

    let scoreFait = 0;
    let scoreProgramme = 0;
    let scorePasFait = 0;

    tasksScores.forEach((task) => {
      scoreFait += task.point_fait;
      scoreProgramme += task.point_programme;
      scorePasFait += task.point_pas_fait;
    });

    return {
      tasksScores,
      avancementDetaille: [scoreFait, scoreProgramme, scorePasFait],
      scoreMax: subActionScore[0]?.point_potentiel,
    };
  }
};
