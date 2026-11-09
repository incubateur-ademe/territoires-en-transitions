import { type Result } from '@tet/backend/utils/result.type';
import { FicheAxePathError } from './analyze-fiches.errors';

export type AxePath = readonly string[];

export type FicheAxePaths = {
  readonly ficheId: number;
  readonly axePaths: readonly AxePath[];
};

export abstract class FicheAxePathRepository {
  abstract listFicheAxePaths(input: {
    readonly ficheIds: readonly number[];
  }): Promise<Result<FicheAxePaths[], FicheAxePathError>>;
}
