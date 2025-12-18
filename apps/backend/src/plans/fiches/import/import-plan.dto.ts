import { FicheImport } from '@/backend/plans/fiches/import/schemas/fiche-import.schema';
import {
  UpdatePlanPilotesSchema,
  UpdatePlanReferentsSchema,
} from '@/backend/plans/plans/plans.schema';

export type PlanImport = {
  nom: string;
  id?: number;
  fiches: FicheImport[];
  typeId?: number;
  pilotes?: UpdatePlanPilotesSchema[];
  referents?: UpdatePlanReferentsSchema[];
};
