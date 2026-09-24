import { notImplemented } from '@tet/backend/utils/not-implemented';
import { FicheAnalysis } from '../models/fiche-analysis';
import { MobilisationState } from '../models/mobilisation-state';

type IsMobilisationStale = (input: {
  readonly mobilisation: MobilisationState;
  readonly analyses: readonly FicheAnalysis[];
}) => boolean;

export const isMobilisationStale: IsMobilisationStale = notImplemented(
  'isMobilisationStale'
);
