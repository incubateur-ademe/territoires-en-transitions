import {
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import ListPersonnalisationQuestionsService from '@tet/backend/collectivites/personnalisations/list-personnalisation-questions/list-personnalisation-questions.service';
import { questionChoixTable } from '@tet/backend/collectivites/personnalisations/models/question-choix.table';
import { questionThematiqueTable } from '@tet/backend/collectivites/personnalisations/models/question-thematique.table';
import { QuestionWithChoices } from '@tet/backend/collectivites/personnalisations/models/question-with-choices.dto';
import { questionTable } from '@tet/backend/collectivites/personnalisations/models/question.table';
import BaseSpreadsheetImporterService from '@tet/backend/shared/services/base-spreadsheet-importer.service';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { buildConflictUpdateColumns } from '@tet/backend/utils/database/conflict.utils';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import SheetService from '@tet/backend/utils/google-sheets/sheet.service';
import VersionService from '@tet/backend/utils/version/version.service';
import {
  QuestionChoixCreate,
  QuestionThematique,
  questionThematiqueSchema,
} from '@tet/domain/collectivites';
import { sql } from 'drizzle-orm';
import {
  ImportPersonnalisationChoix,
  importPersonnalisationChoixSchema,
  ImportPersonnalisationQuestion,
  importPersonnalisationQuestionSchema,
} from './import-personnalisation-question.dto';

@Injectable()
export default class ImportPersonnalisationQuestionService extends BaseSpreadsheetImporterService {
  readonly logger = new Logger(ImportPersonnalisationQuestionService.name);

  private readonly QUESTIONS_SPREADSHEET_RANGE = 'Questions!A:H';
  private readonly THEMATIQUES_SPREADSHEET_RANGE = 'Thématiques!A:B';
  private readonly CHOIX_SPREADSHEET_RANGE = 'Choix!A:D';

  constructor(
    private readonly databaseService: DatabaseService,
    sheetService: SheetService,
    private readonly config: ConfigurationService,
    private readonly listPersonnalisationQuestionsService: ListPersonnalisationQuestionsService,
    private readonly versionService: VersionService
  ) {
    super(sheetService);
  }

  private getSpreadsheetId(): string {
    return this.config.get('PERSONNALISATION_QUESTIONS_SHEET_ID');
  }

  private async getVersion(): Promise<string | null> {
    const result = await this.databaseService.db
      .select({
        version: sql<string>`MAX(${questionTable.version})`,
      })
      .from(questionTable);
    const version = result.length ? result[0].version : null;
    return version;
  }

  async importPersonnalisationQuestions(): Promise<{
    questions: QuestionWithChoices[];
  }> {
    const spreadsheetId = this.getSpreadsheetId();

    const allowVersionOverwrite =
      this.versionService.getVersion().environment !== 'prod';
    const lastVersion = await this.getVersion();
    this.logger.log(`Last version found in database: ${lastVersion}`);
    const newVersion = await this.checkLastVersion(
      spreadsheetId,
      lastVersion,
      allowVersionOverwrite
    );

    // Get thématiques, questions and choices from spreadsheet
    const { data: questionThematiques } =
      await this.listPersonnalisationQuestionThematiques(spreadsheetId);

    const { data: questions } = await this.listPersonnalisationQuestions(
      spreadsheetId,
      newVersion
    );
    const { data: choix } = await this.listPersonnalisationChoix(
      spreadsheetId,
      newVersion
    );

    this.logger.log(
      `Found ${questions.length} questions and ${choix.length} choices in spreadsheet ${spreadsheetId}`
    );

    // Verify data integrity
    this.verifyPersonnalisationQuestionsAndChoix(
      questions,
      choix,
      questionThematiques
    );

    // Upsert questions and choices
    const upsertedQuestions =
      await this.upsertPersonnalisationQuestionsAndChoix(
        questions,
        choix,
        questionThematiques
      );

    return { questions: upsertedQuestions };
  }

  async listPersonnalisationQuestionThematiques(spreadsheetId: string) {
    return this.sheetService.getDataFromSheet<QuestionThematique>(
      spreadsheetId,
      questionThematiqueSchema,
      this.THEMATIQUES_SPREADSHEET_RANGE,
      ['id']
    );
  }

  async listPersonnalisationQuestions(
    spreadsheetId: string,
    newVersion: string
  ) {
    return this.sheetService.getDataFromSheet<ImportPersonnalisationQuestion>(
      spreadsheetId,
      importPersonnalisationQuestionSchema,
      this.QUESTIONS_SPREADSHEET_RANGE,
      ['id'],
      {
        description: '',
        version: newVersion,
      }
    );
  }

  async listPersonnalisationChoix(spreadsheetId: string, newVersion: string) {
    return this.sheetService.getDataFromSheet<ImportPersonnalisationChoix>(
      spreadsheetId,
      importPersonnalisationChoixSchema,
      this.CHOIX_SPREADSHEET_RANGE,
      ['id'],
      {
        version: newVersion,
      }
    );
  }

  verifyPersonnalisationQuestionsAndChoix(
    questions: ImportPersonnalisationQuestion[],
    choix: ImportPersonnalisationChoix[],
    questionThematiques: QuestionThematique[]
  ) {
    const questionsMap = new Map<string, ImportPersonnalisationQuestion>();
    const choixByQuestionMap = new Map<string, ImportPersonnalisationChoix[]>();

    // Verify no duplicate question IDs
    questions.forEach((question) => {
      if (questionsMap.has(question.id)) {
        throw new UnprocessableEntityException(
          `Duplicate question id ${question.id}`
        );
      }
      questionsMap.set(question.id, question);

      if (
        question.thematiqueId &&
        !questionThematiques.find(
          (thematique) => thematique.id === question.thematiqueId
        )
      ) {
        throw new UnprocessableEntityException(
          `Invalid thematique reference ${question.thematiqueId} for question ${question.id}`
        );
      }
    });

    // Group choices by question and verify references
    choix.forEach((choice) => {
      if (!questionsMap.has(choice.questionId)) {
        throw new UnprocessableEntityException(
          `Invalid question reference ${choice.questionId} for choice ${choice.id}`
        );
      }

      if (!choixByQuestionMap.has(choice.questionId)) {
        choixByQuestionMap.set(choice.questionId, []);
      }
      choixByQuestionMap.get(choice.questionId)?.push(choice);
    });

    // Verify that questions of type 'choix' have choices
    questions.forEach((question) => {
      if (question.type === 'choix') {
        const questionChoix = choixByQuestionMap.get(question.id) || [];
        if (questionChoix.length === 0) {
          throw new UnprocessableEntityException(
            `Question ${question.id} is of type 'choix' but has no choices defined`
          );
        }
      }
    });

    this.logger.log('Verification complete: all data is valid');
  }

  private async upsertPersonnalisationQuestionsAndChoix(
    questions: ImportPersonnalisationQuestion[],
    choix: ImportPersonnalisationChoix[],
    questionThematiques: QuestionThematique[]
  ): Promise<QuestionWithChoices[]> {
    await this.databaseService.db.transaction(async (tx) => {
      this.logger.log(
        `Upserting ${questionThematiques.length} thematiques, ${questions.length} questions and ${choix.length} choices in a transaction`
      );

      // Upsert thematiques
      const upsertedThematiques = await tx
        .insert(questionThematiqueTable)
        .values(questionThematiques)
        .onConflictDoUpdate({
          target: [questionThematiqueTable.id],
          set: buildConflictUpdateColumns(questionThematiqueTable, ['nom']),
        })
        .returning();

      // Upsert questions
      const upsertedQuestions = await tx
        .insert(questionTable)
        .values(questions)
        .onConflictDoUpdate({
          target: [questionTable.id],
          set: buildConflictUpdateColumns(questionTable, [
            'formulation',
            'description',
            'type',
            'thematiqueId',
            'ordonnancement',
            'typesCollectivitesConcernees',
            'version',
          ]),
        })
        .returning();

      // Insert new choices
      let upsertedChoix: QuestionChoixCreate[] = [];
      if (choix.length > 0) {
        upsertedChoix = await tx
          .insert(questionChoixTable)
          .values(choix)
          .onConflictDoUpdate({
            target: [questionChoixTable.id],
            set: buildConflictUpdateColumns(questionChoixTable, [
              'questionId',
              'formulation',
              'ordonnancement',
              'version',
            ]),
          })
          .returning();
      }

      this.logger.log(
        `Successfully upserted ${upsertedQuestions.length} questions and ${upsertedChoix.length} choices`
      );

      return {
        thematiques: upsertedThematiques,
        questions: upsertedQuestions,
        choix: upsertedChoix,
      };
    });

    return this.listPersonnalisationQuestionsService.listQuestionsWithChoices();
  }
}
