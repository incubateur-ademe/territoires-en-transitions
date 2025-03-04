import { TActionReferentiel } from '../_shared/fetchActionsReferentiel.ts';
import { Enums } from './typeUtils.ts';

export type TScore = {
  avancement: Enums<'avancement'> | null;
  avancement_descendants: Enums<'avancement'>[] | null;
  concerne: boolean | null;
  desactive: boolean | null;
};

/** Transforme un statut d'avancemement en libellé */
export const formatActionStatut = (
  score: TScore,
  action: TActionReferentiel | undefined,
  parentScore: TScore | undefined
) => {
  // pas de statut si les données ne sont pas disponibles ou que l'item n'est ni une sous-action ni une tâche
  if (!action || (action.type !== 'sous-action' && action.type !== 'tache')) {
    return '';
  }

  // affiche "non concerné" pour un item ayant ce statut ou étant désactivé
  const { concerne, desactive, avancement, avancement_descendants } = score;
  if (concerne === false || desactive === true) {
    return 'Non concerné';
  }

  // pour éviter d'afficher "non renseigné" pour une tâche sans statut mais ayant un statut à la sous-action
  if (
    (action.type === 'tache' &&
      avancement === null &&
      parentScore !== null &&
      parentScore?.avancement !== 'non_renseigne' &&
      parentScore?.avancement !== 'detaille') ||
    parentScore?.concerne === false
  ) {
    return '';
  }

  // pour éviter d'afficher "non renseigné" pour une sous-action dont au moins une tâche est renseignée
  if (
    action.type === 'sous-action' &&
    (avancement === null ||
      avancement === 'non_renseigne' ||
      avancement === 'detaille') &&
    avancement_descendants?.filter((s) => s !== 'non_renseigne').length
  ) {
    return avancementToLabel['detaille'];
  }

  // affiche "non renseigné" si l'avancement n'est pas renseigné
  if (!avancement || !avancementToLabel[avancement]) {
    return avancementToLabel.non_renseigne;
  }

  // affiche le libellé correspondant à l'avancement
  return avancementToLabel[avancement];
};

const avancementToLabel: Record<Enums<'avancement'> | 'non_concerne', string> =
  {
    non_renseigne: 'Non renseigné',
    fait: 'Fait',
    pas_fait: 'Pas fait',
    detaille: 'Détaillé',
    programme: 'Programmé',
    non_concerne: 'Non concerné',
  };
