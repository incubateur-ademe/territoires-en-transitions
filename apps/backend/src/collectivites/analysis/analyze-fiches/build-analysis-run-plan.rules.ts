import { match } from 'ts-pattern';
import {
  AnalysisRunPlan,
  FicheAnalysis,
  FicheCandidate,
} from '../models/fiche-analysis';
import { calculateFicheFingerprint } from './calculate-fiche-fingerprint.rules';

type BuildAnalysisRunPlan = (input: {
  readonly fiches: readonly FicheCandidate[];
  readonly analyses: readonly FicheAnalysis[];
}) => AnalysisRunPlan;

type FicheDecision = 'skip' | 'classify' | 'mark_stale' | 'remove';

const hasFingerprintChanged = (
  fiche: FicheCandidate,
  analysis: Extract<FicheAnalysis, { status: 'processed' }>
): boolean => calculateFicheFingerprint(fiche) !== analysis.fingerprint;

const isModifiedSinceFailedAnalysis = (
  fiche: FicheCandidate,
  analysis: Extract<FicheAnalysis, { status: 'failed' }>
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
