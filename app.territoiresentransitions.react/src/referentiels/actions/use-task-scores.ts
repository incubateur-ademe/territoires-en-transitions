import { referentielId } from '@/app/referentiels/actions.utils';
import { useScores } from '@/app/referentiels/score-hooks';

export const useTasksScoreRepartition = (actionId: string) => {
  const scores = useScores();
  // Modification nécessaire côté back sur "action_statuts" pour éviter l'appel de useScores
  const tasksScores = scores[referentielId(actionId)].filter(
    (act) => act.action_id.includes(actionId) && act.action_id !== actionId
  );
  const subActionScore = scores[referentielId(actionId)].filter(
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
    scoreMax: subActionScore[0].point_potentiel,
  };
};
