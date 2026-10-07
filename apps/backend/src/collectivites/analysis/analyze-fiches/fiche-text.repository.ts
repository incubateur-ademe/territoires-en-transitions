import { type Result } from '@tet/backend/utils/result.type';
import { FicheText } from '../models/fiche-analysis';
import { FicheTextError } from './analyze-fiches.errors';

export abstract class FicheTextRepository {
  abstract listFicheTexts(input: {
    readonly ficheIds: readonly number[];
  }): Promise<Result<FicheText[], FicheTextError>>;
}
