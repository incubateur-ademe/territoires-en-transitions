import { describeLlmError, LlmError } from '@tet/backend/utils/llm/llm.errors';
import { failure, Result, success } from '@tet/backend/utils/result.type';

export type SucceededBatches<Outcome> = {
  outcomes: Outcome[];
  warnings: string[];
  failedBatches: number;
};

/**
 * Une étape d'amélioration garde ce qu'un lot en échec n'a pas amélioré, avec
 * un avertissement. Sauf quand tous ses lots butent sur le quota : le
 * brouillon perdrait l'étape sans que personne le sache, mieux vaut un échec
 * qu'on reprend une fois le quota rétabli.
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
    failures.every(({ error }) => error.kind === 'rate_limited')
  ) {
    return failure({ kind: 'rate_limited' });
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
