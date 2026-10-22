import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { discussionTable } from '@tet/backend/collectivites/discussions/infrastructure/discussion.table';
import { DiscussionRepository } from '@tet/backend/collectivites/discussions/infrastructure/discussion-repository.interface';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import { ficheActionActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action-action.table';
import ScoresService from '@tet/backend/referentiels/compute-score/scores.service';
import { GetReferentielService } from '@tet/backend/referentiels/get-referentiel/get-referentiel.service';
import { ListActionDefinitionsService } from '@tet/backend/referentiels/list-actions/list-action-definitions.service';
import { getTestApp, getTestDatabase } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { discussionStatus } from '@tet/domain/collectivites';
import { ReferentielId } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import {
  DROM_REGION_CODE,
  setActionTemplatesForTest,
} from './action-definitions.test-fixture';

const TE_TEST: ReferentielId = 'te-test';
const ACTION_ID = 'te-test_1.1.1';
const NOM_METROPOLE = 'Suivre le SRADDET';
const NOM_DOM = 'Suivre le SAR';

type ActionNode = {
  actionId: string;
  nom?: string | null;
  actionsEnfant: ActionNode[];
};

function findNom(
  node: ActionNode,
  actionId: string
): string | null | undefined {
  if (node.actionId === actionId) {
    return node.nom;
  }
  for (const child of node.actionsEnfant) {
    const nom = findNom(child, actionId);
    if (nom !== undefined) {
      return nom;
    }
  }
  return undefined;
}

/**
 * Chaque lecteur du backend qui connaît la collectivité rend le nom de son
 * profil : même nom pour une collectivité donnée, différent entre une
 * collectivité DOM et une collectivité de métropole.
 */
describe('Lecteurs des textes balisés', () => {
  let app: INestApplication;
  let databaseService: DatabaseService;
  let metropole: { collectiviteId: number; userId: string };
  let dom: { collectiviteId: number; userId: string };

  beforeAll(async () => {
    app = await getTestApp();
    databaseService = await getTestDatabase(app);

    const metropoleFixture = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    const domFixture = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: { regionCode: DROM_REGION_CODE },
    });
    metropole = {
      collectiviteId: metropoleFixture.collectivite.id,
      userId: metropoleFixture.user.id,
    };
    dom = {
      collectiviteId: domFixture.collectivite.id,
      userId: domFixture.user.id,
    };

    const restoreTemplates = await setActionTemplatesForTest(app, {
      actionId: ACTION_ID,
      templates: { nom: 'Suivre le {{si dom}}SAR{{sinon}}SRADDET{{/si}}' },
    });

    return async () => {
      await restoreTemplates();
      await metropoleFixture.cleanup();
      await domFixture.cleanup();
      await app.close();
    };
  });

  test('payload des scores (snapshots)', async () => {
    const scoresService = app.get(ScoresService);

    const [metropoleScores, domScores] = await Promise.all(
      [metropole, dom].map(({ collectiviteId }) =>
        scoresService.computeScoreForCollectivite(
          TE_TEST,
          collectiviteId,
          {},
          undefined,
          undefined,
          true
        )
      )
    );

    expect(
      findNom(metropoleScores.scoresPayload.scores as ActionNode, ACTION_ID)
    ).toBe(NOM_METROPOLE);
    expect(
      findNom(domScores.scoresPayload.scores as ActionNode, ACTION_ID)
    ).toBe(NOM_DOM);
  });

  test('arbre du référentiel avec ou sans collectivité', async () => {
    const getReferentielService = app.get(GetReferentielService);

    const [sansCollectivite, avecDom] = await Promise.all([
      getReferentielService.getReferentielTree(TE_TEST),
      getReferentielService.getReferentielTree(TE_TEST, {
        collectiviteId: dom.collectiviteId,
      }),
    ]);

    expect(findNom(sansCollectivite.itemsTree as ActionNode, ACTION_ID)).toBe(
      NOM_METROPOLE
    );
    expect(findNom(avecDom.itemsTree as ActionNode, ACTION_ID)).toBe(NOM_DOM);
  });

  test('définitions côté backend avec collectivité', async () => {
    const service = app.get(ListActionDefinitionsService);

    const [defaut, avecDom] = await Promise.all([
      service.listActionDefinitions({ referentielId: TE_TEST }),
      service.listActionDefinitions({
        referentielId: TE_TEST,
        collectiviteId: dom.collectiviteId,
      }),
    ]);
    if (!defaut.success || !avecDom.success) {
      throw new Error('définitions indisponibles');
    }

    expect(defaut.data.definitionsById[ACTION_ID].nom).toBe(NOM_METROPOLE);
    expect(avecDom.data.definitionsById[ACTION_ID].nom).toBe(NOM_DOM);
  });

  test('mesures liées aux fiches', async () => {
    const { db } = databaseService;
    const fiches = await db
      .insert(ficheActionTable)
      .values([
        { titre: 'Fiche métropole', collectiviteId: metropole.collectiviteId },
        { titre: 'Fiche DOM', collectiviteId: dom.collectiviteId },
      ])
      .returning();
    await db
      .insert(ficheActionActionTable)
      .values(
        fiches.map((fiche) => ({ ficheId: fiche.id, actionId: ACTION_ID }))
      );
    onTestFinished(async () => {
      for (const fiche of fiches) {
        await db
          .delete(ficheActionActionTable)
          .where(eq(ficheActionActionTable.ficheId, fiche.id));
        await db
          .delete(ficheActionTable)
          .where(eq(ficheActionTable.id, fiche.id));
      }
    });

    const listFichesService = app.get(ListFichesService);
    const [metropoleFiches, domFiches] = await Promise.all(
      [metropole, dom].map(({ collectiviteId }) =>
        listFichesService.listFichesQuery(collectiviteId)
      )
    );

    expect(metropoleFiches.data[0].mesures?.[0].nom).toBe(NOM_METROPOLE);
    expect(domFiches.data[0].mesures?.[0].nom).toBe(NOM_DOM);
  });

  test('discussions', async () => {
    const { db } = databaseService;
    const now = new Date().toISOString();
    const discussions = await db
      .insert(discussionTable)
      .values(
        [metropole, dom].map(({ collectiviteId, userId }) => ({
          collectiviteId,
          actionId: ACTION_ID,
          status: discussionStatus.OUVERT,
          createdBy: userId,
          createdAt: now,
          modifiedAt: now,
        }))
      )
      .returning();
    onTestFinished(async () => {
      for (const discussion of discussions) {
        await db
          .delete(discussionTable)
          .where(eq(discussionTable.id, discussion.id));
      }
    });

    const repository = app.get<DiscussionRepository>('DiscussionRepository');
    const [metropoleDiscussions, domDiscussions] = await Promise.all(
      [metropole, dom].map(({ collectiviteId }) =>
        repository.findByCollectiviteIdAndReferentielId(collectiviteId, TE_TEST)
      )
    );
    if (!metropoleDiscussions.success || !domDiscussions.success) {
      throw new Error('discussions indisponibles');
    }

    // `actionNom` est renvoyé par la requête sans figurer dans le type `Discussion`
    const getActionNom = (discussion: object) =>
      (discussion as { actionNom?: string }).actionNom;
    expect(getActionNom(metropoleDiscussions.data[0])).toBe(NOM_METROPOLE);
    expect(getActionNom(domDiscussions.data[0])).toBe(NOM_DOM);
  });
});
