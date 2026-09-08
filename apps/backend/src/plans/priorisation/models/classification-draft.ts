import { ClassifiedFiche } from '../pipeline/classify-fiches/apply-classification';
import { ClassifyFichesError } from '../pipeline/classify-fiches/classify-fiches';

export type UnclassifiedFiche = {
  ficheId: number;
  reason: ClassifyFichesError['kind'];
};

export type ClassificationDraft = {
  fiches: ClassifiedFiche[];
  unclassified: UnclassifiedFiche[];
};
