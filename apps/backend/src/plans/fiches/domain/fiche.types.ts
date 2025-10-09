import {
  Cible,
  ParticipationCitoyenne,
  Priorite,
  Statut,
} from '@/backend/plans/fiches/shared/models/fiche-action.table';

export interface Fiche {
  collectiviteId: number;
  titre: string;
  description?: string;
  objectifs?: string;
  cibles?: Cible[];
  ressources?: string;
  financements?: string;
  budgetPrevisionnel?: number;
  statut?: Statut;
  priorite?: Priorite;
  dateDebut?: Date;
  dateFin?: Date;
  ameliorationContinue?: boolean;
  calendrier?: string;
  notesComplementaires?: string;
  instanceGouvernance?: string;
  participationCitoyenneType?: ParticipationCitoyenne;
}

export type PersonOrTag = { userId?: string; tagId?: number };

export type FicheAggregate = Fiche & {
  thematiques?: number[];
  sousThematiques?: number[];
  effetsAttendus?: number[];
  structures?: number[];
  services?: number[];
  pilotes?: Array<PersonOrTag>;
  referents?: Array<PersonOrTag>;
  partenaires?: number[];
  financeurs?: Array<{ tagId: number; montant: number }>;
};
