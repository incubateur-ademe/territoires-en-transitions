import {TActionAvancement, TActionAvancementExt} from 'types/alias';
import {Database} from 'types/database.types';

export const phaseToLabel: Record<
  Database['public']['Enums']['action_categorie'] | string,
  string
> = {
  bases: "S'engager",
  'mise en œuvre': 'Concrétiser',
  effets: 'Consolider',
};

// Valeurs par défaut de l'avancement détaillé par statut d'avancement
export const AVANCEMENT_DETAILLE_PAR_STATUT: Record<
  TActionAvancement,
  number[] | undefined
> = {
  non_renseigne: undefined,
  fait: [1, 0, 0],
  programme: [0, 1, 0],
  pas_fait: [0, 0, 1],
  detaille: [0.25, 0.5, 0.25],
};

// Génère les propriétés de l'objet statut à écrire lors du changement de l'avancement
export const statutParAvancement = (avancement: TActionAvancementExt) => {
  // cas spécial pour le faux statut "non concerné"
  if (avancement === 'non_concerne') {
    return {
      avancement: 'non_renseigne' as TActionAvancement,
      concerne: false,
    };
  }

  return {
    avancement,
    // quand on change l'avancement, l'avancement détaillé est réinitialisé à la
    // valeur par défaut correspondante
    avancement_detaille: AVANCEMENT_DETAILLE_PAR_STATUT[avancement],
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
  avancement: TActionAvancement | undefined;
  desactive: boolean | undefined;
  concerne: boolean | undefined;
}): TActionAvancementExt | undefined => {
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
 * Renvoie le statut en fonction de l'index dans le tableau avancement détaillé
 */
export const getStatusFromIndex = (index: number): TActionAvancement => {
  switch (index) {
    case 0:
      return 'fait';
    case 1:
      return 'programme';
    default:
      return 'pas_fait';
  }
};
