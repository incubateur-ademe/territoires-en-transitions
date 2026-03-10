import { Injectable, Logger } from '@nestjs/common';
import { ListPersonnalisationQuestionsError } from '@tet/backend/collectivites/personnalisations/list-personnalisation-questions/list-personnalisation-questions.errors';
import ListPersonnalisationQuestionsService from '@tet/backend/collectivites/personnalisations/list-personnalisation-questions/list-personnalisation-questions.service';
import { GetPersonnalisationConsequencesRequestType } from '@tet/backend/collectivites/personnalisations/models/get-personnalisation-consequences.request';
import { GetPersonnalisationReglesResponseType } from '@tet/backend/collectivites/personnalisations/models/get-personnalisation-regles.response';
import { PersonnalisationConsequencesByActionId } from '@tet/backend/collectivites/personnalisations/models/personnalisation-consequence.dto';
import {
  GetPersonnalisationConsequencesForCollectiviteOptions,
  PersonnalisationConsequencesService,
} from '@tet/backend/collectivites/personnalisations/services/personnalisation-consequences.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  CollectiviteAvecType,
  IdentiteCollectivite,
  PersonnalisationReponsesPayload,
} from '@tet/domain/collectivites';
import { eq } from 'drizzle-orm';
import { questionActionTable } from '../models/question-action.table';

export type NeededPersonnalisationQuestionsStatus = {
  missingNeededQuestionIds: string[];
  questionStatusById: Record<
    string,
    {
      response: boolean | number | string | null;
      relatedActionIds: string[];
    }
  >;
};

@Injectable()
export class ActionPersonnalisationsService {
  private readonly logger = new Logger(ActionPersonnalisationsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly personnalisationConsequencesService: PersonnalisationConsequencesService,
    private readonly listPersonnalisationQuestionsService: ListPersonnalisationQuestionsService
  ) {}

  async getActionIdsForQuestion(questionId: string): Promise<string[]> {
    const rows = await this.databaseService.db
      .select({ actionId: questionActionTable.actionId })
      .from(questionActionTable)
      .where(eq(questionActionTable.questionId, questionId));

    return rows.map((row) => row.actionId);
  }

  getPersonnalisationRegles(
    actionId?: string
  ): Promise<GetPersonnalisationReglesResponseType> {
    return this.personnalisationConsequencesService.getPersonnalisationRegles(
      actionId
    );
  }

  async getPersonnalisationConsequencesForCollectivite(
    collectiviteId: number,
    request: GetPersonnalisationConsequencesRequestType,
    tokenInfo?: AuthenticatedUser,
    collectiviteInfo?: CollectiviteAvecType,
    options?: GetPersonnalisationConsequencesForCollectiviteOptions
  ): Promise<{
    reponses: PersonnalisationReponsesPayload;
    consequences: PersonnalisationConsequencesByActionId;
  }> {
    return this.personnalisationConsequencesService.getPersonnalisationConsequencesForCollectivite(
      collectiviteId,
      request,
      tokenInfo,
      collectiviteInfo,
      options
    );
  }

  getPersonnalisationConsequences(
    regles: GetPersonnalisationReglesResponseType,
    reponses: PersonnalisationReponsesPayload,
    collectiviteInfo: IdentiteCollectivite
  ): Promise<PersonnalisationConsequencesByActionId> {
    return this.personnalisationConsequencesService.getPersonnalisationConsequences(
      regles,
      reponses,
      collectiviteInfo
    );
  }

  async getNeededPersonnalisationQuestionsStatus(
    collectiviteId: number,
    actionId: string,
    user: AuthenticatedUser
  ): Promise<
    Result<
      NeededPersonnalisationQuestionsStatus,
      ListPersonnalisationQuestionsError
    >
  > {
    this.logger.log(
      `Getting needed personnalisation questions status for collectivite ${collectiviteId}, action ${actionId}`
    );

    const questionReponsesResult =
      await this.listPersonnalisationQuestionsService.listQuestionsReponses(
        {
          actionIds: [actionId],
          collectiviteId,
        },
        user
      );
    if (!questionReponsesResult.success) {
      return failure(questionReponsesResult.error);
    }

    const questionReponses = questionReponsesResult.data;
    if (!questionReponses.length) {
      return success({
        missingNeededQuestionIds: [],
        questionStatusById: {},
      });
    }

    const questionStatusById: NeededPersonnalisationQuestionsStatus['questionStatusById'] =
      questionReponses.reduce<
        NeededPersonnalisationQuestionsStatus['questionStatusById']
      >((acc, { question, reponse }) => {
        if (!acc[question.id]) {
          acc[question.id] = {
            response: reponse?.reponse ?? null,
            relatedActionIds: [],
          };
        }
        acc[question.id].relatedActionIds.push(actionId);
        return acc;
      }, {});

    const missingNeededQuestionIds = Object.entries(questionStatusById)
      .filter(
        ([, status]) =>
          status.response === null || typeof status.response === 'undefined'
      )
      .map(([questionId]) => questionId)
      .sort();

    return success({
      missingNeededQuestionIds,
      questionStatusById,
    });
  }
}
