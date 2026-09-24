import { match } from 'ts-pattern';
import { FicheAnalysis } from '../models/fiche-analysis';
import { MobilisationState } from '../models/mobilisation-state';

type IsMobilisationStale = (input: {
  readonly mobilisation: MobilisationState;
  readonly analyses: readonly FicheAnalysis[];
}) => boolean;

const isProcessedAfter =
  (calculatedAt: Date) =>
  (analysis: FicheAnalysis): boolean =>
    analysis.status === 'processed' && analysis.analyzedAt > calculatedAt;

export const isMobilisationStale: IsMobilisationStale = ({
  mobilisation,
  analyses,
}) =>
  match(mobilisation)
    .with({ kind: 'never_calculated' }, () =>
      analyses.some(({ status }) => status === 'processed')
    )
    .with({ kind: 'calculated' }, ({ calculatedAt, ficheIds }) => {
      const analyzedFicheIds = new Set(analyses.map(({ ficheId }) => ficheId));
      const citesFicheWithoutAnalysis = ficheIds.some(
        (ficheId) => !analyzedFicheIds.has(ficheId)
      );
      return (
        citesFicheWithoutAnalysis ||
        analyses.some(isProcessedAfter(calculatedAt))
      );
    })
    .exhaustive();
