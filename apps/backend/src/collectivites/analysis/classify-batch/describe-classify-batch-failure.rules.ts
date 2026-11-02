import { describeLlmError } from '@tet/backend/utils/llm/llm.errors';
import { match } from 'ts-pattern';
import { ClassifyBatchFailure } from './classify-batch.errors';

type DescribeClassifyBatchFailure = (failure: ClassifyBatchFailure) => string;

export const describeClassifyBatchFailure: DescribeClassifyBatchFailure = (
  failure
) =>
  match(failure)
    .with(
      { kind: 'rate_limited' },
      { kind: 'truncated' },
      { kind: 'invalid_json' },
      { kind: 'api_error' },
      { kind: 'unsupported' },
      (llmError) => describeLlmError(llmError)
    )
    .with(
      { kind: 'empty_batch' },
      { kind: 'empty_response' },
      ({ kind }) => kind
    )
    .with(
      { kind: 'batch_too_large' },
      ({ count }) => `batch_too_large (${count} fiches)`
    )
    .with(
      { kind: 'unexpected_index' },
      { kind: 'duplicate_index' },
      { kind: 'contradictory_abstention' },
      { kind: 'undeclared_abstention' },
      ({ kind, index }) => `${kind} (index ${index})`
    )
    .with(
      { kind: 'missing_indexes' },
      ({ indexes }) => `missing_indexes (${indexes.join(', ')})`
    )
    .with({ kind: 'unknown_enjeu' }, ({ enjeu }) => `unknown_enjeu (${enjeu})`)
    .exhaustive();
