import { notImplemented } from '@tet/backend/utils/not-implemented';
import {
  AnalysisRunPlan,
  FicheAnalysis,
  FicheCandidate,
} from '../models/fiche-analysis';

type BuildAnalysisRunPlan = (input: {
  readonly fiches: readonly FicheCandidate[];
  readonly analyses: readonly FicheAnalysis[];
}) => AnalysisRunPlan;

export const buildAnalysisRunPlan: BuildAnalysisRunPlan = notImplemented(
  'buildAnalysisRunPlan'
);
