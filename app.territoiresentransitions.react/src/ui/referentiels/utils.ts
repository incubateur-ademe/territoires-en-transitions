import {TActionAvancement} from 'types/alias';
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
  detaille: [0.3, 0.4, 0.3],
};
