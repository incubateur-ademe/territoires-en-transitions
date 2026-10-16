import { isTransientError } from '@tet/backend/utils/llm/is-transient-error';
import { describeLlmError, LlmError } from '@tet/backend/utils/llm/llm.errors';
import { failure, Result, success } from '@tet/backend/utils/result.type';

export type SucceededBatches<Outcome> = {
  outcomes: Outcome[];
  warnings: string[];
  failedBatches: number;
};

/**
 * Une étape d'amélioration garde ce qu'un lot en échec n'a pas amélioré, avec
 * un avertissement. Sauf quand tous ses lots échouent sur une erreur passagère
 * (quota, panne, coupure) malgré les relances : le brouillon perdrait l'étape
 * sans que personne le sache, mieux vaut un échec qu'on reprend ensuite.
 */
export const keepSucceededBatches = <Batch, Outcome>(
  batches: readonly Batch[],
  results: readonly Result<Outcome, LlmError>[],
  describeFailure: (batch: Batch) => string
): Result<SucceededBatches<Outcome>, LlmError> => {
  const failures = results.flatMap((result, index) =>
    result.success ? [] : [{ batch: batches[index], error: result.error }]
  );
  if (
    failures.length > 0 &&
    failures.length === results.length &&
    failures.every(({ error }) => isTransientError(error))
  ) {
    return failure(failures[0].error);
  }
  return success({
    outcomes: results.flatMap((result) =>
      result.success ? [result.data] : []
    ),
    warnings: failures.map(
      ({ batch, error }) =>
        `${describeFailure(batch)} : ${describeLlmError(error)}`
    ),
    failedBatches: failures.length,
  });
};
