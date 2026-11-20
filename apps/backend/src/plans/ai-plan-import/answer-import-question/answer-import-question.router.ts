import { Injectable } from '@nestjs/common';
import { createTrpcErrorHandler } from '@tet/backend/utils/trpc/trpc-error-handler';
import { TrpcService } from '@tet/backend/utils/trpc/trpc.service';
import { aiPlanImportErrorConfig } from '../ai-plan-import.trpc-errors';
import { answerImportQuestionInputSchema } from './answer-import-question.input';
import { AnswerImportQuestionService } from './answer-import-question.service';

@Injectable()
export class AnswerImportQuestionRouter {
  constructor(
    private readonly trpc: TrpcService,
    private readonly answerImportQuestionService: AnswerImportQuestionService
  ) {}

  private readonly getResultDataOrThrowError = createTrpcErrorHandler(
    aiPlanImportErrorConfig
  );

  router = this.trpc.router({
    answerAiImportQuestion: this.trpc.authedProcedure
      .input(answerImportQuestionInputSchema)
      .mutation(async ({ input, ctx: { user } }) => {
        const result = await this.answerImportQuestionService.answer(input, {
          user,
        });
        return this.getResultDataOrThrowError(result);
      }),
  });
}
