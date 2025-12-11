import { PersonneId, TagEnum, TagType } from '@tet/domain/collectivites';
import {
  Cible,
  ParticipationCitoyenne,
  Priorite,
  Statut,
} from '@tet/domain/plans';

export const ficheTagTypes = [
  TagEnum.Partenaire,
  TagEnum.Service,
  TagEnum.Structure,
  TagEnum.Financeur,
  TagEnum.Personne,
];

export type TagImport = {
  nom: string;
  id?: number;
  type: TagType;
};

export type FinanceurImport = {
  tag: TagImport;
  montant: number;
};

export type PersonneImport = {
  tag?: TagImport;
  userId?: string;
};

export type FicheImport = {
  titre: string;
  id?: number;
  description?: string;
  thematique?: number;
  sousThematique?: number;
  gouvernance?: string;
  objectifs?: string;
  indicateurs?: any; // unavailable
  resultats?: number;
  cibles?: Cible;
  structures: TagImport[];
  resources?: string;
  partenaires: TagImport[];
  services: TagImport[];
  pilotes: PersonneImport[];
  referents: PersonneImport[];
  participation?: ParticipationCitoyenne;
  financements?: string;
  financeurs: FinanceurImport[];
  budget?: number;
  statut?: Statut;
  priorite?: Priorite;
  dateDebut?: string;
  dateFin?: string;
  ameliorationContinue?: boolean;
  calendrier?: string;
  actions?: any; // unavailable
  fiches?: any; // unavailable
  notesSuivi?: any; // unavailable
  etapes?: any; // unavailable
  notesComplementaire?: string;
  annexes?: any; // unavailable
};

export type AxeImport = {
  nom: string;
  id?: number;
  parent?: AxeImport | PlanImport;
  enfants: Set<AxeImport>;
  fiches: FicheImport[];
};

export type PlanImport = AxeImport & {
  typeId?: number;
  pilotes?: PersonneId[];
  referents?: PersonneId[];
};

export type MemoryImport = {
  axes: Set<AxeImport>;
  tags: Set<TagImport>;
  fiches: Set<FicheImport>;
  effetsAttendu: Record<string, number>;
  members: Record<string, string>;
  thematiques: Record<string, number>;
  sousThematiques: Record<string, number>;
};
