import { Personne } from '../../collectivites';
import { BudgetWithTotal } from '../fiches/fiche-budget.schema';
import { PlanNode } from './flat-axe.schema';
import { PlanSource } from './plan-source.enum.schema';
import { PlanType } from './plan-type.schema';

export type Plan = {
  id: number;
  nom: string | null;
  axes: PlanNode[];
  referents: Personne[];
  pilotes: Personne[];
  type: PlanType | null;
  dateDebut: string | null;
  dateFin: string | null;
  collectiviteId: number;
  createdAt: string;
  budget?: BudgetWithTotal;
  totalFiches?: number;
  /** Renseignés par la lecture d'un plan seul, pas par les listes. */
  source?: PlanSource | null;
  verifiedAt?: string | null;
};
