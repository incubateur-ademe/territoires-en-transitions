import { Injectable } from '@nestjs/common';
import ListPersonnalisationQuestionsService from '@tet/backend/collectivites/personnalisations/list-personnalisation-questions/list-personnalisation-questions.service';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import type {
  PersonnalisationQuestionReponse,
  PersonnalisationThematique,
  QuestionWithChoices,
} from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { ResourceType } from '@tet/domain/users';
import { uniq } from 'es-toolkit';
import { ListPersonnalisationThematiquesError } from './list-personnalisation-thematiques.errors';
import type { ListThematiquesInput } from './list-personnalisation-thematiques.input';
import { ListThematiquesOutput } from './list-personnalisation-thematiques.output';

@Injectable()
export class ListPersonnalisationThematiquesService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly collectiviteService: CollectivitesService,
    private readonly listPersonnalisationQuestionsService: ListPersonnalisationQuestionsService
  ) {}

  async listThematiques(
    input: ListThematiquesInput,
    user: AuthenticatedUser
  ): Promise<
    Result<ListThematiquesOutput, ListPersonnalisationThematiquesError>
  > {
    const { collectiviteId, actionIds, referentielIds, thematiqueIds } = input;

    const collectivitePrivate = await this.collectiviteService.isPrivate(
      collectiviteId
    );

    await this.permissionService.isAllowed(
      user,
      collectivitePrivate
        ? 'referentiels.read_confidentiel'
        : 'referentiels.read',
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    const questionReponsesResult =
      await this.listPersonnalisationQuestionsService.listQuestionsReponses(
        { collectiviteId, actionIds, referentielIds, thematiqueIds },
        user
      );
    if (!questionReponsesResult.success) {
      return failure(questionReponsesResult.error);
    }

    const questionReponses = questionReponsesResult.data;

    const questions = questionReponses.map((qr) => qr.question);
    const answeredQuestionIds = questionReponses
      .filter((qr) => qr.reponse != null && qr.reponse.reponse != null)
      .map((qr) => qr.question.id);

    const thematiques = this.buildThematiquesFromVisibleQuestions(
      questions,
      answeredQuestionIds
    );

    const nbSuggestionsBanatic =
      this.countQuestionsWithDefinedCompetence(questionReponses);

    return success({
      thematiques,
      nbSuggestionsBanatic,
    });
  }

  private countQuestionsWithDefinedCompetence(
    questionReponses: PersonnalisationQuestionReponse[]
  ): number {
    const seen = new Set<string>();
    for (const { question, reponse } of questionReponses) {
      if (reponse?.competenceExercee != null && !seen.has(question.id)) {
        seen.add(question.id);
      }
    }
    return seen.size;
  }

  private buildThematiquesFromVisibleQuestions(
    questions: QuestionWithChoices[],
    answeredQuestionIds: string[]
  ): PersonnalisationThematique[] {
    const answeredSet = new Set(answeredQuestionIds);
    const byThematiqueId = new Map<string, QuestionWithChoices[]>();

    for (const q of questions) {
      const thematiqueId = q.thematiqueId;
      if (thematiqueId === null || thematiqueId === undefined) {
        continue;
      }
      const list = byThematiqueId.get(thematiqueId) ?? [];
      list.push(q);
      byThematiqueId.set(thematiqueId, list);
    }

    const rows: PersonnalisationThematique[] = [];

    for (const [id, qs] of byThematiqueId) {
      const nom = qs[0]?.thematiqueNom ?? '';
      const questionsCount = qs.length;
      const reponsesCount = qs.filter((q) => answeredSet.has(q.id)).length;
      const referentielIdsDistinct = uniq(
        qs.flatMap((q) => q.referentielIds ?? [])
      ) as ReferentielId[];

      rows.push({
        id,
        nom,
        isComplete: questionsCount > 0 && reponsesCount >= questionsCount,
        questionsCount,
        reponsesCount,
        referentiels: referentielIdsDistinct,
      });
    }

    const nonEmpty = rows.filter((r) => r.questionsCount > 0);

    nonEmpty.sort((a, b) => {
      const sortKey = (row: PersonnalisationThematique) =>
        row.id === 'identite' ? '0' : row.nom;
      return sortKey(a).localeCompare(sortKey(b), 'fr');
    });

    return nonEmpty;
  }
}
