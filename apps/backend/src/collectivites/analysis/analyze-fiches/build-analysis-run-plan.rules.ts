import { match } from 'ts-pattern';
import { z } from 'zod';
import {
  AnalysisRunPlan,
  failedFicheAnalysisSchema,
  FicheAnalysis,
  FicheCandidate,
  processedFicheAnalysisSchema,
} from '../models/fiche-analysis';
import { calculateFicheFingerprint } from './calculate-fiche-fingerprint.rules';

type BuildAnalysisRunPlan = (input: {
  readonly fiches: readonly FicheCandidate[];
  readonly analyses: readonly FicheAnalysis[];
}) => AnalysisRunPlan;

type FicheDecision = 'skip' | 'classify' | 'mark_stale' | 'remove';

type ProcessedFicheAnalysis = z.output<typeof processedFicheAnalysisSchema>;

type FailedFicheAnalysis = z.output<typeof failedFicheAnalysisSchema>;

const hasFingerprintChanged = (
  fiche: FicheCandidate,
  analysis: ProcessedFicheAnalysis
): boolean => calculateFicheFingerprint(fiche) !== analysis.fingerprint;

const isModifiedSinceFailedAnalysis = (
  fiche: FicheCandidate,
  analysis: FailedFicheAnalysis
): boolean => fiche.modifiedAt > analysis.analyzedAt;

const decideAnalyzedFiche = (
  fiche: FicheCandidate,
  analysis: FicheAnalysis
): FicheDecision =>
  match(analysis)
    .with({ status: 'processed' }, (processed) =>
      hasFingerprintChanged(fiche, processed) ? 'mark_stale' : 'skip'
    )
    .with({ status: 'stale' }, (): FicheDecision => 'classify')
    .with({ status: 'failed' }, (failed) =>
      isModifiedSinceFailedAnalysis(fiche, failed) ? 'mark_stale' : 'classify'
    )
    .exhaustive();

const decideFiche = (
  fiche: FicheCandidate,
  analysis: FicheAnalysis | undefined
): FicheDecision => {
  if (analysis === undefined) {
    return fiche.isDeleted ? 'skip' : 'classify';
  }
  if (fiche.isDeleted) {
    return 'remove';
  }
  return decideAnalyzedFiche(fiche, analysis);
};

export const buildAnalysisRunPlan: BuildAnalysisRunPlan = ({
  fiches,
  analyses,
}) => {
  const analysisByFicheId = new Map(
    analyses.map((analysis) => [analysis.ficheId, analysis])
  );
  const decisions = fiches.map((fiche) => ({
    fiche,
    decision: decideFiche(fiche, analysisByFicheId.get(fiche.ficheId)),
  }));
  const fichesWith = (accepted: readonly FicheDecision[]): FicheCandidate[] =>
    decisions
      .filter(({ decision }) => accepted.includes(decision))
      .map(({ fiche }) => fiche);

  return {
    toClassify: fichesWith(['classify', 'mark_stale']),
    toMarkStale: fichesWith(['mark_stale']),
    toRemove: fichesWith(['remove']),
  };
};
