import { INestApplicationContext, Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { success, type Result } from '@tet/backend/utils/result.type';
import { Enjeu } from '@tet/domain/shared';
import { getErrorMessage } from '@tet/domain/utils';
import { AnalyzeFichesInputError } from './analyze-fiches.errors';
import {
  AnalyzeFichesInput,
  toAnalyzeFichesInputScope,
} from './analyze-fiches.input';
import { AnalyzeFichesModule } from './analyze-fiches.module';
import { AnalyzeFichesOutput } from './analyze-fiches.output';
import { AnalyzeFichesService } from './analyze-fiches.service';

const SUCCESS_EXIT_CODE = 0;

const FAILURE_EXIT_CODE = 1;

export type AnalyzeFichesExitCode =
  | typeof SUCCESS_EXIT_CODE
  | typeof FAILURE_EXIT_CODE;

const ANALYZED_ENJEU: Enjeu = 'ges';

const SCRIPT_NAME = 'analyze-fiches.script';

const logger = new Logger(SCRIPT_NAME);

type AnalyzeFichesCommand = {
  readonly argv: readonly string[];
  readonly startedAt: Date;
};

export const toAnalyzeFichesInput = ({
  argv,
  startedAt,
}: AnalyzeFichesCommand): Result<
  AnalyzeFichesInput,
  AnalyzeFichesInputError
> => {
  const scopeResult = toAnalyzeFichesInputScope(argv);
  if (!scopeResult.success) {
    return scopeResult;
  }
  return success({ enjeu: ANALYZED_ENJEU, scope: scopeResult.data, startedAt });
};

const toRunSummary = (output: AnalyzeFichesOutput): string =>
  [
    `${output.classifiedFicheIds.length} fiche(s) classified`,
    `${output.failedFicheIds.length} fiche(s) failed`,
    `${output.removedFicheIds.length} removed fiche(s) cleaned`,
    `${output.recalculatedCollectiviteIds.length} mobilisation(s) recalculated`,
    `${output.failedCollectiviteIds.length} mobilisation(s) failed`,
  ].join(', ');

export const runAnalyzeFichesScript = async ({
  app,
  ...command
}: AnalyzeFichesCommand & {
  readonly app: INestApplicationContext;
}): Promise<AnalyzeFichesExitCode> => {
  const inputResult = toAnalyzeFichesInput(command);
  if (!inputResult.success) {
    logger.error(`Rejected arguments: ${JSON.stringify(inputResult.error)}`);
    return FAILURE_EXIT_CODE;
  }

  const runResult = await app
    .get(AnalyzeFichesService)
    .analyzeFiches(inputResult.data);
  if (!runResult.success) {
    logger.error(`Run aborted: ${JSON.stringify(runResult.error)}`);
    return FAILURE_EXIT_CODE;
  }

  logger.log(`Run completed: ${toRunSummary(runResult.data)}`);
  return SUCCESS_EXIT_CODE;
};

const analyzeFichesFromCommandLine = async (): Promise<void> => {
  const startedAt = new Date();
  const app = await NestFactory.createApplicationContext(AnalyzeFichesModule);
  try {
    process.exitCode = await runAnalyzeFichesScript({
      app,
      argv: process.argv.slice(2),
      startedAt,
    });
  } finally {
    await app.close();
  }
};

const isLaunchedFromCommandLine =
  process.argv[1]?.includes(SCRIPT_NAME) ?? false;

if (isLaunchedFromCommandLine) {
  analyzeFichesFromCommandLine().catch((error: unknown) => {
    logger.error(`Run could not complete: ${getErrorMessage(error)}`);
    process.exitCode = FAILURE_EXIT_CODE;
  });
}
