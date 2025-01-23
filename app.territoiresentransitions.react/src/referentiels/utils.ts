import { Enums } from '@/api';
import {
  StatutAvancement,
  StatutAvancementEnum,
  StatutAvancementIncludingNonConcerne,
} from '@/domain/referentiels';

export const phaseToLabel: Record<Enums<'action_categorie'> | string, string> =
  {
    bases: "S'engager",
    'mise en œuvre': 'Concrétiser',
    effets: 'Consolider',
  };

// Valeurs par défaut de l'avancement détaillé par statut d'avancement
export const AVANCEMENT_DETAILLE_PAR_STATUT: Record<
  StatutAvancement,
  number[] | undefined
> = {
  non_renseigne: undefined,
  fait: [1, 0, 0],
  programme: [0, 1, 0],
  pas_fait: [0, 0, 1],
  detaille: [0.25, 0.5, 0.25],
};

// Génère les propriétés de l'objet statut à écrire lors du changement de l'avancement
export const statutParAvancement = (
  avancement: StatutAvancementIncludingNonConcerne
) => {
  // cas spécial pour le faux statut "non concerné"
  if (avancement === StatutAvancementEnum.NON_CONCERNE) {
    return {
      avancement: StatutAvancementEnum.NON_RENSEIGNE,
      concerne: false,
    };
  }

  return {
    avancement,
    // quand on change l'avancement, l'avancement détaillé est réinitialisé à la
    // valeur par défaut correspondante
    avancementDetaille: AVANCEMENT_DETAILLE_PAR_STATUT[avancement],
    concerne: true,
  };
};

/**
 * Détermine l'avancement "étendu" d'une action (inclus le "non concerné")
 */
export const getAvancementExt = ({
  avancement,
  desactive,
  concerne,
}: {
  avancement: StatutAvancement | undefined;
  desactive: boolean | undefined;
  concerne: boolean | undefined;
}): StatutAvancementIncludingNonConcerne | undefined => {
  // affiche le statut "non concerné" quand l'action est désactivée par la
  // personnalisation ou que l'option "non concerné" a été sélectionnée
  // explicitement par l'utilisateur
  if (desactive || concerne === false) {
    return 'non_concerne';
  } else if (avancement === undefined) {
    return 'non_renseigne';
  }
  return avancement;
};

/**
 * Détermine le statut "étendu" d'une action : inclus le "non concerné" et prend
 * en compte l'avancement des tâches pour déterminer le statut à la sous-action
 */
export const getActionStatut = (action: {
  avancement: StatutAvancement | undefined;
  desactive: boolean | undefined;
  concerne: boolean | undefined;
  avancementDescendants: StatutAvancement[] | undefined;
}) => {
  const avancementExt = getAvancementExt(action);

  return (!avancementExt || avancementExt === 'non_renseigne') &&
    action.avancementDescendants?.find((av) => !!av && av !== 'non_renseigne')
    ? // Une sous-action "non renseigné" mais avec au moins une tâche renseignée a
      // le statut "détaillé"
      'detaille'
    : avancementExt || 'non_renseigne';
};

/**
 * Renvoie le statut en fonction de l'index dans le tableau avancement détaillé
 */
export const getStatusFromIndex = (index: number): StatutAvancement => {
  switch (index) {
    case 0:
      return 'fait';
    case 1:
      return 'programme';
    default:
      return 'pas_fait';
  }
};
