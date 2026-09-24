import { FicheVolet } from '../pipeline/calculate-mobilisation/group-volets-by-levier';
import { FicheToScore } from '../pipeline/calculate-mobilisation/render-volet-actions';
import { ClassificationReport } from './classification-report';

export type ClassificationOutcome = {
  report: ClassificationReport;
  fiches: FicheToScore[];
  volets: FicheVolet[];
};
