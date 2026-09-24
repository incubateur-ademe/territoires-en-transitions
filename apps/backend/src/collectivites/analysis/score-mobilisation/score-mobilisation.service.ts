import { Injectable } from '@nestjs/common';
import { notImplemented } from '@tet/backend/utils/not-implemented';
import { type Result } from '@tet/backend/utils/result.type';
import { LevierMobilisation } from '../mobilisation.repository';
import { CalculateCollectiviteMobilisationError } from './score-mobilisation.errors';
import { CalculateCollectiviteMobilisationInput } from './score-mobilisation.input';

export type MobilisationScore = {
  leviers: LevierMobilisation[];
};

type CalculateCollectiviteMobilisation = (
  input: CalculateCollectiviteMobilisationInput
) => Promise<Result<MobilisationScore, CalculateCollectiviteMobilisationError>>;

@Injectable()
export class ScoreMobilisationService {
  calculateCollectiviteMobilisation: CalculateCollectiviteMobilisation =
    notImplemented('calculateCollectiviteMobilisation');
}
