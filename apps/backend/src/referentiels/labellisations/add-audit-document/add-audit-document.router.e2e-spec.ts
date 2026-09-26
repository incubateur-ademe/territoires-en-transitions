import { INestApplication } from '@nestjs/common';
import { REFERENTIEL_NOT_WRITABLE_MESSAGE } from '@tet/backend/collectivites/collectivite-referentiel-mode/referentiel-mode-guard.errors';
import {
  addTestCollectivite,
  addTestCollectiviteAndUsers,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { buildRandomDocumentHash } from '@tet/backend/collectivites/documents/documents.test-fixture';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { preuveAuditTable } from '@tet/backend/collectivites/documents/models/preuve-audit.table';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import {
  getAuthUserFromUserCredentials,
  getTestApp,
  getTestDatabase,
  getTestRouter,
} from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  addAndEnableUserSuperAdminMode,
  addTestUser,
} from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { defaultCollectivitePreferences } from '@tet/domain/collectivites';
import {
  AUDIT_REPORT_UPDATE_WINDOW_DAYS,
  ReferentielIdEnum,
} from '@tet/domain/referentiels';
import { CollectiviteRole } from '@tet/domain/users';
import { eq } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';
import { onTestFinished } from 'vitest';
import { auditTable } from '../audit.table';
import {
  addAuditeurPermission,
  createAudit,
  setAuditDateFin,
  validateAudit,
} from '../labellisations.test-fixture';

const DAY_IN_MS = 24 * 60 * 60 * 1000;
const UNKNOWN_AUDIT_ID = 2_000_000_000;

const daysAgo = (days: number): Date => new Date(Date.now() - days * DAY_IN_MS);

describe('AddAuditDocumentRouter', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    app = await getTestApp();
    router = await getTestRouter(app);
    databaseService = await getTestDatabase(app);

    return async () => {
      await app.close();
    };
  });

  const addFichier = async (collectiviteId: number): Promise<number> => {
    const [fichier] = await databaseService.db
      .insert(bibliothequeFichierTable)
      .values({
        collectiviteId,
        hash: buildRandomDocumentHash(),
        filename: 'rapport-audit.pdf',
        confidentiel: false,
      })
      .returning();

    return fichier.id;
  };

  const getPreuveAuditRow = async (
    preuveId: number
  ): Promise<InferSelectModel<typeof preuveAuditTable>> => {
    const [row] = await databaseService.db
      .select()
      .from(preuveAuditTable)
      .where(eq(preuveAuditTable.id, preuveId));
    return row;
  };

  const setReferentielCaeReadonly = async (
    collectiviteId: number
  ): Promise<void> => {
    await databaseService.db
      .update(collectiviteTable)
      .set({
        preferences: {
          referentiels: {
            ...defaultCollectivitePreferences.referentiels,
            cae: { display: true, mode: 'readonly' },
          },
        },
      })
      .where(eq(collectiviteTable.id, collectiviteId));
  };

  const seedAudit = async ({
    clos,
    valide,
    dateFin,
  }: { clos?: boolean; valide?: boolean; dateFin?: Date } = {}): Promise<{
    collectiviteId: number;
    auditId: number;
    fichierId: number;
    editeur: AuthenticatedUser;
    lecteur: AuthenticatedUser;
    auditeur: AuthenticatedUser;
  }> => {
    const { collectivite, users, cleanup } = await addTestCollectiviteAndUsers(
      databaseService,
      {
        users: [
          { role: CollectiviteRole.EDITION },
          { role: CollectiviteRole.LECTURE },
          { role: CollectiviteRole.LECTURE },
        ],
      }
    );

    const { audit } = await createAudit({
      databaseService,
      collectiviteId: collectivite.id,
      referentielId: ReferentielIdEnum.CAE,
      clos,
      valide,
    });
    if (dateFin) {
      await setAuditDateFin({
        databaseService,
        collectiviteId: collectivite.id,
        referentielId: ReferentielIdEnum.CAE,
        dateFin,
      });
    }

    const auditeurPermission = await addAuditeurPermission({
      databaseService,
      auditId: audit.id,
      userId: users[2].id,
    });

    const fichierId = await addFichier(collectivite.id);

    onTestFinished(async () => {
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
    });

    return {
      collectiviteId: collectivite.id,
      auditId: audit.id,
      fichierId,
      editeur: getAuthUserFromUserCredentials(users[0]),
      lecteur: getAuthUserFromUserCredentials(users[1]),
      auditeur: getAuthUserFromUserCredentials(users[2]),
    };
  };

  test("un éditeur dépose un document sur l'audit ouvert de sa collectivité", async () => {
    const { collectiviteId, auditId, fichierId, editeur } = await seedAudit();

    const caller = router.createCaller({ user: editeur });
    const preuveAudit =
      await caller.referentiels.labellisations.addAuditDocument({
        auditId,
        fichierId,
      });

    const expectedPreuveAudit = {
      id: expect.any(Number),
      collectiviteId,
      auditId,
      fichierId,
      commentaire: '',
      modifiedBy: editeur.id,
      modifiedAt: expect.any(String),
      url: null,
      titre: '',
      lien: null,
    };

    expect(preuveAudit).toEqual(expectedPreuveAudit);
    expect(await getPreuveAuditRow(preuveAudit.id)).toEqual(
      expectedPreuveAudit
    );
  });

  test("l'auditeur dépose le rapport tant que l'audit est ouvert", async () => {
    const { auditId, fichierId, auditeur } = await seedAudit();

    const caller = router.createCaller({ user: auditeur });
    const preuveAudit =
      await caller.referentiels.labellisations.addAuditDocument({
        auditId,
        fichierId,
      });

    expect(preuveAudit).toMatchObject({
      auditId,
      fichierId,
      modifiedBy: auditeur.id,
    });
  });

  test("un audit validé retire à l'auditeur le droit d'écrire sur le référentiel", async () => {
    const { auditId, fichierId, editeur, auditeur } = await seedAudit();
    const auditeurCaller = router.createCaller({ user: auditeur });

    await auditeurCaller.referentiels.labellisations.addAuditDocument({
      auditId,
      fichierId,
    });

    await validateAudit({ databaseService, auditId });

    await expect(
      auditeurCaller.referentiels.labellisations.addAuditDocument({
        auditId,
        fichierId,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });

    const editeurCaller = router.createCaller({ user: editeur });

    await expect(
      editeurCaller.referentiels.labellisations.addAuditDocument({
        auditId,
        fichierId,
      })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test("refuse un audit qui n'existe pas", async () => {
    const { fichierId, editeur } = await seedAudit();

    const caller = router.createCaller({ user: editeur });

    await expect(
      caller.referentiels.labellisations.addAuditDocument({
        auditId: UNKNOWN_AUDIT_ID,
        fichierId,
      })
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test("refuse l'audit d'une autre collectivité", async () => {
    const { fichierId, editeur } = await seedAudit();
    const otherCollectiviteAudit = await seedAudit();

    const caller = router.createCaller({ user: editeur });

    await expect(
      caller.referentiels.labellisations.addAuditDocument({
        auditId: otherCollectiviteAudit.auditId,
        fichierId,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('refuse un fichier appartenant à une autre collectivité', async () => {
    const { auditId, editeur } = await seedAudit();
    const { collectivite: otherCollectivite, cleanup } =
      await addTestCollectivite(databaseService);
    onTestFinished(cleanup);
    const otherFichierId = await addFichier(otherCollectivite.id);

    const caller = router.createCaller({ user: editeur });

    await expect(
      caller.referentiels.labellisations.addAuditDocument({
        auditId,
        fichierId: otherFichierId,
      })
    ).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test("refuse un lecteur de la collectivité de l'audit", async () => {
    const { auditId, fichierId, lecteur } = await seedAudit();

    const caller = router.createCaller({ user: lecteur });

    await expect(
      caller.referentiels.labellisations.addAuditDocument({
        auditId,
        fichierId,
      })
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test("refuse le dépôt quand le référentiel de l'audit est en lecture seule", async () => {
    const { collectiviteId, auditId, fichierId, editeur } = await seedAudit();
    await setReferentielCaeReadonly(collectiviteId);

    const caller = router.createCaller({ user: editeur });

    await expect(
      caller.referentiels.labellisations.addAuditDocument({
        auditId,
        fichierId,
      })
    ).rejects.toMatchObject({
      code: 'FORBIDDEN',
      message: REFERENTIEL_NOT_WRITABLE_MESSAGE,
    });
  });

  test(`refuse le dépôt sur un audit validé terminé il y a ${
    AUDIT_REPORT_UPDATE_WINDOW_DAYS - 1
  } jours : la fenêtre de quinze jours ne rouvre que le remplacement du rapport`, async () => {
    const { auditId, fichierId, editeur } = await seedAudit({
      valide: true,
      dateFin: daysAgo(AUDIT_REPORT_UPDATE_WINDOW_DAYS - 1),
    });

    const caller = router.createCaller({ user: editeur });

    await expect(
      caller.referentiels.labellisations.addAuditDocument({
        auditId,
        fichierId,
      })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('refuse le dépôt sur un audit clos', async () => {
    const { auditId, fichierId, editeur } = await seedAudit({ clos: true });

    const caller = router.createCaller({ user: editeur });

    await expect(
      caller.referentiels.labellisations.addAuditDocument({
        auditId,
        fichierId,
      })
    ).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('le super-admin en mode support dépose sur un audit clos et validé depuis plus de quinze jours', async () => {
    const { collectiviteId, auditId, fichierId } = await seedAudit({
      clos: true,
      valide: true,
      dateFin: daysAgo(AUDIT_REPORT_UPDATE_WINDOW_DAYS + 1),
    });

    const { user, cleanup } = await addTestUser(databaseService);
    onTestFinished(cleanup);
    const superAdmin = getAuthUserFromUserCredentials(user);
    const caller = router.createCaller({ user: superAdmin });
    const superAdminMode = await addAndEnableUserSuperAdminMode({
      app,
      caller,
      userId: superAdmin.id,
    });
    onTestFinished(superAdminMode.cleanup);

    const preuveAudit =
      await caller.referentiels.labellisations.addAuditDocument({
        auditId,
        fichierId,
      });

    expect(preuveAudit).toMatchObject({
      collectiviteId,
      auditId,
      fichierId,
      modifiedBy: superAdmin.id,
    });
  });
});
