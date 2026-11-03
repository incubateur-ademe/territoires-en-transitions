import { ErrorConfigMap } from '@tet/backend/utils/trpc/trpc-error-config';
import {
  PLAN_CREATION_DISABLED_MESSAGES,
  PlanCreationDisabledReason,
} from '@tet/domain/plans';

export const planCreationErrorConfig: ErrorConfigMap<PlanCreationDisabledReason> =
  {
    ELECTRIFICATION_CREATION_DISABLED: {
      code: 'BAD_REQUEST',
      message:
        PLAN_CREATION_DISABLED_MESSAGES.ELECTRIFICATION_CREATION_DISABLED,
    },
  };
