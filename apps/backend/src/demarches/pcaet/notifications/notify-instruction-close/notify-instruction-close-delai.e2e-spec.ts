import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@tet/backend/app.module';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { demarchePiloteTable } from '@tet/backend/demarches/shared/models/demarche-pilote.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { getTestDatabase } from '@tet/backend/test';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { ContextStoreService } from '@tet/backend/utils/context/context.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { EmailService } from '@tet/backend/utils/email/email.service';
import { CustomZodValidationPipe } from '@tet/backend/utils/nest/custom-zod-validation.pipe';
import { notificationTable } from '@tet/backend/utils/notifications/models/notification.table';
import { NotificationsService } from '@tet/backend/utils/notifications/notifications.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import {
  DemarchePcaetStatusEnum,
  DemarchePcaetTransitionEnum,
} from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import { NotificationStatusEnum, NotifiedOnEnum } from '@tet/domain/utils';
import { and, eq, inArray } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { CloreInstructionService } from '../../clore-instruction/clore-instruction.service';
import {
  completeTestDossierPcaet,
  createDemarche,
  pickFreeRegionCode,
} from '../../demarches-pcaet.test-fixture';
import { pcaetDemandeAvisTable } from '../../shared/models/pcaet-demande-avis.table';

/**
 * La clôture sur délai échu, le chemin du planificateur.
 *
 * C'est le seul qui produise le motif `delai_avis_echu`, et le seul où
 * personne n'agit : la DREAL saisie n'a rien rendu, c'est l'expiration qui
 * clôt l'instruction. Il court aussi hors transaction, contrairement à la
 * clôture déclenchée par la validation d'un avis.
 */
describe("Notification de clôture sur délai d'avis échu", () => {
  let app: INestApplication;
  let db: DatabaseService;
  const sendEmail = vi.fn();

  let demarcheId: number;
  let piloteId: string;
  let adminId: string;

  beforeAll(async () => {
    sendEmail.mockResolvedValue({ success: true, data: { messageId: 'test' } });

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
      collectivite: { regionCode, nom: 'Agglo test délai échu' },
    });
    demarcheId = deposante.demarche.id;
    adminId = deposante.user.id;

    const { user: pilote, cleanup: piloteCleanup } = await addTestUser(db, {
      collectiviteId: deposante.collectiviteId,
      role: CollectiviteRole.EDITION,
    });
    piloteId = pilote.id;
    await db.db.insert(demarchePiloteTable).values([
      { demarcheId, userId: piloteId, createdBy: adminId },
      { demarcheId, userId: adminId, createdBy: adminId },
    ]);

    // Une DREAL saisie qui ne rendra rien : sans avis attendu en suspens, le
    // dossier se clôturerait sur « tous les avis rendus » et le motif ne serait
    // pas celui qu'on veut éprouver.
    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: collectiviteTypeEnum.DREAL,
        regionCode,
        nom: 'DREAL test délai échu',
      },
    });

    await completeTestDossierPcaet(db, {
      collectiviteId: deposante.collectiviteId,
      demarcheId,
    });
    await deposante.caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: deposante.collectiviteId,
      demarcheId,
    });

    // L'échéance est passée d'hier : le planificateur la constaterait cette nuit.
    await db.db
      .update(demarcheTable)
      .set({
        avisDeadlineAt: DateTime.now().minus({ days: 1 }).toISO(),
      })
      .where(eq(demarcheTable.id, demarcheId));

    // Le chemin du cron, mais ciblé sur ce dossier : `cloreInstructions()`
    // ramasserait aussi ceux des specs qui tournent en parallèle et les
    // clôturerait dans leur dos.
    const result = await app.get(CloreInstructionService).clore({
      collectiviteId: deposante.collectiviteId,
      demarcheId,
    });
    if (!result.success || !result.data) {
      throw new Error(
        `Le dossier n'a pas basculé sur le délai échu : ${
          result.success ? 'aucune transition armée' : result.error
        }`
      );
    }
    expect(result.data.status).toBe(DemarchePcaetStatusEnum.INSTRUIT);

    return async () => {
      await db.db
        .delete(pcaetDemandeAvisTable)
        .where(eq(pcaetDemandeAvisTable.demarcheId, demarcheId));
      await dreal.cleanup();
      await piloteCleanup();
      await app.close();
    };
  });

  it('prévient les pilotes et administrateurs, en disant que le délai est échu', async () => {
    const notifications = await db.db
      .select({
        sendTo: notificationTable.sendTo,
        createdBy: notificationTable.createdBy,
        notificationData: notificationTable.notificationData,
      })
      .from(notificationTable)
      .where(
        and(
          eq(
            notificationTable.notifiedOn,
            NotifiedOnEnum['DEMARCHES.PCAET.INSTRUCTION_CLOSE']
          ),
          eq(notificationTable.entityId, String(demarcheId))
        )
      );

    expect(notifications.map((n) => n.sendTo).sort()).toEqual(
      [piloteId, adminId].sort()
    );
    for (const notification of notifications) {
      expect(notification.notificationData).toMatchObject({
        motif: DemarchePcaetTransitionEnum.DELAI_AVIS_ECHU,
      });
      // Personne n'a clos cette instruction : c'est un constat du système.
      expect(notification.createdBy).toBeNull();
    }
  });

  it('rend le message et le marque envoyé', async () => {
    const mesDestinataires = [piloteId, adminId];
    await db.db
      .update(notificationTable)
      .set({ sendAfter: DateTime.now().minus({ hours: 1 }).toUTC().toSQL() })
      .where(inArray(notificationTable.sendTo, mesDestinataires));

    await app.get(NotificationsService).sendPendingNotifications();

    const apres = await db.db
      .select({
        status: notificationTable.status,
        sentToEmail: notificationTable.sentToEmail,
        errorMessage: notificationTable.errorMessage,
      })
      .from(notificationTable)
      .where(inArray(notificationTable.sendTo, mesDestinataires));

    // `sent` prouve que le générateur a produit le message : sans générateur
    // enregistré, la notification resterait « pending » sans erreur ni log.
    expect(apres).toHaveLength(2);
    for (const notification of apres) {
      expect(notification.status).toBe(NotificationStatusEnum.SENT);
      expect(notification.errorMessage).toBeNull();
      expect(notification.sentToEmail).toBeTruthy();
    }
  });
});
