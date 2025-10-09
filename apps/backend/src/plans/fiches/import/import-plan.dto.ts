import { TagEnum, TagType } from '@/backend/collectivites/tags/tag.table-base';
import { FicheImport } from '@/backend/plans/fiches/import/schemas/import.schema';
import {
  UpdatePlanPilotesSchema,
  UpdatePlanReferentsSchema,
} from '@/backend/plans/plans/plans.schema';

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

export type AxeImport = {
  nom: string;
  id?: number;
  fiches: FicheImport[];
  enfants: Set<AxeImport>;
};

export interface ResolvedEntities {
  // Members
  pilotes: string[]; // User IDs
  referents: string[]; // User IDs

  // Tags
  structures: number[]; // Tag IDs
  services: number[]; // Tag IDs
  financeurs: number[]; // Tag IDs

  // Thematiques
  thematiques: number[]; // Thematique IDs
  sousThematiques: number[]; // SousThematique IDs

  // Effets Attendus
  effetsAttendus: number[]; // EffetAttendu IDs
}

export type PlanImport = Omit<AxeImport, 'enfants'> & {
  typeId?: number;
  pilotes?: UpdatePlanPilotesSchema[];
  referents?: UpdatePlanReferentsSchema[];
  resolvedEntities?: ResolvedEntities;
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
