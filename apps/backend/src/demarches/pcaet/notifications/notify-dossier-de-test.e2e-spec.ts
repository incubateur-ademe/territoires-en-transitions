import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@tet/backend/app.module';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { buildRandomDocumentHash } from '@tet/backend/collectivites/documents/documents.test-fixture';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { demarchePiloteTable } from '@tet/backend/demarches/shared/models/demarche-pilote.table';
import {
  getAuthUserFromUserCredentials,
  getTestDatabase,
} from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { ContextStoreService } from '@tet/backend/utils/context/context.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { EmailService } from '@tet/backend/utils/email/email.service';
import { CustomZodValidationPipe } from '@tet/backend/utils/nest/custom-zod-validation.pipe';
import { notificationTable } from '@tet/backend/utils/notifications/models/notification.table';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import { DGEC_SIREN, PcaetAvisAuTitreDeEnum } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { NotifiedOnEnum, type NotifiedOn } from '@tet/domain/utils';
import { and, eq, inArray } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  completeTestDossierPcaet,
  createDemarche,
  pickFreeRegionCode,
} from '../demarches-pcaet.test-fixture';
import { pcaetAvisTable } from '../shared/models/pcaet-avis.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';

/**
 * Le dossier d'une collectivité de test saisit les services qui la couvrent,
 * mais ne leur écrit pas : ce sont de vrais services, qu'une démonstration ou
 * un essai ne doit pas solliciter.
 */
describe("Notifications du dossier d'une collectivité de test", () => {
  let app: INestApplication;
  let db: DatabaseService;
  const sendEmail = vi.fn();
  const cleanups: Array<() => Promise<void>> = [];

  let demarcheId: number;
  let demandeDrealId: number;
  let demandeDrAdemeId: number;
  let demandeDgecId: number;
  let drealAdminId: string;
  let drAdemeAdminId: string;
  let dgecMembreId: string;
  let avisDrealId: string;

  const notificationsPour = async (notifiedOn: NotifiedOn, entityId: string) =>
    db.db
      .select()
      .from(notificationTable)
      .where(
        and(
          eq(notificationTable.notifiedOn, notifiedOn),
          eq(notificationTable.entityId, entityId)
        )
      );

  beforeAll(async () => {
    sendEmail.mockResolvedValue({
      success: true,
      data: { messageId: 'test' },
    });

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EmailService)
      .useValue({ sendEmail })
      .compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new CustomZodValidationPipe(app.get(ContextStoreService))
    );
    await app.init();

    const router = app.get(TrpcRouter);
    db = await getTestDatabase(app);

    const regionCode = await pickFreeRegionCode(db, collectiviteTypeEnum.DREAL);

    const deposante = await createDemarche(db, router, {
      role: CollectiviteRole.ADMIN,
      collectivite: {
        type: collectiviteTypeEnum.TEST,
        regionCode,
        nom: 'Collectivité de test notifications',
      },
    });
    demarcheId = deposante.demarche.id;
    await db.db.insert(demarchePiloteTable).values({
      demarcheId,
      userId: deposante.user.id,
      createdBy: deposante.user.id,
    });

    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: collectiviteTypeEnum.DREAL,
        regionCode,
        nom: 'DREAL test dossier de test',
      },
    });
    cleanups.push(dreal.cleanup);
    drealAdminId = dreal.user.id;
    const drealCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(dreal.user),
    });

    const drAdeme = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: collectiviteTypeEnum.DR_ADEME,
        regionCode,
        nom: 'DR ADEME test dossier de test',
      },
    });
    cleanups.push(drAdeme.cleanup);
    drAdemeAdminId = drAdeme.user.id;

    // La DGEC est un singleton du seed : on y ajoute un agent à soi.
    const [dgec] = await db.db
      .select({ id: collectiviteTable.id })
      .from(collectiviteTable)
      .where(
        and(
          eq(collectiviteTable.type, collectiviteTypeEnum.SERVICE_NATIONAL),
          eq(collectiviteTable.siren, DGEC_SIREN)
        )
      )
      .limit(1);
    if (!dgec) {
      throw new Error('DGEC absente du seed');
    }
    const { user: dgecMembre, cleanup: dgecMembreCleanup } = await addTestUser(
      db,
      { collectiviteId: dgec.id, role: CollectiviteRole.LECTURE }
    );
    cleanups.push(dgecMembreCleanup);
    dgecMembreId = dgecMembre.id;

    await completeTestDossierPcaet(db, {
      collectiviteId: deposante.collectiviteId,
      demarcheId,
    });
    await deposante.caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: deposante.collectiviteId,
      demarcheId,
    });

    const demandes = await db.db
      .select({
        id: pcaetDemandeAvisTable.id,
        instructeurCollectiviteId:
          pcaetDemandeAvisTable.instructeurCollectiviteId,
      })
      .from(pcaetDemandeAvisTable)
      .where(eq(pcaetDemandeAvisTable.demarcheId, demarcheId));
    const demandeDe = (collectiviteId: number) => {
      const demande = demandes.find(
        (d) => d.instructeurCollectiviteId === collectiviteId
      );
      if (!demande) {
        throw new Error(
          `La transmission n'a pas saisi la collectivité ${collectiviteId}`
        );
      }
      return demande.id;
    };
    demandeDrealId = demandeDe(dreal.collectivite.id);
    demandeDrAdemeId = demandeDe(drAdeme.collectivite.id);
    demandeDgecId = demandeDe(dgec.id);

    const [avisDreal] = await db.db
      .insert(pcaetAvisTable)
      .values({
        demandeAvisId: demandeDrealId,
        emetteurCollectiviteId: dreal.collectivite.id,
        auTitreDe: PcaetAvisAuTitreDeEnum.PREFET_REGION,
        fichierRefs: [buildRandomDocumentHash()],
        deposePar: dreal.user.id,
      })
      .returning({ id: pcaetAvisTable.id });
    avisDrealId = avisDreal.id;
    await drealCaller.demarches.pcaet.validerAvis({
      demandeAvisId: demandeDrealId,
      avisId: avisDrealId,
    });
  });

  // Un `afterAll` plutôt qu'un retour du `beforeAll` : l'app se ferme même si la
  // préparation échoue en route.
  afterAll(async () => {
    try {
      // Rendre le code de région : l'index unique par DREAL le refuserait au
      // prochain spec qui tirerait le même.
      if (demarcheId !== undefined) {
        await db.db
          .delete(pcaetDemandeAvisTable)
          .where(eq(pcaetDemandeAvisTable.demarcheId, demarcheId));
      }
      for (const cleanup of cleanups.reverse()) {
        await cleanup();
      }
    } finally {
      await app?.close();
    }
  });

  it('saisit les services sans leur écrire, ni à la transmission ni en copie', async () => {
    expect(demandeDrealId).toBeDefined();
    expect(demandeDrAdemeId).toBeDefined();
    expect(demandeDgecId).toBeDefined();

    // Restreint aux notifications de ce dossier : un agent de la DGEC peut
    // recevoir les notifications de plusieurs dossiers.
    // Transmission par demande, avis reçu par avis, clôture par démarche.
    const auxServices = await db.db
      .select()
      .from(notificationTable)
      .where(
        and(
          inArray(notificationTable.sendTo, [
            drealAdminId,
            drAdemeAdminId,
            dgecMembreId,
          ]),
          inArray(notificationTable.entityId, [
            String(demandeDrealId),
            String(demandeDrAdemeId),
            String(demandeDgecId),
            avisDrealId,
            String(demarcheId),
          ])
        )
      );
    expect(auxServices).toEqual([]);
  });

  it("prévient toujours la déposante de l'avis rendu", async () => {
    const notifications = await notificationsPour(
      NotifiedOnEnum['DEMARCHES.PCAET.AVIS_RECU'],
      avisDrealId
    );
    expect(notifications.length).toBeGreaterThan(0);
  });
});
