import { INestApplication } from '@nestjs/common';
import { render } from '@react-email/components';
import { Test } from '@nestjs/testing';
import { AppModule } from '@tet/backend/app.module';
import {
  addTestCollectivite,
  addTestCollectiviteAndUser,
} from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { buildRandomDocumentHash } from '@tet/backend/collectivites/documents/documents.test-fixture';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { demarchePcaetCollectiviteCouverteTable } from '@tet/backend/demarches/shared/models/demarche-pcaet-collectivite-couverte.table';
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
import { GetNotificationContentResult } from '@tet/backend/utils/notifications/models/notification-template.dto';
import { notificationTable } from '@tet/backend/utils/notifications/models/notification.table';
import { NotificationsService } from '@tet/backend/utils/notifications/notifications.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { collectiviteTypeEnum } from '@tet/domain/collectivites';
import {
  DGEC_SIREN,
  DemarchePcaetTransitionEnum,
  PcaetAvisAuTitreDeEnum,
} from '@tet/domain/demarches';
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
import { NotifyAvisRecuService } from './notify-avis-recu/notify-avis-recu.service';
import { NotifyInstructionCloseService } from './notify-instruction-close/notify-instruction-close.service';

/**
 * Le cycle d'un dossier, du point de vue de ce qui part en notification.
 *
 * Les trois évènements s'enchaînent sur un même dossier plutôt que d'être
 * isolés : c'est ainsi qu'ils se produisent, et c'est le seul moyen de vérifier
 * qu'ils ne se marchent pas dessus.
 *
 * Le conseil régional se prononce le premier, la DREAL ensuite : son avis clôt
 * l'instruction. L'ordre permet de voir la DREAL en copie de l'avis d'un autre,
 * puis écartée de la copie du sien.
 *
 * La déposante porte aussi le PCAET de deux EPCI, comme un Supra : leurs
 * administrateurs suivent les mêmes étapes.
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
  let regionId: number;
  let nationalId: number;
  let demandeDrealId: number;
  let demandeRegionId: number;
  let demandeNationaleId: number;
  let demandeDgecId: number;
  let avisDrealId: string;
  let avisRegionId: string;
  let piloteId: string;
  let deposanteAdminId: string;
  let dgecMembreId: string;
  let membresDrealIds: string[];
  let regionAdminId: string;
  let drealCaller: ReturnType<TrpcRouter['createCaller']>;
  let regionCaller: ReturnType<TrpcRouter['createCaller']>;
  const cleanups: Array<() => Promise<void>> = [];
  let ddtNom: string;
  let epciAId: number;
  let epciBId: number;
  let epciAAdminId: string;
  let epciAEditeurId: string;
  let epciBAdminId: string;
  let adminDeuxEpciId: string;

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

  type Notifications = Awaited<ReturnType<typeof notificationsPour>>;

  const destinationDe = (n: Notifications[number]) => {
    const data = n.notificationData as {
      copieDemandeAvisId?: number;
      couverteCollectiviteId?: number;
    };
    if (data.copieDemandeAvisId !== undefined) {
      return { type: 'copie' } as const;
    }
    if (data.couverteCollectiviteId !== undefined) {
      return {
        type: 'couvert',
        collectiviteId: data.couverteCollectiviteId,
      } as const;
    }
    return { type: 'porteur' } as const;
  };

  const couvertsDe = (notifications: Notifications) =>
    notifications
      .flatMap((n) => {
        const destination = destinationDe(n);
        return destination.type === 'couvert'
          ? [{ sendTo: n.sendTo, collectiviteId: destination.collectiviteId }]
          : [];
      })
      .sort((a, b) => a.sendTo.localeCompare(b.sendTo));

  /**
   * Ni l'administrateur de la déposante, déjà prévenu au titre du porteur, ni
   * l'éditeur. L'administrateur des deux EPCI l'est au titre du premier par
   * ordre de nom.
   */
  const couvertsAttendus = () =>
    [
      { sendTo: epciAAdminId, collectiviteId: epciAId },
      { sendTo: adminDeuxEpciId, collectiviteId: epciAId },
      { sendTo: epciBAdminId, collectiviteId: epciBId },
    ].sort((a, b) => a.sendTo.localeCompare(b.sendTo));

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

    // Deux EPCI couverts. L'administrateur de la déposante administre aussi le
    // premier ; un autre administre les deux ; un éditeur n'est pas notifié.
    const epciA = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        natureInsee: 'CC',
        regionCode,
        departementCode,
        nom: 'CC A test notifications',
      },
    });
    const epciB = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        natureInsee: 'CC',
        regionCode,
        departementCode,
        nom: 'CC B test notifications',
      },
    });
    cleanups.push(epciA.cleanup, epciB.cleanup);
    epciAId = epciA.collectivite.id;
    epciBId = epciB.collectivite.id;
    epciAAdminId = epciA.user.id;
    epciBAdminId = epciB.user.id;
    const { user: adminDeuxEpci, cleanup: adminDeuxEpciCleanup } =
      await addTestUser(db, {
        collectiviteId: epciBId,
        role: CollectiviteRole.ADMIN,
      });
    const { user: epciAEditeur, cleanup: epciAEditeurCleanup } =
      await addTestUser(db, {
        collectiviteId: epciAId,
        role: CollectiviteRole.EDITION,
      });
    cleanups.push(adminDeuxEpciCleanup, epciAEditeurCleanup);
    adminDeuxEpciId = adminDeuxEpci.id;
    epciAEditeurId = epciAEditeur.id;
    await db.db.insert(utilisateurCollectiviteAccessTable).values(
      [deposanteAdminId, adminDeuxEpciId].map((userId) => ({
        userId,
        collectiviteId: epciAId,
        isActive: true,
        role: CollectiviteRole.ADMIN,
      }))
    );
    cleanups.push(async () => {
      await db.db
        .delete(utilisateurCollectiviteAccessTable)
        .where(eq(utilisateurCollectiviteAccessTable.collectiviteId, epciAId));
    });
    await db.db.insert(demarchePcaetCollectiviteCouverteTable).values(
      [epciAId, epciBId].map((collectiviteId) => ({
        demarcheId,
        collectiviteId,
        createdBy: deposanteAdminId,
      }))
    );

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

    // Le conseil régional, saisi pour l'avis du président de région.
    const region = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: collectiviteTypeEnum.REGION,
        regionCode,
        nom: 'Région test notifications',
      },
    });
    regionId = region.collectivite.id;
    regionAdminId = region.user.id;
    cleanups.push(region.cleanup);
    regionCaller = router.createCaller({
      user: getAuthUserFromUserCredentials(region.user),
    });

    // Un service national autre que la DGEC, saisi lui aussi mais qui ne doit
    // rien recevoir.
    const national = await addTestCollectiviteAndUser(db, {
      user: { role: CollectiviteRole.ADMIN },
      collectivite: {
        type: collectiviteTypeEnum.SERVICE_NATIONAL,
        nom: 'Service national test notifications',
      },
    });
    nationalId = national.collectivite.id;
    cleanups.push(national.cleanup);

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
    demandeRegionId = demandeDe(regionId);
    demandeNationaleId = demandeDe(nationalId);
    demandeDgecId = demandeDe(dgec.id);

    const membresDreal = await db.db
      .select({ userId: utilisateurCollectiviteAccessTable.userId })
      .from(utilisateurCollectiviteAccessTable)
      .where(
        and(
          eq(utilisateurCollectiviteAccessTable.collectiviteId, drealId),
          eq(utilisateurCollectiviteAccessTable.isActive, true)
        )
      );
    membresDrealIds = membresDreal.map(({ userId }) => userId);

    const [avisDreal, avisRegion] = await db.db
      .insert(pcaetAvisTable)
      .values([
        {
          demandeAvisId: demandeDrealId,
          emetteurCollectiviteId: drealId,
          auTitreDe: PcaetAvisAuTitreDeEnum.PREFET_REGION,
          fichierRefs: [buildRandomDocumentHash()],
          deposePar: dreal.user.id,
        },
        {
          demandeAvisId: demandeRegionId,
          emetteurCollectiviteId: regionId,
          auTitreDe: PcaetAvisAuTitreDeEnum.PRESIDENT_REGION,
          fichierRefs: [buildRandomDocumentHash()],
          deposePar: region.user.id,
        },
      ])
      .returning({ id: pcaetAvisTable.id });
    avisDrealId = avisDreal.id;
    avisRegionId = avisRegion.id;

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

      // L'administrateur et le lecteur : la notification ne suit pas le rôle.
      expect(membresDrealIds).toHaveLength(2);
      expect(notifications.map((n) => n.sendTo).sort()).toEqual(
        [...membresDrealIds].sort()
      );
    });

    it('écrit à la DGEC, seul service national en copie des transmissions', async () => {
      const notifications = await notificationsPour(
        NotifiedOnEnum['DEMARCHES.PCAET.DOSSIER_TRANSMIS_POUR_AVIS'],
        String(demandeDgecId)
      );

      // Le seed peut lui donner d'autres agents : on cherche le nôtre.
      expect(notifications.map((n) => n.sendTo)).toContain(dgecMembreId);
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

    it("n'écrit pas aux autres services nationaux, qui voient tous les dossiers du pays", async () => {
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
      await regionCaller.demarches.pcaet.validerAvis({
        demandeAvisId: demandeRegionId,
        avisId: avisRegionId,
      });
      await drealCaller.demarches.pcaet.validerAvis({
        demandeAvisId: demandeDrealId,
        avisId: avisDrealId,
      });
    });

    const copiesDe = (
      notifications: Awaited<ReturnType<typeof notificationsPour>>
    ) =>
      notifications.filter(
        (n) =>
          (n.notificationData as { copieDemandeAvisId?: number })
            .copieDemandeAvisId !== undefined
      );

    it('prévient les pilotes et les administrateurs de la déposante', async () => {
      const notifications = await notificationsPour(
        NotifiedOnEnum['DEMARCHES.PCAET.AVIS_RECU'],
        avisRegionId
      );

      expect(
        notifications
          .filter((n) => destinationDe(n).type === 'porteur')
          .map((n) => n.sendTo)
          .sort()
      ).toEqual([piloteId, deposanteAdminId].sort());
    });

    it('prévient une fois chaque administrateur des EPCI couverts', async () => {
      const notifications = await notificationsPour(
        NotifiedOnEnum['DEMARCHES.PCAET.AVIS_RECU'],
        avisRegionId
      );

      expect(couvertsDe(notifications)).toEqual(couvertsAttendus());
      expect(notifications.map((n) => n.sendTo)).not.toContain(epciAEditeurId);
      // L'administrateur commun au porteur et à un EPCI n'a que le message du
      // porteur.
      expect(
        notifications.filter((n) => n.sendTo === deposanteAdminId)
      ).toHaveLength(1);
    });

    it('met la DREAL et la DGEC en copie, chacune vers son dossier', async () => {
      const copies = copiesDe(
        await notificationsPour(
          NotifiedOnEnum['DEMARCHES.PCAET.AVIS_RECU'],
          avisRegionId
        )
      );
      const copieDe = (userId: string) =>
        copies.find((n) => n.sendTo === userId)?.notificationData;

      for (const membreId of membresDrealIds) {
        expect(copieDe(membreId)).toMatchObject({
          copieDemandeAvisId: demandeDrealId,
        });
      }
      expect(copieDe(dgecMembreId)).toMatchObject({
        copieDemandeAvisId: demandeDgecId,
      });
      // Ni le conseil régional qui s'est prononcé, ni les autres services.
      expect(copieDe(regionAdminId)).toBeUndefined();
    });

    it("n'écrit pas en copie au service qui vient de se prononcer", async () => {
      const destinataires = copiesDe(
        await notificationsPour(
          NotifiedOnEnum['DEMARCHES.PCAET.AVIS_RECU'],
          avisDrealId
        )
      ).map((n) => n.sendTo);

      expect(destinataires).toContain(dgecMembreId);
      for (const membreId of membresDrealIds) {
        expect(destinataires).not.toContain(membreId);
      }
    });

    it('ne peut pas être rejouée, donc ne renotifie pas', async () => {
      const avant = await notificationsPour(
        NotifiedOnEnum['DEMARCHES.PCAET.AVIS_RECU'],
        avisDrealId
      );

      // L'avis de la DREAL a clos l'instruction : la fenêtre d'avis est fermée
      // et le dépôt refusé. La garde `valideLe === null` n'a même pas à jouer —
      // mais si elle sautait, ce test le verrait au décompte.
      await expect(
        drealCaller.demarches.pcaet.validerAvis({
          demandeAvisId: demandeDrealId,
          avisId: avisDrealId,
        })
      ).rejects.toThrow();

      await expect(
        notificationsPour(
          NotifiedOnEnum['DEMARCHES.PCAET.AVIS_RECU'],
          avisDrealId
        )
      ).resolves.toHaveLength(avant.length);
    });
  });

  describe("à la clôture de l'instruction", () => {
    it('prévient une fois chaque administrateur des EPCI couverts', async () => {
      expect(
        couvertsDe(
          await notificationsPour(
            NotifiedOnEnum['DEMARCHES.PCAET.INSTRUCTION_CLOSE'],
            String(demarcheId)
          )
        )
      ).toEqual(couvertsAttendus());
    });

    it('annonce le dossier instruit, en disant pourquoi, avec la DREAL en copie', async () => {
      // La DREAL était le dernier service attendu : son avis validé a clos
      // l'instruction dans la foulée.
      const notifications = await notificationsPour(
        NotifiedOnEnum['DEMARCHES.PCAET.INSTRUCTION_CLOSE'],
        String(demarcheId)
      );

      expect(
        notifications
          .filter((n) => destinationDe(n).type !== 'couvert')
          .map((n) => ({
            sendTo: n.sendTo,
            copieDemandeAvisId: (
              n.notificationData as { copieDemandeAvisId?: number }
            ).copieDemandeAvisId,
          }))
          .sort((a, b) => a.sendTo.localeCompare(b.sendTo))
      ).toEqual(
        [
          { sendTo: piloteId, copieDemandeAvisId: undefined },
          { sendTo: deposanteAdminId, copieDemandeAvisId: undefined },
          ...membresDrealIds.map((sendTo) => ({
            sendTo,
            copieDemandeAvisId: demandeDrealId,
          })),
        ].sort((a, b) => a.sendTo.localeCompare(b.sendTo))
      );
      for (const notification of notifications) {
        expect(notification.notificationData).toMatchObject({
          motif: DemarchePcaetTransitionEnum.AVIS_TOUS_RENDUS,
        });
      }
    });
  });

  describe("le message à l'EPCI couvert", () => {
    // Le générateur appelé directement : l'envoi est global, un spec voisin
    // pourrait servir ces notifications avant nous.
    const htmlPour = async (
      getContent: (
        notification: Notifications[number]
      ) => Promise<GetNotificationContentResult>,
      notification: Notifications[number]
    ) => {
      const result = await getContent(notification);
      if (!result.success) {
        throw new Error(result.error);
      }
      return render(result.data.content);
    };
    const notificationDe = async (notifiedOn: NotifiedOn, entityId: string) => {
      const notification = (await notificationsPour(notifiedOn, entityId)).find(
        (n) => n.sendTo === epciBAdminId
      );
      if (!notification) {
        throw new Error("L'EPCI couvert n'a pas été notifié");
      }
      return notification;
    };

    it("mène aux avis du dépôt, sous l'identifiant du porteur", async () => {
      const service = app.get(NotifyAvisRecuService);
      const html = await htmlPour(
        (n) => service['getContent'](n),
        await notificationDe(
          NotifiedOnEnum['DEMARCHES.PCAET.AVIS_RECU'],
          avisRegionId
        )
      );

      expect(html).toContain(
        `/collectivite/${deposanteId}/demarche-pcaet/${demarcheId}/documents`
      );
      expect(html).toContain('Agglo test notifications');
      expect(html).toContain('CC B test notifications');
    });

    it("mène au dépôt en lecture seule, sous l'identifiant du porteur", async () => {
      const service = app.get(NotifyInstructionCloseService);
      const html = await htmlPour(
        (n) => service['getContent'](n),
        await notificationDe(
          NotifiedOnEnum['DEMARCHES.PCAET.INSTRUCTION_CLOSE'],
          String(demarcheId)
        )
      );

      expect(html).toContain(
        `/collectivite/${deposanteId}/demarche-pcaet/${demarcheId}"`
      );
      expect(html).toContain('Consulter le dépôt');
      expect(html).toContain('CC B test notifications');
    });
  });

  describe("à l'envoi", () => {
    it('marque envoyées toutes les notifications, copies comprises', async () => {
      // `sent` est la preuve que les générateurs sont enregistrés : sans eux,
      // `sendNotification` sort sans rien faire et la notification resterait
      // « pending » indéfiniment, sans erreur ni log.
      // Restreint à MES destinataires, et non aux `entityId` : ceux-ci sont des
      // entiers qu'un autre spec tournant en parallèle porte aussi, et on
      // enverrait alors ses notifications avant de les asserter.
      const mesDestinataires = [
        piloteId,
        deposanteAdminId,
        regionAdminId,
        dgecMembreId,
        ...membresDrealIds,
        epciAAdminId,
        epciBAdminId,
        adminDeuxEpciId,
      ];

      await db.db
        .update(notificationTable)
        .set({ sendAfter: DateTime.now().minus({ hours: 1 }).toUTC().toSQL() })
        .where(inArray(notificationTable.sendTo, mesDestinataires));

      await notificationsService.sendPendingNotifications();

      // La DGEC est unique : son agent reçoit aussi les transmissions des
      // dossiers d'autres specs en parallèle. On ne compte que ce dossier-ci.
      const mesDemandes = new Set([
        demandeDrealId,
        demandeRegionId,
        demandeNationaleId,
        demandeDgecId,
      ]);
      const miennes = (
        await db.db
          .select({
            id: notificationTable.id,
            status: notificationTable.status,
            sentToEmail: notificationTable.sentToEmail,
            notifiedOn: notificationTable.notifiedOn,
            notificationData: notificationTable.notificationData,
          })
          .from(notificationTable)
          .where(inArray(notificationTable.sendTo, mesDestinataires))
      ).filter(({ notificationData }) => {
        const data = notificationData as {
          demandeAvisId?: number;
          demarcheId?: number;
        };
        return (
          data.demarcheId === demarcheId ||
          (data.demandeAvisId !== undefined &&
            mesDemandes.has(data.demandeAvisId))
        );
      });

      // Transmission : les deux agents DREAL, l'agent du conseil régional et
      // celui de la DGEC (4). Avis du conseil régional : pilote et
      // administrateur, copies aux deux agents DREAL et à la DGEC (5). Avis de
      // la DREAL : pilote, administrateur, copie à la DGEC (3). Clôture :
      // pilote, administrateur, copies aux deux agents DREAL (4). Les trois
      // administrateurs d'EPCI couverts reçoivent les deux avis et la clôture
      // (9).
      expect(miennes).toHaveLength(25);
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
