import { notImplemented } from '@tet/backend/utils/not-implemented';
import { FicheToClassify } from '../pipeline/classify-fiches/render-fiches-text';
import { ClassifyBatchFailure } from './classify-batch.errors';

type ToFaultyFicheIds = (input: {
  readonly failure: ClassifyBatchFailure;
  readonly fiches: readonly FicheToClassify[];
}) => number[];

export const toFaultyFicheIds: ToFaultyFicheIds =
  notImplemented('toFaultyFicheIds');
