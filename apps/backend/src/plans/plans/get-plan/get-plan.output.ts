import { AxeNode } from '../../axes/list-axes/flat-axe.schema';
import { Personne } from '../../shared/personne.dto';

export type PlanType = {
  categorie: string;
  detail: string | null;
  id: number;
  type: string;
};

export type Plan = {
  id: number;
  nom: string | null;
  axes: AxeNode[];
  referents: Personne[];
  pilotes: Personne[];
  type: PlanType | null;
  collectiviteId: number;
  createdAt: string;
};
