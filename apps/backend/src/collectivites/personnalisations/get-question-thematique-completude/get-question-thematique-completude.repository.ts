import { Injectable, Logger } from '@nestjs/common';
import { questionThematiqueCompletudeView } from '@tet/backend/collectivites/personnalisations/models/question-thematique-completude.view';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import {
  questionThematiqueCompletudeSchema,
  type QuestionThematiqueCompletude,
} from '@tet/domain/collectivites';
import { eq } from 'drizzle-orm';

@Injectable()
export class GetQuestionThematiqueCompletudeRepository {
  private readonly logger = new Logger(GetQuestionThematiqueCompletudeRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async listByCollectiviteId(
    collectiviteId: number,
    user: AuthenticatedUser
  ): Promise<QuestionThematiqueCompletude[]> {
    const rows = await this.databaseService.rls(user)(async (tx) => {
      return tx
        .select()
        .from(questionThematiqueCompletudeView)
        .where(
          eq(questionThematiqueCompletudeView.collectiviteId, collectiviteId)
        );
    });

    return rows
      .map((row) => {
        const result = questionThematiqueCompletudeSchema.safeParse(row);
        if (!result.success) {
          this.logger.warn(
            `invalid question_thematique_completude for row: ${JSON.stringify(
              row
            )} - ${JSON.stringify(result.error.issues)}`
          );
          return undefined;
        }
        return result.data;
      })
      .filter(
        (data): data is QuestionThematiqueCompletude => data !== undefined
      );
  }
}
