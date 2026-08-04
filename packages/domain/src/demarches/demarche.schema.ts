import type { PersonneTagOrUser } from '../collectivites';
import type { DemarcheType } from './demarche-type.enum.schema';

/**
 * Socle commun à tous les types de démarches (entité abstraite) : chaque type
 * concret (ex. `DemarchePcaet`) l'étend avec son discriminant `type`, ses
 * statuts et ses champs propres.
 */
export type DemarcheBase = {
  id: number;
  collectiviteId: number;
  type: DemarcheType;
  titre: string;
  description: string;
  pilotes: PersonneTagOrUser[];
  createdAt: string;
  modifiedAt: string;
};
