import { questionTable } from '@tet/backend/collectivites/personnalisations/models/question.table';
import { questionThematiqueTable } from '@tet/backend/collectivites/personnalisations/models/question-thematique.table';
import { sql } from 'drizzle-orm';
import { databaseService } from 'tests/shared/database.service';
import { UserFixture } from 'tests/users/users.fixture';


export const TEST_QUESTION_BINAIRE_ID = 'hist-e2e-question-binaire';
export const TEST_THEMATIQUE_ID = 'hist-e2e-thematique';

/**
 * Insère question + thématique utilisées par les seeds `reponse` et
 * `justification`. Idempotent grâce à `onConflictDoNothing`.
 */
export async function ensureTestQuestion() {
  await databaseService.db
    .insert(questionThematiqueTable)
    .values({ id: TEST_THEMATIQUE_ID, nom: 'Historique e2e' })
    .onConflictDoNothing();
  await databaseService.db
    .insert(questionTable)
    .values({
      id: TEST_QUESTION_BINAIRE_ID,
      type: 'binaire',
      description: 'Question binaire pour le spec e2e historique',
      formulation: 'Question test e2e ?',
      thematiqueId: TEST_THEMATIQUE_ID,
      version: '1.0.0',
    })
    .onConflictDoNothing();
}

/**
 * Seed action_statut via la mutation tRPC (le backend écrit la ligne
 * historique.action_statut dans la même transaction).
 */
export async function seedActionStatut(
  user: UserFixture,
  input: { collectiviteId: number; actionId: string }
) {
  await user.getTrpcClient().referentiels.actions.updateStatut.mutate({
    collectiviteId: input.collectiviteId,
    actionId: input.actionId,
    avancement: 'fait',
    avancementDetaille: null,
    concerne: true,
  });
}

/**
 * Insère directement une ligne `historique.action_statut` avec un
 * `modifiedAt` contrôlé — utile pour les tests de filtres par plage de dates.
 * Contourne la mutation tRPC parce qu'on ne peut pas y fixer la date.
 */
export async function seedActionStatutAt(
  userId: string,
  input: {
    collectiviteId: number;
    actionId: string;
    modifiedAt: string; // ISO timestamp
  }
) {
  await databaseService.db.execute(sql`
    insert into historique.action_statut
      (collectivite_id, action_id, avancement, concerne, modified_by, modified_at)
    values (
      ${input.collectiviteId},
      ${input.actionId}::action_id,
      'fait'::avancement,
      true,
      ${userId}::uuid,
      ${input.modifiedAt}::timestamptz
    )
  `);
}

/**
 * Seed action_precision via la mutation tRPC `updateCommentaire`.
 */
export async function seedActionPrecision(
  user: UserFixture,
  input: { collectiviteId: number; actionId: string; commentaire?: string }
) {
  await user.getTrpcClient().referentiels.actions.updateCommentaire.mutate({
    collectiviteId: input.collectiviteId,
    actionId: input.actionId,
    commentaire: input.commentaire ?? 'Précision e2e historique',
  });
}

/**
 * Seed reponse_binaire via `setReponse`. Le trigger DB sur reponse_binaire
 * produit la ligne `historique.reponse_binaire` correspondante.
 */
export async function seedReponse(
  user: UserFixture,
  input: {
    collectiviteId: number;
    questionId?: string;
    reponse?: boolean;
  }
) {
  await user
    .getTrpcClient()
    .collectivites.personnalisations.setReponse.mutate({
      collectiviteId: input.collectiviteId,
      questionId: input.questionId ?? TEST_QUESTION_BINAIRE_ID,
      reponse: input.reponse ?? true,
    });
}

/**
 * Seed historique.justification via la mutation tRPC `setReponse`
 * (le backend écrit la ligne historique.justification si la justification
 * diffère de celle en base). `reponse` doit être fournie : la valeur par
 * défaut `true` s'aligne sur `seedReponse`, de sorte qu'un enchaînement
 * `seedReponse` + `seedJustification` ne crée pas d'entrée reponse
 * supplémentaire (déduplication côté service).
 */
export async function seedJustification(
  user: UserFixture,
  input: {
    collectiviteId: number;
    questionId?: string;
    texte?: string;
    reponse?: boolean;
  }
) {
  await user
    .getTrpcClient()
    .collectivites.personnalisations.setReponse.mutate({
      collectiviteId: input.collectiviteId,
      questionId: input.questionId ?? TEST_QUESTION_BINAIRE_ID,
      reponse: input.reponse ?? true,
      justification: input.texte ?? 'Justification e2e historique',
    });
}

