import { createEnumObject } from '@tet/domain/utils';

const voletErrorValues = [
  'SAVE_VOLETS_ERROR',
  'GET_VOLETS_ERROR',
  'DELETE_VOLETS_ERROR',
  'LIST_COLLECTIVITES_WITH_MOBILISATION_ERROR',
  'GET_MOBILISATION_STATE_ERROR',
] as const;

export const VoletErrorEnum = createEnumObject(voletErrorValues);

export type VoletError = (typeof voletErrorValues)[number];
