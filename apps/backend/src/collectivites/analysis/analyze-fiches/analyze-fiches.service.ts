import { Injectable } from '@nestjs/common';
import { notImplemented } from '@tet/backend/utils/not-implemented';
import { type Result } from '@tet/backend/utils/result.type';
import { AnalyzeFichesError } from './analyze-fiches.errors';
import { AnalyzeFichesInput } from './analyze-fiches.input';
import { AnalyzeFichesOutput } from './analyze-fiches.output';

type AnalyzeFiches = (
  input: AnalyzeFichesInput
) => Promise<Result<AnalyzeFichesOutput, AnalyzeFichesError>>;

@Injectable()
export class AnalyzeFichesService {
  analyzeFiches: AnalyzeFiches = notImplemented('analyzeFiches');
}
