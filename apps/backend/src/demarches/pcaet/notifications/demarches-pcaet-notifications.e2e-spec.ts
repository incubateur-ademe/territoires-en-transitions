import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@tet/backend/app.module';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { buildRandomDocumentHash } from '@tet/backend/collectivites/documents/documents.test-fixture';
import { demarchePiloteTable } from '@tet/backend/demarches/shared/models/demarche-pilote.table';
import {
  getAuthUserFromUserCredentials,
  getTestDatabase,
} from '@tet/backend/test';
import { utilisateurCollectiviteAccessTable } from '@tet/backend/users/authorizations/utilisateur-collectivite-access.table';
import { addTestUser } from '@tet/backend/users/users/users.test-fixture';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { EmailService } from '@tet/backend/utils/email/email.service';
import { ContextStoreService } from '@tet/backend/utils/context/context.service';
import { CustomZodValidationPipe } from '@tet/backend/utils/nest/custom-zod-validation.pipe';
import { notificationTable } from '@tet/backend/utils/notifications/models/notification.table';
import { NotificationsService } from '@tet/backend/utils/notifications/notifications.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import { DemarchePcaetTransitionEnum } from '@tet/domain/demarches';
import { CollectiviteRole } from '@tet/domain/users';
import {
  NotificationStatusEnum,
  NotifiedOnEnum,
  type NotifiedOn,
} from '@tet/domain/utils';
import { and, eq, inArray } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import {
  completeTestDossierPcaet,
  createDemarche,
  pickFreeRegionCode,
} from '../demarches-pcaet.test-fixture';
import { pcaetAvisTable } from '../shared/models/pcaet-avis.table';
import { pcaetDemandeAvisTable } from '../shared/models/pcaet-demande-avis.table';

/**
 * Le cycle d'un dossier, du point de vue de ce qui part en notification.
 *
 * Les trois évènements s'enchaînent sur un même dossier plutôt que d'être
 * isolés : c'est ainsi qu'ils se produisent, et c'est le seul moyen de vérifier
 * qu'ils ne se marchent pas dessus.
 */
describe('Notifications des démarches PCAET', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let db: DatabaseService;
  let notificationsService: NotificationsService;
  const sendEmail = vi.fn();

  let demarcheId: number;
  let deposanteId: number;
  let drealId: number;
  let nationalId: number;
  let demandeDrealId: number;
  let demandeNationaleId: number;
  let avisId: string;
  let piloteId: string;
  let deposanteAdminId: string;
  let drealCaller: ReturnType<TrpcRouter['createCaller']>;
  const cleanups: Array<() => Promise<void>> = [];
  let ddtNom: string;

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

    router = app.get(TrpcRouter);
    db = await getTestDatabase(app);
    notificationsService = app.get(NotificationsService);

    const regionCode = await pickFreeRegionCode(db, collectiviteTypeEnum.DREAL);
    const departementCode = await pickFreeRegionCode(
      db,
      collectiviteTypeEnum.DDT
    );

    // La déposante : son administrateur porte la démarche, un pilote dédié s'y
    // ajoute, et un pilote en tag seul reste injoignable.
    const deposante = await createDemarche(db, router, {
      role: CollectiviteRole.ADMIN,
      collectivite: {
        regionCode,
        departementCode,
        nom: 'Agglo test notifications',
      },
    });
    deposanteId = deposante.collectiviteId;
    demarcheId = deposante.demarche.id;
    deposanteAdminId = deposante.user.id;

    const { user: pilote, cleanup: piloteCleanup } = await addTestUser(db, {
      collectiviteId: deposanteId,
      role: CollectiviteRole.EDITION,
    });
    cleanups.push(piloteCleanup);
    piloteId = pilote.id;
    // Les deux sont pilotes : `transmettre_pour_avis` est réservée aux pilotes,
    // et l'administrateur doit pouvoir transmettre.
    await db.db.insert(demarchePiloteTable).values([
      { demarcheId, userId: piloteId, createdBy: deposanteAdminId },
      { demarcheId, userId: deposanteAdminId, createdBy: deposanteAdminId },
    ]);

    // La DREAL couvrante : deux agents, dont un simple lecteur.
    const dreal = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: collectiviteTypeEnum.DREAL,
        regionCode,
        nom: 'DREAL test notifications',
      },
    });
    drealId = dreal.collectivite.id;
    cleanups.push(dreal.cleanup);
    drealCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(dreal.user),
    });
    const { cleanup: lecteurCleanup } = await addTestUser(db, {
      collectiviteId: drealId,
      role: CollectiviteRole.LECTURE,
    });
    cleanups.push(lecteurCleanup);

    // Le service national, saisi lui aussi mais qui ne doit rien recevoir.
    const national = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: collectiviteTypeEnum.SERVICE_NATIONAL,
        nom: 'DGEC test notifications',
      },
    });
    nationalId = national.collectivite.id;
    cleanups.push(national.cleanup);

    // Une DDT saisie dont aucun agent n'a de compte : personne à notifier, donc
    // le support doit l'apprendre.
    const ddt = await addTestCollectivite(db, {
      type: collectiviteTypeEnum.DDT,
      regionCode,
      departementCode,
      nom: 'DDT test notifications',
    });
    ddtNom = ddt.collectivite.nom;
    cleanups.push(ddt.cleanup);

    await completeTestDossierPcaet(db, {
      collectiviteId: deposanteId,
      demarcheId,
    });
    await deposante.caller.demarches.pcaet.transmettrePourAvis({
      collectiviteId: deposanteId,
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
    demandeDrealId = demandeDe(drealId);
    demandeNationaleId = demandeDe(nationalId);

    const [avis] = await db.db
      .insert(pcaetAvisTable)
      .values({
        demandeAvisId: demandeDrealId,
        emetteurCollectiviteId: drealId,
        auTitreDe: 'prefet_region',
        fichierRef: buildRandomDocumentHash(),
        deposePar: dreal.user.id,
      })
      .returning({ id: pcaetAvisTable.id });
    avisId = avis.id;

    return async () => {
      // Rendre le code de région : l'index unique par DREAL le refuserait au
      // prochain spec qui tirerait le même.
      await db.db
        .delete(pcaetDemandeAvisTable)
        .where(eq(pcaetDemandeAvisTable.demarcheId, demarcheId));
      for (const cleanup of cleanups.reverse()) {
        await cleanup();
      }
      await app.close();
    };
  });

  describe('à la transmission pour avis', () => {
    it('écrit à tous les membres du service saisi, quel que soit leur rôle', async () => {
      const notifications = await notificationsPour(
        NotifiedOnEnum['DEMARCHES.PCAET.DOSSIER_TRANSMIS_POUR_AVIS'],
        String(demandeDrealId)
      );

      const membres = await db.db
        .select({ userId: utilisateurCollectiviteAccessTable.userId })
        .from(utilisateurCollectiviteAccessTable)
        .where(
          and(
            eq(utilisateurCollectiviteAccessTable.collectiviteId, drealId),
            eq(utilisateurCollectiviteAccessTable.isActive, true)
          )
        );

      // L'administrateur et le lecteur : la notification ne suit pas le rôle.
      expect(membres).toHaveLength(2);
      expect(notifications.map((n) => n.sendTo).sort()).toEqual(
        membres.map((m) => m.userId).sort()
      );
    });

    it("prévient le support des services saisis que personne n'habite", async () => {
      const auSupport = sendEmail.mock.calls.filter(
        ([email]) => email.to === 'contact@territoiresentransitions.fr'
      );

      // Un seul message pour toute la transmission, et il nomme la DDT.
      expect(auSupport).toHaveLength(1);
      expect(auSupport[0][0].html).toContain(ddtNom);
      expect(auSupport[0][0].subject).toContain('sans compte');
    });

    it("n'écrit pas aux services nationaux, qui voient tous les dossiers du pays", async () => {
      // Le service est bien saisi : c'est la notification qu'on lui épargne.
      expect(demandeNationaleId).toBeDefined();
      await expect(
        notificationsPour(
          NotifiedOnEnum['DEMARCHES.PCAET.DOSSIER_TRANSMIS_POUR_AVIS'],
          String(demandeNationaleId)
        )
      ).resolves.toEqual([]);
    });
  });

  describe("à la validation d'un avis", () => {
    beforeAll(async () => {
      await drealCaller.demarches.pcaet.validerAvis({
        demandeAvisId: demandeDrealId,
        avisId,
      });
    });

    it('prévient les pilotes et les administrateurs de la déposante', async () => {
      const notifications = await notificationsPour(
        NotifiedOnEnum['DEMARCHES.PCAET.AVIS_RECU'],
        avisId
      );

      expect(notifications.map((n) => n.sendTo).sort()).toEqual(
        [piloteId, deposanteAdminId].sort()
      );
    });

    it('ne peut pas être rejouée, donc ne renotifie pas', async () => {
      // Le premier avis validé a clos l'instruction : la fenêtre d'avis est
      // fermée et le dépôt refusé. La garde `valideLe === null` n'a même pas à
      // jouer — mais si elle sautait, ce test le verrait au décompte.
      await expect(
        drealCaller.demarches.pcaet.validerAvis({
          demandeAvisId: demandeDrealId,
          avisId,
        })
      ).rejects.toThrow();

      const notifications = await notificationsPour(
        NotifiedOnEnum['DEMARCHES.PCAET.AVIS_RECU'],
        avisId
      );
      expect(notifications).toHaveLength(2);
    });
  });

  describe("à la clôture de l'instruction", () => {
    it('annonce le dossier instruit, en disant pourquoi', async () => {
      // La DREAL était le seul service attendu : son avis validé a clos
      // l'instruction dans la foulée.
      const notifications = await notificationsPour(
        NotifiedOnEnum['DEMARCHES.PCAET.INSTRUCTION_CLOSE'],
        String(demarcheId)
      );

      expect(notifications.map((n) => n.sendTo).sort()).toEqual(
        [piloteId, deposanteAdminId].sort()
      );
      expect(notifications[0].notificationData).toMatchObject({
        motif: DemarchePcaetTransitionEnum.AVIS_TOUS_RENDUS,
      });
    });
  });

  describe("à l'envoi", () => {
    it('marque les six notifications envoyées', async () => {
      // `sent` est la preuve que les générateurs sont enregistrés : sans eux,
      // `sendNotification` sort sans rien faire et la notification resterait
      // « pending » indéfiniment, sans erreur ni log.
      // Restreint à MES destinataires, et non aux `entityId` : ceux-ci sont des
      // entiers qu'un autre spec tournant en parallèle porte aussi, et on
      // enverrait alors ses notifications avant de les asserter.
      const membresDreal = await db.db
        .select({ userId: utilisateurCollectiviteAccessTable.userId })
        .from(utilisateurCollectiviteAccessTable)
        .where(eq(utilisateurCollectiviteAccessTable.collectiviteId, drealId));
      const mesDestinataires = [
        piloteId,
        deposanteAdminId,
        ...membresDreal.map(({ userId }) => userId),
      ];

      await db.db
        .update(notificationTable)
        .set({ sendAfter: DateTime.now().minus({ hours: 1 }).toUTC().toSQL() })
        .where(inArray(notificationTable.sendTo, mesDestinataires));

      await notificationsService.sendPendingNotifications();

      const miennes = await db.db
        .select({
          id: notificationTable.id,
          status: notificationTable.status,
          sentToEmail: notificationTable.sentToEmail,
          notifiedOn: notificationTable.notifiedOn,
        })
        .from(notificationTable)
        .where(inArray(notificationTable.sendTo, mesDestinataires));

      // Deux agents DREAL prévenus de la transmission, puis le pilote et
      // l'administrateur pour l'avis rendu comme pour la clôture.
      expect(miennes).toHaveLength(6);
      for (const notification of miennes) {
        expect(notification.status).toBe(NotificationStatusEnum.SENT);
        expect(notification.sentToEmail).toBeTruthy();
      }

      // Le contenu lui-même est figé par les specs de rendu des templates :
      // `sendPendingNotifications` est global, donc un spec voisin peut avoir
      // servi ces notifications avec son propre EmailService.
    });
  });
});
