import {PlanActionRead} from 'generated/dataLayer/plan_action_read';

export interface Categorie {
  nom: string;
  uid: string;
  parent?: string;
}

export interface PlanActionStructure {
  categories: Categorie[];
  fiches_by_category: {category_uid?: string; fiche_uid: string}[];
}

export type PlanActionTyped = Omit<
  PlanActionRead,
  'categories' | 'fiches_by_category'
> &
  PlanActionStructure;
