import {
  HttpException,
  Injectable,
  Logger,
  UnprocessableEntityException,
} from '@nestjs/common';
import ListPersonnalisationQuestionsService from '@tet/backend/collectivites/personnalisations/list-personnalisation-questions/list-personnalisation-questions.service';
import { questionChoixTable } from '@tet/backend/collectivites/personnalisations/models/question-choix.table';
import { questionThematiqueTable } from '@tet/backend/collectivites/personnalisations/models/question-thematique.table';
import { questionTable } from '@tet/backend/collectivites/personnalisations/models/question.table';
import { banatic2025CompetenceTable } from '@tet/backend/shared/models/banatic-2025-competence.table';
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
  QuestionWithChoices,
} from '@tet/domain/collectivites';
import { sql } from 'drizzle-orm';
import PersonnalisationsExpressionService from '../services/personnalisations-expression.service';
import {
  ImportPersonnalisationChoix,
  importPersonnalisationChoixSchema,
  ImportPersonnalisationCompetence,
  importPersonnalisationCompetenceSchema,
  ImportPersonnalisationQuestion,
  importPersonnalisationQuestionSchema,
} from './import-personnalisation-question.dto';

@Injectable()
export default class ImportPersonnalisationQuestionService extends BaseSpreadsheetImporterService {
  readonly logger = new Logger(ImportPersonnalisationQuestionService.name);

  private readonly QUESTIONS_SPREADSHEET_RANGE = 'Questions!A:J';
  private readonly THEMATIQUES_SPREADSHEET_RANGE = 'Thématiques!A:B';
  private readonly CHOIX_SPREADSHEET_RANGE = 'Choix!A:D';
  private readonly COMPETENCES_SPREADSHEET_RANGE = 'Compétences Banatic!A:B';

  constructor(
    private readonly databaseService: DatabaseService,
    sheetService: SheetService,
    private readonly config: ConfigurationService,
    private readonly listPersonnalisationQuestionsService: ListPersonnalisationQuestionsService,
    private readonly versionService: VersionService,
    private readonly personnalisationsExpressionService: PersonnalisationsExpressionService
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
    const { data: competences } = await this.listPersonnalisationCompetences(
      spreadsheetId,
      newVersion
    );

    this.logger.log(
      `Found ${questions.length} questions and ${choix.length} choices in spreadsheet ${spreadsheetId}`
    );

    const existingQuestions =
      await this.listPersonnalisationQuestionsService.listQuestionsWithChoices(
        []
      );

    // Verify data integrity
    this.verifyPersonnalisationQuestionsAndChoix(
      questions,
      choix,
      questionThematiques,
      existingQuestions,
      competences
    );

    // Upsert questions and choices
    const upsertedQuestions =
      await this.upsertPersonnalisationQuestionsAndChoix(
        questions,
        choix,
        questionThematiques,
        competences
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

  async listPersonnalisationCompetences(
    spreadsheetId: string,
    newVersion: string
  ) {
    return this.sheetService.getDataFromSheet<ImportPersonnalisationCompetence>(
      spreadsheetId,
      importPersonnalisationCompetenceSchema,
      this.COMPETENCES_SPREADSHEET_RANGE,
      ['competenceCode'],
      {
        version: newVersion,
      }
    );
  }

  verifyPersonnalisationQuestionsAndChoix(
    questions: ImportPersonnalisationQuestion[],
    choix: ImportPersonnalisationChoix[],
    questionThematiques: QuestionThematique[],
    existingQuestions: QuestionWithChoices[],
    competences: ImportPersonnalisationCompetence[]
  ) {
    const questionsMap = new Map<string, ImportPersonnalisationQuestion>();
    const choixByQuestionMap = new Map<string, ImportPersonnalisationChoix[]>();

    const existingQuestionsMap = new Map<string, QuestionWithChoices>();
    existingQuestions.forEach((question) => {
      existingQuestionsMap.set(question.id.toLowerCase(), question);
    });

    // Verify no duplicate question IDs
    questions.forEach((question) => {
      const normalizedQuestionId = question.id.toLowerCase();
      if (questionsMap.has(normalizedQuestionId)) {
        throw new UnprocessableEntityException(
          `Duplicate question id ${question.id} (existing: ${
            questionsMap.get(normalizedQuestionId)?.id
          })`
        );
      }

      // or case changes into ID
      if (
        existingQuestionsMap.has(normalizedQuestionId) &&
        existingQuestionsMap.get(normalizedQuestionId)?.id !== question.id
      ) {
        throw new UnprocessableEntityException(
          `Cannot change existing question ID ${
            existingQuestionsMap.get(normalizedQuestionId)?.id
          } to ${question.id} `
        );
      }
      questionsMap.set(normalizedQuestionId, question);

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
      const normalizedQuestionId = choice.questionId.toLowerCase();
      const canonicalQuestion = questionsMap.get(normalizedQuestionId);
      if (!canonicalQuestion) {
        throw new UnprocessableEntityException(
          `Invalid question reference ${choice.questionId} for choice ${choice.id}`
        );
      }
      choice.questionId = canonicalQuestion.id;

      if (!choixByQuestionMap.has(normalizedQuestionId)) {
        choixByQuestionMap.set(normalizedQuestionId, []);
      }
      choixByQuestionMap.get(normalizedQuestionId)?.push(choice);
    });

    // Verify that questions of type 'choix' have choices
    questions.forEach((question) => {
      const normalizedQuestionId = question.id.toLowerCase();
      if (question.type === 'choix') {
        const questionChoix =
          choixByQuestionMap.get(normalizedQuestionId) || [];
        if (questionChoix.length === 0) {
          throw new UnprocessableEntityException(
            `Question ${normalizedQuestionId} is of type 'choix' but has no choices defined`
          );
        }
      }

      // validate expressions
      if (question.exprVisible) {
        try {
          this.personnalisationsExpressionService.parseExpression(
            question.exprVisible
          );
        } catch (error) {
          throw new UnprocessableEntityException(
            `Invalid expression for question ${question.id}: "${
              (error as HttpException).message
            }"`
          );
        }
      }

      // validate competence codes
      if (
        question.competenceCode != null &&
        !competences.some((c) => c.competenceCode === question.competenceCode)
      ) {
        throw new UnprocessableEntityException(
          `Competence code ${question.competenceCode} not found for question ${question.id}`
        );
      }
    });

    this.logger.log('Verification complete: all data is valid');
  }

  private async upsertPersonnalisationQuestionsAndChoix(
    questions: ImportPersonnalisationQuestion[],
    choix: ImportPersonnalisationChoix[],
    questionThematiques: QuestionThematique[],
    competences: ImportPersonnalisationCompetence[]
  ): Promise<QuestionWithChoices[]> {
    await this.databaseService.db.transaction(async (tx) => {
      this.logger.log(
        `Upserting ${competences.length} competences, ${questionThematiques.length} thematiques, ${questions.length} questions and ${choix.length} choices in a transaction`
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

      // Upsert competences
      await tx
        .insert(banatic2025CompetenceTable)
        .values(competences)
        .onConflictDoUpdate({
          target: [banatic2025CompetenceTable.competenceCode],
          set: buildConflictUpdateColumns(banatic2025CompetenceTable, [
            'intitule',
          ]),
        });

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
            'competenceCode',
            'consignesJustification',
            'exprVisible',
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

    return this.listPersonnalisationQuestionsService.listQuestionsWithChoices(
      []
    );
  }
}
