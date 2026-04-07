import { Injectable } from '@nestjs/common';
import ListPersonnalisationQuestionsService from '@tet/backend/collectivites/personnalisations/list-personnalisation-questions/list-personnalisation-questions.service';
import { ListPersonnalisationReponsesRepository } from '@tet/backend/collectivites/personnalisations/list-personnalisation-reponses/list-personnalisation-reponses.repository';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import type {
  PersonnalisationThematique,
  QuestionWithChoices,
} from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { ResourceType } from '@tet/domain/users';
import { uniq } from 'es-toolkit';
import type { ListThematiquesInput } from './list-personnalisation-thematiques.input';

@Injectable()
export class ListPersonnalisationThematiquesService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly databaseService: DatabaseService,
    private readonly collectiviteService: CollectivitesService,
    private readonly listPersonnalisationQuestionsService: ListPersonnalisationQuestionsService,
    private readonly listPersonnalisationReponsesRepository: ListPersonnalisationReponsesRepository
  ) {}

  async listThematiques(
    input: ListThematiquesInput,
    user: AuthenticatedUser
  ): Promise<PersonnalisationThematique[]> {
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

    const [questions, answeredQuestionIds] = await Promise.all([
      this.listPersonnalisationQuestionsService.listQuestionsWithChoices({
        collectiviteId,
        actionIds,
        referentielIds,
        thematiqueIds,
      }),
      this.databaseService.db.transaction(async (tx) =>
        this.listPersonnalisationReponsesRepository.listAnsweredQuestionIds(
          collectiviteId,
          tx
        )
      ),
    ]);

    return this.buildThematiquesFromVisibleQuestions(
      questions,
      answeredQuestionIds
    );
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
