import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUsers } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { preuveAuditTable } from '@tet/backend/collectivites/documents/models/preuve-audit.table';
import { auditTable } from '@tet/backend/referentiels/labellisations/audit.table';
import {
  addAuditeurPermission,
  createAudit,
} from '@tet/backend/referentiels/labellisations/labellisations.test-fixture';
import { getAuthUser, getTestApp } from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { ReferentielIdEnum } from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

describe('UpdateAuditReportRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    databaseService = app.get(DatabaseService);
  });

  afterAll(async () => {
    await app.close();
  });

  const seedReport = async ({
    clos,
    valide = false,
    dateFin,
  }: {
    clos: boolean;
    valide?: boolean;
    dateFin?: string;
  }) => {
    const { collectivite, users, cleanup } = await addTestCollectiviteAndUsers(
      databaseService,
      {
        users: [
          { role: CollectiviteRole.LECTURE },
          { role: CollectiviteRole.LECTURE },
        ],
      }
    );
    const [auditeurUser, otherUser] = users;

    const { audit } = await createAudit({
      databaseService,
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.CAE,
      clos,
      valide,
    });
    if (dateFin) {
      await databaseService.db
        .update(auditTable)
        .set({ dateFin })
        .where(eq(auditTable.id, audit.id));
    }

    const auditeurPermission = await addAuditeurPermission({
      databaseService,
      auditId: audit.id,
      userId: auditeurUser.id,
    });

    const [oldFichier, newFichier] = await databaseService.db
      .insert(bibliothequeFichierTable)
      .values([
        {
          collectiviteId: collectivite.id,
          hash: `old-${audit.id}`,
          filename: 'rapport.pdf',
          confidentiel: false,
        },
        {
          collectiviteId: collectivite.id,
          hash: `new-${audit.id}`,
          filename: 'rapport-v2.pdf',
          confidentiel: false,
        },
      ])
      .returning();

    const [preuve] = await databaseService.db
      .insert(preuveAuditTable)
      .values({
        collectiviteId: collectivite.id,
        auditId: audit.id,
        fichierId: oldFichier.id,
        modifiedBy: auditeurUser.id,
      })
      .returning();

    const cleanupAll = async () => {
      await databaseService.db
        .delete(preuveAuditTable)
        .where(eq(preuveAuditTable.collectiviteId, collectivite.id));
      await databaseService.db
        .delete(bibliothequeFichierTable)
        .where(eq(bibliothequeFichierTable.collectiviteId, collectivite.id));
      await auditeurPermission.cleanup();
      await databaseService.db
        .delete(auditTable)
        .where(eq(auditTable.id, audit.id));
      await cleanup();
    };

    return {
      auditeurUser,
      otherUser,
      preuve,
      newFichier,
      cleanup: cleanupAll,
    };
  };

  const getPreuveFichierId = async (preuveId: number) => {
    const [row] = await databaseService.db
      .select({ fichierId: preuveAuditTable.fichierId })
      .from(preuveAuditTable)
      .where(eq(preuveAuditTable.id, preuveId));
    return row.fichierId;
  };

  test("l'auditeur remplace le rapport dans les 15 jours suivant la validation", async () => {
    const { auditeurUser, preuve, newFichier, cleanup } = await seedReport({
      clos: false,
      valide: true,
      dateFin: new Date(Date.now() - 14 * DAY_IN_MS).toISOString(),
    });
    onTestFinished(cleanup);

    const caller = router.createCaller({ user: await getAuthUser(auditeurUser) });
    await caller.referentiels.labellisations.updateAuditReport({
      preuveId: preuve.id,
      fichierId: newFichier.id,
    });

    expect(await getPreuveFichierId(preuve.id)).toBe(newFichier.id);
  });

  test("l'auditeur remplace le rapport d'un audit pas encore valide", async () => {
    const { auditeurUser, preuve, newFichier, cleanup } = await seedReport({
      clos: false,
      valide: false,
    });
    onTestFinished(cleanup);

    const caller = router.createCaller({ user: await getAuthUser(auditeurUser) });
    await caller.referentiels.labellisations.updateAuditReport({
      preuveId: preuve.id,
      fichierId: newFichier.id,
    });

    expect(await getPreuveFichierId(preuve.id)).toBe(newFichier.id);
  });

  test('refuse une preuve qui ne correspond à aucun rapport', async () => {
    const { auditeurUser, newFichier, cleanup } = await seedReport({
      clos: false,
    });
    onTestFinished(cleanup);

    const caller = router.createCaller({ user: await getAuthUser(auditeurUser) });

    await expect(
      caller.referentiels.labellisations.updateAuditReport({
        preuveId: 2_000_000_000,
        fichierId: newFichier.id,
      })
    ).rejects.toThrow(/Aucun rapport d'audit/);
  });

  test("refuse un utilisateur qui n'est pas l'auditeur de cet audit", async () => {
    const { otherUser, preuve, newFichier, cleanup } = await seedReport({
      clos: false,
      valide: true,
      dateFin: new Date(Date.now() - 14 * DAY_IN_MS).toISOString(),
    });
    onTestFinished(cleanup);

    const caller = router.createCaller({ user: await getAuthUser(otherUser) });

    await expect(
      caller.referentiels.labellisations.updateAuditReport({
        preuveId: preuve.id,
        fichierId: newFichier.id,
      })
    ).rejects.toThrow();
  });

  test("refuse l'auditeur plus de 15 jours après la validation", async () => {
    const { auditeurUser, preuve, newFichier, cleanup } = await seedReport({
      clos: false,
      valide: true,
      dateFin: new Date(Date.now() - 16 * DAY_IN_MS).toISOString(),
    });
    onTestFinished(cleanup);

    const caller = router.createCaller({ user: await getAuthUser(auditeurUser) });

    await expect(
      caller.referentiels.labellisations.updateAuditReport({
        preuveId: preuve.id,
        fichierId: newFichier.id,
      })
    ).rejects.toThrow();
  });

  test("autorise l'auditeur dans les 15 jours même si l'audit est clos", async () => {
    const { auditeurUser, preuve, newFichier, cleanup } = await seedReport({
      clos: true,
      valide: true,
      dateFin: new Date(Date.now() - 14 * DAY_IN_MS).toISOString(),
    });
    onTestFinished(cleanup);

    const caller = router.createCaller({ user: await getAuthUser(auditeurUser) });
    await caller.referentiels.labellisations.updateAuditReport({
      preuveId: preuve.id,
      fichierId: newFichier.id,
    });

    expect(await getPreuveFichierId(preuve.id)).toBe(newFichier.id);
  });

  test("refuse un fichier appartenant à une autre collectivité", async () => {
    const { auditeurUser, preuve, cleanup } = await seedReport({
      clos: false,
      valide: true,
      dateFin: new Date(Date.now() - 14 * DAY_IN_MS).toISOString(),
    });
    onTestFinished(cleanup);

    const { collectivite: otherCollectivite, cleanup: otherCleanup } =
      await addTestCollectiviteAndUsers(databaseService, {
        users: [{ role: CollectiviteRole.LECTURE }],
      });
    const [otherFichier] = await databaseService.db
      .insert(bibliothequeFichierTable)
      .values({
        collectiviteId: otherCollectivite.id,
        hash: `other-${preuve.id}`,
        filename: 'autre.pdf',
        confidentiel: false,
      })
      .returning();
    onTestFinished(async () => {
      await databaseService.db
        .delete(bibliothequeFichierTable)
        .where(
          eq(bibliothequeFichierTable.collectiviteId, otherCollectivite.id)
        );
      await otherCleanup();
    });

    const caller = router.createCaller({ user: await getAuthUser(auditeurUser) });

    await expect(
      caller.referentiels.labellisations.updateAuditReport({
        preuveId: preuve.id,
        fichierId: otherFichier.id,
      })
    ).rejects.toThrow();
  });
});
