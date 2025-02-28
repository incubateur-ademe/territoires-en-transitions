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
  detaille: [0.5, 0.25, 0.25],
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
