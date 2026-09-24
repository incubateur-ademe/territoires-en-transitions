import { createEnumObject } from '@tet/domain/utils';

const voletErrorValues = ['SAVE_VOLETS_ERROR', 'GET_VOLETS_ERROR'] as const;

export const VoletErrorEnum = createEnumObject(voletErrorValues);

export type VoletError = (typeof voletErrorValues)[number];
