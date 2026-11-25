import { failure, Result } from '@tet/backend/utils/result.type';
import { TrpcErrorHandlerConfig } from '@tet/backend/utils/trpc/trpc-error-handler';
import type { EstimationError } from 'leviers-ges';
import { match } from 'ts-pattern';

export type EstimateLevierGesError = EstimationError['kind'];

export const estimateLevierGesErrorConfig: TrpcErrorHandlerConfig<EstimateLevierGesError> =
  {
    specificErrors: {
      invalid_request: { code: 'BAD_REQUEST', messageFromCause: true },
      unknown_territory: { code: 'NOT_FOUND', messageFromCause: true },
      level_not_computed: {
        code: 'UNPROCESSABLE_CONTENT',
        messageFromCause: true,
      },
      missing_data: { code: 'UNPROCESSABLE_CONTENT', messageFromCause: true },
      invalid_dataset: { code: 'INTERNAL_SERVER_ERROR' },
    },
  };

const toReadableMessage = (error: EstimationError): string | undefined =>
  match(error)
    .with(
      { kind: 'invalid_request' },
      ({ issues }) =>
        `Requête invalide : ${issues
          .map(({ parameter, message }) => `${parameter} (${message})`)
          .join(', ')}`
    )
    .with(
      { kind: 'unknown_territory' },
      ({ level, code }) => `Territoire inconnu (${level} ${code})`
    )
    .with(
      { kind: 'level_not_computed' },
      ({ lever, level }) =>
        `Le levier ${lever} n'est pas calculé au niveau ${level}`
    )
    .with(
      { kind: 'missing_data' },
      ({ dataset, key }) =>
        `Données manquantes pour ce territoire (${dataset}, ${key})`
    )
    .with({ kind: 'invalid_dataset' }, () => undefined)
    .exhaustive();

export const toEstimateLevierGesFailure = (
  error: EstimationError
): Result<never, EstimateLevierGesError> => {
  const message = toReadableMessage(error);
  return failure(error.kind, message ? new Error(message) : undefined);
};
