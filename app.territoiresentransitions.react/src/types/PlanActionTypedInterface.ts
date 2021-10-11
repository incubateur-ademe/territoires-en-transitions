import {PlanAction} from 'generated/models/plan_action';

export interface Categorie {
  nom: string;
  uid: string;
  parent?: string;
}

export interface PlanActionStructure {
  categories: Categorie[];
  fiches_by_category: {category_uid?: string; fiche_uid: string}[];
}

export type PlanActionTyped = PlanAction & PlanActionStructure;
