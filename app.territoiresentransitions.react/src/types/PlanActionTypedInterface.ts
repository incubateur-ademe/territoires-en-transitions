import {PlanAction} from 'generated/models/plan_action';

export interface Categories {
  categories: {nom: string; uid: string; children: string[]}[];
}

export interface FicheByCategory {
  fiches_by_category: {category_uid: string; fiche_uid: string}[];
}

export type PlanActionTypedInterface = PlanAction &
  FicheByCategory &
  Categories;
