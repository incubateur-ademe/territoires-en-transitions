import { createErrorsEnum } from '@tet/backend/utils/trpc/trpc-error-handler';

export const VoletSpecificErrors = ['SAVE_VOLETS_ERROR'] as const;

export type VoletSpecificError = (typeof VoletSpecificErrors)[number];

export const VoletErrorEnum = createErrorsEnum(VoletSpecificErrors);

export type VoletError = keyof typeof VoletErrorEnum;
