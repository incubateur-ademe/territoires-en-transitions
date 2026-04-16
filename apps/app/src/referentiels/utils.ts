import { appLabels } from '@/app/labels/catalog';
import { Enums } from '@tet/api';
import {
  StatutAvancement,
  StatutAvancementEnum,
  StatutAvancementIncludingNonConcerneDetailleALaTache,
} from '@tet/domain/referentiels';

export const phaseToLabel: Record<Enums<'action_categorie'> | string, string> =
  {
    bases: appLabels.phaseBases,
    'mise en œuvre': appLabels.phaseMiseEnOeuvre,
    effets: appLabels.phaseEffets,
  };

// Valeurs par defaut de l'avancement detaille par statut d'avancement
export const AVANCEMENT_DETAILLE_PAR_STATUT = {
  non_renseigne: undefined,
  fait: [1, 0, 0],
  programme: [0, 1, 0],
  pas_fait: [0, 0, 1],
  detaille: [0.5, 0.25, 0.25],
} satisfies Record<StatutAvancement, number[] | undefined>;

// Genere les proprietes de l'objet statut a ecrire lors du changement de l'avancement
export const statutParAvancement = (
  avancement: StatutAvancementIncludingNonConcerneDetailleALaTache
) => {
  // cas special pour le faux statut "non concerne"
  if (avancement === StatutAvancementEnum.NON_CONCERNE) {
    return {
      avancement: StatutAvancementEnum.NON_RENSEIGNE,
      concerne: false,
    };
  }

  if (avancement === StatutAvancementEnum.DETAILLE_A_LA_TACHE) {
    return {
      avancement: StatutAvancementEnum.NON_RENSEIGNE,
      concerne: true,
    };
  }

  return {
    avancement,
    // quand on change l'avancement, l'avancement detaille est reinitialise a la
    // valeur par defaut correspondante
    avancementDetaille: AVANCEMENT_DETAILLE_PAR_STATUT[avancement],
    concerne: true,
  };
};

/**
 * Renvoie le statut en fonction de l'index dans le tableau avancement detaille
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
