import { ClassifiedFiche } from '../pipeline/classify-fiches/apply-classification';

export type UnclassifiedFiche = {
  ficheId: number;
  reason: string;
};

export type ClassificationDraft = {
  fiches: ClassifiedFiche[];
  unclassified: UnclassifiedFiche[];
};
