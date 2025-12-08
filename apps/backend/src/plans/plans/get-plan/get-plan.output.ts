import { Personne } from '@/backend/shared/models/personne.dto';
import { PlanNode } from '../../axes/list-axes/flat-axe.schema';

export type PlanType = {
  categorie: string;
  detail: string | null;
  id: number;
  type: string;
};

export type Plan = {
  id: number;
  nom: string | null;
  axes: PlanNode[];
  referents: Personne[];
  pilotes: Personne[];
  type: PlanType | null;
  collectiviteId: number;
  createdAt: string;
};
