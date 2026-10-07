import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { collectiviteBanatic2025CompetenceTable } from '@tet/backend/collectivites/shared/models/collectivite-banatic-2025-competence.table';
import { banatic2025CompetenceTable } from '@tet/backend/shared/models/banatic-2025-competence.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { COMPETENCE_BANATIC_SCOT } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { and, eq } from 'drizzle-orm';
import { onTestFinished } from 'vitest';

describe('Contexte de dépôt PCAET', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;

  const freshEditor = async () => {
    const fixture = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const user = getAuthUserFromUserCredentials(fixture.user);
    return {
      collectivite: fixture.collectivite,
      caller: router.createCaller({ user }),
    };
  };

  /**
   * Le référentiel Banatic 2025 n'est pas seedé : il vient de
   * `make db-import-referentiels`. Le test le pose donc lui-même s'il manque,
   * sans jamais le retirer — c'est une ligne de nomenclature, pas une donnée de
   * test, et une autre spec peut s'y adosser au même moment.
   */
  const declareCompetenceScot = async (
    collectiviteId: number,
    exercice: boolean
  ) => {
    await db.db
      .insert(banatic2025CompetenceTable)
      .values({
        competenceCode: COMPETENCE_BANATIC_SCOT,
        intitule: 'Schéma de cohérence territoriale (SCOT)',
      })
      .onConflictDoNothing();

    await db.db
      .insert(collectiviteBanatic2025CompetenceTable)
      .values({
        collectiviteId,
        competenceCode: COMPETENCE_BANATIC_SCOT,
        exercice,
      })
      .onConflictDoNothing();

    onTestFinished(async () => {
      await db.db
        .delete(collectiviteBanatic2025CompetenceTable)
        .where(
          and(
            eq(
              collectiviteBanatic2025CompetenceTable.collectiviteId,
              collectiviteId
            ),
            eq(
              collectiviteBanatic2025CompetenceTable.competenceCode,
              COMPETENCE_BANATIC_SCOT
            )
          )
        );
    });
  };

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  it('ne propose pas la déclaration SCoT-AEC sans la compétence SCOT', async () => {
    const { collectivite, caller } = await freshEditor();

    const contexte = await caller.demarches.pcaet.getDepotContext({
      collectiviteId: collectivite.id,
    });

    expect(contexte.peutDeclarerScotAec).toBe(false);
  });

  it('propose la déclaration SCoT-AEC à une collectivité qui exerce la compétence SCOT', async () => {
    const { collectivite, caller } = await freshEditor();
    await declareCompetenceScot(collectivite.id, true);

    const contexte = await caller.demarches.pcaet.getDepotContext({
      collectiviteId: collectivite.id,
    });

    expect(contexte.peutDeclarerScotAec).toBe(true);
  });

  it('ne la propose pas quand la compétence est portée sans être exercée', async () => {
    const { collectivite, caller } = await freshEditor();
    await declareCompetenceScot(collectivite.id, false);

    const contexte = await caller.demarches.pcaet.getDepotContext({
      collectiviteId: collectivite.id,
    });

    expect(contexte.peutDeclarerScotAec).toBe(false);
  });

  it("refuse le contexte à qui n'a pas le droit de déposer", async () => {
    const { collectivite } = await freshEditor();
    const autre = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.EDITION },
    });
    const etranger = router.createCaller({
      user: getAuthUserFromUserCredentials(autre.user),
    });

    await expect(
      etranger.demarches.pcaet.getDepotContext({
        collectiviteId: collectivite.id,
      })
    ).rejects.toThrow();
  });
});
