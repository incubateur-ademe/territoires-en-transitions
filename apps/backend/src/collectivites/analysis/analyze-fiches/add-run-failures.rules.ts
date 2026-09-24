import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { z } from 'zod';

export const runFailureSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('fiche'),
    ficheId: z.number().int().positive(),
    collectiviteId: z.optional(z.undefined()),
  }),
  z.object({
    kind: z.literal('mobilisation'),
    collectiviteId: z.number().int().positive(),
    ficheId: z.optional(z.undefined()),
  }),
]);

export type RunFailure = z.output<typeof runFailureSchema>;

export type RunAborted = {
  readonly kind: 'failure_threshold_reached';
  readonly failures: readonly RunFailure[];
};

type AddRunFailures = (
  failures: readonly RunFailure[],
  newFailures: readonly RunFailure[]
) => Result<RunFailure[], RunAborted>;

const RUN_FAILURE_THRESHOLD = 10;

export const addRunFailures: AddRunFailures = (failures, newFailures) => {
  const allFailures = [...failures, ...newFailures];
  if (allFailures.length >= RUN_FAILURE_THRESHOLD) {
    return failure({
      kind: 'failure_threshold_reached',
      failures: allFailures,
    });
  }
  return success(allFailures);
};
