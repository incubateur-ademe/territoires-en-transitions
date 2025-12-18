import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

export const instanceGouvernanceErrorEnum = createErrorsEnum(['YOLO']);
export type InstanceGouvernanceError =
  keyof typeof instanceGouvernanceErrorEnum;
