import { Personne } from '../../collectivites';
import { BudgetWithTotal } from '../fiches/fiche-budget.schema';
import { PlanNode } from './flat-axe.schema';
import { PlanType } from './plan-type.schema';

export type Plan = {
  id: number;
  nom: string | null;
  axes: PlanNode[];
  referents: Personne[];
  pilotes: Personne[];
  type: PlanType | null;
  collectiviteId: number;
  createdAt: string;
  budget?: BudgetWithTotal;
  totalFiches?: number;
};
