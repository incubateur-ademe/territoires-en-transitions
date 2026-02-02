import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

export const instanceGouvernanceErrorEnum = createErrorsEnum();
export type InstanceGouvernanceError =
  keyof typeof instanceGouvernanceErrorEnum;
