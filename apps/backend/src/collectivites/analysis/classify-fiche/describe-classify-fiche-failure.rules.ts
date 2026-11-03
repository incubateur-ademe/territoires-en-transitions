import { describeLlmError } from '@tet/backend/utils/llm/llm.errors';
import { match } from 'ts-pattern';
import { ClassifyFicheFailure } from './classify-fiche.errors';

type DescribeClassifyFicheFailure = (failure: ClassifyFicheFailure) => string;

export const describeClassifyFicheFailure: DescribeClassifyFicheFailure = (
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
    .with({ kind: 'unknown_enjeu' }, ({ enjeu }) => `unknown_enjeu (${enjeu})`)
    .exhaustive();
