import { match } from 'ts-pattern';
import { FicheToClassify } from '../pipeline/classify-fiches/render-fiches-text';
import { ClassifyBatchFailure } from './classify-batch.errors';

type ToFaultyFicheIds = (input: {
  readonly failure: ClassifyBatchFailure;
  readonly fiches: readonly FicheToClassify[];
}) => number[];

const toFicheIdsAt = (
  fiches: readonly FicheToClassify[],
  indexes: readonly number[]
): number[] =>
  indexes.flatMap((index) => {
    const fiche = fiches.at(index);
    return fiche === undefined ? [] : [fiche.ficheId];
  });

export const toFaultyFicheIds: ToFaultyFicheIds = ({ failure, fiches }) => {
  const wholeBatch = (): number[] => fiches.map(({ ficheId }) => ficheId);
  return match(failure)
    .with(
      { kind: 'rate_limited' },
      { kind: 'truncated' },
      { kind: 'invalid_json' },
      { kind: 'api_error' },
      { kind: 'empty_batch' },
      { kind: 'batch_too_large' },
      { kind: 'empty_response' },
      { kind: 'unexpected_index' },
      { kind: 'unknown_enjeu' },
      wholeBatch
    )
    .with(
      { kind: 'duplicate_index' },
      { kind: 'contradictory_abstention' },
      { kind: 'undeclared_abstention' },
      ({ index }) => toFicheIdsAt(fiches, [index])
    )
    .with({ kind: 'missing_indexes' }, ({ indexes }) =>
      toFicheIdsAt(fiches, indexes)
    )
    .exhaustive();
};
