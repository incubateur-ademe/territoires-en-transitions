import {
  questionChoixTable,
  QuestionChoixType,
} from '@/backend/collectivites/personnalisations/models/question-choix.table';
import { questionThematiqueTable } from '@/backend/collectivites/personnalisations/models/question-thematique.table';
import { QuestionWithChoices } from '@/backend/collectivites/personnalisations/models/question-with-choices.dto';
import { questionTable } from '@/backend/collectivites/personnalisations/models/question.table';
import { CollectiviteType } from '@/backend/collectivites/shared/models/collectivite.table';
import { DatabaseService } from '@/backend/utils';
import { Injectable, Logger } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';

@Injectable()
export default class ListPersonnalisationQuestionsService {
  private readonly logger = new Logger(
    ListPersonnalisationQuestionsService.name
  );

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Creates a subquery that aggregates choices per question
   */
  private getQuestionChoixQuery() {
    const query = this.databaseService.db
      .select({
        questionId: questionChoixTable.questionId,
        choix: sql<Omit<QuestionChoixType, 'questionId' | 'version'>[]>`
          array_agg(
            json_build_object(
              'id', ${questionChoixTable.id},
              'ordonnancement', ${questionChoixTable.ordonnancement},
              'formulation', ${questionChoixTable.formulation}
            )
            ORDER BY ${questionChoixTable.ordonnancement}
          )
        `.as('choix'),
      })
      .from(questionChoixTable)
      .groupBy(questionChoixTable.questionId);

    return query.as('questionChoix');
  }

  /**
   * Lists all personnalisation questions with their choices
   * @returns Array of questions with their choices attached
   */
  async listQuestionsWithChoices(): Promise<QuestionWithChoices[]> {
    this.logger.log('Fetching all personnalisation questions with choices');

    // Create the choices subquery
    const questionChoixSubquery = this.getQuestionChoixQuery();

    // Main query with joined subquery
    const questions = await this.databaseService.db
      .select({
        id: questionTable.id,
        thematiqueId: questionTable.thematiqueId,
        thematiqueNom: questionThematiqueTable.nom,
        ordonnancement: questionTable.ordonnancement,
        typesCollectivitesConcernees: sql<
          CollectiviteType[] | null | undefined
        >`${questionTable.typesCollectivitesConcernees}`,
        type: questionTable.type,
        description: questionTable.description,
        formulation: questionTable.formulation,
        version: questionTable.version,
        choix: sql<
          Omit<QuestionChoixType, 'questionId' | 'version'>[]
        >`${questionChoixSubquery.choix}`,
      })
      .from(questionTable)
      .leftJoin(
        questionChoixSubquery,
        eq(questionChoixSubquery.questionId, questionTable.id)
      )
      .leftJoin(
        questionThematiqueTable,
        eq(questionThematiqueTable.id, questionTable.thematiqueId)
      )
      .orderBy(questionTable.ordonnancement, questionTable.id);

    this.logger.log(`Successfully fetched ${questions.length} questions`);

    return questions;
  }
}
